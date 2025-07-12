# 📅 CalendarX - Modern Task Management System | 现代化任务管理系统

[English](#english) | [中文](#chinese)

---

## English

A sophisticated calendar-based task management application built with Vue 3 and modern web technologies. CalendarX provides an intuitive interface for managing tasks across multiple views with powerful features for productivity enhancement.

### 🌟 Key Features

- **📋 Comprehensive Task Management**: Create, edit, delete, and organize tasks with rich metadata
- **📅 Multiple View Modes**: Switch between Month View, Week View, and List View seamlessly
- **🔄 Recurring Tasks**: Support for daily, weekly, monthly, and yearly recurring patterns
- **🔍 Advanced Search & Filter**: Real-time search with status-based filtering
- **💾 Smart Data Management**: Automatic backup, manual backup, and data import/export
- **📱 Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **🎨 Clean Modern UI**: Intuitive interface with consistent visual design
- **⚡ High Performance**: Built with Vue 3 Composition API and optimized rendering

### 🚀 Live Demo

**🌐 [Try CalendarX Live](https://superxsy.github.io/calenderX/)**

> 🔄 **Latest Update**: Enhanced UI/UX with unified view controls and responsive layout optimizations (January 2025)

### 🛠️ Tech Stack

- **Frontend Framework**: Vue 3.5.17 (Composition API)
- **State Management**: Pinia
- **Build Tool**: Vite 7.0.3
- **Development Language**: JavaScript (ES6+)
- **Styling**: CSS3 with Flexbox/Grid
- **Testing**: Vitest + @vue/test-utils
- **Deployment**: GitHub Pages + GitHub Actions

### 📦 Quick Start

#### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0

#### Installation

```bash
# Clone the repository
git clone https://github.com/superxsy/calenderX.git
cd calenderX

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

#### Build for Production

```bash
# Build the project
npm run build

# Preview production build
npm run preview
```

### 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:run

# Launch test UI
npm run test:ui
```

### 📁 Project Architecture

```
src/
├── components/          # Reusable UI components
│   ├── CalendarView.vue    # Calendar component (Month/Week views)
│   ├── TaskList.vue        # Task list component
│   ├── TaskModal.vue       # Task editing modal
│   └── BackupModal.vue     # Data backup modal
├── store/              # Pinia state management
│   └── modules/        # Feature-specific stores
│       ├── taskStore.js      # Task management state
│       ├── calendarStore.js  # Calendar view state
│       ├── backupStore.js    # Backup management
│       └── uiStore.js        # UI state management
├── services/           # Business logic layer
│   ├── taskService.js        # Task operations
│   ├── backupService.js      # Backup operations
│   ├── storageService.js     # Local storage
│   ├── dateService.js        # Date utilities
│   └── validationService.js  # Data validation
├── test/               # Test files
├── App.vue             # Root component
├── main.js             # Application entry
└── style.css           # Global styles
```

### 🎯 Core Functionality

#### Task Management
- **Create Tasks**: Click on calendar dates or use the "Add Task" button
- **Edit Tasks**: Click on task items to modify details
- **Task Status**: Toggle between Todo, In Progress, and Completed
- **Recurring Tasks**: Set up repeating tasks with flexible patterns
- **Rich Metadata**: Add descriptions, tags, and priority levels

#### View Modes
- **Month View**: Traditional calendar layout with task indicators
- **Week View**: Detailed weekly schedule with time slots
- **List View**: Comprehensive task list with search and filters

#### Data Management
- **Auto Backup**: Automatic periodic data backup
- **Manual Backup**: On-demand backup creation
- **Import/Export**: JSON-based data portability
- **Local Storage**: Persistent data storage in browser

### 🚀 Deployment

The project uses GitHub Actions for automated deployment:

1. Push code to `main` branch
2. GitHub Actions triggers automatic build
3. Successful builds deploy to GitHub Pages
4. Access at `https://superxsy.github.io/calenderX/`

### 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### 📝 Development Guidelines

- Follow Vue 3 Composition API best practices
- Use Pinia for state management
- Implement responsive design principles
- Write comprehensive unit tests
- Follow semantic commit conventions
- Maintain clean, readable code

### 🐛 Issues & Support

Found a bug or have a feature request?

1. Check [existing issues](https://github.com/superxsy/calenderX/issues)
2. Create a new issue with detailed description
3. Include steps to reproduce for bugs

### 📄 License

This project is licensed under the [MIT License](LICENSE).

### 🙏 Acknowledgments

- [Vue.js](https://vuejs.org/) - The Progressive JavaScript Framework
- [Vite](https://vitejs.dev/) - Next Generation Frontend Tooling
- [Vitest](https://vitest.dev/) - A Vite-native testing framework
- [Pinia](https://pinia.vuejs.org/) - The Vue Store that you will enjoy using

---

## Chinese

一个基于 Vue 3 和现代 Web 技术构建的精致日历任务管理应用。CalendarX 提供直观的界面，支持多视图任务管理，具备强大的生产力提升功能。

### 🌟 核心特性

- **📋 全面的任务管理**: 创建、编辑、删除和组织任务，支持丰富的元数据
- **📅 多视图模式**: 无缝切换月视图、周视图和列表视图
- **🔄 重复任务**: 支持日、周、月、年重复模式
- **🔍 高级搜索过滤**: 实时搜索和基于状态的过滤
- **💾 智能数据管理**: 自动备份、手动备份和数据导入导出
- **📱 响应式设计**: 针对桌面、平板和移动设备优化
- **🎨 简洁现代UI**: 直观界面，视觉设计一致
- **⚡ 高性能**: 基于 Vue 3 组合式 API 和优化渲染

### 🚀 在线演示

**🌐 [体验 CalendarX](https://superxsy.github.io/calenderX/)**

> 🔄 **最新更新**: 增强 UI/UX，统一视图控制和响应式布局优化 (2025年1月)

### 🛠️ 技术栈

- **前端框架**: Vue 3.5.17 (组合式 API)
- **状态管理**: Pinia
- **构建工具**: Vite 7.0.3
- **开发语言**: JavaScript (ES6+)
- **样式**: CSS3 + Flexbox/Grid
- **测试**: Vitest + @vue/test-utils
- **部署**: GitHub Pages + GitHub Actions

### 📦 快速开始

#### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0

#### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/superxsy/calenderX.git
cd calenderX

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 打开 http://localhost:5173
```

#### 生产构建

```bash
# 构建项目
npm run build

# 预览生产版本
npm run preview
```

### 🧪 测试

```bash
# 运行单元测试
npm run test

# 运行测试并生成覆盖率
npm run test:run

# 启动测试UI
npm run test:ui
```

### 📁 项目架构

```
src/
├── components/          # 可复用UI组件
│   ├── CalendarView.vue    # 日历组件（月/周视图）
│   ├── TaskList.vue        # 任务列表组件
│   ├── TaskModal.vue       # 任务编辑模态框
│   └── BackupModal.vue     # 数据备份模态框
├── store/              # Pinia 状态管理
│   └── modules/        # 功能特定的存储
│       ├── taskStore.js      # 任务管理状态
│       ├── calendarStore.js  # 日历视图状态
│       ├── backupStore.js    # 备份管理
│       └── uiStore.js        # UI状态管理
├── services/           # 业务逻辑层
│   ├── taskService.js        # 任务操作
│   ├── backupService.js      # 备份操作
│   ├── storageService.js     # 本地存储
│   ├── dateService.js        # 日期工具
│   └── validationService.js  # 数据验证
├── test/               # 测试文件
├── App.vue             # 根组件
├── main.js             # 应用入口
└── style.css           # 全局样式
```

### 🎯 核心功能

#### 任务管理
- **创建任务**: 点击日历日期或使用"添加任务"按钮
- **编辑任务**: 点击任务项目修改详情
- **任务状态**: 在待办、进行中和已完成之间切换
- **重复任务**: 设置灵活的重复模式
- **丰富元数据**: 添加描述、标签和优先级

#### 视图模式
- **月视图**: 传统日历布局，显示任务指示器
- **周视图**: 详细的周计划，带时间段
- **列表视图**: 全面的任务列表，支持搜索和过滤

#### 数据管理
- **自动备份**: 自动定期数据备份
- **手动备份**: 按需创建备份
- **导入导出**: 基于JSON的数据可移植性
- **本地存储**: 浏览器中的持久数据存储

### 🚀 部署说明

项目使用 GitHub Actions 自动部署：

1. 推送代码到 `main` 分支
2. GitHub Actions 触发自动构建
3. 构建成功后部署到 GitHub Pages
4. 访问 `https://superxsy.github.io/calenderX/`

### 🤝 贡献指南

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

### 📝 开发规范

- 遵循 Vue 3 组合式 API 最佳实践
- 使用 Pinia 进行状态管理
- 实施响应式设计原则
- 编写全面的单元测试
- 遵循语义化提交约定
- 保持代码清洁可读

### 🐛 问题与支持

发现错误或有功能请求？

1. 查看 [现有问题](https://github.com/superxsy/calenderX/issues)
2. 创建新问题并详细描述
3. 对于错误，请包含重现步骤

### 📄 许可证

本项目基于 [MIT 许可证](LICENSE) 开源。

### 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [Vitest](https://vitest.dev/) - Vite 原生测试框架
- [Pinia](https://pinia.vuejs.org/) - 你会喜欢使用的 Vue 状态管理库
