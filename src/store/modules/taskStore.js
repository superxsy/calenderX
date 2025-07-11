// 任务管理 Store
import { defineStore } from 'pinia'
import { taskService } from '../../services/taskService'

export const useTaskStore = defineStore('task', {
  state: () => ({
    tasks: [],
    loading: false,
    error: null,
    searchTerm: '',
    taskTags: {},
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
        return newTasks
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    // 更新任务
    async updateTask(taskId, updates) {
      try {
        const index = this.tasks.findIndex(task => task.id === taskId)
        if (index !== -1) {
          this.tasks[index] = { ...this.tasks[index], ...updates }
          await this.saveTasks()
        }
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    // 删除任务
    async deleteTask(taskId) {
      try {
        const index = this.tasks.findIndex(task => task.id === taskId)
        if (index !== -1) {
          this.tasks.splice(index, 1)
          await this.saveTasks()
        }
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    // 更新任务状态
    async updateTaskStatus(task) {
      try {
        await this.updateTask(task.id, { 
          completed: task.completed,
          status: task.completed ? 'completed' : task.status
        })
      } catch (error) {
        this.error = error.message
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
    }
  }
})