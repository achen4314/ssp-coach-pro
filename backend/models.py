"""
SSP COACH PRO — SQLAlchemy 数据模型
教练员运动员管理平台 · STEELBULL SPORT PERFORMANCE
"""

from datetime import datetime, date
from typing import Optional, List, Dict, Any

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import UniqueConstraint, Index, text
from sqlalchemy.orm import relationship, validates
from werkzeug.security import generate_password_hash, check_password_hash

# ── 全局 db 实例 ──
db = SQLAlchemy()

# ── 评分维度常量 ──
DIMENSIONS: List[str] = [
    "cardio_endurance",
    "running_ability",
    "lower_body_strength",
    "upper_body_pushpull",
    "core_stability",
    "motor_coordination",
    "fatigue_resistance",
    "training_willingness",
    "completion_state",
    "hyrox_potential",
]

# 维度中文标签
DIMENSION_LABELS: Dict[str, str] = {
    "cardio_endurance": "心肺耐力",
    "running_ability": "跑步能力",
    "lower_body_strength": "下肢力量",
    "upper_body_pushpull": "上肢推拉",
    "core_stability": "核心稳定",
    "motor_coordination": "动作协调",
    "fatigue_resistance": "抗疲劳能力",
    "training_willingness": "训练意愿",
    "completion_state": "完成状态",
    "hyrox_potential": "HYROX 潜力",
}

# ── 客户类型 ──
CLIENT_TYPES: Dict[str, str] = {
    "A": "备赛型",
    "B": "观望型",
    "C": "减脂型",
    "D": "专项型",
    "E": "低频型",
    "F": "低意向",
}

# ── 来源选项 ──
SOURCES: List[str] = [
    "大众点评", "社群", "老会员转介绍", "小红书", "其他",
]

# ── HYROX 兴趣选项 ──
HYROX_INTEREST_OPTIONS: List[str] = ["是", "否", "观望"]

# ── 弱点候选 ──
WEAKNESS_OPTIONS: List[str] = [
    "心肺耐力不足", "跑步能力弱", "下肢力量不足",
    "上肢推拉力量不足", "核心稳定性差", "动作协调性差",
    "抗疲劳能力弱", "训练意愿低", "完成度差",
    "HYROX 专项潜力低", "无明显短板",
]


# ============================================================
#  User — 统一用户表
# ============================================================
class User(db.Model):
    """统一用户：教练/管理员/运动员"""

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(
        db.String(20), nullable=False, default="coach", index=True
    )  # admin / coach / athlete
    display_name = db.Column(db.String(120), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # ── 关系 ──
    coach_profile = relationship(
        "Coach", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    athlete_profile = relationship(
        "Athlete", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )

    # ── 密码工具 ──
    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "username": self.username,
            "role": self.role,
            "display_name": self.display_name,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self) -> str:
        return f"<User {self.username} ({self.role})>"


# ============================================================
#  Coach — 教练档案
# ============================================================
class Coach(db.Model):
    """教练扩展信息"""

    __tablename__ = "coaches"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False
    )
    title = db.Column(db.String(80), default="")  # 高级教练 / 金牌教练
    bio = db.Column(db.Text, default="")
    certifications = db.Column(db.JSON, default=list)  # ["NSCA-CSCS", "ACE"]
    specialties = db.Column(db.JSON, default=list)  # ["HYROX", "力量训练"]
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # ── 关系 ──
    user = relationship("User", back_populates="coach_profile")
    athletes = relationship("Athlete", back_populates="coach", lazy="dynamic")
    assessments = relationship("Assessment", back_populates="coach", lazy="dynamic")
    training_plans = relationship("TrainingPlan", back_populates="coach", lazy="dynamic")
    sales_follows = relationship("SalesFollow", back_populates="coach", lazy="dynamic")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "display_name": self.user.display_name if self.user else "",
            "title": self.title,
            "bio": self.bio,
            "certifications": self.certifications or [],
            "specialties": self.specialties or [],
            "athlete_count": self.athletes.count() if self.athletes else 0,
        }

    def __repr__(self) -> str:
        return f"<Coach {self.user.display_name if self.user else self.id}>"


