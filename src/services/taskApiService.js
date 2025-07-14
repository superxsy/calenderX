// 任务API服务 - 封装任务相关的后端API调用
import { apiService } from './apiService'
import { authService } from './authService'
import { taskService } from './taskService' // 本地任务服务作为备用

class TaskApiService {
  constructor() {
    this.isOnline = true
    this.syncPending = []
  }

  // 检查网络连接状态
  async checkConnection() {
    try {
      this.isOnline = await apiService.checkHealth()
      return this.isOnline
    } catch (error) {
      this.isOnline = false
      return false
    }
  }

  // 获取任务列表
  async getTasks() {
    try {
      // 检查用户是否已登录
      if (!authService.isLoggedIn()) {
        throw new Error('用户未登录')
      }

      // 尝试从API获取
      if (await this.checkConnection()) {
        const response = await apiService.get('/tasks/')
        return {
          success: true,
          tasks: response,
          source: 'api'
        }
      } else {
        // 离线模式，从本地存储获取
        const tasks = await taskService.loadTasks()
        return {
          success: true,
          tasks: tasks,
          source: 'local',
          message: '离线模式：从本地加载任务'
        }
      }
    } catch (error) {
      // API失败时回退到本地存储
      console.warn('API获取任务失败，回退到本地存储:', error)
      const tasks = await taskService.loadTasks()
      return {
        success: true,
        tasks: tasks,
        source: 'local',
        message: '网络错误：从本地加载任务'
      }
    }
  }

  // 创建任务
  async createTask(taskData) {
    try {
      // 检查用户是否已登录
      if (!authService.isLoggedIn()) {
        throw new Error('用户未登录')
      }

      // 转换数据格式以匹配后端API
      const apiTaskData = this.convertToApiFormat(taskData)

      // 尝试通过API创建
      if (await this.checkConnection()) {
        const response = await apiService.post('/tasks/', apiTaskData)
        return {
          success: true,
          task: this.convertFromApiFormat(response),
          source: 'api'
        }
      } else {
        // 离线模式，保存到本地并标记为待同步
        const tasks = await taskService.createTasksWithRepeat(taskData)
        const localTasks = await taskService.loadTasks()
        localTasks.push(...tasks)
        await taskService.saveTasks(localTasks)
        
        // 标记为待同步
        this.addToSyncQueue('create', tasks[0])
        
        return {
          success: true,
          task: tasks[0],
          source: 'local',
          message: '离线模式：任务已保存到本地，将在联网后同步'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: '创建任务失败'
      }
    }
  }

  // 更新任务
  async updateTask(taskId, updates) {
    try {
      // 检查用户是否已登录
      if (!authService.isLoggedIn()) {
        throw new Error('用户未登录')
      }

      // 转换数据格式
      const apiUpdates = this.convertToApiFormat(updates)

      // 尝试通过API更新
      if (await this.checkConnection()) {
        const response = await apiService.put(`/tasks/${taskId}`, apiUpdates)
        return {
          success: true,
          task: this.convertFromApiFormat(response),
          source: 'api'
        }
      } else {
        // 离线模式，更新本地数据
        const localTasks = await taskService.loadTasks()
        const updatedTask = await taskService.updateTask(taskId, updates, localTasks)
        await taskService.saveTasks(localTasks)
        
        // 标记为待同步
        this.addToSyncQueue('update', { id: taskId, ...updates })
        
        return {
          success: true,
          task: updatedTask,
          source: 'local',
          message: '离线模式：任务已更新到本地，将在联网后同步'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: '更新任务失败'
      }
    }
  }

  // 删除任务
  async deleteTask(taskId) {
    try {
      // 检查用户是否已登录
      if (!authService.isLoggedIn()) {
        throw new Error('用户未登录')
      }

      // 尝试通过API删除
      if (await this.checkConnection()) {
        await apiService.delete(`/tasks/${taskId}`)
        return {
          success: true,
          source: 'api'
        }
      } else {
        // 离线模式，从本地删除
        const localTasks = await taskService.loadTasks()
        const deleted = await taskService.deleteTask(taskId, localTasks)
        if (deleted) {
          await taskService.saveTasks(localTasks)
          // 标记为待同步
          this.addToSyncQueue('delete', { id: taskId })
        }
        
        return {
          success: deleted,
          source: 'local',
          message: deleted ? '离线模式：任务已从本地删除，将在联网后同步' : '任务不存在'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: '删除任务失败'
      }
    }
  }

  // 转换为API格式
  convertToApiFormat(taskData) {
    return {
      title: taskData.title,
      description: taskData.description || '',
      task_date: taskData.date,
      start_time: taskData.startTime || null,
      end_time: taskData.endTime || null,
      status: taskData.status || 'todo',
      tag_name: taskData.tag || null,
      tag_color: taskData.tagColor || null,
      priority: taskData.priority || 'medium',
      completed: taskData.completed || false
    }
  }

  // 从API格式转换
  convertFromApiFormat(apiTask) {
    return {
      id: apiTask.id,
      title: apiTask.title,
      description: apiTask.description,
      date: apiTask.task_date,
      startTime: apiTask.start_time,
      endTime: apiTask.end_time,
      status: apiTask.status,
      tag: apiTask.tag_name,
      tagColor: apiTask.tag_color,
      priority: apiTask.priority,
      completed: apiTask.completed,
      createdAt: apiTask.created_at,
      updatedAt: apiTask.updated_at
    }
  }

  // 添加到同步队列
  addToSyncQueue(operation, data) {
    this.syncPending.push({
      operation,
      data,
      timestamp: Date.now()
    })
    
    // 保存到localStorage
    localStorage.setItem('sync_pending', JSON.stringify(this.syncPending))
  }

  // 同步待处理的操作
  async syncPendingOperations() {
    if (!authService.isLoggedIn() || !(await this.checkConnection())) {
      return { success: false, message: '无法同步：用户未登录或网络不可用' }
    }

    const pending = JSON.parse(localStorage.getItem('sync_pending') || '[]')
    const results = []

    for (const item of pending) {
      try {
        let result
        switch (item.operation) {
          case 'create':
            result = await this.createTask(item.data)
            break
          case 'update':
            result = await this.updateTask(item.data.id, item.data)
            break
          case 'delete':
            result = await this.deleteTask(item.data.id)
            break
        }
        results.push({ ...item, result, synced: result.success })
      } catch (error) {
        results.push({ ...item, error: error.message, synced: false })
      }
    }

    // 清除已同步的操作
    const stillPending = results.filter(r => !r.synced)
    this.syncPending = stillPending
    localStorage.setItem('sync_pending', JSON.stringify(stillPending))

    return {
      success: true,
      synced: results.filter(r => r.synced).length,
      failed: results.filter(r => !r.synced).length,
      results
    }
  }

  // 获取同步状态
  getSyncStatus() {
    const pending = JSON.parse(localStorage.getItem('sync_pending') || '[]')
    return {
      hasPending: pending.length > 0,
      pendingCount: pending.length,
      isOnline: this.isOnline
    }
  }
}

export const taskApiService = new TaskApiService()