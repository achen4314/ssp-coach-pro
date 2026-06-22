"""
SSP COACH PRO — 运动员管理接口 (Blueprint: api_athletes)
GET /   POST /   GET /<id>   PUT /<id>   GET /<id>/assessments   GET /<id>/timeline
"""
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy import or_

from models import (
    db,
    User,
    Coach,
    Athlete,
    Assessment,
    TrainingLog,
    SalesFollow,
    DIMENSIONS,
)

api_athletes_bp = Blueprint("api_athletes", __name__, url_prefix="/api/v1/athletes")


def _coach_id_from_jwt() -> int:
    """从 JWT identity 获取 coach_id（通过 User → Coach 查询）"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if user and user.coach_profile:
        return user.coach_profile.id
    return 0


# ────────────────────────── GET / ──────────────────────────
@api_athletes_bp.route("/", methods=["GET"])
@jwt_required()
def list_athletes():
    """分页查询运动员列表，支持搜索/筛选"""
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    search = (request.args.get("search") or "").strip()
    client_type = (request.args.get("type") or "").strip().upper()  # A-F
    source = (request.args.get("source") or "").strip()
    coach_id_param = request.args.get("coach_id", type=int)
    jwt_claims = get_jwt()

    query = Athlete.query

    # 教练只能看自己的学员
    if jwt_claims.get("role") == "coach":
        cid = _coach_id_from_jwt()
        query = query.filter(Athlete.coach_id == cid)
    elif coach_id_param:
        # 管理员可按教练筛选
        query = query.filter(Athlete.coach_id == coach_id_param)

    # 搜索（姓名/手机号）
    if search:
        query = query.filter(
            or_(
                Athlete.name.ilike(f"%{search}%"),
                Athlete.phone.ilike(f"%{search}%"),
            )
        )

    # 客户类型
    if client_type:
        query = query.filter(Athlete.current_client_type == client_type)

    # 来源
    if source:
        query = query.filter(Athlete.source == source)

    # 排序：最近更新在前
    query = query.order_by(Athlete.updated_at.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    items = []
    for a in pagination.items:
        d = a.to_dict()
        # 附加最新评估摘要
        latest = a.latest_assessment
        if latest:
            d["latest_assessment"] = {
                "id": latest.id,
                "date": latest.assessment_date.isoformat() if latest.assessment_date else None,
                "total_score": latest.total_score,
                "client_type": latest.client_type,
                "client_type_label": latest.client_type_label,
            }
        else:
            d["latest_assessment"] = None
        d["assessment_count"] = a.assessments.count() if a.assessments else 0
        items.append(d)

    return jsonify({
        "items": items,
        "total": pagination.total,
        "page": page,
        "per_page": per_page,
        "pages": pagination.pages,
    }), 200


# ────────────────────────── POST / ──────────────────────────
@api_athletes_bp.route("/", methods=["POST"])
@jwt_required()
def create_athlete():
    """创建运动员档案（可同时创建登录账号）"""
    data = request.get_json(silent=True) or {}
    jwt_claims = get_jwt()
    coach_id = _coach_id_from_jwt()

    if not coach_id:
        return jsonify({"error": "当前用户无教练档案"}), 400

    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "姓名不能为空"}), 400

    # 可选：为运动员创建登录账号
    user_id = None
    if data.get("create_user") and data.get("username"):
        if User.query.filter_by(username=data["username"]).first():
            return jsonify({"error": "用户名已存在"}), 409
        user = User(
            username=data["username"],
            display_name=name,
            role="athlete",
            is_active=True,
        )
        user.set_password(data.get("password", "athlete123"))
        db.session.add(user)
        db.session.flush()
        user_id = user.id

    athlete = Athlete(
        user_id=user_id,
        coach_id=coach_id,
        name=name,
        phone=(data.get("phone") or "").strip(),
        gender=(data.get("gender") or "").strip(),
        birth_date=_parse_date(data.get("birth_date")),
        source=(data.get("source") or "").strip(),
        hyrox_interest=(data.get("hyrox_interest") or "").strip(),
        sport_background=(data.get("sport_background") or "").strip(),
        notes=(data.get("notes") or "").strip(),
        is_active=data.get("is_active", True),
    )
    db.session.add(athlete)
    db.session.commit()

    return jsonify(athlete.to_dict()), 201


# ────────────────────────── GET /<id> ──────────────────────────
@api_athletes_bp.route("/<int:athlete_id>", methods=["GET"])
@jwt_required()
def get_athlete(athlete_id):
    """获取运动员详情（含教练信息、最新评估、评估次数）"""
    athlete: Athlete = Athlete.query.get(athlete_id)
    if athlete is None:
        return jsonify({"error": "运动员不存在"}), 404

    result = athlete.to_dict()

    # 教练信息
    if athlete.coach:
        result["coach"] = athlete.coach.to_dict()
    else:
        result["coach"] = None

    # 最新评估
    latest = athlete.latest_assessment
    if latest:
        result["latest_assessment"] = latest.to_dict()
    else:
        result["latest_assessment"] = None

    # 评估次数
    result["assessment_count"] = athlete.assessments.count() if athlete.assessments else 0

    return jsonify(result), 200


# ────────────────────────── PUT /<id> ──────────────────────────
@api_athletes_bp.route("/<int:athlete_id>", methods=["PUT"])
@jwt_required()
def update_athlete(athlete_id):
    """更新运动员档案"""
    athlete: Athlete = Athlete.query.get(athlete_id)
    if athlete is None:
        return jsonify({"error": "运动员不存在"}), 404

    data = request.get_json(silent=True) or {}
    updatable_fields = [
        "name", "phone", "gender", "birth_date",
        "source", "hyrox_interest", "sport_background",
        "current_client_type", "notes", "is_active",
    ]
    for field in updatable_fields:
        if field in data:
            val = data[field]
            if field == "birth_date":
                val = _parse_date(val)
            setattr(athlete, field, val)

    db.session.commit()
    return jsonify(athlete.to_dict()), 200


# ────────────────────────── GET /<id>/assessments ──────────────────────────
@api_athletes_bp.route("/<int:athlete_id>/assessments", methods=["GET"])
@jwt_required()
def list_athlete_assessments(athlete_id):
    """获取某运动员所有评估记录（按日期倒序）"""
    athlete: Athlete = Athlete.query.get(athlete_id)
    if athlete is None:
        return jsonify({"error": "运动员不存在"}), 404

    assessments = (
        Assessment.query
        .filter_by(athlete_id=athlete_id)
        .order_by(Assessment.assessment_date.desc())
        .all()
    )

    return jsonify([a.to_dict() for a in assessments]), 200


# ────────────────────────── GET /<id>/timeline ──────────────────────────
@api_athletes_bp.route("/<int:athlete_id>/timeline", methods=["GET"])
@jwt_required()
def athlete_timeline(athlete_id):
    """获取运动员综合时间线（评估 + 销售跟进 + 训练日志）"""
    athlete: Athlete = Athlete.query.get(athlete_id)
    if athlete is None:
        return jsonify({"error": "运动员不存在"}), 404

    timeline = []

    # 评估记录
    assessments = (
        Assessment.query
        .filter_by(athlete_id=athlete_id)
        .order_by(Assessment.created_at.desc())
        .all()
    )
    for a in assessments:
        timeline.append({
            "type": "assessment",
            "id": a.id,
            "date": a.created_at.isoformat() if a.created_at else None,
            "data": a.to_dict(),
        })

    # 销售跟进
    follows = (
        SalesFollow.query
        .filter_by(athlete_id=athlete_id)
        .order_by(SalesFollow.created_at.desc())
        .all()
    )
    for f in follows:
        timeline.append({
            "type": "sales_follow",
            "id": f.id,
            "date": f.created_at.isoformat() if f.created_at else None,
            "data": f.to_dict(),
        })

    # 训练日志
    logs = (
        TrainingLog.query
        .filter_by(athlete_id=athlete_id)
        .order_by(TrainingLog.created_at.desc())
        .all()
    )
    for l in logs:
        timeline.append({
            "type": "training_log",
            "id": l.id,
            "date": l.created_at.isoformat() if l.created_at else None,
            "data": l.to_dict(),
        })

    # 按日期降序排序
    timeline.sort(key=lambda x: x["date"] or "", reverse=True)

    return jsonify(timeline), 200


# ── 工具函数 ──
def _parse_date(value):
    """将字符串/date 转为 Python date；失败返回 None"""
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
