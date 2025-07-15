# 📋 Services 服务层

服务层负责封装业务逻辑和数据处理，为组件和状态管理提供统一的数据接口。

## 📁 模块结构

```
services/
├── index.js              # 服务统一导出
├── taskService.js        # 任务业务逻辑
├── taskApiService.js     # 任务API服务
├── authService.js        # 用户认证服务
├── backupService.js      # 备份管理服务
├── storageService.js     # 本地存储服务
├── dateService.js        # 日期工具服务
├── validationService.js  # 数据验证服务
├── apiService.js         # 通用API服务
└── styleService.js       # 样式工具服务
```

## 🎯 核心服务模块

### 📝 taskService.js
**任务业务逻辑处理**
- 任务创建、编辑、删除逻辑
- 重复任务生成算法
- 任务状态管理
- 任务搜索和过滤
- 任务数据验证

```javascript
import { taskService } from '@/services'

// 创建重复任务
const tasks = await taskService.createTasksWithRepeat(taskData)

// 搜索任务
const results = taskService.searchTasks(tasks, searchQuery)
```

### 🔐 authService.js
**用户认证服务**
- 用户登录/注册
- JWT token管理
- 会话状态维护
- 权限验证

```javascript
import { authService } from '@/services'

// 用户登录
const result = await authService.login(credentials)

// 检查认证状态
const isAuthenticated = authService.isAuthenticated()
```

### 💾 backupService.js
**数据备份管理**
- 自动备份创建
- 手动备份导出
- 数据导入恢复
- 备份文件验证

```javascript
import { backupService } from '@/services'

// 创建备份
const backup = backupService.createBackup(data)

// 导入备份
const result = await backupService.importBackup(file)
```

### 🗄️ storageService.js
**本地存储管理**
- LocalStorage操作
- 数据序列化/反序列化
- 存储空间管理
- 数据迁移

```javascript
import { storageService } from '@/services'

// 保存数据
storageService.setItem('tasks', tasks)

// 读取数据
const tasks = storageService.getItem('tasks', [])
```

### 📅 dateService.js
**日期工具服务**
- 日期格式化
- 日期计算和比较
- 重复模式处理
- 时区处理

```javascript
import { dateService } from '@/services'

// 格式化日期
const formatted = dateService.formatDate(date, 'YYYY-MM-DD')

// 计算重复日期
const nextDates = dateService.calculateRepeatDates(startDate, pattern)
```

### ✅ validationService.js
**数据验证服务**
- 表单数据验证
- 业务规则验证
- 错误信息生成
- 数据格式检查

```javascript
import { validationService } from '@/services'

// 验证任务数据
const validation = validationService.validateTask(taskData)
if (!validation.isValid) {
  console.error(validation.errors)
}
```

### 🌐 apiService.js
**API通信服务**
- HTTP请求封装
- 错误处理
- 请求拦截器
- 响应处理

```javascript
import { apiService } from '@/services'

// 发送API请求
const response = await apiService.get('/api/tasks')
const result = await apiService.post('/api/tasks', taskData)
```

## 🔧 使用指南

### 导入服务

```javascript
// 导入单个服务
import { taskService } from '@/services'

// 导入多个服务
import { taskService, authService, dateService } from '@/services'

// 导入所有服务
import * as services from '@/services'
```

### 在组件中使用

```javascript
<script setup>
import { taskService, dateService } from '@/services'
import { ref, onMounted } from 'vue'

const tasks = ref([])

onMounted(async () => {
  try {
    tasks.value = await taskService.loadTasks()
  } catch (error) {
    console.error('加载任务失败:', error)
  }
})

const createTask = async (taskData) => {
  try {
    const newTasks = await taskService.createTasksWithRepeat(taskData)
    tasks.value.push(...newTasks)
  } catch (error) {
    console.error('创建任务失败:', error)
  }
}
</script>
```

### 在Store中使用

```javascript
import { defineStore } from 'pinia'
import { taskService, storageService } from '@/services'

export const useTaskStore = defineStore('task', {
  state: () => ({
    tasks: []
  }),
  
  actions: {
    async loadTasks() {
      try {
        this.tasks = await taskService.loadTasks()
      } catch (error) {
        console.error('加载任务失败:', error)
      }
    },
    
    async saveTask(taskData) {
      try {
        const newTasks = await taskService.createTasksWithRepeat(taskData)
        this.tasks.push(...newTasks)
        storageService.setItem('tasks', this.tasks)
      } catch (error) {
        console.error('保存任务失败:', error)
      }
    }
  }
})
```

## 🏗️ 设计原则

### 1. 单一职责
每个服务模块只负责一个特定的业务领域，保持功能的内聚性。

### 2. 依赖注入
服务之间可以相互依赖，但要避免循环依赖，保持清晰的依赖关系。

### 3. 错误处理
统一的错误处理机制，提供有意义的错误信息和恢复策略。

### 4. 纯函数优先
尽量使用纯函数，便于测试和调试，减少副作用。

### 5. 异步处理
合理使用 async/await 处理异步操作，提供良好的用户体验。

## 🧪 测试策略

### 单元测试
```javascript
import { describe, it, expect } from 'vitest'
import { taskService } from '@/services'

describe('taskService', () => {
  it('should create task with repeat pattern', () => {
    const taskData = {
      title: 'Test Task',
      repeat: { type: 'daily', interval: 1 }
    }
    
    const tasks = taskService.createTasksWithRepeat(taskData)
    expect(tasks).toHaveLength(1)
    expect(tasks[0].title).toBe('Test Task')
  })
})
```

### 集成测试
```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { taskService, storageService } from '@/services'

describe('Task Integration', () => {
  beforeEach(() => {
    storageService.clear()
  })
  
  it('should save and load tasks', async () => {
    const taskData = { title: 'Test Task' }
    await taskService.saveTask(taskData)
    
    const tasks = await taskService.loadTasks()
    expect(tasks).toHaveLength(1)
    expect(tasks[0].title).toBe('Test Task')
  })
})
```

## 🚀 扩展指南

### 添加新服务
1. 在 `services/` 目录创建新的服务文件
2. 实现服务的核心功能
3. 在 `services/index.js` 中导出新服务
4. 编写相应的测试用例
5. 更新文档说明

### 服务模板
```javascript
/**
 * 新服务模板
 * @description 服务功能描述
 */

class NewService {
  constructor() {
    // 初始化逻辑
  }
  
  /**
   * 核心方法
   * @param {Object} data - 输入数据
   * @returns {Promise<Object>} 处理结果
   */
  async coreMethod(data) {
    try {
      // 业务逻辑处理
      return result
    } catch (error) {
      console.error('操作失败:', error)
      throw error
    }
  }
}

export const newService = new NewService()
export default newService
```