# ============================================================
#  Athlete — 运动员档案
# ============================================================
class Athlete(db.Model):
    """运动员/客户档案"""

    __tablename__ = "athletes"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), unique=True, nullable=True
    )  # nullable: 允许无登录账号的学员
    coach_id = db.Column(db.Integer, db.ForeignKey("coaches.id"), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20), default="")
    gender = db.Column(db.String(10), default="")  # 男 / 女
    birth_date = db.Column(db.Date, nullable=True)
    source = db.Column(db.String(20), default="")  # 大众点评/社群/...
    hyrox_interest = db.Column(db.String(10), default="")  # 是/否/观望
    sport_background = db.Column(db.String(30), default="")
    current_client_type = db.Column(db.String(2), default="")  # 最新 A-F 类型
    notes = db.Column(db.Text, default="")
    is_active = db.Column(db.Boolean, default=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # ── 关系 ──
    user = relationship("User", back_populates="athlete_profile")
    coach = relationship("Coach", back_populates="athletes")
    assessments = relationship(
        "Assessment", back_populates="athlete", lazy="dynamic", order_by="Assessment.assessment_date.desc()"
    )
    body_metrics = relationship(
        "BodyMetric", back_populates="athlete", lazy="dynamic", order_by="BodyMetric.measured_date.desc()"
    )
    training_assignments = relationship(
        "PlanAssignment", back_populates="athlete", lazy="dynamic"
    )
    injury_records = relationship("InjuryRecord", back_populates="athlete", lazy="dynamic")
    sales_follows = relationship("SalesFollow", back_populates="athlete", lazy="dynamic")

    # ── 计算属性 ──
    @property
    def age(self) -> Optional[int]:
        if self.birth_date is None:
            return None
        today = date.today()
        return (
            today.year
            - self.birth_date.year
            - ((today.month, today.day) < (self.birth_date.month, self.birth_date.day))
        )

    @property
    def latest_assessment(self):
        return self.assessments.order_by(None).order_by(
            Assessment.assessment_date.desc()
        ).first()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "coach_id": self.coach_id,
            "coach_name": self.coach.user.display_name if self.coach and self.coach.user else "",
            "name": self.name,
            "phone": self.phone,
            "gender": self.gender,
            "birth_date": self.birth_date.isoformat() if self.birth_date else None,
            "age": self.age,
            "source": self.source,
            "hyrox_interest": self.hyrox_interest,
            "sport_background": self.sport_background,
            "current_client_type": self.current_client_type,
            "notes": self.notes,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self) -> str:
        return f"<Athlete {self.name}>"


