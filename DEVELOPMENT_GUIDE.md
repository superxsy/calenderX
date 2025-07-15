# 📚 CalendarX 开发指南

## 🎯 项目概述

CalendarX 是一个现代化的全栈任务管理系统，采用前后端分离架构，支持本地存储和云端同步的双模式运行。项目采用模块化设计，具有良好的可扩展性和可维护性。

### 🏗️ 技术架构

```
前端技术栈:
- 框架: Vue.js 3 (Composition API)
- 状态管理: Pinia
- 构建工具: Vite
- 测试框架: Vitest
- 样式方案: 原生CSS + CSS变量

后端技术栈:
- 框架: FastAPI
- ORM: SQLModel
- 数据库: SQLite
- 认证: JWT + bcrypt
- 部署: Docker支持

架构模式:
- 前后端分离
- 模块化设计
- 服务层抽象
- 状态管理集中化
```

### 📁 项目结构

```
calendarX/
├── src/                 # 前端源码
│   ├── App.vue          # 主应用组件
│   ├── main.js          # 应用入口
│   ├── style.css        # 全局样式
│   ├── components/      # 可复用组件
│   │   ├── CalendarView.vue
│   │   ├── TaskModal.vue
│   │   ├── TaskList.vue
│   │   └── BackupModal.vue
│   ├── store/           # Pinia状态管理
│   │   ├── index.js     # Store配置
│   │   └── modules/     # 状态模块
│   │       ├── taskStore.js
│   │       ├── authStore.js
│   │       ├── calendarStore.js
│   │       ├── backupStore.js
│   │       └── uiStore.js
│   └── services/        # 业务逻辑层
│       ├── taskService.js
│       ├── taskApiService.js
│       ├── authService.js
│       ├── backupService.js
│       └── dateService.js
├── backend/             # 后端源码
│   ├── app/
│   │   ├── main.py      # FastAPI应用入口
│   │   ├── models.py    # 数据模型
│   │   ├── auth.py      # 认证工具
│   │   ├── database.py  # 数据库配置
│   │   └── routes/      # API路由
│   │       ├── auth.py
│   │       └── tasks.py
│   ├── requirements.txt # Python依赖
│   └── Dockerfile       # Docker配置
├── public/
│   ├── index.html       # HTML模板
│   └── calendar-tasks.json  # 本地数据文件
├── tests/               # 测试文件
├── docs/                # 文档目录
├── package.json         # 前端依赖配置
├── vite.config.js       # Vite配置
└── vitest.config.js     # 测试配置
```

## 🚀 核心功能特性

### 1. 日历显示
- 月视图日历界面
- 当前日期高亮显示
- 任务数量指示器
- 响应式设计，支持移动端

### 2. 任务管理
- ✅ **创建任务**: 支持标题、描述、时间、颜色设置
- ✏️ **编辑任务**: 点击任务可编辑所有属性
- 🗑️ **删除任务**: 支持单个删除和批量删除
- 📋 **任务列表**: 显示选定日期的所有任务

### 3. 重复任务
- 🔄 **重复类型**: 无重复、每日、每周、每月、每年
- 📅 **智能生成**: 自动生成重复任务实例
- ⏰ **结束条件**: 支持设置重复结束日期

### 4. 颜色管理
- 🎨 **预设颜色**: 提供多种预设颜色选项
- 🎯 **自定义颜色**: 支持颜色选择器
- 📚 **颜色历史**: 记录最近使用的颜色
- 🏷️ **颜色分类**: 不同颜色代表不同类型的任务

### 5. 搜索与过滤
- 🔍 **关键词搜索**: 支持任务标题和描述搜索
- 🎨 **颜色过滤**: 按颜色筛选任务
- 📊 **实时过滤**: 搜索结果实时更新

### 6. 数据持久化
- 💾 **本地存储**: 使用LocalStorage保存数据
- 📁 **文件导出**: 支持JSON格式导出
- 🔄 **自动保存**: 操作后自动保存数据

## 🎨 核心功能模块

### 📅 日历视图模块 (CalendarView.vue)
- **月视图**: 显示当前月份的日历网格，正确处理跨月日期
- **日期导航**: 支持月份切换和今天按钮
- **任务显示**: 在对应日期显示任务标记和数量
- **响应式设计**: 适配不同屏幕尺寸
- **状态管理**: 通过calendarStore管理视图状态

### 📝 任务管理模块 (TaskStore + TaskService)
- **任务CRUD**: 创建、读取、更新、删除任务
- **任务属性**: 标题、描述、日期、时间、颜色、重复设置
- **状态管理**: 完成/未完成状态切换
- **颜色分类**: 8种预设颜色标签
- **重复任务**: 支持每日、每周、每月重复
- **双模式支持**: 本地存储 + API模式

