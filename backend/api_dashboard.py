"""
SSP COACH PRO — 仪表盘数据分析 API
统计概览 / 转化漏斗 / 人群分布 / 来源转化 / 待办 / 产品销售
"""
from datetime import datetime, date, timedelta
from collections import defaultdict

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, case, extract, and_, or_

from models import (
    db, User, Coach, Athlete, Assessment,
    SalesFollow, ProductCatalog, CLIENT_TYPES, SOURCES,
)

api_dashboard_bp = Blueprint("api_dashboard", __name__)


def _get_current_user() -> User:
    user_id = get_jwt_identity()
    return db.session.get(User, int(user_id))


def _get_coach_id(user: User):
    """如果是 coach 角色，返回其 coach_id；否则返回 None（admin 看全部）"""
    if user.role == "coach" and user.coach_profile:
        return user.coach_profile.id
    return None


def _this_month_range():
    """返回本月起止日期"""
    today = date.today()
    first_day = today.replace(day=1)
    # 下个月第一天
    if today.month == 12:
        next_first = today.replace(year=today.year + 1, month=1, day=1)
    else:
        next_first = today.replace(month=today.month + 1, day=1)
    return first_day, next_first


def _last_month_range():
    """返回上月月起止日期"""
    today = date.today()
    first_this = today.replace(day=1)
    last_day_last = first_this - timedelta(days=1)
    first_last = last_day_last.replace(day=1)
    return first_last, first_this


# ═══════════════════════════════════════════════════
#  GET /stats — 统计概览
# ═══════════════════════════════════════════════════
@api_dashboard_bp.route("/stats", methods=["GET"])
@jwt_required()
def dashboard_stats():
    """仪表盘核心统计数字"""
    user = _get_current_user()
    coach_id = _get_coach_id(user)

    this_start, this_end = _this_month_range()
    last_start, last_end = _last_month_range()
    now = datetime.utcnow()

    # ── 基础查询 ──
    athlete_q = Athlete.query.filter_by(is_active=True)
    assessment_q = Assessment.query
    sales_q = SalesFollow.query

    if coach_id:
        athlete_q = athlete_q.filter_by(coach_id=coach_id)
        assessment_q = assessment_q.filter_by(coach_id=coach_id)
        sales_q = sales_q.filter_by(coach_id=coach_id)

    # 总学员数
    total_athletes = athlete_q.count()

    # 本月新增学员
    new_this_month = athlete_q.filter(
        func.strftime("%Y-%m", Athlete.created_at) == this_start.strftime("%Y-%m")
    ).count()

    # 本月评估数
    assessments_this_month = assessment_q.filter(
        Assessment.assessment_date >= this_start,
        Assessment.assessment_date < this_end,
    ).count()

    # 评估目标（硬编码 50 或可配置）
    assessments_target = 50

    # 待跟进（scheduled_at <= now 且尚未完成）
    pending_followups = sales_q.filter(
        SalesFollow.completed_at.is_(None),
        SalesFollow.scheduled_at <= now,
    ).count()

    # 超时跟进（scheduled_at < now - 24h 且未完成）
    deadline = now - timedelta(hours=24)
    overdue_followups = sales_q.filter(
        SalesFollow.completed_at.is_(None),
        SalesFollow.scheduled_at < deadline,
    ).count()

    # ── 转化率 ──
    # 本月：有评估的高意向学员 / 有评估的学员总数
    assessments_this_month_ids = assessment_q.filter(
        Assessment.assessment_date >= this_start,
        Assessment.assessment_date < this_end,
    ).with_entities(Assessment.athlete_id)

    if assessments_this_month_ids.count() > 0:
        completed_this_month = assessment_q.filter(
            Assessment.assessment_date >= this_start,
            Assessment.assessment_date < this_end,
            Assessment.sales_high_intent == True,
        ).count()
        conversion_rate_this_month = round(
            completed_this_month / max(assessments_this_month, 1) * 100, 1
        )
    else:
        conversion_rate_this_month = 0.0

    # 上月转化率
    assessments_last_month = assessment_q.filter(
        Assessment.assessment_date >= last_start,
        Assessment.assessment_date < last_end,
    )
    total_last = assessments_last_month.count()
    if total_last > 0:
        converted_last = assessments_last_month.filter(
            Assessment.sales_high_intent == True
        ).count()
        conversion_rate_last_month = round(converted_last / total_last * 100, 1)
    else:
        conversion_rate_last_month = 0.0

    # 趋势
    if conversion_rate_this_month > conversion_rate_last_month:
        conversion_trend = "up"
    elif conversion_rate_this_month < conversion_rate_last_month:
        conversion_trend = "down"
    else:
        conversion_trend = "stable"

    return jsonify({
        "total_athletes": total_athletes,
        "new_this_month": new_this_month,
        "assessments_this_month": assessments_this_month,
        "assessments_target": assessments_target,
        "pending_followups": pending_followups,
        "overdue_followups": overdue_followups,
        "conversion_rate_this_month": conversion_rate_this_month,
        "conversion_rate_last_month": conversion_rate_last_month,
        "conversion_trend": conversion_trend,
    })


