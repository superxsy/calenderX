// 任务管理 Store
import { defineStore } from 'pinia'
import { taskService } from '../../services/taskService'
import { taskApiService } from '../../services/taskApiService'
import { useAuthStore } from './authStore'

export const useTaskStore = defineStore('task', {
  state: () => ({
    tasks: [],
    loading: false,
    error: null,
    searchTerm: '',
    usedColors: [],
    statusSymbols: {
      pending: '⏳',
      'in-progress': '▶',
      completed: '✔',
      overdue: '⚠'
    },
    // API模式相关状态
    apiMode: true, // 默认使用API模式
    syncStatus: {
      isOnline: true,
      hasPending: false,
      pendingCount: 0
    },
    lastSyncTime: null
  }),

  getters: {
    // 过滤后的任务列表
    filteredTasks: (state) => {
      if (!state.searchTerm) {
        return state.tasks
      }
      const searchTermLower = state.searchTerm.toLowerCase()
      return state.tasks.filter(task => {
        const titleMatch = task.title && task.title.toLowerCase().includes(searchTermLower)
        const descriptionMatch = task.description && task.description.toLowerCase().includes(searchTermLower)
        const tagMatch = task.tag && task.tag.toLowerCase().includes(searchTermLower)
        return titleMatch || descriptionMatch || tagMatch
      })
    },

    // 根据日期获取任务
    getTasksByDate: (state) => (date) => {
      return state.tasks.filter(task => task.date === date)
    },

    // 获取任务统计信息
    taskStats: (state) => {
      const total = state.tasks.length
      const completed = state.tasks.filter(task => task.completed).length
      const pending = state.tasks.filter(task => task.status === 'pending').length
      const overdue = state.tasks.filter(task => task.status === 'overdue').length
      
      return {
        total,
        completed,
        pending,
        overdue,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
      }
    }
  },

  actions: {
    // 加载任务
    async loadTasks() {
      this.loading = true
      this.error = null
      try {
        const authStore = useAuthStore()
        
        if (this.apiMode && authStore.isLoggedIn) {
          // API模式：从后端加载任务
          const result = await taskApiService.getTasks()
          if (result.success) {
            this.tasks = result.tasks
            this.updateSyncStatus()
            this.lastSyncTime = new Date().toISOString()
            
            if (result.source === 'local') {
              console.warn(result.message)
            }
          } else {
            throw new Error(result.error || '加载任务失败')
          }
        } else {
          // 本地模式：从本地存储加载任务
          this.tasks = await taskService.loadTasks()
        }
        
        this.extractColorsFromTasks()
      } catch (error) {
        this.error = error.message
        console.error('Failed to load tasks:', error)
        
        // 如果API失败，尝试从本地加载
        if (this.apiMode) {
          try {
            this.tasks = await taskService.loadTasks()
            this.extractColorsFromTasks()
            console.warn('API加载失败，已从本地存储加载任务')
          } catch (localError) {
            console.error('本地加载也失败:', localError)
          }
        }
      } finally {
        this.loading = false
      }
    },

    // 保存任务
    async saveTasks() {
      try {
        await taskService.saveTasks(this.tasks)
      } catch (error) {
        this.error = error.message
        console.error('Failed to save tasks:', error)
        throw error
      }
    },

    // 添加任务
    async addTask(taskData) {
      try {
        const authStore = useAuthStore()
        let newTasks = []
        
        if (this.apiMode && authStore.isLoggedIn) {
          // API模式：通过后端创建任务
          const result = await taskApiService.createTask(taskData)
          if (result.success) {
            newTasks = [result.task]
            this.tasks.push(result.task)
            this.updateSyncStatus()
            
            if (result.source === 'local') {
              console.warn(result.message)
            }
          } else {
            throw new Error(result.error || '创建任务失败')
          }
        } else {
          // 本地模式：使用本地服务创建任务
          newTasks = await taskService.createTasksWithRepeat(taskData)
          this.tasks.push(...newTasks)
          await this.saveTasks()
        }
        
        // 记录使用的颜色
        if (taskData.tag && taskData.tagColor) {
          this.addToUsedColors(taskData.tagColor)
        }
        
        // 刷新日历视图以显示新添加的任务
        const { useCalendarStore } = await import('./calendarStore')
        const calendarStore = useCalendarStore()
        calendarStore.renderCurrentView()
        
        return newTasks
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    // 更新任务
    async updateTask(taskId, updates, editOption = 'single') {
      try {
        const authStore = useAuthStore()
        const task = this.tasks.find(task => task.id === taskId)
        if (!task) {
          throw new Error('任务不存在')
        }

        if (this.apiMode && authStore.isLoggedIn) {
          // API模式：通过后端更新任务
          const result = await taskApiService.updateTask(taskId, updates)
          if (result.success) {
            const index = this.tasks.findIndex(t => t.id === taskId)
            if (index !== -1) {
              this.tasks[index] = result.task
            }
            this.updateSyncStatus()
            
            if (result.source === 'local') {
              console.warn(result.message)
            }
          } else {
            throw new Error(result.error || '更新任务失败')
          }
        } else {
          // 本地模式：使用本地服务更新任务
          // 检查是否从非重复任务改为重复任务
          const wasNonRepeating = !task.repeat || task.repeat === 'none'
          const isNowRepeating = updates.repeat && updates.repeat !== 'none'
          
          if (wasNonRepeating && isNowRepeating) {
            // 删除原任务
            const taskIndex = this.tasks.findIndex(t => t.id === taskId)
            if (taskIndex !== -1) {
              this.tasks.splice(taskIndex, 1)
            }
            
            // 创建新的重复任务系列
            const newTaskData = { ...task, ...updates }
            const newTasks = await taskService.createTasksWithRepeat(newTaskData)
            this.tasks.push(...newTasks)
          } else if (task.repeatId && editOption === 'all') {
            // 如果是重复任务且选择编辑所有
            const repeatTasks = this.tasks.filter(t => t.repeatId === task.repeatId)
            repeatTasks.forEach(repeatTask => {
              const index = this.tasks.findIndex(t => t.id === repeatTask.id)
              if (index !== -1) {
                // 保留每个任务的特定属性（如日期、完成状态）
                const preservedProps = {
                  id: repeatTask.id,
                  date: repeatTask.date,
                  completed: repeatTask.completed,
                  status: repeatTask.status
                }
                this.tasks[index] = { 
                  ...this.tasks[index], 
                  ...updates, 
                  ...preservedProps
                }
              }
            })
          } else {
            // 只更新单个任务
            const index = this.tasks.findIndex(task => task.id === taskId)
            if (index !== -1) {
              this.tasks[index] = { ...this.tasks[index], ...updates }
            }
          }
          
          await this.saveTasks()
        }
        
        // 刷新日历视图以显示更新后的任务
        const { useCalendarStore } = await import('./calendarStore')
        const calendarStore = useCalendarStore()
        calendarStore.renderCurrentView()
      } catch (error) {
        this.error = error.message
        console.error('更新任务失败:', error)
        throw error
      }
    },

    // 删除任务
    async deleteTask(taskId, deleteOption = 'single') {
      try {
        const authStore = useAuthStore()
        const task = this.tasks.find(task => task.id === taskId)
        if (!task) {
          throw new Error('任务不存在')
        }

        if (this.apiMode && authStore.isLoggedIn) {
          // API模式：通过后端删除任务
          const result = await taskApiService.deleteTask(taskId)
          if (result.success) {
            // 只有API删除成功后才从本地数组中删除
            const index = this.tasks.findIndex(t => t.id === taskId)
            if (index !== -1) {
              this.tasks.splice(index, 1)
            }
            this.updateSyncStatus()
            
            if (result.source === 'local') {
              console.warn(result.message)
            }
          } else {
            // 如果是404错误（任务不存在），也从本地数组中删除
            if (result.error && result.error.includes('Task not found')) {
              const index = this.tasks.findIndex(t => t.id === taskId)
              if (index !== -1) {
                this.tasks.splice(index, 1)
                console.warn('任务在服务器上不存在，已从本地删除')
              }
            } else {
              throw new Error(result.error || '删除任务失败')
            }
          }
        } else {
          // 本地模式：使用本地服务删除任务
          // 如果是重复任务且选择删除所有
          if (task.repeatId && deleteOption === 'all') {
            // 删除所有具有相同 repeatId 的任务
            for (let i = this.tasks.length - 1; i >= 0; i--) {
              if (this.tasks[i].repeatId === task.repeatId) {
                this.tasks.splice(i, 1)
              }
            }
          } else {
            // 只删除单个任务
            const index = this.tasks.findIndex(task => task.id === taskId)
            if (index !== -1) {
              this.tasks.splice(index, 1)
            }
          }
          
          await this.saveTasks()
        }
        
        // 刷新日历视图
        const { useCalendarStore } = await import('./calendarStore')
        const calendarStore = useCalendarStore()
        calendarStore.renderCurrentView()
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    // 更新任务状态
    async updateTaskStatus(task) {
      try {
        const updates = { 
          completed: task.completed,
          status: task.completed ? 'completed' : (task.status || 'pending')
        }
        await this.updateTask(task.id, updates)
        
        // 刷新日历视图以显示更新后的任务状态
        const { useCalendarStore } = await import('./calendarStore')
        const calendarStore = useCalendarStore()
        calendarStore.renderCurrentView()
      } catch (error) {
        this.error = error.message
        console.error('更新任务状态失败:', error)
        throw error
      }
    },

    // 设置搜索关键词
    setSearchTerm(term) {
      this.searchTerm = term
    },

    // 添加到已使用颜色
    addToUsedColors(color) {
      if (!this.usedColors.includes(color)) {
        this.usedColors.unshift(color)
        // 限制历史颜色数量
        if (this.usedColors.length > 12) {
          this.usedColors = this.usedColors.slice(0, 12)
        }
      }
    },

    // 从现有任务中提取颜色
    extractColorsFromTasks() {
      const colors = new Set()
      this.tasks.forEach(task => {
        if (task.tagColor) {
          colors.add(task.tagColor)
        }
      })
      this.usedColors = Array.from(colors).slice(0, 12)
    },

    // 清除错误
    clearError() {
      this.error = null
    },

    // 获取所有任务（用于导出）
    getAllTasks() {
      return this.tasks
    },

    // 导入任务
    async importTasks(importedTasks, replace = false) {
      try {
        if (replace) {
          this.tasks = [...importedTasks]
        } else {
          // 合并任务，避免ID冲突
          const existingIds = new Set(this.tasks.map(task => task.id))
          const newTasks = importedTasks.filter(task => !existingIds.has(task.id))
          this.tasks.push(...newTasks)
        }
        
        this.extractColorsFromTasks()
        await this.saveTasks()
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    // 恢复任务（从备份）
    async restoreTasks(restoredTasks) {
      try {
        console.log('taskStore.restoreTasks 开始执行，接收到的数据:', restoredTasks)
        
        if (!Array.isArray(restoredTasks)) {
          throw new Error('恢复数据必须是数组格式')
        }
        
        // 完全替换当前任务
        this.tasks = [...restoredTasks]
        console.log('任务已替换，当前任务数量:', this.tasks.length)
        
        // 重新提取颜色
        this.extractColorsFromTasks()
        
        // 保存到本地存储
        await this.saveTasks()
        console.log('任务已保存到本地存储')
        
        // 刷新日历视图
        const { useCalendarStore } = await import('./calendarStore')
        const calendarStore = useCalendarStore()
        calendarStore.renderCurrentView()
        console.log('日历视图已刷新')
      } catch (error) {
        this.error = error.message
        console.error('恢复任务失败:', error)
        throw error
      }
    },

    async exportTasks() {
      try {
        const { dateService } = await import('../../services/dateService')
        const tasks = this.getAllTasks()
        const dataStr = JSON.stringify(tasks, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `calendar-tasks-${dateService.formatDate(new Date())}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('导出任务失败:', error)
        throw error
      }
    },

    // API模式相关方法
    // 更新同步状态
    updateSyncStatus() {
      this.syncStatus.isOnline = navigator.onLine
      this.syncStatus.hasPending = taskApiService.hasPendingSync()
      this.syncStatus.pendingCount = taskApiService.getPendingSyncCount()
    },

    // 切换API模式
    toggleApiMode(enabled) {
      this.apiMode = enabled
      if (enabled) {
        // 切换到API模式时，尝试同步离线数据
        this.syncOfflineData()
      }
    },

    // 同步离线数据
    async syncOfflineData() {
      const authStore = useAuthStore()
      if (!authStore.isLoggedIn) {
        return
      }

      try {
        const result = await taskApiService.syncPendingChanges()
        if (result.success) {
          this.updateSyncStatus()
          this.lastSyncTime = new Date().toISOString()
          console.log('离线数据同步成功')
        } else {
          console.error('离线数据同步失败:', result.error)
        }
      } catch (error) {
        console.error('同步过程中发生错误:', error)
      }
    },

    // 强制刷新任务（从服务器重新加载）
    async refreshTasks() {
      if (this.apiMode) {
        await this.loadTasks()
      }
    },

    // 检查网络状态并更新同步状态
    checkNetworkStatus() {
      this.updateSyncStatus()
      
      // 如果网络恢复且有待同步数据，自动同步
      if (navigator.onLine && this.syncStatus.hasPending) {
        this.syncOfflineData()
      }
    }
  }
})