### 🔐 用户认证模块 (AuthStore + AuthService)
- **用户注册**: 支持用户名、邮箱、密码注册
- **用户登录**: JWT token认证
- **会话管理**: 自动token刷新和过期处理
- **权限控制**: 基于用户身份的数据访问控制

### 🔍 搜索过滤功能
- **关键词搜索**: 按标题和描述搜索
- **日期过滤**: 按日期范围筛选
- **状态过滤**: 按完成状态筛选
- **颜色过滤**: 按颜色标签筛选
- **实时搜索**: 输入即时过滤结果

### 💾 数据管理模块 (BackupStore + BackupService)
- **本地存储**: LocalStorage数据持久化
- **云端同步**: 与后端API数据同步
- **数据导入**: 支持JSON文件导入
- **数据导出**: 支持JSON格式导出
- **备份恢复**: 完整的备份和恢复机制
- **冲突解决**: 本地与云端数据冲突处理

## 🔧 关键代码说明

### 数据结构
```javascript
// 任务对象结构
{
  id: 'unique-id',
  title: '任务标题',
  description: '任务描述',
  date: '2024-01-15',
  time: '14:30',
  color: '#ff6b6b',
  repeat: 'weekly',  // none, daily, weekly, monthly, yearly
  repeatEnd: '2024-12-31'
}
```

### 核心方法
- `loadTasks()`: 从LocalStorage加载任务数据
- `saveTasks()`: 保存任务到LocalStorage
- `addTask()`: 添加新任务（包含重复任务生成）
- `editTask()`: 编辑现有任务
- `deleteTask()`: 删除任务
- `generateRepeatingTasks()`: 生成重复任务实例
- `filterTasks()`: 搜索和过滤任务

## 🎨 样式特点

### 设计理念
- **现代化UI**: 使用圆角、阴影、渐变等现代设计元素
- **响应式布局**: 适配桌面和移动设备
- **颜色系统**: 统一的颜色主题和对比度
- **交互反馈**: 悬停效果、点击反馈、动画过渡

### 关键样式类
- `.calendar-container`: 主容器样式
- `.calendar-grid`: 日历网格布局
- `.task-item`: 任务项样式
- `.modal`: 模态框样式
- `.color-picker`: 颜色选择器样式

## 🔄 最近更新内容

### 功能增强
1. **完善任务创建和编辑功能**
   - 优化表单验证
   - 改进用户交互体验
   - 增强错误处理

2. **重复任务处理优化**
   - 修复重复任务生成逻辑
   - 优化性能，避免重复计算
   - 改进结束日期处理

3. **颜色选择和历史记录**
   - 新增颜色历史功能
   - 优化颜色选择器界面
   - 改进颜色对比度计算

4. **搜索和过滤体验**
   - 实时搜索功能
   - 多条件过滤
   - 搜索结果高亮

5. **用户界面优化**
   - 响应式设计改进
   - 动画效果增强
   - 可访问性提升

6. **代码质量提升**
   - 重构核心逻辑
   - 优化性能
   - 增强错误处理
   - 改进代码注释

## 🚀 开发建议

### 继续开发时的注意事项
1. **数据兼容性**: 修改数据结构时要考虑向后兼容
2. **性能优化**: 大量任务时注意渲染性能
3. **用户体验**: 保持操作的直观性和一致性
4. **测试覆盖**: 新功能要添加相应测试用例

### 可能的扩展方向
- 📱 移动端App开发
- ☁️ 云端数据同步
- 👥 多用户协作功能
- 📊 数据统计和分析
- 🔔 提醒和通知功能
- 📎 文件附件支持

## 🛠️ 开发环境

## 🚀 开发环境设置

### 📋 环境要求
```bash
前端环境:
Node.js >= 16.0.0
npm >= 8.0.0

后端环境:
Python >= 3.8
pip >= 21.0

通用要求:
现代浏览器 (Chrome, Firefox, Safari, Edge)
Git >= 2.0
```

### 🛠️ 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/superxsy/calenderX.git
cd calenderX
```

2. **前端环境设置**
```bash
# 安装前端依赖
npm install

# 启动前端开发服务器
npm run dev
```

3. **后端环境设置**
```bash
# 进入后端目录
cd backend

# 创建虚拟环境（推荐）
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate     # Windows

# 安装后端依赖
pip install -r requirements.txt

# 启动后端服务器
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

4. **运行测试**
```bash
# 前端测试
npm run test

# 后端测试
cd backend
pytest
```

5. **构建生产版本**
```bash
# 前端构建
npm run build

# 后端Docker构建
cd backend
docker build -t calendarx-backend .
```

---

**📝 提示**: 这个文档会随着项目发展持续更新，建议在每次重大修改后更新相关内容。