# ═══════════════════════════════════════════════════
#  GET /funnel — 转化漏斗
# ═══════════════════════════════════════════════════
@api_dashboard_bp.route("/funnel", methods=["GET"])
@jwt_required()
def conversion_funnel():
    """本月转化漏斗"""
    user = _get_current_user()
    coach_id = _get_coach_id(user)
    this_start, this_end = _this_month_range()

    # 总体验客户 = 所有活跃学员
    athlete_q = Athlete.query.filter_by(is_active=True)
    if coach_id:
        athlete_q = athlete_q.filter_by(coach_id=coach_id)

    total = athlete_q.count()

    # 本月完成评估的学员
    assessed_q = Assessment.query
    if coach_id:
        assessed_q = assessed_q.filter_by(coach_id=coach_id)

    assessed_ids = set(
        row[0] for row in assessed_q.filter(
            Assessment.assessment_date >= this_start,
            Assessment.assessment_date < this_end,
        ).with_entities(Assessment.athlete_id).all()
    )
    assessed = len(assessed_ids)

    # 高意向：本月评估 + sales_high_intent == True
    high_intent_q = Assessment.query
    if coach_id:
        high_intent_q = high_intent_q.filter_by(coach_id=coach_id)

    high_intent = high_intent_q.filter(
        Assessment.assessment_date >= this_start,
        Assessment.assessment_date < this_end,
        Assessment.sales_high_intent == True,
    ).count()

    # 购买：SalesFollow.completed_at 在本月
    purchase_q = SalesFollow.query
    if coach_id:
        purchase_q = purchase_q.filter_by(coach_id=coach_id)

    purchased = purchase_q.filter(
        SalesFollow.completed_at.isnot(None),
        func.strftime("%Y-%m", SalesFollow.completed_at) == this_start.strftime("%Y-%m"),
    ).count()

    # 续费升级：有多次 completed followup 的学员（简化：有 >= 2 次完成跟进）
    if coach_id:
        multi_purchase = db.session.query(
            SalesFollow.athlete_id,
            func.count(SalesFollow.id).label("cnt"),
        ).filter(
            SalesFollow.coach_id == coach_id,
            SalesFollow.completed_at.isnot(None),
        ).group_by(SalesFollow.athlete_id).having(
            func.count(SalesFollow.id) >= 2
        ).count()
    else:
        multi_purchase = db.session.query(
            SalesFollow.athlete_id,
            func.count(SalesFollow.id).label("cnt"),
        ).filter(
            SalesFollow.completed_at.isnot(None),
        ).group_by(SalesFollow.athlete_id).having(
            func.count(SalesFollow.id) >= 2
        ).count()

    # 计算百分比
    def pct(value):
        return round(value / max(total, 1) * 100, 1)

    funnel = [
        {"stage": "总体验客户", "count": total, "pct": 100.0},
        {"stage": "完成评估", "count": assessed, "pct": pct(assessed)},
        {"stage": "高意向客户", "count": high_intent, "pct": pct(high_intent)},
        {"stage": "购买产品", "count": purchased, "pct": pct(purchased)},
        {"stage": "续费升级", "count": multi_purchase, "pct": pct(multi_purchase)},
    ]

    return jsonify(funnel)