# ============================================================
#  Assessment — SSP 综合评估
# ============================================================
class Assessment(db.Model):
    """SSP 综合评估记录 — 核心评估表"""

    __tablename__ = "assessments"

    id = db.Column(db.Integer, primary_key=True)
    athlete_id = db.Column(db.Integer, db.ForeignKey("athletes.id"), nullable=False, index=True)
    coach_id = db.Column(db.Integer, db.ForeignKey("coaches.id"), nullable=False)
    assessment_date = db.Column(db.Date, nullable=False, default=date.today, index=True)

    # ── 来源 / 基础信息（评估时可覆盖 athlete 档案） ──
    source = db.Column(db.String(20), default="")
    hyrox_interest = db.Column(db.String(10), default="")
    sport_background = db.Column(db.String(30), default="")
    trial_class = db.Column(db.String(30), default="")

    # ── 10 维度评分 (1-5) ──
    cardio_endurance = db.Column(db.Integer, default=0)
    running_ability = db.Column(db.Integer, default=0)
    lower_body_strength = db.Column(db.Integer, default=0)
    upper_body_pushpull = db.Column(db.Integer, default=0)
    core_stability = db.Column(db.Integer, default=0)
    motor_coordination = db.Column(db.Integer, default=0)
    fatigue_resistance = db.Column(db.Integer, default=0)
    training_willingness = db.Column(db.Integer, default=0)
    completion_state = db.Column(db.Integer, default=0)
    hyrox_potential = db.Column(db.Integer, default=0)
    total_score = db.Column(db.Integer, default=0)  # /50，自动求和

    # ── 分类 ──
    top_weaknesses = db.Column(db.JSON, default=list)  # ["心肺耐力不足", ...]
    client_type = db.Column(db.String(2), default="")  # A-F
    client_type_confidence = db.Column(db.Float, default=0.0)  # 0.0 - 1.0
    client_type_auto = db.Column(db.Boolean, default=True)  # True=系统自动, False=教练手动

    # ── 推荐 ──
    recommended_products = db.Column(db.JSON, default=list)  # 推荐产品列表
    coach_feedback = db.Column(db.String(500), default="")  # 教练一句话反馈

    # ── 销售跟进 (内嵌) ──
    sales_test_recommended = db.Column(db.Boolean, default=False)  # 是否推荐测试课
    sales_test_scheduled = db.Column(db.Boolean, default=False)  # 是否已约测试课
    sales_group_joined = db.Column(db.Boolean, default=False)  # 是否已拉群
    sales_camp_recommended = db.Column(db.Boolean, default=False)  # 是否推荐训练营
    sales_private_screening = db.Column(db.Boolean, default=False)  # 私教初筛
    sales_followup_24h = db.Column(db.Boolean, default=False)  # 24h 内跟进
    sales_high_intent = db.Column(db.Boolean, default=False)  # 高意向标记
    sales_notes = db.Column(db.Text, default="")  # 销售备注

    # ── 状态 ──
    is_complete = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # ── 关系 ──
    athlete = relationship("Athlete", back_populates="assessments")
    coach = relationship("Coach", back_populates="assessments")

    # ── 索引 ──
    __table_args__ = (
        Index("ix_assessment_athlete_date", "athlete_id", "assessment_date"),
    )

    # ── 计算属性 ──
    @property
    def score_dict(self) -> Dict[str, int]:
        """返回所有维度分数字典"""
        return {dim: getattr(self, dim, 0) for dim in DIMENSIONS}

    @property
    def weakness_labels(self) -> List[str]:
        """弱点中文标签"""
        return [
            WEAKNESS_OPTIONS[int(i)] if isinstance(i, (int, str)) and str(i).isdigit() else str(i)
            for i in (self.top_weaknesses or [])
        ]

    @property
    def client_type_label(self) -> str:
        """客户类型中文标签"""
        return CLIENT_TYPES.get(self.client_type, self.client_type or "未知")

    def calculate_total(self) -> int:
        """计算总分（/50）并写入 total_score"""
        total = sum(getattr(self, dim, 0) for dim in DIMENSIONS)
        self.total_score = total
        return total

    @validates(
        "cardio_endurance", "running_ability", "lower_body_strength",
        "upper_body_pushpull", "core_stability", "motor_coordination",
        "fatigue_resistance", "training_willingness", "completion_state",
        "hyrox_potential",
    )
    def validate_score(self, key: str, value: int) -> int:
        if value is not None and (value < 0 or value > 5):
            raise ValueError(f"{key} 评分必须在 0-5 之间")
        return value

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "athlete_id": self.athlete_id,
            "athlete_name": self.athlete.name if self.athlete else "",
            "coach_id": self.coach_id,
            "coach_name": self.coach.user.display_name if self.coach and self.coach.user else "",
            "assessment_date": self.assessment_date.isoformat() if self.assessment_date else None,
            "source": self.source,
            "hyrox_interest": self.hyrox_interest,
            "sport_background": self.sport_background,
            "trial_class": self.trial_class,
            # 评分
            **self.score_dict,
            "total_score": self.total_score,
            # 分类
            "top_weaknesses": self.top_weaknesses or [],
            "client_type": self.client_type,
            "client_type_label": self.client_type_label,
            "client_type_confidence": self.client_type_confidence,
            "client_type_auto": self.client_type_auto,
            # 推荐
            "recommended_products": self.recommended_products or [],
            "coach_feedback": self.coach_feedback,
            # 销售
            "sales_test_recommended": self.sales_test_recommended,
            "sales_test_scheduled": self.sales_test_scheduled,
            "sales_group_joined": self.sales_group_joined,
            "sales_camp_recommended": self.sales_camp_recommended,
            "sales_private_screening": self.sales_private_screening,
            "sales_followup_24h": self.sales_followup_24h,
            "sales_high_intent": self.sales_high_intent,
            "sales_notes": self.sales_notes,
            # 状态
            "is_complete": self.is_complete,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self) -> str:
        return f"<Assessment #{self.id} athlete={self.athlete_id} date={self.assessment_date}>"


