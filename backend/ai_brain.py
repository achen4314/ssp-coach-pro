"""
SSP COACH PRO — DeepSeek AI 大脑
统一 AI 接口：短板分析 / 跟进话术 / 人群洞察 / 教练问答
"""
import json
from typing import Generator, List, Dict, Any

from config import Config


class DeepSeekBrain:
    """DeepSeek AI 统一封装 — SSP 运动表现 & 销售智能"""

    def __init__(self):
        self._client = None

    # ── 延迟初始化（避免 import 时因缺少 SDK 崩溃） ──
    @property
    def client(self):
        if self._client is None:
            if not Config.DEEPSEEK_API_KEY:
                return None
            from openai import OpenAI

            self._client = OpenAI(
                api_key=Config.DEEPSEEK_API_KEY,
                base_url=Config.DEEPSEEK_BASE_URL,
            )
        return self._client

    @property
    def model(self) -> str:
        return Config.DEEPSEEK_MODEL

    @property
    def available(self) -> bool:
        return bool(Config.DEEPSEEK_API_KEY)

    # ── 基础聊天 ──
    def chat(
        self, system_prompt: str, user_message: str, stream: bool = False
    ) -> str:
        """标准非流式 chat completion"""
        if not self.available:
            return "AI 服务未配置，请联系管理员设置 DEEPSEEK_API_KEY"

        try:
            resp = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                temperature=0.7,
                max_tokens=2048,
                stream=False,
            )
            return resp.choices[0].message.content or ""
        except Exception as e:
            return f"AI 调用失败：{str(e)}"

    def chat_stream(
        self, system_prompt: str, user_message: str
    ) -> Generator[str, None, None]:
        """流式 chat completion — 逐 token yield"""
        if not self.available:
            yield "AI 服务未配置，请联系管理员设置 DEEPSEEK_API_KEY"
            return

        try:
            resp = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                temperature=0.7,
                max_tokens=2048,
                stream=True,
            )
            for chunk in resp:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            yield f"AI 调用失败：{str(e)}"

    # ═══════════════════════════════════════════════════
    #  专项方法
    # ═══════════════════════════════════════════════════

    def analyze_weakness(
        self, scores: Dict[str, int], sport_background: str, age: int
    ) -> str:
        """
        分析运动员核心短板，给出训练优先级和预期改善时间。

        Args:
            scores: 10 维度评分 dict {dimension_name: score}
            sport_background: 运动背景描述
            age: 年龄
        """
        system_prompt = (
            "你是SSP运动表现分析专家。"
            "根据运动员10维度评分，分析核心短板，给出训练优先级和预期改善时间。"
            "回复使用中文，结构清晰，包含："
            "1) 核心短板识别（列出最弱的2-3项）"
            "2) 训练优先级排序"
            "3) 各项预期改善时间"
            "4) 总体建议"
        )

        user_message = json.dumps(
            {
                "scores": scores,
                "sport_background": sport_background,
                "age": age,
            },
            ensure_ascii=False,
            indent=2,
        )

        return self.chat(system_prompt, user_message)

    def suggest_followup(
        self,
        athlete_name: str,
        client_type: str,
        weaknesses: List[str],
        recommended_product: str,
    ) -> str:
        """
        生成三版微信跟进话术：温和版、专业版、激励版。

        Args:
            athlete_name: 学员姓名
            client_type: 客户类型 (A-F)
            weaknesses: 弱点列表
            recommended_product: 推荐产品名称
        """
        system_prompt = (
            "你是SSP教练销售顾问。"
            "根据学员评估结果，生成3版微信跟进话术："
            "1) 🟢 温和版 — 轻松友好，适合初次接触"
            "2) 🔵 专业版 — 强调数据和训练方案"
            "3) 🟡 激励版 — 激发行动，制造紧迫感"
            "确保适配SSP品牌语气：专业、科学、温暖。"
            "用中文回复，分别标注三版话术。"
        )

        user_message = json.dumps(
            {
                "athlete_name": athlete_name,
                "client_type": client_type,
                "weaknesses": weaknesses,
                "recommended_product": recommended_product,
            },
            ensure_ascii=False,
            indent=2,
        )

        return self.chat(system_prompt, user_message)

    def audience_insight(
        self, athletes_summary: List[Dict[str, Any]]
    ) -> str:
        """
        基于学员数据，分析人群特征、转化瓶颈、给出策略建议。

        Args:
            athletes_summary: 匿名化学员摘要列表
                [{type, source, total_score, converted, ...}]
        """
        system_prompt = (
            "你是SSP数据分析师。"
            "基于学员数据，分析人群特征、转化瓶颈、给出策略建议。"
            "回复结构："
            "1) 🧑‍🤝‍🧑 人群画像（主要客户类型占比和特征）"
            "2) 📊 转化漏斗分析（找出流失环节）"
            "3) 🎯 策略建议（具体可行的提升方案）"
            "4) ⚠️ 风险提示"
            "用中文回复。"
        )

        user_message = json.dumps(
            athletes_summary, ensure_ascii=False, indent=2
        )

        return self.chat(system_prompt, user_message)

    def coach_chat(
        self,
        system_prompt: str = "",
        user_message: str = "",
        stream: bool = False,
    ):
        """
        教练自由问答 AI 助手。

        Args:
            system_prompt: 可自定义系统提示词
            user_message: 用户消息
            stream: 是否流式输出
        """
        if not system_prompt:
            system_prompt = (
                "你是SSP COACH PRO的AI教练助手。"
                "你可以帮助教练分析学员数据、提供训练建议、生成跟进话术、"
                "解答运动科学问题。你的语气专业但友善，用中文回复。"
            )

        if stream:
            return self.chat_stream(system_prompt, user_message)
        return self.chat(system_prompt, user_message)
