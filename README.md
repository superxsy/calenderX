The following readme was written by Claude, it looks very advanced but is actually about a very simple thing.


# 📅 Vue 日历任务管理系统

一个基于 Vue 3 + Vite 构建的现代化日历任务管理应用，支持任务创建、编辑、删除和多视图展示。

## 🌟 功能特性

- **📋 任务管理**: 创建、编辑、删除和查看任务
- **📅 多视图模式**: 支持月视图和列表视图
- **🔍 智能搜索**: 按标题、描述或标签快速搜索任务
- **🏷️ 标签分类**: 支持工作、个人、学习等多种标签
- **📱 响应式设计**: 完美适配桌面和移动设备
- **💾 数据持久化**: 本地存储任务数据
- **🎨 现代化UI**: 简洁美观的用户界面

## 🚀 在线演示

访问部署版本：[https://superxsy.github.io/calenderX/](https://superxsy.github.io/calenderX/)

## 🛠️ 技术栈

- **前端框架**: Vue 3.5.17
- **构建工具**: Vite 7.0.3
- **开发语言**: JavaScript (ES6+)
- **样式**: CSS3 + Flexbox/Grid
- **测试框架**: Vitest + @vue/test-utils
- **部署**: GitHub Pages + GitHub Actions

## 📦 安装与运行

### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0

### 本地开发

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

### 构建生产版本

```bash
# 构建项目
npm run build

# 预览构建结果
npm run preview
```

## 🧪 测试

```bash
# 运行测试
npm run test

# 运行测试并生成覆盖率报告
npm run test:run

# 启动测试UI界面
npm run test:ui
```

## 📁 项目结构

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

## 🎯 核心功能说明

### 任务管理
- **创建任务**: 点击日期或"添加任务"按钮
- **编辑任务**: 点击任务卡片进行编辑
- **删除任务**: 在任务详情中删除
- **任务状态**: 支持待办、进行中、已完成状态

### 视图切换
- **月视图**: 以日历形式展示任务
- **列表视图**: 以列表形式展示所有任务

### 搜索功能
- 支持按任务标题搜索
- 支持按任务描述搜索
- 支持按标签筛选

## 🚀 部署说明

项目使用 GitHub Actions 自动部署到 GitHub Pages：

1. 推送代码到 `main` 分支
2. GitHub Actions 自动触发构建
3. 构建成功后自动部署到 GitHub Pages
4. 访问 `https://superxsy.github.io/calenderX/`

### 手动部署

```bash
# 构建项目
npm run build

# 将 dist/ 目录内容部署到你的服务器
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 开发规范

- 遵循 Vue 3 Composition API 最佳实践
- 使用 ES6+ 语法
- 保持代码简洁和可读性
- 编写单元测试覆盖核心功能
- 提交信息使用语义化格式

## 🐛 问题反馈

如果你发现任何问题或有改进建议，请：

1. 查看 [Issues](https://github.com/superxsy/calenderX/issues) 是否已有相关问题
2. 如果没有，请创建新的 Issue
3. 详细描述问题和复现步骤

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源协议。

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [Vitest](https://vitest.dev/) - 由 Vite 提供支持的测试框架

---

⭐ 如果这个项目对你有帮助，请给它一个 Star！
