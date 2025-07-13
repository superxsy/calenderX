// 任务管理 Store
import { defineStore } from 'pinia'
import { taskService } from '../../services/taskService'

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
    }
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
        this.tasks = await taskService.loadTasks()
        this.extractColorsFromTasks()
      } catch (error) {
        this.error = error.message
        console.error('Failed to load tasks:', error)
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
        const newTasks = await taskService.createTasksWithRepeat(taskData)
        this.tasks.push(...newTasks)
        
        // 记录使用的颜色
        if (taskData.tag && taskData.tagColor) {
          this.addToUsedColors(taskData.tagColor)
        }
        
        await this.saveTasks()
        
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
        const task = this.tasks.find(task => task.id === taskId)
        if (!task) {
          throw new Error('任务不存在')
        }

        // 如果是重复任务且选择编辑所有
        if (task.repeatId && editOption === 'all') {
          // 更新所有具有相同 repeatId 的任务
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
        const task = this.tasks.find(task => task.id === taskId)
        if (!task) {
          throw new Error('任务不存在')
        }

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
    }
  }
})