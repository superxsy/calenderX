# 🛠️ CalendarX Backend 开发指南

本指南将帮助开发者快速搭建本地开发环境并开始开发。

## 📋 开发环境要求

- **Python**: 3.12+
- **操作系统**: Windows 10/11, macOS, Linux
- **IDE**: VS Code (推荐) 或 PyCharm
- **Git**: 最新版本

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-username/calendarx.git
cd calendarx/backend
```

### 2. 创建虚拟环境

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3.12 -m venv venv
source venv/bin/activate
```

### 3. 安装依赖

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env
```

编辑 `.env` 文件：
```bash
# 开发环境配置
JWT_SECRET=dev-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRE_DAYS=7

# 数据库配置
DATABASE_URL=sqlite:///calendarx.db

# 服务器配置
HOST=127.0.0.1
PORT=8000
DEBUG=true

# CORS 配置（开发环境）
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
```

### 5. 启动开发服务器

```bash
# 方式一：使用启动脚本（推荐）
python start.py

# 方式二：直接使用 uvicorn
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 6. 验证安装

打开浏览器访问：
- API 文档: http://127.0.0.1:8000/docs
- 健康检查: http://127.0.0.1:8000/health

## 🧪 测试 API

### 使用内置测试脚本

```bash
python test_api.py
```

### 手动测试

```bash
# 1. 健康检查
curl http://127.0.0.1:8000/health

# 2. 用户注册
curl -X POST "http://127.0.0.1:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 3. 用户登录
curl -X POST "http://127.0.0.1:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 4. 创建任务（需要先登录获取 token）
curl -X POST "http://127.0.0.1:8000/api/v1/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title":"测试任务",
    "description":"这是一个测试任务",
    "task_date":"2024-01-15",
    "start_time":"09:00:00",
    "end_time":"10:00:00",
    "tag_name":"工作",
    "tag_color":"#FF5722"
  }'
```

## 📁 项目结构详解

```
backend/
├── app/                    # 应用核心代码
│   ├── __init__.py
│   ├── main.py            # FastAPI 应用入口
│   ├── db.py              # 数据库配置
│   ├── models.py          # SQLModel 数据模型
│   ├── schemas.py         # Pydantic 请求/响应模型
│   ├── auth.py            # 认证相关功能
│   └── routes/            # API 路由
│       ├── __init__.py
│       ├── auth.py        # 认证路由
│       └── tasks.py       # 任务管理路由
├── requirements.txt       # Python 依赖
├── .env.example          # 环境变量模板
├── start.py              # 开发服务器启动脚本
├── test_api.py           # API 测试脚本
├── Dockerfile            # Docker 配置
├── docker-compose.yml    # Docker Compose 配置
├── nginx.conf            # Nginx 配置
├── README.md             # 项目说明
├── DEVELOPMENT.md        # 开发指南（本文件）
└── DEPLOYMENT.md         # 部署指南
```

## 🔧 开发工具配置

### VS Code 配置

创建 `.vscode/settings.json`：
```json
{
    "python.defaultInterpreterPath": "./venv/bin/python",
    "python.linting.enabled": true,
    "python.linting.pylintEnabled": false,
    "python.linting.flake8Enabled": true,
    "python.formatting.provider": "black",
    "python.formatting.blackArgs": ["--line-length=88"],
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.organizeImports": true
    }
}
```

推荐安装的 VS Code 扩展：
- Python
- Pylance
- Python Docstring Generator
- REST Client
- SQLite Viewer

### 代码质量工具

安装开发依赖：
```bash
pip install black flake8 isort pytest pytest-asyncio httpx
```

创建 `pyproject.toml`：
```toml
[tool.black]
line-length = 88
target-version = ['py312']
include = '\.pyi?$'

[tool.isort]
profile = "black"
line_length = 88
```

创建 `.flake8`：
```ini
[flake8]
max-line-length = 88
extend-ignore = E203, W503
exclude = venv, __pycache__
```

## 🧪 测试开发

### 单元测试

创建 `tests/` 目录：
```bash
mkdir tests
touch tests/__init__.py
touch tests/test_auth.py
touch tests/test_tasks.py
```

示例测试文件 `tests/test_auth.py`：
```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_register_user():
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "password123"}
    )
    assert response.status_code == 201
    assert "access_token" in response.json()

def test_login_user():
    # 先注册用户
    client.post(
        "/api/v1/auth/register",
        json={"email": "login@example.com", "password": "password123"}
    )
    
    # 然后登录
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "login@example.com", "password": "password123"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
```

运行测试：
```bash
pytest tests/ -v
```

### API 测试

