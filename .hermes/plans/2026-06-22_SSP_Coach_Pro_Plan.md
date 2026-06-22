# SSP COACH PRO — 教练员运动员管理平台 · 实施计划

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** 在 `~/Desktop/SSP教练平台/` 搭建完整的教练员管理运动员平台 — 数字化SSP评估表、销售漏斗看板、目标人群分析、AI教练助手(DeepSeek V4 Pro)，打造大厂级前端体验。

**Architecture:** React 18 + TypeScript (Vite) 前端 + Flask 3 后端 + PostgreSQL/SQLite 数据库 + DeepSeek API AI引擎。单仓库结构，前后端分离，通过 REST API 通信。

**Tech Stack:** React 18, TypeScript, Vite, Ant Design 5, ECharts 5, Tailwind CSS, Flask 3, SQLAlchemy 2.0, PostgreSQL/SQLite, DeepSeek V4 Pro, gunicorn, Render部署

**Design System:** SSP品牌色 (#a0c040绿 / #204040深青 / #c0c060金), 暗色主题, 对标Linear/Vercel/Stripe的大厂级UI

---

## Phase 1: 项目脚手架 + 数据库模型 (Day 1)

### Task 1: 创建项目目录结构

**Objective:** 建立完整的项目目录结构

**Files:**
- Create: `~/Desktop/SSP教练平台/` (root)
- Create: `~/Desktop/SSP教练平台/backend/` (Flask后端)
- Create: `~/Desktop/SSP教练平台/frontend/` (React前端)
- Create: `~/Desktop/SSP教练平台/design/` (设计原型)
- Create: `~/Desktop/SSP教练平台/.hermes/plans/` (计划文件)

### Task 2: 后端脚手架 — Flask应用初始化

**Objective:** 创建Flask应用骨架，含配置、数据库初始化、CORS

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/config.py`
- Create: `backend/app.py`
- Create: `backend/.env.example`

**Step 1: requirements.txt**
```
flask==3.1.0
flask-sqlalchemy==3.1.1
flask-cors==5.0.0
flask-jwt-extended==4.6.0
python-dotenv==1.0.1
gunicorn==22.0.0
psycopg2-binary==2.9.10
openai==1.58.1
alembic==1.14.0
flask-migrate==4.0.7
weasyprint==62.3
pydantic==2.10.0
```

**Step 2: config.py — SSP品牌配置 + 数据库自动适配**
```python
import os
from dotenv import load_dotenv
load_dotenv()

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "ssp-coach-pro-dev-secret")
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    _db_url = os.environ.get("DATABASE_URL", "")
    if _db_url:
        if _db_url.startswith("postgres://"):
            _db_url = _db_url.replace("postgres://", "postgresql://", 1)
        SQLALCHEMY_DATABASE_URI = _db_url
    else:
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASE_DIR, 'coach_pro.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", SECRET_KEY)
    DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
    DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1"
    DEEPSEEK_MODEL = "deepseek-chat"
    IS_PRODUCTION = bool(os.environ.get("RENDER"))
    DEBUG = not IS_PRODUCTION

class BrandConfig:
    GREEN = "#a0c040"
    GREEN_LIGHT = "#b8d45a"
    DARK = "#204040"
    GOLD = "#c0c060"
    BG_ROOT = "#0a0f0f"
    BG_SURFACE = "#111818"
    TEXT_PRIMARY = "#edf0ef"
    TEXT_SECONDARY = "#889492"
