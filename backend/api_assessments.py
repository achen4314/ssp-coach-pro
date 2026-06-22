"""
SSP COACH PRO — 评估接口 (Blueprint: api_assessments)
POST /   GET /   GET /<id>   PUT /<id>
"""
from datetime import datetime, date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy import desc

from models import (
    db,
    User,
    Coach,
    Athlete,
    Assessment,
    SalesFollow,
    DIMENSIONS,
)
from classifier import classify_client

api_assessments_bp = Blueprint("api_assessments", __name__, url_prefix="/api/v1/assessments")


def _coach_id_from_jwt() -> int:
    """从 JWT identity 获取 coach_id"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if user and user.coach_profile:
        return user.coach_profile.id
    return 0


def _parse_date(value):
    """将字符串转为 Python date；失败返回 None"""
    if value is None or value == "":
        return None
    if isinstance(value, str):
        try:
            return datetime.strptime(value[:10], "%Y-%m-%d").date()
        except ValueError:
            return None
    if hasattr(value, "date"):
        return value.date() if callable(value.date) else value
    return None


# ────────────────────────── POST / ──────────────────────────
@api_assessments_bp.route("/", methods=["POST"])
@jwt_required()
def create_assessment():
    """
    创建 SSP 综合评估记录。

    请求体包含:
      - athlete_id (必填)
      - assessment_date (可选，默认今天)
      - source, hyrox_interest, sport_background, trial_class
      - 10 维度评分: cardio_endurance ~ hyrox_potential (整数 0-5)
      - top_weaknesses (数组)
      - client_type (可选；留空则自动分类)
      - recommended_products (数组)
      - coach_feedback
      - sales_* 字段
    """
    data = request.get_json(silent=True) or {}
    coach_id = _coach_id_from_jwt()
    if not coach_id:
        return jsonify({"error": "当前用户无教练档案"}), 400

    athlete_id = data.get("athlete_id")
    if not athlete_id:
        return jsonify({"error": "athlete_id 不能为空"}), 400

    athlete: Athlete = Athlete.query.get(athlete_id)
    if athlete is None:
        return jsonify({"error": "运动员不存在"}), 404

    # ── 解析基础字段 ──
    assessment_date = _parse_date(data.get("assessment_date")) or date.today()

    # ── 收集 10 维度评分 ──
    scores = {}
    for dim in DIMENSIONS:
        val = data.get(dim, 0)
        scores[dim] = max(0, min(5, int(val) if val is not None else 0))

    total_score = sum(scores.values())

    # ── 分类判定 ──
    client_type = (data.get("client_type") or "").strip().upper()
    client_type_auto = True
    client_type_confidence = 0.0
    classifier_reasoning = ""

    if not client_type:
        # 自动分类
        classification = classify_client(
            scores=scores,
            hyrox_interest=data.get("hyrox_interest", athlete.hyrox_interest or ""),
            sport_background=data.get("sport_background", athlete.sport_background or ""),
            source=data.get("source", athlete.source or ""),
        )
        client_type = classification["client_type"]
        client_type_confidence = classification["confidence"]
        classifier_reasoning = classification["reasoning"]
        # 如果用户没传 recommended_products，使用分类器推荐
        if "recommended_products" not in data:
            data["recommended_products"] = classification["recommended_products"]
    else:
        client_type_auto = False
        client_type_confidence = 1.0

    # ── 创建 Assessment ──
    assessment = Assessment(
        athlete_id=athlete_id,
        coach_id=coach_id,
        assessment_date=assessment_date,
        source=(data.get("source") or "").strip(),
        hyrox_interest=(data.get("hyrox_interest") or "").strip(),
        sport_background=(data.get("sport_background") or "").strip(),
        trial_class=(data.get("trial_class") or "").strip(),
        # 维度评分
        cardio_endurance=scores["cardio_endurance"],
        running_ability=scores["running_ability"],
        lower_body_strength=scores["lower_body_strength"],
        upper_body_pushpull=scores["upper_body_pushpull"],
        core_stability=scores["core_stability"],
        motor_coordination=scores["motor_coordination"],
        fatigue_resistance=scores["fatigue_resistance"],
        training_willingness=scores["training_willingness"],
        completion_state=scores["completion_state"],
        hyrox_potential=scores["hyrox_potential"],
        total_score=total_score,
        # 分类
        top_weaknesses=data.get("top_weaknesses", []),
        client_type=client_type,
        client_type_confidence=client_type_confidence,
        client_type_auto=client_type_auto,
        # 推荐
        recommended_products=data.get("recommended_products", []),
        coach_feedback=(data.get("coach_feedback") or "").strip(),
        # 销售字段
        sales_test_recommended=data.get("sales_test_recommended", False),
        sales_test_scheduled=data.get("sales_test_scheduled", False),
        sales_group_joined=data.get("sales_group_joined", False),
        sales_camp_recommended=data.get("sales_camp_recommended", False),
        sales_private_screening=data.get("sales_private_screening", False),
        sales_followup_24h=data.get("sales_followup_24h", False),
        sales_high_intent=data.get("sales_high_intent", False),
        sales_notes=(data.get("sales_notes") or "").strip(),
        is_complete=data.get("is_complete", True),
    )

    db.session.add(assessment)
    db.session.flush()

    # ── 更新运动员 current_client_type ──
    athlete.current_client_type = client_type
    db.session.add(athlete)

    # ── 自动创建 SalesFollow ──
    high_intent = data.get("sales_high_intent", False)
    followup_24h = data.get("sales_followup_24h", False)
    if high_intent or followup_24h:
        sales_follow = SalesFollow(
            athlete_id=athlete_id,
            coach_id=coach_id,
            follow_type="评估跟进",
            scheduled_at=datetime.utcnow() if followup_24h else None,
            result="待跟进",
            notes=f"评估 #{assessment.id} {'高意向' if high_intent else ''} 自动创建",
        )
        db.session.add(sales_follow)

    db.session.commit()

    # ── 返回 ──
    result = assessment.to_dict()
    result["classification"] = {
        "auto": client_type_auto,
        "reasoning": classifier_reasoning,
    }
    return jsonify(result), 201


# ────────────────────────── GET / ──────────────────────────
@api_assessments_bp.route("/", methods=["GET"])
@jwt_required()
def list_assessments():
    """分页查询评估列表，支持多条件筛选"""
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    coach_id_param = request.args.get("coach_id", type=int)
    athlete_id_param = request.args.get("athlete_id", type=int)
    client_type = (request.args.get("client_type") or "").strip().upper()
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")
    jwt_claims = get_jwt()

    query = Assessment.query

    # 教练只看自己的评估
    if jwt_claims.get("role") == "coach":
        cid = _coach_id_from_jwt()
        query = query.filter(Assessment.coach_id == cid)
    elif coach_id_param:
        query = query.filter(Assessment.coach_id == coach_id_param)

    if athlete_id_param:
        query = query.filter(Assessment.athlete_id == athlete_id_param)

    if client_type:
        query = query.filter(Assessment.client_type == client_type)

    if date_from:
        d = _parse_date(date_from)
        if d:
            query = query.filter(Assessment.assessment_date >= d)

    if date_to:
        d = _parse_date(date_to)
        if d:
            query = query.filter(Assessment.assessment_date <= d)

    query = query.order_by(desc(Assessment.assessment_date), desc(Assessment.id))

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "items": [a.to_dict() for a in pagination.items],
        "total": pagination.total,
        "page": page,
        "per_page": per_page,
        "pages": pagination.pages,
    }), 200


# ────────────────────────── GET /<id> ──────────────────────────
@api_assessments_bp.route("/<int:assessment_id>", methods=["GET"])
@jwt_required()
def get_assessment(assessment_id):
    """获取单条评估详情（含运动员 & 教练信息）"""
    assessment: Assessment = Assessment.query.get(assessment_id)
    if assessment is None:
        return jsonify({"error": "评估记录不存在"}), 404

    result = assessment.to_dict()
    # 运动员信息
    if assessment.athlete:
        result["athlete"] = assessment.athlete.to_dict()
    else:
        result["athlete"] = None
    # 教练信息
    if assessment.coach:
        result["coach"] = assessment.coach.to_dict()
    else:
        result["coach"] = None

    return jsonify(result), 200


# ────────────────────────── PUT /<id> ──────────────────────────
@api_assessments_bp.route("/<int:assessment_id>", methods=["PUT"])
@jwt_required()
def update_assessment(assessment_id):
    """更新评估记录（逻辑与 POST 相同）"""
    assessment: Assessment = Assessment.query.get(assessment_id)
    if assessment is None:
        return jsonify({"error": "评估记录不存在"}), 404

    data = request.get_json(silent=True) or {}

    # ── 基础字段 ──
    assessment.assessment_date = _parse_date(data.get("assessment_date")) or assessment.assessment_date
    assessment.source = data.get("source", assessment.source)
    assessment.hyrox_interest = data.get("hyrox_interest", assessment.hyrox_interest)
    assessment.sport_background = data.get("sport_background", assessment.sport_background)
    assessment.trial_class = data.get("trial_class", assessment.trial_class)

    # ── 维度评分 ──
    scores = {}
    for dim in DIMENSIONS:
        if dim in data:
            val = max(0, min(5, int(data[dim]) if data[dim] is not None else 0))
            setattr(assessment, dim, val)
        scores[dim] = getattr(assessment, dim, 0)

    assessment.total_score = sum(scores.values())

    # ── 分类 ──
    client_type_input = (data.get("client_type") or "").strip().upper()
    if not client_type_input:
        classification = classify_client(
            scores=scores,
            hyrox_interest=assessment.hyrox_interest or "",
            sport_background=assessment.sport_background or "",
            source=assessment.source or "",
        )
        assessment.client_type = classification["client_type"]
        assessment.client_type_confidence = classification["confidence"]
        assessment.client_type_auto = True
        if "recommended_products" not in data:
            assessment.recommended_products = classification["recommended_products"]
    else:
        assessment.client_type = client_type_input
        assessment.client_type_confidence = 1.0
        assessment.client_type_auto = False

    # ── 弱点 / 推荐 ──
    if "top_weaknesses" in data:
        assessment.top_weaknesses = data["top_weaknesses"]
    if "recommended_products" in data:
        assessment.recommended_products = data["recommended_products"]
    if "coach_feedback" in data:
        assessment.coach_feedback = data["coach_feedback"]

    # ── 销售字段 ──
    for field in [
        "sales_test_recommended", "sales_test_scheduled",
        "sales_group_joined", "sales_camp_recommended",
        "sales_private_screening", "sales_followup_24h",
        "sales_high_intent", "sales_notes",
    ]:
        if field in data:
            setattr(assessment, field, data[field])

    if "is_complete" in data:
        assessment.is_complete = data["is_complete"]

    # ── 更新运动员 current_client_type ──
    athlete = Athlete.query.get(assessment.athlete_id)
    if athlete:
        athlete.current_client_type = assessment.client_type
        db.session.add(athlete)

    db.session.commit()

    return jsonify(assessment.to_dict()), 200