# ============================================================
#  BodyMetric — 身体指标
# ============================================================
class BodyMetric(db.Model):
    """运动员身体指标记录"""

    __tablename__ = "body_metrics"

    id = db.Column(db.Integer, primary_key=True)
    athlete_id = db.Column(db.Integer, db.ForeignKey("athletes.id"), nullable=False, index=True)
    measured_date = db.Column(db.Date, nullable=False, default=date.today)
    weight_kg = db.Column(db.Float, nullable=True)  # 体重 (kg)
    body_fat_pct = db.Column(db.Float, nullable=True)  # 体脂率 (%)
    muscle_kg = db.Column(db.Float, nullable=True)  # 肌肉量 (kg)
    waist_cm = db.Column(db.Float, nullable=True)  # 腰围 (cm)
    notes = db.Column(db.Text, default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # ── 关系 ──
    athlete = relationship("Athlete", back_populates="body_metrics")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "athlete_id": self.athlete_id,
            "measured_date": self.measured_date.isoformat() if self.measured_date else None,
            "weight_kg": self.weight_kg,
            "body_fat_pct": self.body_fat_pct,
            "muscle_kg": self.muscle_kg,
            "waist_cm": self.waist_cm,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self) -> str:
        return f"<BodyMetric {self.athlete_id} @ {self.measured_date}>"


# ============================================================
#  TrainingPlan — 训练计划模板
# ============================================================
class TrainingPlan(db.Model):
    """训练计划模板"""

    __tablename__ = "training_plans"

    id = db.Column(db.Integer, primary_key=True)
    coach_id = db.Column(db.Integer, db.ForeignKey("coaches.id"), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default="")
    type = db.Column(db.String(30), default="")  # HYROX / 力量 / 减脂 / 康复
    duration_weeks = db.Column(db.Integer, default=4)
    is_template = db.Column(db.Boolean, default=True)  # True=模板 / False=定制
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # ── 关系 ──
    coach = relationship("Coach", back_populates="training_plans")
    plan_days = relationship(
        "PlanDay", back_populates="plan", lazy="dynamic",
        order_by="PlanDay.day_number", cascade="all, delete-orphan",
    )
    assignments = relationship("PlanAssignment", back_populates="plan", lazy="dynamic")

    @property
    def day_count(self) -> int:
        return self.plan_days.count() if self.plan_days else 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "coach_id": self.coach_id,
            "name": self.name,
            "description": self.description,
            "type": self.type,
            "duration_weeks": self.duration_weeks,
            "day_count": self.day_count,
            "is_template": self.is_template,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self) -> str:
        return f"<TrainingPlan {self.name}>"


