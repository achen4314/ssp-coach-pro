"""
SSP COACH PRO — 认证接口 (Blueprint: api_auth)
POST /login   POST /register   GET /me
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    jwt_required,
    create_access_token,
    get_jwt_identity,
    get_jwt,
)
from models import db, User, Coach

api_auth_bp = Blueprint("api_auth", __name__, url_prefix="/api/v1/auth")


def _auto_seed_users():
    """安全网：数据库为空时自动创建默认用户"""
    try:
        from models import Coach
        admin = User(username="admin", role="admin", display_name="总教练")
        admin.set_password("admin123")
        db.session.add(admin); db.session.flush()
        db.session.add(Coach(user_id=admin.id, title="总教练"))
        for uname, pwd, dname, title in [
            ("coach1", "coach123", "李教练", "高级教练"),
            ("coach2", "coach123", "王教练", "金牌教练"),
        ]:
            u = User(username=uname, role="coach", display_name=dname)
            u.set_password(pwd)
            db.session.add(u); db.session.flush()
            db.session.add(Coach(user_id=u.id, title=title))
        db.session.commit()
        print("[auto_seed] Created default users")
    except Exception as e:
        db.session.rollback()
        print(f"[auto_seed] Failed: {e}")


# ────────────────────────── POST /login ──────────────────────────
@api_auth_bp.route("/login", methods=["POST"])
def login():
    """教练/管理员登录，返回 JWT token"""
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    if not username or not password:
        return jsonify({"error": "请输入用户名和密码"}), 400

    user: User = User.query.filter_by(username=username).first()
    if user is None or not user.check_password(password):
        # 安全网：如果数据库是全新的（无任何用户），自动播种后重试
        if User.query.count() == 0:
            _auto_seed_users()
            user = User.query.filter_by(username=username).first()
    if user is None or not user.check_password(password):
        return jsonify({"error": "用户名或密码错误"}), 401

    if not user.is_active:
        return jsonify({"error": "账号已被禁用"}), 403

    # 额外 claims 放入角色 & 显示名
    additional_claims = {
        "role": user.role,
        "display_name": user.display_name,
    }
    access_token = create_access_token(
        identity=str(user.id),
        additional_claims=additional_claims,
    )

    return jsonify({
        "token": access_token,
        "user": user.to_dict(),
    }), 200


# ────────────────────────── GET /me ──────────────────────────
@api_auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    """获取当前登录用户信息"""
    user_id = int(get_jwt_identity())
    user: User = User.query.get(user_id)
    if user is None:
        return jsonify({"error": "用户不存在"}), 404

    result = user.to_dict()
    # 附加 coach 档案（若存在）
    if user.coach_profile:
        result["coach"] = user.coach_profile.to_dict()
    if user.athlete_profile:
        result["athlete"] = user.athlete_profile.to_dict()

    return jsonify(result), 200


# ────────────────────────── POST /register ──────────────────────────
@api_auth_bp.route("/register", methods=["POST"])
def register():
    """教练注册（创建 User + Coach 档案）"""
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()
    display_name = (data.get("display_name") or "").strip()
    role = (data.get("role") or "coach").strip()

    # 校验必填
    if not username or not password:
        return jsonify({"error": "用户名和密码不能为空"}), 400
    if not display_name:
        return jsonify({"error": "显示名称不能为空"}), 400
    if role not in ("coach", "admin", "athlete"):
        return jsonify({"error": "无效的角色"}), 400

    # 用户名唯一
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "用户名已存在"}), 409

    # 创建 User
    user = User(
        username=username,
        display_name=display_name,
        role=role,
        is_active=True,
    )
    user.set_password(password)
    db.session.add(user)
    db.session.flush()  # 获取 user.id

    # 创建 Coach 档案（仅教练/管理员）
    if role in ("coach", "admin"):
        coach = Coach(
            user_id=user.id,
            title=data.get("title", ""),
            bio=data.get("bio", ""),
            certifications=data.get("certifications", []),
            specialties=data.get("specialties", []),
        )
        db.session.add(coach)

    db.session.commit()

    # 签发 token
    additional_claims = {
        "role": user.role,
        "display_name": user.display_name,
    }
    access_token = create_access_token(
        identity=str(user.id),
        additional_claims=additional_claims,
    )

    return jsonify({
        "token": access_token,
        "user": user.to_dict(),
    }), 201
