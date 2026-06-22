"""
SSP COACH PRO — 综合种子数据
创建 8 名运动员、评估记录、销售跟进和身体指标
"""
import sys
import os
from datetime import datetime, date, timedelta
from random import randint, uniform, choice

# ── 确保 backend 目录在 sys.path 中 ──
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app
from models import (
    db, User, Coach, Athlete, Assessment, BodyMetric, SalesFollow,
    DIMENSIONS, CLIENT_TYPES, SOURCES, WEAKNESS_OPTIONS,
)

# ── 快捷引用 ──
today = date.today()


def seed_all():
    """创建完整的演示数据"""
    print("=" * 60)
    print("  SSP COACH PRO — 种子数据创建中...")
    print("=" * 60)

    # ================================================================
    # 1. 用户 & 教练
    # ================================================================
    print("\n[1/5] 创建用户 & 教练...")

    # Admin
    admin = User.query.filter_by(username="admin").first()
    if not admin:
        admin = User(
            username="admin",
            display_name="总教练",
            role="admin",
            is_active=True,
        )
        admin.set_password("admin123")
        db.session.add(admin)
        db.session.flush()

        coach_admin = Coach(
            user_id=admin.id,
            title="总教练",
            bio="SSP 创始人 & 主教练，10 年体能训练经验",
            certifications=["NSCA-CSCS", "ACE-CPT", "FMS Level 2"],
            specialties=["HYROX 备赛", "力量训练", "运动康复"],
        )
        db.session.add(coach_admin)
        print("  ✓ 创建 admin/admin123 (总教练)")
    else:
        print("  → admin 已存在，跳过")

    # Coach 1 — 李教练
    coach1_user = User.query.filter_by(username="coach1").first()
    if not coach1_user:
        coach1_user = User(
            username="coach1",
            display_name="李教练",
            role="coach",
            is_active=True,
        )
        coach1_user.set_password("coach123")
        db.session.add(coach1_user)
        db.session.flush()

        coach1 = Coach(
            user_id=coach1_user.id,
            title="高级教练",
            bio="专注 HYROX 备赛与体能训练，5 年执教经验",
            certifications=["NSCA-CSCS", "CrossFit Level 2"],
            specialties=["HYROX 备赛", "体能训练", "减脂塑形"],
        )
        db.session.add(coach1)
        print("  ✓ 创建 coach1/coach123 (李教练·高级教练)")
    else:
        coach1 = Coach.query.filter_by(user_id=coach1_user.id).first()
        print("  → coach1 已存在，跳过")

    # Coach 2 — 王教练
    coach2_user = User.query.filter_by(username="coach2").first()
    if not coach2_user:
        coach2_user = User(
            username="coach2",
            display_name="王教练",
            role="coach",
            is_active=True,
        )
        coach2_user.set_password("coach123")
        db.session.add(coach2_user)
        db.session.flush()

        coach2 = Coach(
            user_id=coach2_user.id,
            title="金牌教练",
            bio="前国家队体能教练，8 年专业运动训练经验",
            certifications=["NSCA-CSCS", "ACSM-CEP", "USAW Level 1"],
            specialties=["专项运动表现", "力量举", "HYROX 精英备赛"],
        )
        db.session.add(coach2)
        print("  ✓ 创建 coach2/coach123 (王教练·金牌教练)")
    else:
        coach2 = Coach.query.filter_by(user_id=coach2_user.id).first()
        print("  → coach2 已存在，跳过")

    db.session.commit()

    # 重新获取确保有 ID
    coach1 = Coach.query.filter_by(user_id=coach1_user.id).first()
    coach2 = Coach.query.filter_by(user_id=coach2_user.id).first()

    # ================================================================
    # 2. 运动员
    # ================================================================
    print("\n[2/5] 创建 8 名运动员...")

    # 清除旧种子运动员（根据姓名判断）
    seed_names = ["张三", "李四", "王五", "赵六", "陈七", "刘八", "周九", "吴十"]
    for old in Athlete.query.filter(Athlete.name.in_(seed_names)).all():
        # 级联删除关联数据
        Assessment.query.filter_by(athlete_id=old.id).delete()
        BodyMetric.query.filter_by(athlete_id=old.id).delete()
        SalesFollow.query.filter_by(athlete_id=old.id).delete()
        db.session.delete(old)
    db.session.commit()

    athletes_data = [
        {
            "name": "张三", "gender": "男", "birth_year": 1998,
            "source": "老会员转介绍", "hyrox_interest": "是",
            "sport_background": "有健身基础",
            "phone": "13800010001", "coach": coach1,
        },
        {
            "name": "李四", "gender": "女", "birth_year": 1994,
            "source": "社群", "hyrox_interest": "观望",
            "sport_background": "有跑步基础",
            "phone": "13800020002", "coach": coach1,
        },
        {
            "name": "王五", "gender": "女", "birth_year": 2001,
            "source": "大众点评", "hyrox_interest": "否",
            "sport_background": "零基础",
            "phone": "13800030003", "coach": coach1,
        },
        {
            "name": "赵六", "gender": "男", "birth_year": 1991,
            "source": "老会员转介绍", "hyrox_interest": "是",
            "sport_background": "有专项运动基础",
            "phone": "13800040004", "coach": coach2,
        },
        {
            "name": "陈七", "gender": "男", "birth_year": 1996,
            "source": "小红书", "hyrox_interest": "观望",
            "sport_background": "有健身基础",
            "phone": "13800050005", "coach": coach1,
        },
        {
            "name": "刘八", "gender": "女", "birth_year": 1999,
            "source": "社群", "hyrox_interest": "是",
            "sport_background": "有跑步基础",
            "phone": "13800060006", "coach": coach1,
        },
        {
            "name": "周九", "gender": "男", "birth_year": 1986,
            "source": "大众点评", "hyrox_interest": "否",
            "sport_background": "有专项运动基础",
            "phone": "13800070007", "coach": coach2,
        },
        {
            "name": "吴十", "gender": "女", "birth_year": 2004,
            "source": "小红书", "hyrox_interest": "否",
            "sport_background": "零基础",
            "phone": "13800080008", "coach": coach1,
        },
    ]

    athletes = {}
    for ad in athletes_data:
        athlete = Athlete(
            name=ad["name"],
            gender=ad["gender"],
            birth_date=date(ad["birth_year"], randint(1, 12), randint(1, 28)),
            source=ad["source"],
            hyrox_interest=ad["hyrox_interest"],
            sport_background=ad["sport_background"],
            phone=ad["phone"],
            coach_id=ad["coach"].id,
            is_active=True,
        )
        db.session.add(athlete)
        db.session.flush()
        athletes[ad["name"]] = athlete
        print(f"  ✓ {ad['name']} ({ad['gender']}, {today.year - ad['birth_year']}岁) → {ad['coach'].user.display_name}")

    db.session.commit()
    print(f"  共创建 {len(athletes)} 名运动员")

    # ================================================================
    # 3. 评估记录（2-3 条/人）
    # ================================================================
    print("\n[3/5] 创建评估记录...")

    # 评分模板：(10维分数, client_type, top_weaknesses, coach_feedback)
    # 每个运动员 2-3 条，模拟进度变化
    assessment_plans = {
        "张三": [
            {
                "scores": [3, 2, 4, 4, 3, 3, 3, 4, 3, 3],
                "client_type": "B", "confidence": 0.78,
                "weaknesses": ["跑步能力弱", "心肺耐力不足"],
                "feedback": "力量基础扎实，心肺和跑步是短板，HYROX 潜力大。",
            },
            {
                "scores": [3, 3, 4, 4, 3, 3, 3, 4, 3, 4],
                "client_type": "A", "confidence": 0.85,
                "weaknesses": ["心肺耐力不足"],
                "feedback": "进步明显，跑步有提升，建议进入备赛阶段。",
            },
            {
                "scores": [4, 3, 4, 5, 4, 3, 4, 5, 4, 4],
                "client_type": "A", "confidence": 0.92,
                "weaknesses": [],
                "feedback": "全面进步，已具备备赛条件，推荐 12 周备赛营。",
            },
        ],
        "李四": [
            {
                "scores": [4, 5, 2, 2, 2, 3, 3, 3, 3, 3],
                "client_type": "B", "confidence": 0.80,
                "weaknesses": ["上肢推拉力量不足", "核心稳定性差", "下肢力量不足"],
                "feedback": "跑步能力强，但力量训练是明显短板。",
            },
            {
                "scores": [4, 5, 3, 2, 2, 3, 3, 3, 3, 3],
                "client_type": "B", "confidence": 0.82,
                "weaknesses": ["上肢推拉力量不足", "核心稳定性差"],
                "feedback": "下肢力量有提升，上肢和核心仍需加强。",
            },
        ],
        "王五": [
            {
                "scores": [1, 1, 1, 1, 1, 2, 1, 2, 1, 1],
                "client_type": "F", "confidence": 0.90,
                "weaknesses": [
                    "心肺耐力不足", "跑步能力弱", "下肢力量不足",
                    "上肢推拉力量不足", "核心稳定性差",
                ],
                "feedback": "零基础学员，各方面都有很大提升空间，建议从基础体能开始。",
            },
            {
                "scores": [2, 1, 1, 1, 2, 2, 1, 2, 2, 1],
                "client_type": "F", "confidence": 0.88,
                "weaknesses": [
                    "跑步能力弱", "下肢力量不足", "上肢推拉力量不足", "抗疲劳能力弱",
                ],
                "feedback": "训练意愿略有提升，但进步缓慢，需要更多鼓励和基础训练。",
            },
        ],
        "赵六": [
            {
                "scores": [4, 4, 5, 5, 4, 4, 4, 5, 4, 5],
                "client_type": "A", "confidence": 0.95,
                "weaknesses": [],
                "feedback": "全能型选手，专项运动基础极好，HYROX 备赛首选。",
            },
            {
                "scores": [4, 4, 5, 5, 5, 4, 5, 5, 5, 5],
                "client_type": "A", "confidence": 0.97,
                "weaknesses": [],
                "feedback": "核心力量和抗疲劳能力进一步提升，已是备赛最佳状态。",
            },
            {
                "scores": [5, 4, 5, 5, 5, 5, 5, 5, 5, 5],
                "client_type": "A", "confidence": 0.98,
                "weaknesses": [],
                "feedback": "接近满分，精英级别，建议参加高级别 HYROX 赛事。",
            },
        ],
        "陈七": [
            {
                "scores": [2, 2, 4, 4, 3, 3, 3, 3, 3, 3],
                "client_type": "C", "confidence": 0.75,
                "weaknesses": ["心肺耐力不足", "跑步能力弱"],
                "feedback": "健身基础扎实但偏力量型，心肺和跑步需要补强。",
            },
            {
                "scores": [3, 2, 4, 4, 3, 3, 3, 3, 3, 3],
                "client_type": "B", "confidence": 0.76,
                "weaknesses": ["跑步能力弱"],
                "feedback": "心肺有改善，跑步仍需加强，建议增加有氧训练。",
            },
        ],
        "刘八": [
            {
                "scores": [4, 4, 2, 2, 3, 3, 3, 4, 3, 4],
                "client_type": "B", "confidence": 0.82,
                "weaknesses": ["下肢力量不足", "上肢推拉力量不足"],
                "feedback": "跑步底子好，HYROX 兴趣高，力量训练跟上即可备赛。",
            },
            {
                "scores": [4, 4, 3, 3, 3, 3, 3, 4, 3, 4],
                "client_type": "A", "confidence": 0.86,
                "weaknesses": [],
                "feedback": "力量稳步提升，已可进入备赛阶段。",
            },
            {
                "scores": [4, 5, 3, 3, 4, 3, 4, 4, 4, 4],
                "client_type": "A", "confidence": 0.90,
                "weaknesses": [],
                "feedback": "整体状态良好，推荐 12 周备赛营。",
            },
        ],
        "周九": [
            {
                "scores": [3, 3, 4, 4, 4, 4, 3, 2, 3, 2],
                "client_type": "D", "confidence": 0.80,
                "weaknesses": ["训练意愿低", "HYROX 专项潜力低"],
                "feedback": "专项能力强，但对 HYROX 兴趣不大，适合保持在专项训练方向。",
            },
            {
                "scores": [3, 3, 4, 4, 4, 4, 3, 2, 3, 2],
                "client_type": "D", "confidence": 0.82,
                "weaknesses": ["训练意愿低"],
                "feedback": "状态稳定，保持专项训练即可，不强推 HYROX 方向。",
            },
        ],
        "吴十": [
            {
                "scores": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                "client_type": "F", "confidence": 0.95,
                "weaknesses": [
                    "心肺耐力不足", "跑步能力弱", "下肢力量不足",
                    "上肢推拉力量不足", "核心稳定性差", "动作协调性差",
                    "抗疲劳能力弱", "训练意愿低",
                ],
                "feedback": "完全零基础，各方面都需要从零开始，建议先体验测试课。",
            },
            {
                "scores": [2, 1, 1, 1, 1, 2, 1, 2, 1, 1],
                "client_type": "F", "confidence": 0.93,
                "weaknesses": [
                    "跑步能力弱", "下肢力量不足", "上肢推拉力量不足",
                    "核心稳定性差", "抗疲劳能力弱", "完成度差",
                ],
                "feedback": "略有进步但非常缓慢，需要更多激励和耐心引导。",
            },
        ],
    }

    # 日期范围：过去 2 个月
    date_offsets = [60, 40, 10]  # ~2个月前, ~1个半月前, ~10天前

    assessment_count = 0
    for name, plans in assessment_plans.items():
        athlete = athletes[name]
        for i, plan in enumerate(plans):
            assessment_date = today - timedelta(days=date_offsets[i])

            assessment = Assessment(
                athlete_id=athlete.id,
                coach_id=athlete.coach_id,
                assessment_date=assessment_date,
                source=athlete.source,
                hyrox_interest=athlete.hyrox_interest,
                sport_background=athlete.sport_background,
                # 10 维度评分
                cardio_endurance=plan["scores"][0],
                running_ability=plan["scores"][1],
                lower_body_strength=plan["scores"][2],
                upper_body_pushpull=plan["scores"][3],
                core_stability=plan["scores"][4],
                motor_coordination=plan["scores"][5],
                fatigue_resistance=plan["scores"][6],
                training_willingness=plan["scores"][7],
                completion_state=plan["scores"][8],
                hyrox_potential=plan["scores"][9],
                # 分类
                top_weaknesses=plan["weaknesses"],
                client_type=plan["client_type"],
                client_type_confidence=plan["confidence"],
                client_type_auto=False,
                # 推荐 / 反馈
                recommended_products=_recommend_products(plan["client_type"]),
                coach_feedback=plan["feedback"],
                # 销售标记
                sales_test_recommended=plan["client_type"] in ("B", "C", "E", "F"),
                sales_test_scheduled=plan["client_type"] in ("A", "B"),
                sales_group_joined=plan["client_type"] in ("A", "D"),
                sales_camp_recommended=plan["client_type"] in ("A", ),
                sales_private_screening=plan["client_type"] in ("A", "B", "D"),
                sales_followup_24h=(i == 0),  # 首次评估后 24h 跟进
                sales_high_intent=plan["client_type"] in ("A", "D"),
                sales_notes="已推荐测试课" if plan["client_type"] in ("B", "C") else "",
                is_complete=True,
            )
            # 计算总分
            assessment.calculate_total()
            db.session.add(assessment)
            assessment_count += 1

    db.session.commit()
    print(f"  共创建 {assessment_count} 条评估记录")

    # ================================================================
    # 4. 销售跟进记录
    # ================================================================
    print("\n[4/5] 创建销售跟进记录...")

    sales_data = [
        # 张三 — 高意向，多次跟进，已成交
        {
            "athlete": "张三",
            "follows": [
                {"type": "电话", "days_ago": 58, "result": "有意向", "notes": "首次电话沟通，对 HYROX 训练很感兴趣"},
                {"type": "到店", "days_ago": 40, "result": "有意向", "notes": "到店体验测试课，反馈很好"},
                {"type": "微信", "days_ago": 12, "result": "已成交", "notes": "确认报名 12 周备赛营，已付款"},
            ],
        },
        # 赵六 — 高意向，迅速成交
        {
            "athlete": "赵六",
            "follows": [
                {"type": "电话", "days_ago": 55, "result": "有意向", "notes": "老会员介绍，对训练非常认可"},
                {"type": "到店", "days_ago": 42, "result": "已成交", "notes": "到店评估后当场报名私教月卡 + 备赛营"},
            ],
        },
        # 李四 — 观望中，跟进中
        {
            "athlete": "李四",
            "follows": [
                {"type": "微信", "days_ago": 50, "result": "待跟进", "notes": "加了微信，发了训练方案，表示要考虑"},
                {"type": "微信", "days_ago": 20, "result": "待跟进", "notes": "再次跟进，表示还在犹豫，价格是主要顾虑"},
            ],
        },
        # 刘八 — 有意向，正在推进
        {
            "athlete": "刘八",
            "follows": [
                {"type": "微信", "days_ago": 45, "result": "有意向", "notes": "社群来的学员，对备赛非常有热情"},
                {"type": "电话", "days_ago": 15, "result": "有意向", "notes": "电话沟通训练方案，近期安排到店测试"},
            ],
        },
        # 陈七 — 观望
        {
            "athlete": "陈七",
            "follows": [
                {"type": "微信", "days_ago": 30, "result": "待跟进", "notes": "小红书来的，观望状态，想先看看效果"},
            ],
        },
        # 王五 — 低意向
        {
            "athlete": "王五",
            "follows": [
                {"type": "电话", "days_ago": 55, "result": "无意向", "notes": "大众点评看到来的，只是咨询，暂无训练打算"},
            ],
        },
    ]

    sales_count = 0
    for sd in sales_data:
        athlete = athletes[sd["athlete"]]
        for follow in sd["follows"]:
            sched = datetime.utcnow() - timedelta(days=follow["days_ago"])
            completed = sched + timedelta(hours=1) if follow["result"] != "待跟进" else None
            sf = SalesFollow(
                athlete_id=athlete.id,
                coach_id=athlete.coach_id,
                follow_type=follow["type"],
                scheduled_at=sched,
                completed_at=completed,
                result=follow["result"],
                notes=follow["notes"],
            )
            db.session.add(sf)
            sales_count += 1

    db.session.commit()
    print(f"  共创建 {sales_count} 条销售跟进记录")

    # ================================================================
    # 5. 身体指标
    # ================================================================
    print("\n[5/5] 创建身体指标记录...")

    body_data = [
        {
            "athlete": "张三",
            "metrics": [
                {"days_ago": 58, "weight": 78.5, "bf_pct": 18.2, "muscle": 34.5, "waist": 88.0},
                {"days_ago": 10, "weight": 76.8, "bf_pct": 16.8, "muscle": 35.2, "waist": 86.0},
            ],
        },
        {
            "athlete": "李四",
            "metrics": [
                {"days_ago": 50, "weight": 56.2, "bf_pct": 24.5, "muscle": 22.0, "waist": 72.0},
                {"days_ago": 15, "weight": 55.0, "bf_pct": 23.8, "muscle": 22.3, "waist": 71.0},
            ],
        },
        {
            "athlete": "赵六",
            "metrics": [
                {"days_ago": 55, "weight": 85.0, "bf_pct": 14.5, "muscle": 40.5, "waist": 82.0},
                {"days_ago": 12, "weight": 83.5, "bf_pct": 13.2, "muscle": 41.2, "waist": 80.0},
            ],
        },
        {
            "athlete": "刘八",
            "metrics": [
                {"days_ago": 45, "weight": 54.0, "bf_pct": 22.0, "muscle": 22.5, "waist": 68.0},
                {"days_ago": 8, "weight": 53.2, "bf_pct": 21.2, "muscle": 22.8, "waist": 67.0},
            ],
        },
        {
            "athlete": "陈七",
            "metrics": [
                {"days_ago": 35, "weight": 82.0, "bf_pct": 20.5, "muscle": 35.0, "waist": 90.0},
                {"days_ago": 5, "weight": 80.5, "bf_pct": 19.5, "muscle": 35.5, "waist": 88.5},
            ],
        },
    ]

    metric_count = 0
    for bd in body_data:
        athlete = athletes[bd["athlete"]]
        for metric in bd["metrics"]:
            bm = BodyMetric(
                athlete_id=athlete.id,
                measured_date=today - timedelta(days=metric["days_ago"]),
                weight_kg=metric["weight"],
                body_fat_pct=metric["bf_pct"],
                muscle_kg=metric["muscle"],
                waist_cm=metric["waist"],
                notes="InBody 测量",
            )
            db.session.add(bm)
            metric_count += 1

    db.session.commit()
    print(f"  共创建 {metric_count} 条身体指标记录")

    # ================================================================
    # 输出统计
    # ================================================================
    print("\n" + "=" * 60)
    print("  种子数据创建完成！统计：")
    print("=" * 60)
    print(f"  👤 用户:     {User.query.count()}")
    print(f"  🧑‍🏫 教练:     {Coach.query.count()}")
    print(f"  🏃 运动员:   {Athlete.query.count()}")
    print(f"  📋 评估记录: {Assessment.query.count()}")
    print(f"  📞 销售跟进: {SalesFollow.query.count()}")
    print(f"  📏 身体指标: {BodyMetric.query.count()}")
    print("=" * 60)
    print("  登录账号：")
    print("    admin  / admin123  (总教练)")
    print("    coach1 / coach123  (李教练)")
    print("    coach2 / coach123  (王教练)")
    print("=" * 60)


def _recommend_products(client_type: str) -> list:
    """根据客户类型返回推荐产品"""
    mapping = {
        "A": ["12 周备赛营", "私教 1v1（月卡）"],
        "B": ["HYROX 基础测试", "私教 1v1（月卡）"],
        "C": ["减脂训练营", "HYROX 基础测试"],
        "D": ["私教 1v1（月卡）", "12 周备赛营"],
        "E": ["HYROX 基础测试"],
        "F": ["HYROX 基础测试"],
    }
    return mapping.get(client_type, ["HYROX 基础测试"])


# ================================================================
# 直接运行入口
# ================================================================
if __name__ == "__main__":
    with app.app_context():
        seed_all()
