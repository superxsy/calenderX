# 🏪 Store 状态管理层

基于 Pinia 的状态管理系统，采用模块化设计，为应用提供集中式的状态管理和数据流控制。

## 📁 模块结构

```
store/
├── index.js              # Store 配置和统一导出
└── modules/              # 功能模块 Store
    ├── taskStore.js      # 任务管理状态
    ├── authStore.js      # 用户认证状态
    ├── calendarStore.js  # 日历视图状态
    ├── backupStore.js    # 备份管理状态
    └── uiStore.js        # UI 状态管理
```

## 🎯 核心 Store 模块

### 📝 taskStore.js
**任务管理状态**
- 任务数据存储和管理
- 任务 CRUD 操作
- 搜索和过滤状态
- 任务统计信息
- 本地/API 模式切换

```javascript
import { useTaskStore } from '@/store'

const taskStore = useTaskStore()

// 获取任务列表
const tasks = taskStore.tasks

// 添加任务
await taskStore.addTask(taskData)

// 搜索任务
taskStore.setSearchQuery('会议')
const filteredTasks = taskStore.filteredTasks
```

### 🔐 authStore.js
**用户认证状态**
- 用户登录状态
- JWT token 管理
- 用户信息存储
- 权限控制
- 会话管理

```javascript
import { useAuthStore } from '@/store'

const authStore = useAuthStore()

// 用户登录
await authStore.login(credentials)

// 检查登录状态
const isLoggedIn = authStore.isAuthenticated

// 获取用户信息
const user = authStore.user
```

### 📅 calendarStore.js
**日历视图状态**
- 当前日期和视图模式
- 日历导航状态
- 视图切换控制
- 日期选择状态
- 月/周视图配置

```javascript
import { useCalendarStore } from '@/store'

const calendarStore = useCalendarStore()

// 切换视图模式
calendarStore.setViewMode('week')

// 导航到指定日期
calendarStore.navigateToDate(new Date())

// 获取当前月份任务
const monthTasks = calendarStore.currentMonthTasks
```

### 💾 backupStore.js
**备份管理状态**
- 备份历史记录
- 备份操作状态
- 导入/导出进度
- 备份配置设置
- 数据同步状态

```javascript
import { useBackupStore } from '@/store'

const backupStore = useBackupStore()

// 创建备份
await backupStore.createBackup()

// 获取备份列表
const backups = backupStore.backupHistory

// 恢复备份
await backupStore.restoreBackup(backupId)
```

### 🎨 uiStore.js
**UI 状态管理**
- 模态框显示状态
- 加载状态管理
- 通知消息
- 主题设置
- 响应式布局状态

```javascript
import { useUiStore } from '@/store'

const uiStore = useUiStore()

// 显示任务编辑模态框
uiStore.showTaskModal(taskData)

// 显示加载状态
uiStore.setLoading(true)

// 显示通知
uiStore.showNotification('任务创建成功', 'success')
```

## 🔧 使用指南

### 在组件中使用 Store

```vue
<template>
  <div>
    <h2>任务列表 ({{ taskStore.tasks.length }})</h2>
    <div v-if="uiStore.isLoading">加载中...</div>
    <div v-else>
      <task-item 
        v-for="task in taskStore.filteredTasks" 
        :key="task.id" 
        :task="task"
        @edit="editTask"
      />
    </div>
  </div>
</template>

<script setup>
import { useTaskStore, useUiStore } from '@/store'
import { onMounted } from 'vue'

const taskStore = useTaskStore()
const uiStore = useUiStore()

onMounted(async () => {
  uiStore.setLoading(true)
  try {
    await taskStore.loadTasks()
  } catch (error) {
    uiStore.showNotification('加载任务失败', 'error')
  } finally {
    uiStore.setLoading(false)
  }
})

const editTask = (task) => {
  uiStore.showTaskModal(task)
}
</script>
```

### Store 组合使用

```javascript
import { useTaskStore, useCalendarStore, useAuthStore } from '@/store'
import { computed } from 'vue'

export default {
  setup() {
    const taskStore = useTaskStore()
    const calendarStore = useCalendarStore()
    const authStore = useAuthStore()
    
    // 组合多个 Store 的数据
    const currentDateTasks = computed(() => {
      return taskStore.getTasksByDate(calendarStore.currentDate)
    })
    
    // 根据认证状态决定数据源
    const loadTasks = async () => {
      if (authStore.isAuthenticated) {
        await taskStore.loadTasksFromAPI()
      } else {
        await taskStore.loadTasksFromLocal()
      }
    }
    
    return {
      currentDateTasks,
      loadTasks
    }
  }
}
```

## 🏗️ Store 设计模式

