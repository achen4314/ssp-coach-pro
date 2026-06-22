"""
SSP COACH PRO — 配置模块
自动检测 PostgreSQL / SQLite，根据环境变量 DATABASE_URL 切换。
"""
import os


class Config:
    """应用核心配置"""

    # --- Flask 基础 ---
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-in-production")

    # --- 数据库：PostgreSQL 优先，降级 SQLite ---
    _db_url: str = os.getenv("DATABASE_URL", "").strip()
    if _db_url:
        SQLALCHEMY_DATABASE_URI: str = _db_url
    else:
        SQLALCHEMY_DATABASE_URI: str = "sqlite:///ssp_coach_pro.db"

    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False

    # --- JWT ---
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", SECRET_KEY)

    # --- DeepSeek AI ---
    DEEPSEEK_API_KEY: str = os.getenv("DEEPSEEK_API_KEY", "")
    DEEPSEEK_BASE_URL: str = os.getenv(
        "DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1"
    )
    DEEPSEEK_MODEL: str = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

    # --- 生产环境标识 ---
    IS_PRODUCTION: bool = os.getenv("FLASK_ENV", "").lower() == "production"


class BrandConfig:
    """SSP 品牌视觉 & 业务常量"""

    # --- 品牌色 ---
    GREEN = "#a0c040"
    DARK_TEAL = "#204040"
    GOLD = "#c0c060"

    # --- 角色中文标签 ---
    ROLE_LABELS = {
        "coach": "教练",
        "admin": "总教练",
        "athlete": "学员",
    }