使用 REST Client 扩展创建 `api.http`：
```http
### 健康检查
GET http://127.0.0.1:8000/health

### 用户注册
POST http://127.0.0.1:8000/api/v1/auth/register
Content-Type: application/json

{
  "email": "dev@example.com",
  "password": "password123"
}

### 用户登录
POST http://127.0.0.1:8000/api/v1/auth/login
Content-Type: application/json

{
  "email": "dev@example.com",
  "password": "password123"
}

### 获取任务列表
GET http://127.0.0.1:8000/api/v1/tasks
Authorization: Bearer {{token}}

### 创建任务
POST http://127.0.0.1:8000/api/v1/tasks
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "title": "开发任务",
  "description": "完成 API 开发",
  "task_date": "2024-01-15",
  "start_time": "09:00:00",
  "end_time": "17:00:00",
  "tag_name": "开发",
  "tag_color": "#2196F3"
}
```

## 🔄 开发工作流

### 1. 功能开发流程

```bash
# 1. 创建功能分支
git checkout -b feature/new-feature

# 2. 开发功能
# 编辑代码...

# 3. 运行测试
pytest tests/
python test_api.py

# 4. 代码格式化
black app/
isort app/
flake8 app/

# 5. 提交代码
git add .
git commit -m "feat: add new feature"

# 6. 推送分支
git push origin feature/new-feature

# 7. 创建 Pull Request
```

### 2. 数据库迁移

当修改数据模型时：
```python
# 在 models.py 中修改模型
# 然后重新创建数据库表
from app.db import engine
from app.models import SQLModel

# 删除现有数据库（开发环境）
# rm calendarx.db

# 重新创建表
SQLModel.metadata.create_all(engine)
```

### 3. 添加新的 API 端点

1. 在 `schemas.py` 中定义请求/响应模型
2. 在相应的路由文件中添加端点
3. 更新 API 文档
4. 编写测试
5. 测试功能

示例：添加任务搜索功能

```python
# schemas.py
class TaskSearchRequest(BaseModel):
    keyword: str
    tag_name: Optional[str] = None
    status: Optional[TaskStatus] = None

# routes/tasks.py
@router.get("/search", response_model=List[TaskResponse])
async def search_tasks(
    search: TaskSearchRequest = Depends(),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # 实现搜索逻辑
    pass
```

## 🐛 调试技巧

### 1. 日志调试

```python
import logging

# 配置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# 在代码中添加日志
logger.debug(f"User {user.id} created task {task.id}")
logger.info(f"Task {task_id} updated successfully")
logger.error(f"Failed to create task: {str(e)}")
```

### 2. 数据库调试

```python
# 查看生成的 SQL
from sqlalchemy import event
from sqlalchemy.engine import Engine
import logging

logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

@event.listens_for(Engine, "before_cursor_execute")
def receive_before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    print("SQL:", statement)
    print("Parameters:", parameters)
```

### 3. API 调试

```python
# 在路由中添加调试信息
@router.post("/tasks")
async def create_task(task_data: TaskCreate, current_user: User = Depends(get_current_user)):
    print(f"Creating task for user {current_user.id}")
    print(f"Task data: {task_data.dict()}")
    # ... 实现逻辑
```

## 📚 学习资源

### 官方文档
- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [SQLModel 文档](https://sqlmodel.tiangolo.com/)
- [Pydantic 文档](https://docs.pydantic.dev/)
- [Uvicorn 文档](https://www.uvicorn.org/)

### 推荐阅读
- [FastAPI 最佳实践](https://github.com/zhanymkanov/fastapi-best-practices)
- [Python 异步编程](https://docs.python.org/3/library/asyncio.html)
- [RESTful API 设计指南](https://restfulapi.net/)

## 🤝 贡献指南

### 代码规范
- 使用 Black 进行代码格式化
- 遵循 PEP 8 编码规范
- 编写清晰的文档字符串
- 保持函数简洁，单一职责
- 使用类型注解

### 提交规范
使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
feat: 添加新功能
fix: 修复 bug
docs: 更新文档
style: 代码格式化
refactor: 重构代码
test: 添加测试
chore: 构建过程或辅助工具的变动
```

### Pull Request 流程
1. Fork 项目
2. 创建功能分支
3. 完成开发和测试
4. 提交 Pull Request
5. 代码审查
6. 合并到主分支

## 🚨 常见问题

### Q: 虚拟环境激活失败
A: 确保使用正确的 Python 版本，Windows 用户注意路径分隔符。

### Q: 数据库连接错误
A: 检查数据库文件路径和权限，确保目录存在。

### Q: JWT 认证失败
A: 检查 JWT_SECRET 配置，确保前后端使用相同的密钥。

### Q: CORS 错误
A: 检查 CORS_ORIGINS 配置，确保包含前端域名。

### Q: 依赖安装失败
A: 升级 pip 版本，使用国内镜像源：
```bash
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple/ -r requirements.txt
```

---

**🎉 开始您的 CalendarX 开发之旅吧！**

如有问题，请查看项目 Issues 或创建新的 Issue。