# ============================================================
#  PlanDay — 训练日内容
# ============================================================
class PlanDay(db.Model):
    """训练计划中的单日内容"""

    __tablename__ = "plan_days"

    id = db.Column(db.Integer, primary_key=True)
    plan_id = db.Column(db.Integer, db.ForeignKey("training_plans.id"), nullable=False, index=True)
    day_number = db.Column(db.Integer, nullable=False)  # 第 N 天 (1-based)
    warmup = db.Column(db.JSON, default=list)  # [{"exercise": "...", "sets": 1, "reps": "..."}]
    main_workout = db.Column(db.JSON, default=list)  # 主训练
    finisher = db.Column(db.JSON, default=list)  # 整理/代谢
    coach_notes = db.Column(db.Text, default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # ── 关系 ──
    plan = relationship("TrainingPlan", back_populates="plan_days")
    training_logs = relationship("TrainingLog", back_populates="plan_day", lazy="dynamic")

    __table_args__ = (
        UniqueConstraint("plan_id", "day_number", name="uq_plan_day"),
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "plan_id": self.plan_id,
            "day_number": self.day_number,
            "warmup": self.warmup or [],
            "main_workout": self.main_workout or [],
            "finisher": self.finisher or [],
            "coach_notes": self.coach_notes,
        }

    def __repr__(self) -> str:
        return f"<PlanDay plan={self.plan_id} day={self.day_number}>"


# ============================================================
#  PlanAssignment — 计划分配
# ============================================================
class PlanAssignment(db.Model):
    """将训练计划分配给运动员"""

    __tablename__ = "plan_assignments"

    id = db.Column(db.Integer, primary_key=True)
    athlete_id = db.Column(db.Integer, db.ForeignKey("athletes.id"), nullable=False, index=True)
    plan_id = db.Column(db.Integer, db.ForeignKey("training_plans.id"), nullable=False)
    start_date = db.Column(db.Date, nullable=False, default=date.today)
    status = db.Column(db.String(20), default="active")  # active / paused / completed / dropped
    notes = db.Column(db.Text, default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # ── 关系 ──
    athlete = relationship("Athlete", back_populates="training_assignments")
    plan = relationship("TrainingPlan", back_populates="assignments")
    training_logs = relationship("TrainingLog", back_populates="assignment", lazy="dynamic")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "athlete_id": self.athlete_id,
            "plan_id": self.plan_id,
            "plan_name": self.plan.name if self.plan else "",
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "status": self.status,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self) -> str:
        return f"<PlanAssignment athlete={self.athlete_id} plan={self.plan_id}>"


# ============================================================
#  TrainingLog — 训练日志
# ============================================================
class TrainingLog(db.Model):
    """运动员每日训练打卡日志"""

    __tablename__ = "training_logs"

    id = db.Column(db.Integer, primary_key=True)
    athlete_id = db.Column(db.Integer, db.ForeignKey("athletes.id"), nullable=False, index=True)
    assignment_id = db.Column(db.Integer, db.ForeignKey("plan_assignments.id"), nullable=True)
    plan_day_id = db.Column(db.Integer, db.ForeignKey("plan_days.id"), nullable=True)
    log_date = db.Column(db.Date, nullable=False, default=date.today)
    content = db.Column(db.Text, default="")  # 训练内容 / 备注
    athlete_feedback = db.Column(db.Text, default="")  # 运动员自评
    coach_review = db.Column(db.Text, default="")  # 教练点评
    completion_pct = db.Column(db.Integer, default=0)  # 完成度 0-100
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # ── 关系 ──
    assignment = relationship("PlanAssignment", back_populates="training_logs")
    plan_day = relationship("PlanDay", back_populates="training_logs")
    athlete = None  # 通过 assignment.athlete 间接访问（不加 back_populates 以避免冲突）

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "athlete_id": self.athlete_id,
            "assignment_id": self.assignment_id,
            "plan_day_id": self.plan_day_id,
            "log_date": self.log_date.isoformat() if self.log_date else None,
            "content": self.content,
            "athlete_feedback": self.athlete_feedback,
            "coach_review": self.coach_review,
            "completion_pct": self.completion_pct,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self) -> str:
        return f"<TrainingLog athlete={self.athlete_id} date={self.log_date}>"


# ============================================================
#  InjuryRecord — 伤病记录
# ============================================================
class InjuryRecord(db.Model):
    """运动员伤病记录"""

    __tablename__ = "injury_records"

    id = db.Column(db.Integer, primary_key=True)
    athlete_id = db.Column(db.Integer, db.ForeignKey("athletes.id"), nullable=False, index=True)
    body_part = db.Column(db.String(50), nullable=False)  # 受伤部位: 肩/膝/腰/...
    injury_type = db.Column(db.String(50), default="")  # 伤病类型: 拉伤/扭伤/劳损/术后
    severity = db.Column(db.String(20), default="轻度")  # 轻度 / 中度 / 重度
    status = db.Column(db.String(20), default="active")  # active / recovered / chronic
    onset_date = db.Column(db.Date, nullable=True)
    recovery_date = db.Column(db.Date, nullable=True)
    notes = db.Column(db.Text, default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # ── 关系 ──
    athlete = relationship("Athlete", back_populates="injury_records")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "athlete_id": self.athlete_id,
            "body_part": self.body_part,
            "injury_type": self.injury_type,
            "severity": self.severity,
            "status": self.status,
            "onset_date": self.onset_date.isoformat() if self.onset_date else None,
            "recovery_date": self.recovery_date.isoformat() if self.recovery_date else None,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self) -> str:
        return f"<InjuryRecord {self.athlete_id} {self.body_part} [{self.status}]>"