# ═══════════════════════════════════════════════════
#  GET /audience — 人群分布
# ═══════════════════════════════════════════════════
@api_dashboard_bp.route("/audience", methods=["GET"])
@jwt_required()
def audience_distribution():
    """按客户类型 (A-F) 统计人群分布"""
    user = _get_current_user()
    coach_id = _get_coach_id(user)

    athlete_q = Athlete.query.filter_by(is_active=True)
    if coach_id:
        athlete_q = athlete_q.filter_by(coach_id=coach_id)

    athletes = athlete_q.all()
    total = len(athletes)

    # 按类型分组
    groups = defaultdict(lambda: {"count": 0, "total_score": 0, "converted": 0})
    for a in athletes:
        ct = a.current_client_type or "未知"
        groups[ct]["count"] += 1
        latest = a.latest_assessment
        if latest:
            groups[ct]["total_score"] += latest.total_score or 0
            if latest.sales_high_intent:
                groups[ct]["converted"] += 1

    result = []
    for ct in ["A", "B", "C", "D", "E", "F"]:
        g = groups.get(ct, {"count": 0, "total_score": 0, "converted": 0})
        count = g["count"]
        pct = round(count / max(total, 1) * 100, 1)
        conversion_rate = round(
            g["converted"] / max(count, 1) * 100, 1
        )
        avg_score = round(
            g["total_score"] / max(count, 1), 1
        )
        result.append({
            "type": ct,
            "label": CLIENT_TYPES.get(ct, "未知"),
            "count": count,
            "pct": pct,
            "conversion_rate": conversion_rate,
            "avg_score": avg_score,
        })

    return jsonify(result)


# ═══════════════════════════════════════════════════
#  GET /source-conversion — 来源转化
# ═══════════════════════════════════════════════════
@api_dashboard_bp.route("/source-conversion", methods=["GET"])
@jwt_required()
def source_conversion():
    """按获客来源统计转化率"""
    user = _get_current_user()
    coach_id = _get_coach_id(user)

    athlete_q = Athlete.query.filter_by(is_active=True)
    if coach_id:
        athlete_q = athlete_q.filter_by(coach_id=coach_id)

    athletes = athlete_q.all()

    # 按来源分组
    groups = defaultdict(lambda: {"total": 0, "assessed": 0, "converted": 0})
    for a in athletes:
        src = a.source or "其他"
        groups[src]["total"] += 1
        latest = a.latest_assessment
        if latest:
            groups[src]["assessed"] += 1
            if latest.sales_high_intent:
                groups[src]["converted"] += 1

    result = []
    for source in SOURCES:
        g = groups.get(source, {"total": 0, "assessed": 0, "converted": 0})
        total = g["total"]
        conversion_rate = round(
            g["converted"] / max(total, 1) * 100, 1
        )
        result.append({
            "source": source,
            "total": total,
            "assessed": g["assessed"],
            "converted": g["converted"],
            "conversion_rate": conversion_rate,
        })

    return jsonify(result)


