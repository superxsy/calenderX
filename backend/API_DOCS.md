# 📚 CalendarX API 文档

本文档详细描述了 CalendarX 后端 API 的所有接口，包括请求格式、响应格式和使用示例。

## 🌐 基础信息

- **Base URL**: `http://localhost:8000` (开发环境)
- **API 版本**: v1
- **API 前缀**: `/api/v1`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON

## 🔐 认证说明

### JWT Token 格式
```
Authorization: Bearer <your_jwt_token>
```

### Token 有效期
- 默认有效期：7天
- 过期后需要重新登录获取新 Token

## 📋 API 接口列表

### 🔑 认证接口

#### 1. 用户注册

**接口**: `POST /api/v1/auth/register`

**描述**: 创建新用户账户

**请求参数**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**参数说明**:
- `email` (string, 必填): 用户邮箱，必须是有效的邮箱格式
- `password` (string, 必填): 密码，最少6位字符

**成功响应** (201):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**错误响应**:
- `400 Bad Request`: 邮箱格式错误或密码太短
- `409 Conflict`: 邮箱已存在

**示例**:
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

#### 2. 用户登录

**接口**: `POST /api/v1/auth/login`

**描述**: 用户登录获取访问令牌

**请求参数**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**参数说明**:
- `email` (string, 必填): 注册时使用的邮箱
- `password` (string, 必填): 用户密码

**成功响应** (200):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**错误响应**:
- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 邮箱或密码错误

**示例**:
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

### 📅 任务管理接口

#### 1. 获取任务列表

**接口**: `GET /api/v1/tasks`

**描述**: 获取当前用户的任务列表，支持筛选和分页

**认证**: 需要 JWT Token

**查询参数**:
- `status` (string, 可选): 任务状态筛选
  - 可选值: `todo`, `in_progress`, `done`, `overdue`
- `date_from` (string, 可选): 开始日期筛选 (YYYY-MM-DD)
- `date_to` (string, 可选): 结束日期筛选 (YYYY-MM-DD)
- `tag_name` (string, 可选): 标签名称筛选
- `skip` (integer, 可选): 跳过的记录数，默认 0
- `limit` (integer, 可选): 返回的记录数，默认 100

**成功响应** (200):
```json
[
  {
    "id": 1,
    "title": "完成项目文档",
    "description": "编写 API 文档和用户手册",
    "task_date": "2024-01-15",
    "start_time": "09:00:00",
    "end_time": "12:00:00",
    "tag_name": "工作",
    "tag_color": "#FF5722",
    "status": "in_progress",
    "created_at": "2024-01-14T15:30:00Z",
    "updated_at": "2024-01-15T09:00:00Z"
  },
  {
    "id": 2,
    "title": "健身训练",
    "description": "有氧运动 30 分钟",
    "task_date": "2024-01-15",
    "start_time": "18:00:00",
    "end_time": "19:00:00",
    "tag_name": "健康",
    "tag_color": "#4CAF50",
    "status": "todo",
    "created_at": "2024-01-14T20:00:00Z",
    "updated_at": "2024-01-14T20:00:00Z"
  }
]
```

**示例**:
```bash
# 获取所有任务
curl -X GET "http://localhost:8000/api/v1/tasks" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 获取今日待办任务
curl -X GET "http://localhost:8000/api/v1/tasks?status=todo&date_from=2024-01-15&date_to=2024-01-15" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 获取工作相关任务
curl -X GET "http://localhost:8000/api/v1/tasks?tag_name=工作" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 2. 创建任务

**接口**: `POST /api/v1/tasks`

**描述**: 创建新的任务

**认证**: 需要 JWT Token

**请求参数**:
```json
{
  "title": "任务标题",
  "description": "任务描述",
  "task_date": "2024-01-15",
  "start_time": "09:00:00",
  "end_time": "10:00:00",
  "tag_name": "工作",
  "tag_color": "#FF5722"
}
```

**参数说明**:
- `title` (string, 必填): 任务标题，最大 200 字符
- `description` (string, 可选): 任务描述
- `task_date` (string, 必填): 任务日期 (YYYY-MM-DD)
- `start_time` (string, 可选): 开始时间 (HH:MM:SS)
- `end_time` (string, 可选): 结束时间 (HH:MM:SS)
- `tag_name` (string, 可选): 标签名称
- `tag_color` (string, 可选): 标签颜色 (HEX 格式，如 #FF5722)

**成功响应** (201):
```json
{
  "id": 3,
  "title": "任务标题",
  "description": "任务描述",
  "task_date": "2024-01-15",
  "start_time": "09:00:00",
  "end_time": "10:00:00",
  "tag_name": "工作",
  "tag_color": "#FF5722",
  "status": "todo",
  "created_at": "2024-01-15T08:30:00Z",
  "updated_at": "2024-01-15T08:30:00Z"
}
```

**错误响应**:
- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未认证或 Token 无效

**示例**:
```bash
curl -X POST "http://localhost:8000/api/v1/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "团队会议",
    "description": "讨论项目进度和下周计划",
    "task_date": "2024-01-16",
    "start_time": "14:00:00",
    "end_time": "15:30:00",
    "tag_name": "会议",
    "tag_color": "#2196F3"
  }'