### 1. 状态结构
```javascript
export const useTaskStore = defineStore('task', {
  state: () => ({
    // 基础数据
    tasks: [],
    
    // UI 状态
    searchQuery: '',
    selectedTags: [],
    
    // 配置状态
    apiMode: false,
    
    // 加载状态
    loading: false,
    error: null
  }),
  
  getters: {
    // 计算属性
    filteredTasks: (state) => {
      return state.tasks.filter(task => 
        task.title.includes(state.searchQuery)
      )
    },
    
    // 统计信息
    taskStats: (state) => {
      return {
        total: state.tasks.length,
        completed: state.tasks.filter(t => t.completed).length,
        pending: state.tasks.filter(t => !t.completed).length
      }
    }
  },
  
  actions: {
    // 异步操作
    async loadTasks() {
      this.loading = true
      try {
        const tasks = await taskService.loadTasks()
        this.tasks = tasks
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    }
  }
})
```

### 2. 模块间通信
```javascript
// 在一个 Store 中调用另一个 Store
export const useTaskStore = defineStore('task', {
  actions: {
    async addTask(taskData) {
      // 添加任务
      const newTask = await taskService.createTask(taskData)
      this.tasks.push(newTask)
      
      // 通知 UI Store 显示成功消息
      const uiStore = useUiStore()
      uiStore.showNotification('任务创建成功', 'success')
      
      // 更新日历 Store 的当前日期
      const calendarStore = useCalendarStore()
      calendarStore.navigateToDate(newTask.date)
    }
  }
})
```

### 3. 持久化存储
```javascript
export const useTaskStore = defineStore('task', {
  state: () => ({
    tasks: []
  }),
  
  actions: {
    // 保存到本地存储
    saveToLocal() {
      storageService.setItem('tasks', this.tasks)
    },
    
    // 从本地存储加载
    loadFromLocal() {
      const tasks = storageService.getItem('tasks', [])
      this.tasks = tasks
    }
  }
})

// 监听状态变化自动保存
const taskStore = useTaskStore()
taskStore.$subscribe((mutation, state) => {
  if (mutation.type === 'direct' && mutation.events.key === 'tasks') {
    taskStore.saveToLocal()
  }
})
```

## 🧪 测试策略

### Store 单元测试
```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTaskStore } from '@/store/modules/taskStore'

describe('TaskStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('should add task correctly', async () => {
    const taskStore = useTaskStore()
    const taskData = { title: 'Test Task', date: '2025-01-01' }
    
    await taskStore.addTask(taskData)
    
    expect(taskStore.tasks).toHaveLength(1)
    expect(taskStore.tasks[0].title).toBe('Test Task')
  })
  
  it('should filter tasks by search query', () => {
    const taskStore = useTaskStore()
    taskStore.tasks = [
      { id: 1, title: '会议任务' },
      { id: 2, title: '开发任务' }
    ]
    
    taskStore.setSearchQuery('会议')
    
    expect(taskStore.filteredTasks).toHaveLength(1)
    expect(taskStore.filteredTasks[0].title).toBe('会议任务')
  })
})
```

### Store 集成测试
```javascript
import { describe, it, expect } from 'vitest'
import { useTaskStore, useCalendarStore } from '@/store'

describe('Store Integration', () => {
  it('should sync task and calendar stores', async () => {
    const taskStore = useTaskStore()
    const calendarStore = useCalendarStore()
    
    const taskData = { title: 'Test', date: '2025-01-15' }
    await taskStore.addTask(taskData)
    
    calendarStore.navigateToDate(new Date('2025-01-15'))
    
    expect(calendarStore.currentDateTasks).toHaveLength(1)
  })
})
```

## 🚀 最佳实践

### 1. 状态设计
- 保持状态结构扁平化
- 避免嵌套过深的对象
- 使用规范化的数据结构
- 分离 UI 状态和业务状态

### 2. Actions 设计
- 使用 async/await 处理异步操作
- 统一的错误处理机制
- 合理的加载状态管理
- 避免在 actions 中直接修改其他 store

### 3. Getters 优化
- 使用计算属性缓存复杂计算
- 避免在 getters 中执行副作用
- 合理使用参数化 getters

### 4. 性能优化
- 使用 `storeToRefs` 保持响应性
- 避免不必要的状态订阅
- 合理使用 `$patch` 批量更新

```javascript
import { storeToRefs } from 'pinia'
import { useTaskStore } from '@/store'

// 正确的响应式解构
const taskStore = useTaskStore()
const { tasks, loading } = storeToRefs(taskStore)

// 批量更新状态
taskStore.$patch({
  tasks: newTasks,
  loading: false,
  error: null
})
```

## 🔄 数据流架构

```
组件 (Component)
    ↓ 用户交互
Store Actions
    ↓ 调用服务
Services 层
    ↓ 数据处理
数据源 (LocalStorage/API)
    ↓ 返回数据
Store State
    ↓ 响应式更新
组件 (Component)
```

这种单向数据流确保了状态管理的可预测性和可维护性。
