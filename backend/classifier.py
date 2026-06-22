"""
SSP COACH PRO — 客户分类器
根据 SSP 综合评估分数自动判定客户类型 (A-F)
"""
from typing import Dict, List, Optional


def classify_client(
    scores: Dict[str, int],
    hyrox_interest: str = "",
    sport_background: str = "",
    source: str = "",
) -> Dict:
    """
    根据评估数据自动判定客户类型。

    参数:
        scores: 10 维度评分的字典 {dimension_name: score_1_to_5}
        hyrox_interest: HYROX 兴趣 (是/否/观望)
        sport_background: 运动背景 (零基础/有健身基础/有专项运动基础)
        source: 获客来源 (大众点评/社群/老会员转介绍/小红书/其他)

    返回:
        {
            client_type: "A" | ... | "F",
            confidence: 0.0 - 1.0,
            reasoning: "匹配条件说明",
            recommended_products: ["产品1", ...]
        }
    """
    total_score = sum(scores.values())
    cardio_endurance = scores.get("cardio_endurance", 0)
    lower_body_strength = scores.get("lower_body_strength", 0)
    upper_body_pushpull = scores.get("upper_body_pushpull", 0)
    training_willingness = scores.get("training_willingness", 0)
    completion_state = scores.get("completion_state", 0)
    hyrox_potential = scores.get("hyrox_potential", 0)

    # 🔹 A类
    a_conditions = [
        hyrox_interest == "是",
        sport_background in ("有健身基础", "有专项运动基础"),
        total_score >= 35,
        hyrox_potential >= 3,
    ]
    if all(a_conditions):
        matched = sum(a_conditions)
        return {
            "client_type": "A",
            "confidence": matched / len(a_conditions),
            "reasoning": "HYROX 积极参赛意愿 + 有运动基础 + 综合评分≥35 + HYROX潜力≥3 → 备赛型（A类）",
            "recommended_products": [
                "HYROX 12周备赛营",
                "运动表现专项私教 10次卡",
            ],
        }

    # 🔹 B类
    b_conditions = [
        hyrox_interest in ("是", "观望"),
        20 <= total_score <= 34,
        training_willingness >= 3,
    ]
    if all(b_conditions):
        matched = sum(b_conditions)
        return {
            "client_type": "B",
            "confidence": matched / len(b_conditions),
            "reasoning": "HYROX 有兴趣/观望 + 综合评分20-34 + 训练意愿≥3 → 观望型（B类）",
            "recommended_products": [
                "HYROX基础测试 299元",
                "团课月卡",
            ],
        }

    # 🔹 C类
    c_conditions = [
        sport_background == "零基础",
        hyrox_interest in ("否", "观望"),
        cardio_endurance <= 2,
    ]
    if all(c_conditions):
        matched = sum(c_conditions)
        return {
            "client_type": "C",
            "confidence": matched / len(c_conditions),
            "reasoning": "零基础 + 对HYROX无兴趣/观望 + 心肺耐力≤2 → 减脂型（C类）",
            "recommended_products": [
                "团课月卡",
                "燃脂营",
            ],
        }

    # 🔹 D类
    d_conditions = [
        sport_background == "有专项运动基础",
        lower_body_strength <= 3 or upper_body_pushpull <= 3,
    ]
    if all(d_conditions):
        matched = sum(d_conditions)
        # d_conditions[1] is True if either condition is met
        d_matched = sum([d_conditions[0], bool(d_conditions[1])])
        confidence = d_matched / len(d_conditions)
        return {
            "client_type": "D",
            "confidence": confidence,
            "reasoning": "有专项运动基础 + (下肢力量≤3 或 上肢推拉≤3) → 专项型（D类）",
            "recommended_products": [
                "运动表现筛查",
                "运动表现专项私教 10次卡",
            ],
        }

    # 🔹 E类
    e_conditions = [
        source in ("大众点评", "小红书"),
        hyrox_interest == "否",
        completion_state <= 2,
    ]
    if all(e_conditions):
        matched = sum(e_conditions)
        return {
            "client_type": "E",
            "confidence": matched / len(e_conditions),
            "reasoning": "来源(大众点评/小红书) + HYROX无兴趣 + 完成状态≤2 → 低频型（E类）",
            "recommended_products": [
                "周末课",
                "低频课包",
            ],
        }

    # 🔹 F类 (fallback)
    f_conditions = [
        training_willingness <= 2,
        hyrox_interest == "否",
    ]
    if all(f_conditions):
        matched = sum(f_conditions)
        return {
            "client_type": "F",
            "confidence": matched / len(f_conditions),
            "reasoning": "训练意愿≤2 + HYROX无兴趣 → 低意向型（F类），暂不跟进",
            "recommended_products": [],
        }

    # 🔹 兜底 — 无法匹配任何规则时给最低优先级 F，confidence=0
    return {
        "client_type": "F",
        "confidence": 0.0,
        "reasoning": "未命中 A-E 规则，自动归入低意向（F类）",
        "recommended_products": [],
    }