```

#### 3. 获取单个任务

**接口**: `GET /api/v1/tasks/{task_id}`

**描述**: 获取指定 ID 的任务详情

**认证**: 需要 JWT Token

**路径参数**:
- `task_id` (integer): 任务 ID

**成功响应** (200):
```json
{
  "id": 1,
  "title": "完成项目文档",
  "description": "编写 API 文档和用户手册",
  "task_date": "2024-01-15",
  "start_time": "09:00:00",
  "end_time": "12:00:00",
  "tag_name": "工作",
  "tag_color": "#FF5722",
  "status": "in_progress",
  "created_at": "2024-01-14T15:30:00Z",
  "updated_at": "2024-01-15T09:00:00Z"
}
```

**错误响应**:
- `404 Not Found`: 任务不存在或不属于当前用户
- `401 Unauthorized`: 未认证或 Token 无效

**示例**:
```bash
curl -X GET "http://localhost:8000/api/v1/tasks/1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 4. 更新任务

**接口**: `PUT /api/v1/tasks/{task_id}`

**描述**: 完整更新指定任务的信息

**认证**: 需要 JWT Token

**路径参数**:
- `task_id` (integer): 任务 ID

**请求参数**:
```json
{
  "title": "更新后的任务标题",
  "description": "更新后的任务描述",
  "task_date": "2024-01-16",
  "start_time": "10:00:00",
  "end_time": "11:30:00",
  "tag_name": "重要",
  "tag_color": "#F44336"
}
```

**参数说明**: 与创建任务相同，所有字段都是可选的

**成功响应** (200):
```json
{
  "id": 1,
  "title": "更新后的任务标题",
  "description": "更新后的任务描述",
  "task_date": "2024-01-16",
  "start_time": "10:00:00",
  "end_time": "11:30:00",
  "tag_name": "重要",
  "tag_color": "#F44336",
  "status": "in_progress",
  "created_at": "2024-01-14T15:30:00Z",
  "updated_at": "2024-01-15T10:15:00Z"
}
```

**错误响应**:
- `400 Bad Request`: 请求参数错误
- `404 Not Found`: 任务不存在或不属于当前用户
- `401 Unauthorized`: 未认证或 Token 无效

**示例**:
```bash
curl -X PUT "http://localhost:8000/api/v1/tasks/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "完成项目文档（已更新）",
    "description": "编写 API 文档、用户手册和部署指南",
    "task_date": "2024-01-16",
    "start_time": "09:00:00",
    "end_time": "13:00:00",
    "tag_name": "紧急",
    "tag_color": "#F44336"
  }'
```

#### 5. 更新任务状态

**接口**: `PATCH /api/v1/tasks/{task_id}/status`

**描述**: 仅更新任务的状态

**认证**: 需要 JWT Token

**路径参数**:
- `task_id` (integer): 任务 ID

**请求参数**:
```json
{
  "status": "done"
}
```

**参数说明**:
- `status` (string, 必填): 新的任务状态
  - 可选值: `todo`, `in_progress`, `done`, `overdue`

**成功响应** (200):
```json
{
  "id": 1,
  "title": "完成项目文档",
  "description": "编写 API 文档和用户手册",
  "task_date": "2024-01-15",
  "start_time": "09:00:00",
  "end_time": "12:00:00",
  "tag_name": "工作",
  "tag_color": "#FF5722",
  "status": "done",
  "created_at": "2024-01-14T15:30:00Z",
  "updated_at": "2024-01-15T12:00:00Z"
}
```

**错误响应**:
- `400 Bad Request`: 状态值无效
- `404 Not Found`: 任务不存在或不属于当前用户
- `401 Unauthorized`: 未认证或 Token 无效

**示例**:
```bash
# 标记任务为完成
curl -X PATCH "http://localhost:8000/api/v1/tasks/1/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"status": "done"}'

# 标记任务为进行中
curl -X PATCH "http://localhost:8000/api/v1/tasks/2/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"status": "in_progress"}'
```

#### 6. 删除任务

**接口**: `DELETE /api/v1/tasks/{task_id}`

**描述**: 删除指定的任务

**认证**: 需要 JWT Token

**路径参数**:
- `task_id` (integer): 任务 ID

**成功响应** (200):
```json
{
  "message": "Task deleted successfully"
}
```

**错误响应**:
- `404 Not Found`: 任务不存在或不属于当前用户
- `401 Unauthorized`: 未认证或 Token 无效