# ═══════════════════════════════════════════════════
#  GET /todos — 待办事项
# ═══════════════════════════════════════════════════
@api_dashboard_bp.route("/todos", methods=["GET"])
@jwt_required()
def todos():
    """待办事项聚合"""
    user = _get_current_user()
    coach_id = _get_coach_id(user)
    now = datetime.utcnow()
    forty_eight_hours_ago = now - timedelta(hours=48)
    deadline = now - timedelta(hours=24)

    # ── 待评估：48h 内有试课但没有评估的学员 ──
    # 从 Assessment.trial_class 中查找有试课但无正式评估或最新评估不在 48h 内
    # 简化：创建时间在 48h 内但还没有评估的学员
    athlete_q = Athlete.query.filter_by(is_active=True)
    if coach_id:
        athlete_q = athlete_q.filter_by(coach_id=coach_id)

    # 找到 48h 内创建的学员
    recent_athletes = athlete_q.filter(
        Athlete.created_at >= forty_eight_hours_ago
    ).all()

    pending_assessments = []
    for a in recent_athletes:
        # 检查是否有评估
        assessment_count = Assessment.query.filter_by(
            athlete_id=a.id
        ).count()
        if assessment_count == 0:
            pending_assessments.append({
                "athlete_id": a.id,
                "athlete_name": a.name,
                "created_at": a.created_at.isoformat() if a.created_at else None,
                "type": "pending_assessment",
            })

    # ── 待跟进 ──
    follow_q = SalesFollow.query.filter(
        SalesFollow.completed_at.is_(None),
        SalesFollow.scheduled_at <= now,
    )
    if coach_id:
        follow_q = follow_q.filter_by(coach_id=coach_id)

    pending_followups = []
    overdue = []

    for f in follow_q.all():
        item = {
            "follow_id": f.id,
            "athlete_id": f.athlete_id,
            "athlete_name": f.athlete.name if f.athlete else "",
            "follow_type": f.follow_type,
            "scheduled_at": f.scheduled_at.isoformat() if f.scheduled_at else None,
            "notes": f.notes,
        }
        if f.scheduled_at and f.scheduled_at < deadline:
            item["type"] = "overdue"
            overdue.append(item)
        else:
            item["type"] = "pending_followup"
            pending_followups.append(item)

    # ── 待写训练日志（最近 7 天有分配但无日志的学员） ──
    pending_logs = []
    # 简化实现：返回空列表，后续可根据 PlanAssignment + TrainingLog 完善

    return jsonify({
        "pending_assessments": pending_assessments,
        "pending_followups": pending_followups,
        "overdue": overdue,
        "pending_logs": pending_logs,
    })


# ═══════════════════════════════════════════════════
#  GET /product-performance — 产品销售表现
# ═══════════════════════════════════════════════════
@api_dashboard_bp.route("/product-performance", methods=["GET"])
@jwt_required()
def product_performance():
    """产品销售统计 — 基于 SalesFollow.completed_at 关联推荐产品"""
    user = _get_current_user()
    coach_id = _get_coach_id(user)

    # 获取所有完成跟进的 follow，关联其学员的最新评估中的推荐产品
    follow_q = SalesFollow.query.filter(
        SalesFollow.completed_at.isnot(None),
    )
    if coach_id:
        follow_q = follow_q.filter_by(coach_id=coach_id)

    follows = follow_q.all()

    # 统计每个产品被推荐的次数（通过评估的 recommended_products）
    product_counts = defaultdict(lambda: {"count_sold": 0, "total_revenue": 0.0})
    products = {p.name: p for p in ProductCatalog.query.all()}

    for f in follows:
        athlete = f.athlete
        if not athlete:
            continue
        latest = athlete.latest_assessment
        if not latest or not latest.recommended_products:
            continue
        for prod_name in latest.recommended_products:
            product_counts[prod_name]["count_sold"] += 1
            prod = products.get(prod_name)
            if prod:
                product_counts[prod_name]["total_revenue"] += prod.price or 0.0

    result = []
    for name, data in product_counts.items():
        result.append({
            "product_name": name,
            "count_sold": data["count_sold"],
            "total_revenue": round(data["total_revenue"], 2),
        })

    # 按销量降序
    result.sort(key=lambda x: x["count_sold"], reverse=True)

    return jsonify(result)
