# CalendarX 项目结构说明

## 目录结构

```
src/
├── components/          # 可复用的基础组件
│   ├── index.js        # 组件统一导出
│   └── HelloWorld.vue  # 示例组件
├── views/              # 页面级组件
│   └── index.js        # 视图组件统一导出
├── store/              # Pinia 状态管理
│   ├── index.js        # Store 配置和导出
│   └── modules/        # 各功能模块的 Store
│       ├── taskStore.js      # 任务管理状态
│       ├── calendarStore.js  # 日历视图状态
│       ├── backupStore.js    # 备份管理状态
│       └── uiStore.js        # UI 状态管理
├── services/           # 业务逻辑服务层
│   ├── index.js        # 服务统一导出
│   ├── taskService.js        # 任务相关业务逻辑
│   ├── backupService.js      # 备份相关业务逻辑
│   ├── storageService.js     # 本地存储服务
│   ├── dateService.js        # 日期工具服务
│   └── validationService.js  # 数据验证服务
├── assets/             # 静态资源
├── test/               # 测试文件
├── App.vue             # 根组件
├── main.js             # 应用入口
└── style.css           # 全局样式
```

## 架构设计

### 1. 组件层 (Components)
- **基础组件**: 可复用的UI组件，如按钮、输入框、模态框等
- **页面组件**: 完整的业务页面，如月视图、周视图、列表视图等

### 2. 状态管理层 (Store)
使用 Pinia 进行状态管理，按功能模块划分：
- **taskStore**: 任务数据管理、CRUD操作、搜索过滤
- **calendarStore**: 日历视图状态、日期导航、视图切换
- **backupStore**: 备份数据管理、导入导出功能
- **uiStore**: UI状态管理、模态框、主题、通知等

### 3. 服务层 (Services)
封装业务逻辑和数据处理：
- **taskService**: 任务相关业务逻辑、重复任务处理
- **backupService**: 备份创建、恢复、导入导出
- **storageService**: 本地存储操作、数据持久化
- **dateService**: 日期格式化、计算、验证
- **validationService**: 数据验证、表单验证

## 使用方法

### 在组件中使用 Store

```javascript
import { useTaskStore, useCalendarStore } from '@/store'

export default {
  setup() {
    const taskStore = useTaskStore()
    const calendarStore = useCalendarStore()
    
    return {
      taskStore,
      calendarStore
    }
  }
}
```

### 在组件中使用 Services

```javascript
import { taskService, dateService } from '@/services'

export default {
  methods: {
    async createTask(taskData) {
      try {
        const tasks = await taskService.createTasksWithRepeat(taskData)
        // 处理创建的任务
      } catch (error) {
        console.error('创建任务失败:', error)
      }
    }
  }
}
```

## 开发规范

### 1. 命名规范
- **文件名**: 使用 camelCase (如: taskService.js)
- **组件名**: 使用 PascalCase (如: TaskModal.vue)
- **Store模块**: 使用 camelCase + Store 后缀 (如: taskStore)
- **Service模块**: 使用 camelCase + Service 后缀 (如: taskService)

### 2. 代码组织
- **单一职责**: 每个模块只负责一个特定功能
- **依赖注入**: 服务层之间可以相互依赖，但要避免循环依赖
- **错误处理**: 统一的错误处理机制
- **类型安全**: 使用 JSDoc 注释提供类型信息

### 3. 状态管理原则
- **数据流向**: 组件 → Store → Service → 数据源
- **状态更新**: 只能通过 Store 的 actions 修改状态
- **计算属性**: 使用 getters 进行数据派生和过滤
- **副作用**: 异步操作和副作用放在 actions 中

### 4. 服务层原则
- **纯函数**: 尽量使用纯函数，便于测试
- **错误处理**: 统一的错误处理和日志记录
- **数据验证**: 在服务层进行数据验证
- **缓存策略**: 合理使用缓存提高性能

## 扩展指南

### 添加新功能
1. 在 `services/` 中创建相应的服务模块
2. 在 `store/modules/` 中创建状态管理模块
3. 在 `components/` 或 `views/` 中创建UI组件
4. 更新相应的 `index.js` 文件进行导出

### 添加新组件
1. 在 `components/` 中创建组件文件
2. 在 `components/index.js` 中导出组件
3. 编写组件文档和测试

### 添加新页面
1. 在 `views/` 中创建页面组件
2. 在 `views/index.js` 中导出组件
3. 在路由中配置页面（如果使用路由）

## 技术栈

- **Vue 3**: 前端框架
- **Pinia**: 状态管理
- **Vite**: 构建工具
- **Vitest**: 测试框架
- **JavaScript**: 编程语言

## 下一步优化建议

1. **组件化重构**: 将 App.vue 中的大型组件拆分为小组件
2. **路由管理**: 引入 Vue Router 进行页面路由管理
3. **类型安全**: 考虑迁移到 TypeScript
4. **UI组件库**: 引入或创建统一的UI组件库
5. **测试覆盖**: 增加单元测试和集成测试
6. **性能优化**: 实现虚拟滚动、懒加载等优化
7. **PWA支持**: 添加离线支持和安装功能