```

**Verification:** `cd backend && python -c "from config import Config; print(Config.SQLALCHEMY_DATABASE_URI)"`

### Task 3: 数据库模型 — 完整ORM定义

**Objective:** 创建所有数据模型，覆盖SSP评估表的全部字段

**Files:**
- Create: `backend/models.py`
- Create: `backend/seed_data.py`

**Models to create (完整列表):**
1. `User` — id, username, password_hash, role(admin/coach/athlete), display_name, avatar_url, is_active
2. `Coach` — id, user_id(FK), title, bio, certifications(JSON), athlete_count
3. `Athlete` — id, coach_id(FK), name, gender, birth_date, phone, source(来源), hyrox_interest, sport_background, notes
4. `Assessment` — id, athlete_id(FK), coach_id(FK), assessment_date, source, hyrox_interest, sport_background, trial_class, top_weaknesses(JSON), client_type(A-F), recommended_products(JSON), coach_feedback, sales_followup(JSON), is_complete
5. `AssessmentScore` — id, assessment_id(FK), cardio_endurance, running_ability, lower_body_strength, upper_body_pushpull, core_stability, motor_coordination, fatigue_resistance, training_willingness, completion_state, hyrox_potential, total_score, dimension_notes(JSON)
6. `TrainingPlan` — id, coach_id(FK), name, target_client_type, duration_weeks, days_per_week, is_template
7. `PlanDay` — id, plan_id(FK), week_number, day_number, warmup_blocks(JSON), main_blocks(JSON), finisher_blocks(JSON), coach_notes
8. `PlanAssignment` — id, plan_id(FK), athlete_id(FK), start_date, end_date, status
9. `TrainingLog` — id, assignment_id(FK), athlete_id(FK), log_date, completion_pct, notes, athlete_feedback
10. `InjuryRecord` — id, athlete_id(FK), injury_date, body_part, severity, status, notes
11. `SalesFollow` — id, athlete_id(FK), assessment_id(FK), follow_type, scheduled_at, completed_at, result, notes
12. `ProductCatalog` — id, name, price, description, target_client_types(JSON)
13. `CoachNote` — id, athlete_id(FK), coach_id(FK), content, tags(JSON)
14. `Report` — id, athlete_id(FK), assessment_id(FK), coach_id(FK), generated_at, file_path, report_type

**Verify:** `cd backend && python -c "from app import app; from models import db; with app.app_context(): db.create_all(); print('Tables created')"`

### Task 4: 认证系统 — JWT + 角色权限

**Objective:** 实现登录/注册/JWT认证/角色装饰器

**Files:**
- Modify: `backend/app.py` (添加认证路由)
- Create: `backend/auth.py`

**Routes:**
- `POST /api/v1/auth/login` → JWT token
- `POST /api/v1/auth/register` → 创建用户 (admin only)
- `GET /api/v1/auth/me` → 当前用户信息

**Decorator:** `@role_required('admin', 'coach')` 角色验证

### Task 5: 核心API — 运动员与评估CRUD

**Objective:** 实现运动员管理、评估表创建/查询的完整API

**Files:**
- Create: `backend/api_athletes.py`
- Create: `backend/api_assessments.py`
- Modify: `backend/app.py` (注册Blueprint)

**Routes:**
- `GET /api/v1/athletes` — 学员列表 (分页/筛选/搜索)
- `POST /api/v1/athletes` — 创建学员
- `GET /api/v1/athletes/:id` — 学员详情
- `PUT /api/v1/athletes/:id` — 更新学员
- `GET /api/v1/athletes/:id/assessments` — 学员评估历史
- `GET /api/v1/assessments` — 评估列表
- `POST /api/v1/assessments` — 创建评估 (含10维评分+智能分型)
- `GET /api/v1/assessments/:id` — 评估详情

---

## Phase 2: 智能引擎 (Day 2)

### Task 6: 客户分型引擎

**Objective:** 实现基于规则的A-F客户自动分型

**Files:**
- Create: `backend/classifier.py`

**分型规则 (映射SSP评估表):**
```python
CLASSIFIER_RULES = {
    "A": {
        "hyrox_interest": ["是"],
        "sport_background": ["有健身基础", "有专项运动基础"],
        "min_total_score": 35,
        "min_hyrox_potential": 3,
    },
    "B": {
        "hyrox_interest": ["是", "观望"],
        "min_total_score": 20,
        "max_total_score": 34,
        "min_training_willingness": 3,
    },
    "C": {
        "sport_background": ["零基础"],
        "hyrox_interest": ["否", "观望"],
        "max_cardio_endurance": 2,
    },
    "D": {
        "sport_background": ["有专项运动基础"],
        "any_low": ["lower_body_strength", "upper_body_pushpull"],
    },
    "E": {
        "source": ["大众点评", "小红书"],
        "hyrox_interest": ["否"],
        "max_completion_state": 2,
    },
    "F": {
        "max_training_willingness": 2,
        "hyrox_interest": ["否"],
    },
}
```

**API:** `POST /api/v1/ai/classify` — 输入评分 → 返回分型+置信度

### Task 7: DeepSeek AI助手集成

**Objective:** 对接DeepSeek V4 Pro，实现短板分析/训练建议/跟进话术/人群洞察

**Files:**
- Create: `backend/ai_brain.py`
- Modify: `backend/app.py` (添加AI路由)

**三大AI能力:**
1. `POST /api/v1/ai/analyze-weakness` — 短板分析
2. `POST /api/v1/ai/suggest-followup` — 跟进话术生成
3. `POST /api/v1/ai/audience-insight` — 人群洞察 (输入全部学员数据 → AI分析转化瓶颈)
4. `POST /api/v1/ai/coach-chat` — 自由对话 (教练向AI提问)

**Prompt设计要点:**
- 短板分析：输入10维评分+运动背景 → 输出3个核心短板+训练优先级+预期改善时间
- 跟进话术：输入学员类型+短板+推荐产品 → 输出3版话术(温和/专业/激励)
- 人群洞察：输入所有学员匿名数据 → 输出转化率分析+瓶颈建议

### Task 8: Dashboard API — 销售漏斗+目标人群

**Objective:** 实现看板数据API，支持成单率漏斗和目标人群分布

**Files:**
- Create: `backend/api_dashboard.py`

**Routes:**
- `GET /api/v1/dashboard/stats` — 统计卡片数据 (学员总数/本月评估/待跟进/成交率)
- `GET /api/v1/dashboard/funnel` — 销售漏斗数据 (体验→评估→高意向→购买→续费)
- `GET /api/v1/dashboard/audience` — 目标人群分布 (A-F类型人数/占比/转化率)
- `GET /api/v1/dashboard/source-conversion` — 来源渠道转化对比
- `GET /api/v1/dashboard/todos` — 待办事项 (待评估/待跟进/逾期)

---

## Phase 3: React前端 (Day 3-4)

### Task 9: 前端脚手架 + 设计系统

**Objective:** 用Vite创建React+TypeScript项目，集成Ant Design 5 + Tailwind，配置SSP品牌主题

**Files:**
- Create: `frontend/` (via `npm create vite@latest`)
- Modify: `frontend/src/App.tsx`
- Create: `frontend/src/styles/theme.css` (SSP品牌变量)
- Create: `frontend/src/styles/global.css`

**Commands:**
```bash
cd ~/Desktop/SSP教练平台
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install antd @ant-design/icons echarts echarts-for-react react-router-dom zustand axios dayjs tailwindcss @tailwindcss/vite
```

**Theme配置 (Ant Design token):**
```typescript
// frontend/src/theme.ts
const sspTheme = {
  token: {
    colorPrimary: '#a0c040',
    colorBgBase: '#0a0f0f',
    colorBgContainer: '#111818',
    colorText: '#edf0ef',
    colorTextSecondary: '#889492',
    borderRadius: 8,
    fontFamily: '"Inter", "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif',
  }
};
```

### Task 10: 登录页 + 认证状态管理

**Objective:** 创建暗色主题登录页 + Zustand authStore + axios拦截器

**Files:**
- Create: `frontend/src/pages/LoginPage.tsx`
- Create: `frontend/src/stores/authStore.ts`
- Create: `frontend/src/api/client.ts` (axios实例 + JWT拦截器)
- Create: `frontend/src/components/AuthGuard.tsx`

### Task 11: 布局框架 — Sidebar + Header

**Objective:** 实现SSP品牌侧栏导航 + 顶栏搜索 + 全局布局

**Files:**
- Create: `frontend/src/layouts/AppLayout.tsx`
- Create: `frontend/src/components/Sidebar.tsx`
- Create: `frontend/src/components/Header.tsx`
- Create: `frontend/src/components/GlobalSearch.tsx`

**侧栏菜单项:**
- 工作台 Dashboard
- 销售漏斗 Pipeline
- 学员管理 Athletes
- 新建评估 New Assessment
- 训练计划 Training
- 报告中心 Reports
- AI教练助手 AI Coach

### Task 12: 工作台Dashboard — 统计卡片+漏斗+人群

**Objective:** 实现完整Dashboard页面, 对标设计原型

**Files:**
- Create: `frontend/src/pages/Dashboard.tsx`
- Create: `frontend/src/components/StatCard.tsx`
- Create: `frontend/src/components/ConversionFunnel.tsx`
- Create: `frontend/src/components/AudienceMap.tsx`
- Create: `frontend/src/components/AIAssistantPanel.tsx`

**交互特性:**
- 三Tab切换: 总览 / 成单率分析 / 目标人群
- 漏斗柱状图 (ECharts)
- 目标人群TreeMap
- AI助手侧面板 (SSE流式对话)
- 实时数据刷新

### Task 13: 学员管理 + 学员详情

**Objective:** 学员列表 (搜索/筛选/分页) + 学员详情页 (7个Tab)

**Files:**
- Create: `frontend/src/pages/AthleteList.tsx`
- Create: `frontend/src/pages/AthleteDetail.tsx`
- Create: `frontend/src/components/AssessmentRadar.tsx` (ECharts雷达图)
- Create: `frontend/src/components/AssessmentTrend.tsx` (趋势线图)

**学员详情7个Tab:**
1. 档案 (基本信息表单)
2. 评估 (雷达图 + 趋势图 + 评估历史)
3. 训练 (周历视图 + 完成度)
4. 指标 (身体指标趋势)
5. 伤病 (时间线)
6. 沟通 (聊天 + 备注)
7. 报告 (生成/下载)

### Task 14: 评估表单 (数字化SSP评估表)

**Objective:** 完整数字化SSP团课体验后评估表

**Files:**
- Create: `frontend/src/pages/AssessmentForm.tsx`
- Create: `frontend/src/components/ScoringGrid.tsx` (10维度星级评分)
- Create: `frontend/src/components/ClassifierResult.tsx` (智能分型展示)
- Create: `frontend/src/components/ProductRecommend.tsx` (产品推荐)

**表单7个Section (对应SSP评估表):**
1. 基础信息 (学员/日期/来源/意向/背景/课程)
2. 10维评分 (1-5星 + 每项备注)
3. 主要短板 (多选1-3项)
4. 智能分型结果 (系统推荐 + 手动覆盖)
5. 推荐产品 (自动匹配 + 手动调整)
6. 教练反馈 (预设话术 + 自定义)
7. 销售跟进 (勾选 + 备注)

### Task 15: 销售漏斗看板

**Objective:** Kanban风格的销售漏斗管理

**Files:**
- Create: `frontend/src/pages/SalesPipeline.tsx`
- Create: `frontend/src/components/PipelineKanban.tsx`
- Create: `frontend/src/components/AthleteCard.tsx`

---

## Phase 4: 集成+测试+部署 (Day 5-6)

### Task 16: 前后端联调

**Objective:** 确保前端所有API调用与后端路由完全匹配

**Checklist:**
- [ ] 登录→JWT→所有API携带token
- [ ] 学员CRUD完整流程
- [ ] 评估创建→自动分型→实时返回
- [ ] Dashboard数据准确
- [ ] AI助手对话流式响应
- [ ] 雷达图数据正确渲染

### Task 17: AI助手SSE流式对话

**Objective:** 实现DeepSeek流式对话，前端EventSource接收

**Files:**
- Create: `backend/api_ai.py` (SSE endpoint)
- Modify: `frontend/src/components/AIAssistantPanel.tsx` (EventSource连接)

### Task 18: 种子数据填充

**Objective:** 创建演示数据 (4位学员+评估记录+销售跟进)

**Files:**
- Modify: `backend/seed_data.py`

**种子数据内容:**
- 3个教练用户 (李教练/王教练/陈教练)
- 8个学员 (覆盖A-F类型)
- 评估记录 (每人1-3次)
- 销售跟进记录
- 产品目录 (HYROX基础测试/12周备赛营/团课卡/私教)

### Task 19: GitHub推送

**Objective:** 创建GitHub仓库并推送代码

**Commands:**
```bash
cd ~/Desktop/SSP教练平台
git init
echo "node_modules/" > .gitignore
echo "__pycache__/" >> .gitignore
echo "*.db" >> .gitignore
echo ".env" >> .gitignore
git add .
git commit -m "feat: SSP COACH PRO initial commit"
gh repo create ssp-coach-pro --public --source=. --remote=origin --push
```

### Task 20: Render部署

**Objective:** 部署到Render (Flask后端 + React静态站点)

**Files:**
- Create: `render.yaml`
- Create: `backend/Procfile`

**render.yaml内容:**
```yaml
services:
  - type: web
    name: ssp-coach-pro-api
    env: python
    buildCommand: pip install -r backend/requirements.txt
    startCommand: cd backend && gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120
    envVars:
      - key: SECRET_KEY
        generateValue: true
      - key: DEEPSEEK_API_KEY
        sync: false
  - type: static
    name: ssp-coach-pro-web
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: frontend/dist
```

---

## Risks & Tradeoffs

| Risk | Mitigation |
|------|-----------|
| DeepSeek API响应速度 | 前端显示加载动画 + 超时3s降级为规则引擎结果 |
| SQLite并发限制 | 本地开发用SQLite，部署自动切换PostgreSQL |
| 前端暗色主题可读性 | 已用AA级对比度 (text-primary #edf0ef on #111818 = 12.5:1) |
| 评估表单过长 | 分7个Section折叠，每Section独立保存草稿 |
| Gunicorn冷启动 | timeout=120s + health check endpoint |

## Open Questions
1. 是否需要PWA离线支持？(建议Phase 4)
2. 是否需要WebSocket实时通知？(建议Phase 3加入)
3. 是否需要多场馆支持？(当前设计为单场馆，可扩展)
