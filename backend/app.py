"""
SSP COACH PRO — Flask 应用入口
教练员运动员管理平台后端
"""
# ── dotenv 必须在所有 config 读取之前加载 ──
from dotenv import load_dotenv

load_dotenv()

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config

# ── 初始化扩展 ──
from models import db  # db 实例统一定义在 models.py 中
jwt = JWTManager()


_db_initialized = False

def _ensure_db(app_obj) -> None:
    """幂等建表 + 种子数据。gunicorn 兼容：create_app 内调用 + @before_request 兜底"""
    global _db_initialized
    if _db_initialized:
        return
    try:
        db.create_all()
        from models import ProductCatalog, User, Coach
        ProductCatalog.seed_defaults()
        if not User.query.filter_by(username="admin").first():
            admin = User(username="admin", role="admin", display_name="总教练")
            admin.set_password("admin123")
            db.session.add(admin)
        if not Coach.query.first():
            # Create demo coaches
            for uname, pwd, dname, title in [
                ("coach1", "coach123", "李教练", "高级教练"),
                ("coach2", "coach123", "王教练", "金牌教练"),
            ]:
                u = User(username=uname, role="coach", display_name=dname)
                u.set_password(pwd)
                db.session.add(u)
                db.session.flush()
                db.session.add(Coach(user_id=u.id, title=title))
        db.session.commit()
        _db_initialized = True
    except Exception:
        pass  # gunicorn import时可能无context, 由before_request兜底


def create_app() -> Flask:
    """工厂函数：创建并配置 Flask 应用"""
    app = Flask(__name__)
    app.config.from_object(Config)

    # ── 初始化插件 ──
    db.init_app(app)
    CORS(app, supports_credentials=True)
    jwt.init_app(app)

    # ── 注册蓝图 ──
    from api_ai import api_ai_bp
    from api_dashboard import api_dashboard_bp
    from api_auth import api_auth_bp
    from api_athletes import api_athletes_bp
    from api_assessments import api_assessments_bp

    app.register_blueprint(api_ai_bp, url_prefix="/api/v1/ai")
    app.register_blueprint(api_dashboard_bp, url_prefix="/api/v1/dashboard")
    app.register_blueprint(api_auth_bp)
    app.register_blueprint(api_athletes_bp)
    app.register_blueprint(api_assessments_bp)

    # ── 实际建表逻辑在此调用 ──
    with app.app_context():
        _ensure_db(app)

    # ── gunicorn 兼容：首个请求前兜底 ──
    @app.before_request
    def _ensure_db_on_first_request():
        _ensure_db(app)

    # ── 健康检查 ──
    @app.route("/health")
    def health():
        return jsonify({"status": "ok", "service": "SSP COACH PRO"})

    # ── 生产环境：托管前端静态文件 ──
    import os as _os
    _frontend_dist = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "..", "frontend", "dist")
    if _os.path.exists(_frontend_dist):
        from flask import send_from_directory

        @app.route("/")
        @app.route("/<path:path>")
        def serve_frontend(path="index.html"):
            if path.startswith("api/"):
                return jsonify({"error": "Not Found"}), 404
            if "." not in path and not path.startswith("assets"):
                path = "index.html"
            file_path = _os.path.join(_frontend_dist, path)
            if _os.path.isfile(file_path):
                return send_from_directory(_frontend_dist, path)
            return send_from_directory(_frontend_dist, "index.html")

    return app


# ── 应用实例（gunicorn 直接引用 `app`） ──
app = create_app()

# ── 本地开发入口 ──
if __name__ == "__main__":
    app.run(debug=True, port=5000)