**示例**:
```bash
curl -X DELETE "http://localhost:8000/api/v1/tasks/1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 🏥 系统接口

#### 健康检查

**接口**: `GET /health`

**描述**: 检查 API 服务状态

**认证**: 无需认证

**成功响应** (200):
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

**示例**:
```bash
curl -X GET "http://localhost:8000/health"
```

## 📊 数据模型

### User (用户)
```json
{
  "id": 1,
  "email": "user@example.com",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Task (任务)
```json
{
  "id": 1,
  "title": "任务标题",
  "description": "任务描述",
  "task_date": "2024-01-15",
  "start_time": "09:00:00",
  "end_time": "10:00:00",
  "tag_name": "工作",
  "tag_color": "#FF5722",
  "status": "todo",
  "created_at": "2024-01-15T08:30:00Z",
  "updated_at": "2024-01-15T08:30:00Z"
}
```

### TaskStatus (任务状态枚举)
- `todo`: 待办
- `in_progress`: 进行中
- `done`: 已完成
- `overdue`: 已过期

## 🚨 错误处理

### 标准错误响应格式
```json
{
  "detail": "错误描述信息",
  "error_code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 常见错误码

| HTTP 状态码 | 错误描述 | 解决方案 |
|------------|----------|----------|
| 400 | Bad Request | 检查请求参数格式和必填字段 |
| 401 | Unauthorized | 检查 JWT Token 是否有效 |
| 403 | Forbidden | 检查用户权限 |
| 404 | Not Found | 检查资源 ID 是否存在 |
| 409 | Conflict | 检查是否存在重复数据 |
| 422 | Validation Error | 检查数据格式和类型 |
| 500 | Internal Server Error | 服务器内部错误，联系管理员 |

### 验证错误详细信息
当请求参数验证失败时，会返回详细的错误信息：

```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "field required",
      "type": "value_error.missing"
    },
    {
      "loc": ["body", "password"],
      "msg": "ensure this value has at least 6 characters",
      "type": "value_error.any_str.min_length",
      "ctx": {"limit_value": 6}
    }
  ]
}
```

## 🔧 使用技巧

### 1. 批量操作

虽然 API 不直接支持批量操作，但可以通过并发请求实现：

```javascript
// JavaScript 示例：批量创建任务
const tasks = [
  { title: "任务1", task_date: "2024-01-15" },
  { title: "任务2", task_date: "2024-01-16" },
  { title: "任务3", task_date: "2024-01-17" }
];

const promises = tasks.map(task => 
  fetch('/api/v1/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(task)
  })
);

const results = await Promise.all(promises);
```

### 2. 分页处理

```javascript
// JavaScript 示例：分页获取任务
async function getAllTasks() {
  const allTasks = [];
  let skip = 0;
  const limit = 50;
  
  while (true) {
    const response = await fetch(`/api/v1/tasks?skip=${skip}&limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const tasks = await response.json();
    
    if (tasks.length === 0) break;
    
    allTasks.push(...tasks);
    skip += limit;
  }
  
  return allTasks;
}
```

### 3. 错误处理

```javascript
// JavaScript 示例：统一错误处理
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'API request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error.message);
    throw error;
  }
}
```

### 4. Token 管理

```javascript
// JavaScript 示例：Token 自动刷新
class ApiClient {
  constructor() {
    this.token = localStorage.getItem('token');
  }
  
  async request(url, options = {}) {
    try {
      return await this.apiRequest(url, options);
    } catch (error) {
      if (error.message.includes('401')) {
        // Token 过期，重新登录
        await this.login();
        return await this.apiRequest(url, options);
      }
      throw error;
    }
  }
  
  async login() {
    // 实现登录逻辑
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    this.token = data.access_token;
    localStorage.setItem('token', this.token);
  }
}
```

## 📱 客户端集成示例

### React Hook 示例

```javascript
import { useState, useEffect } from 'react';

// 自定义 Hook：任务管理
function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchTasks = async (filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/v1/tasks?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const createTask = async (taskData) => {
    try {
      const response = await fetch('/api/v1/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });
      const newTask = await response.json();
      setTasks(prev => [...prev, newTask]);
      return newTask;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };
  
  const updateTaskStatus = async (taskId, status) => {
    try {
      const response = await fetch(`/api/v1/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const updatedTask = await response.json();
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ));
      return updatedTask;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };
  
  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTaskStatus
  };
}
```

## 🧪 测试工具

### Postman Collection

可以导入以下 Postman Collection 进行 API 测试：

```json
{
  "info": {
    "name": "CalendarX API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:8000"
    },
    {
      "key": "token",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/v1/auth/register",
              "host": ["{{baseUrl}}"],
              "path": ["api", "v1", "auth", "register"]
            }
          }
        }
      ]
    }
  ]
}
```

### 自动化测试脚本

项目包含了完整的测试脚本 `test_api.py`，可以运行完整的 API 测试：

```bash
python test_api.py
```

## 📈 性能建议

### 1. 查询优化
- 使用适当的查询参数减少数据传输
- 利用分页避免一次性加载大量数据
- 使用状态和日期筛选减少不必要的数据

### 2. 缓存策略
- 在客户端缓存不经常变化的数据
- 使用 HTTP 缓存头控制缓存行为
- 考虑使用 Service Worker 进行离线缓存

### 3. 请求优化
- 合并多个小请求为单个请求
- 使用 WebSocket 进行实时更新（未来版本）
- 实现请求去重和防抖

---

**📚 API 文档持续更新中...**

如有疑问或建议，请提交 Issue 或联系开发团队。