# ============================================================
#  SalesFollow — 销售跟进记录
# ============================================================
class SalesFollow(db.Model):
    """销售跟进记录"""

    __tablename__ = "sales_follows"

    id = db.Column(db.Integer, primary_key=True)
    athlete_id = db.Column(db.Integer, db.ForeignKey("athletes.id"), nullable=False, index=True)
    coach_id = db.Column(db.Integer, db.ForeignKey("coaches.id"), nullable=False)
    follow_type = db.Column(db.String(30), default="")  # 电话 / 微信 / 到店 / 测试课
    scheduled_at = db.Column(db.DateTime, nullable=True)  # 计划跟进时间
    completed_at = db.Column(db.DateTime, nullable=True)  # 实际完成时间
    result = db.Column(db.String(30), default="")  # 有意向 / 无意向 / 已成交 / 待跟进
    notes = db.Column(db.Text, default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # ── 关系 ──
    athlete = relationship("Athlete", back_populates="sales_follows")
    coach = relationship("Coach", back_populates="sales_follows")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "athlete_id": self.athlete_id,
            "coach_id": self.coach_id,
            "follow_type": self.follow_type,
            "scheduled_at": self.scheduled_at.isoformat() if self.scheduled_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "result": self.result,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self) -> str:
        return f"<SalesFollow athlete={self.athlete_id} type={self.follow_type}>"


# ============================================================
#  ProductCatalog — 产品目录
# ============================================================
class ProductCatalog(db.Model):
    """SSP 产品/课程目录"""

    __tablename__ = "product_catalog"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    price = db.Column(db.Float, default=0.0)
    description = db.Column(db.Text, default="")
    target_types = db.Column(db.JSON, default=list)  # ["A", "B", "D"] 适用客户类型
    category = db.Column(db.String(30), default="")  # 测试课 / 训练营 / 私教 / 团课
    is_active = db.Column(db.Boolean, default=True)
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "price": self.price,
            "description": self.description,
            "target_types": self.target_types or [],
            "category": self.category,
            "is_active": self.is_active,
            "sort_order": self.sort_order,
        }

    def __repr__(self) -> str:
        return f"<ProductCatalog {self.name}>"


# ============================================================
#  辅助函数
# ============================================================
def init_db():
    """幂等建表 — 在 create_app 工厂中调用"""
    db.create_all()


def seed_defaults():
    """初始化默认数据（首次部署时调用）"""
    # 默认管理员
    if not User.query.filter_by(username="admin").first():
        admin = User(
            username="admin",
            display_name="总教练",
            role="admin",
            is_active=True,
        )
        admin.set_password("admin123")
        db.session.add(admin)
        db.session.flush()

        # 创建对应 Coach 档案
        coach = Coach(
            user_id=admin.id,
            title="总教练",
            bio="SSP 创始人 & 主教练",
        )
        db.session.add(coach)

    # 默认产品
    default_products = [
        {
            "name": "HYROX 基础测试",
            "price": 99.0,
            "description": "30 分钟综合体能评估，含 10 项维度评分",
            "target_types": ["A", "B", "C", "D", "E", "F"],
            "category": "测试课",
            "sort_order": 1,
        },
        {
            "name": "12 周备赛营",
            "price": 5999.0,
            "description": "针对 HYROX 比赛的 12 周系统训练",
            "target_types": ["A", "D"],
            "category": "训练营",
            "sort_order": 2,
        },
        {
            "name": "私教 1v1（月卡）",
            "price": 2999.0,
            "description": "每月 8 次一对一私教课",
            "target_types": ["A", "B", "C", "D"],
            "category": "私教",
            "sort_order": 3,
        },
        {
            "name": "减脂训练营",
            "price": 3999.0,
            "description": "8 周减脂专项训练营",
            "target_types": ["C", "E", "F"],
            "category": "训练营",
            "sort_order": 4,
        },
    ]
    for prod in default_products:
        if not ProductCatalog.query.filter_by(name=prod["name"]).first():
            db.session.add(ProductCatalog(**prod))

    db.session.commit()
