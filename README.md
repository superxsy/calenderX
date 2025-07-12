# 📅 Vue Calendar Task Management System | Vue 日历任务管理系统

[English](#english) | [中文](#chinese)

---

## English

A modern calendar task management application built with Vue 3 + Vite, supporting task creation, editing, deletion, and multi-view display.

### 🌟 Features

- **📋 Task Management**: Create, edit, delete and view tasks
- **📅 Multi-view Mode**: Support for month view and list view
- **🔍 Smart Search**: Quick search tasks by title, description or tags
- **🏷️ Tag Classification**: Support for work, personal, study and other tags
- **📱 Responsive Design**: Perfect adaptation for desktop and mobile devices
- **💾 Data Persistence**: Local storage of task data
- **🎨 Modern UI**: Clean and beautiful user interface

### 🚀 Live Demo

Visit the deployed version: [https://superxsy.github.io/calenderX/](https://superxsy.github.io/calenderX/)

> 🔄 **Latest Update**: Integrated Everything SDK and enhanced task management features (December 2024)

### 🛠️ Tech Stack

- **Frontend Framework**: Vue 3.5.17
- **Build Tool**: Vite 7.0.3
- **Development Language**: JavaScript (ES6+)
- **Styling**: CSS3 + Flexbox/Grid
- **Testing Framework**: Vitest + @vue/test-utils
- **Deployment**: GitHub Pages + GitHub Actions

### 📦 Installation & Running

#### Requirements

- Node.js >= 18.0.0
- npm >= 8.0.0

#### Local Development

```bash
# Clone the project
git clone https://github.com/superxsy/calenderX.git
cd calenderX

# Install dependencies
npm install

# Start development server
npm run dev

# Visit http://localhost:5173
```

#### Build for Production

```bash
# Build the project
npm run build

# Preview build results
npm run preview
```

### 🧪 Testing

```bash
# Run tests
npm run test

# Run tests and generate coverage report
npm run test:run

# Start test UI interface
npm run test:ui
```

### 📁 Project Structure

```
src/
├── components/          # Reusable components
│   └── HelloWorld.vue
├── test/               # Test files
│   ├── setup.js       # Test environment configuration
│   └── App.test.js    # Main application tests
├── App.vue            # Main application component
├── main.js            # Application entry point
└── style.css          # Global styles

public/
├── calendar-tasks.json # Sample task data
└── vite.svg           # Application icon

.github/
└── workflows/
    └── static.yml     # GitHub Actions deployment configuration
```

### 🎯 Core Features

#### Task Management
- **Create Task**: Click on a date or "Add Task" button
- **Edit Task**: Click on task card to edit
- **Delete Task**: Delete in task details
- **Task Status**: Support for todo, in-progress, completed status

#### View Switching
- **Month View**: Display tasks in calendar format
- **List View**: Display all tasks in list format

#### Search Function
- Search by task title
- Search by task description
- Filter by tags

### 🚀 Deployment

The project uses GitHub Actions for automatic deployment to GitHub Pages:

1. Push code to `main` branch
2. GitHub Actions automatically triggers build
3. After successful build, automatically deploy to GitHub Pages
4. Visit `https://superxsy.github.io/calenderX/`

#### Manual Deployment

```bash
# Build the project
npm run build

# Deploy dist/ directory contents to your server
```

### 🤝 Contributing

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 📝 Development Guidelines

- Follow Vue 3 Composition API best practices
- Use ES6+ syntax
- Keep code clean and readable
- Write unit tests covering core functionality
- Use semantic commit messages

### 🐛 Issue Reporting

If you find any issues or have suggestions for improvement:

1. Check [Issues](https://github.com/superxsy/calenderX/issues) for existing related issues
2. If none exist, create a new Issue
3. Describe the problem and reproduction steps in detail

### 📄 License

This project is licensed under the [MIT License](LICENSE).

### 🙏 Acknowledgments

- [Vue.js](https://vuejs.org/) - The Progressive JavaScript Framework
- [Vite](https://vitejs.dev/) - Next Generation Frontend Tooling
- [Vitest](https://vitest.dev/) - A Vite-native test framework

---

## Chinese

一个基于 Vue 3 + Vite 构建的现代化日历任务管理应用，支持任务创建、编辑、删除和多视图展示。

### 🌟 功能特性

- **📋 任务管理**: 创建、编辑、删除和查看任务
- **📅 多视图模式**: 支持月视图和列表视图
- **🔍 智能搜索**: 按标题、描述或标签快速搜索任务
- **🏷️ 标签分类**: 支持工作、个人、学习等多种标签
- **📱 响应式设计**: 完美适配桌面和移动设备
- **💾 数据持久化**: 本地存储任务数据
- **🎨 现代化UI**: 简洁美观的用户界面

### 🚀 在线演示

访问部署版本：[https://superxsy.github.io/calenderX/](https://superxsy.github.io/calenderX/)

### 🛠️ 技术栈

- **前端框架**: Vue 3.5.17
- **构建工具**: Vite 7.0.3
- **开发语言**: JavaScript (ES6+)
- **样式**: CSS3 + Flexbox/Grid
- **测试框架**: Vitest + @vue/test-utils
- **部署**: GitHub Pages + GitHub Actions

### 📦 安装与运行

#### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0

#### 本地开发

```bash
# 克隆项目
git clone https://github.com/superxsy/calenderX.git
cd calenderX

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
```

#### 构建生产版本

```bash
# 构建项目
npm run build

# 预览构建结果
npm run preview
```

### 🧪 测试

```bash
# 运行测试
npm run test

# 运行测试并生成覆盖率报告
npm run test:run

# 启动测试UI界面
npm run test:ui
```

### 📁 项目结构

```
src/
├── components/          # 可复用组件
│   └── HelloWorld.vue
├── test/               # 测试文件
│   ├── setup.js       # 测试环境配置
│   └── App.test.js    # 主应用测试
├── App.vue            # 主应用组件
├── main.js            # 应用入口
└── style.css          # 全局样式

public/
├── calendar-tasks.json # 示例任务数据
└── vite.svg           # 应用图标

.github/
└── workflows/
    └── static.yml     # GitHub Actions 部署配置
```

### 🎯 核心功能说明

#### 任务管理
- **创建任务**: 点击日期或"添加任务"按钮
- **编辑任务**: 点击任务卡片进行编辑
- **删除任务**: 在任务详情中删除
- **任务状态**: 支持待办、进行中、已完成状态

#### 视图切换
- **月视图**: 以日历形式展示任务
- **列表视图**: 以列表形式展示所有任务

#### 搜索功能
- 支持按任务标题搜索
- 支持按任务描述搜索
- 支持按标签筛选

### 🚀 部署说明

项目使用 GitHub Actions 自动部署到 GitHub Pages：

1. 推送代码到 `main` 分支
2. GitHub Actions 自动触发构建
3. 构建成功后自动部署到 GitHub Pages
4. 访问 `https://superxsy.github.io/calenderX/`

#### 手动部署

```bash
# 构建项目
npm run build

# 将 dist/ 目录内容部署到你的服务器
```

### 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 📝 开发规范

- 遵循 Vue 3 Composition API 最佳实践
- 使用 ES6+ 语法
- 保持代码简洁和可读性
- 编写单元测试覆盖核心功能
- 提交信息使用语义化格式

### 🐛 问题反馈

如果你发现任何问题或有改进建议，请：

1. 查看 [Issues](https://github.com/superxsy/calenderX/issues) 是否已有相关问题
2. 如果没有，请创建新的 Issue
3. 详细描述问题和复现步骤

### 📄 许可证

本项目基于 [MIT License](LICENSE) 开源协议。

### 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [Vitest](https://vitest.dev/) - 由 Vite 提供支持的测试框架

---

⭐ If this project helps you, please give it a Star! | 如果这个项目对你有帮助，请给它一个 Star！
