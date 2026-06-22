"""
SSP COACH PRO — AI API 蓝图
短板分析 / 跟进话术 / 人群洞察 / 教练问答
"""
import json

from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import db, User, Athlete, Assessment, CLIENT_TYPES
from ai_brain import DeepSeekBrain

api_ai_bp = Blueprint("api_ai", __name__)
brain = DeepSeekBrain()


def _get_current_user() -> User:
    """通过 JWT identity 获取当前用户"""
    user_id = get_jwt_identity()
    return db.session.get(User, int(user_id))


# ═══════════════════════════════════════════════════
#  POST /analyze-weakness
# ═══════════════════════════════════════════════════
@api_ai_bp.route("/analyze-weakness", methods=["POST"])
@jwt_required()
def analyze_weakness():
    """根据评估 ID，AI 分析核心短板"""
    data = request.get_json(silent=True) or {}
    assessment_id = data.get("assessment_id")

    if not assessment_id:
        return jsonify({"error": "缺少 assessment_id 参数"}), 400

    assessment = db.session.get(Assessment, int(assessment_id))
    if not assessment:
        return jsonify({"error": "评估记录不存在"}), 404

    athlete = assessment.athlete
    if not athlete:
        return jsonify({"error": "关联学员不存在"}), 404

    # 构建评分 dict
    score_dict = assessment.score_dict

    analysis = brain.analyze_weakness(
        scores=score_dict,
        sport_background=athlete.sport_background or "未知",
        age=athlete.age or 0,
    )

    return jsonify({
        "assessment_id": assessment.id,
        "athlete_name": athlete.name,
        "analysis": analysis,
    })


# ═══════════════════════════════════════════════════
#  POST /suggest-followup
# ═══════════════════════════════════════════════════
@api_ai_bp.route("/suggest-followup", methods=["POST"])
@jwt_required()
def suggest_followup():
    """根据学员 ID，AI 生成三版跟进话术"""
    data = request.get_json(silent=True) or {}
    athlete_id = data.get("athlete_id")

    if not athlete_id:
        return jsonify({"error": "缺少 athlete_id 参数"}), 400

    athlete = db.session.get(Athlete, int(athlete_id))
    if not athlete:
        return jsonify({"error": "学员不存在"}), 404

    # 取最新评估
    latest = athlete.latest_assessment
    if not latest:
        return jsonify({"error": "该学员尚无评估记录"}), 404

    client_type_label = CLIENT_TYPES.get(
        latest.client_type, latest.client_type or "未知"
    )
    weaknesses = latest.weakness_labels or []
    recommended = (
        latest.recommended_products[0]
        if latest.recommended_products
        else "SSP 训练课程"
    )

    scripts_text = brain.suggest_followup(
        athlete_name=athlete.name,
        client_type=client_type_label,
        weaknesses=weaknesses,
        recommended_product=recommended,
    )

    return jsonify({
        "athlete_id": athlete.id,
        "athlete_name": athlete.name,
        "scripts": scripts_text,
    })


# ═══════════════════════════════════════════════════
#  POST /audience-insight
# ═══════════════════════════════════════════════════
@api_ai_bp.route("/audience-insight", methods=["POST"])
@jwt_required()
def audience_insight():
    """全量学员数据 AI 人群洞察"""
    current_user = _get_current_user()

    # 查询所有活跃学员及其最新评估
    athletes = Athlete.query.filter_by(is_active=True)
    if current_user.role == "coach":
        coach_profile = current_user.coach_profile
        if coach_profile:
            athletes = athletes.filter_by(coach_id=coach_profile.id)

    athletes = athletes.all()

    summaries = []
    for a in athletes:
        latest = a.latest_assessment
        summaries.append({
            "type": a.current_client_type or "未知",
            "source": a.source or "未知",
            "total_score": latest.total_score if latest else 0,
            "converted": bool(
                latest and latest.sales_high_intent
            ) if latest else False,
            "has_assessment": latest is not None,
        })

    insight = brain.audience_insight(summaries)
    return jsonify({
        "total_athletes": len(summaries),
        "insight": insight,
    })


# ═══════════════════════════════════════════════════
#  POST /coach-chat (SSE 流式)
# ═══════════════════════════════════════════════════
@api_ai_bp.route("/coach-chat", methods=["POST"])
@jwt_required()
def coach_chat():
    """教练 AI 问答 — SSE 流式输出"""
    data = request.get_json(silent=True) or {}
    user_message = data.get("message", "")
    history = data.get("history", [])  # 对话历史 [{role, content}, ...]

    if not user_message:
        return jsonify({"error": "缺少 message 参数"}), 400

    # 构建系统提示词
    system_prompt = (
        "你是SSP COACH PRO的AI教练助手。"
        "你可以帮助教练分析学员数据、提供训练建议、生成跟进话术、"
        "解答运动科学问题。你的语气专业但友善，用中文回复。"
    )

    def generate():
        """SSE 事件生成器"""
        try:
            for token in brain.chat_stream(system_prompt, user_message):
                yield f"data: {json.dumps({'token': token}, ensure_ascii=False)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)}, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
