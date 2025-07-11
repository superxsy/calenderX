// 任务服务 - 封装任务相关的业务逻辑
import { storageService } from './storageService'
import { dateService } from './dateService'
import { validationService } from './validationService'

class TaskService {
  constructor() {
    this.STORAGE_KEY = 'calendar-tasks'
  }

  // 加载任务
  async loadTasks() {
    try {
      // 优先从本地存储加载
      let tasks = storageService.getItem(this.STORAGE_KEY)
      
      if (!tasks || tasks.length === 0) {
        // 如果本地存储为空，尝试从JSON文件加载
        tasks = await this.loadTasksFromFile()
        if (tasks && tasks.length > 0) {
          // 保存到本地存储
          storageService.setItem(this.STORAGE_KEY, tasks)
        }
      }
      
      return tasks || []
    } catch (error) {
      console.error('Failed to load tasks:', error)
      return []
    }
  }

  // 从JSON文件加载任务
  async loadTasksFromFile() {
    try {
      const response = await fetch('/calenderX/calendar-tasks.json')
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.warn('Failed to load tasks from file:', error)
    }
    return []
  }

  // 保存任务
  async saveTasks(tasks) {
    try {
      storageService.setItem(this.STORAGE_KEY, tasks)
      return true
    } catch (error) {
      console.error('Failed to save tasks:', error)
      throw new Error('保存任务失败')
    }
  }

  // 创建任务（包含重复任务逻辑）
  async createTasksWithRepeat(taskData) {
    const { repeat, ...baseTask } = taskData
    const tasks = []
    
    // 验证任务数据
    const validation = validationService.validateTask(taskData)
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '))
    }
    
    // 生成任务ID
    const baseId = this.generateTaskId()
    
    if (!repeat || repeat === 'none') {
      // 单次任务
      const task = {
        ...baseTask,
        id: baseId,
        status: this.calculateTaskStatus(baseTask),
        repeat: 'none',
        repeatId: null
      }
      tasks.push(task)
    } else {
      // 重复任务
      const repeatId = this.generateRepeatId()
      const startDate = new Date(baseTask.date)
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + 6) // 生成半年内的重复任务
      
      let currentDate = new Date(startDate)
      let taskIndex = 0
      
      while (currentDate <= endDate) {
        if (this.shouldCreateTaskOnDate(currentDate, startDate, repeat)) {
          const dateString = dateService.formatDate(currentDate)
          const task = {
            ...baseTask,
            id: `${baseId}_${taskIndex}`,
            date: dateString,
            status: this.calculateTaskStatus({ ...baseTask, date: dateString }),
            repeat,
            repeatId
          }
          tasks.push(task)
          taskIndex++
        }
        
        // 移动到下一天
        currentDate.setDate(currentDate.getDate() + 1)
      }
    }
    
    return tasks
  }

  // 更新任务
  async updateTask(taskId, updates, tasks) {
    const index = tasks.findIndex(task => task.id === taskId)
    if (index === -1) {
      throw new Error('任务不存在')
    }
    
    const updatedTask = { ...tasks[index], ...updates }
    
    // 重新计算状态
    if (updates.date || updates.startTime || updates.endTime) {
      updatedTask.status = this.calculateTaskStatus(updatedTask)
    }
    
    tasks[index] = updatedTask
    return updatedTask
  }

  // 更新重复任务
  async updateRepeatTasks(repeatId, updates, tasks, updateAll = false) {
    const repeatTasks = tasks.filter(task => task.repeatId === repeatId)
    
    if (updateAll) {
      // 更新所有重复任务
      repeatTasks.forEach(task => {
        const index = tasks.findIndex(t => t.id === task.id)
        if (index !== -1) {
          tasks[index] = {
            ...tasks[index],
            ...updates,
            status: this.calculateTaskStatus({ ...tasks[index], ...updates })
          }
        }
      })
    }
    
    return repeatTasks
  }

  // 删除任务
  async deleteTask(taskId, tasks) {
    const index = tasks.findIndex(task => task.id === taskId)
    if (index !== -1) {
      tasks.splice(index, 1)
      return true
    }
    return false
  }

  // 删除重复任务
  async deleteRepeatTasks(repeatId, tasks, deleteAll = false) {
    if (deleteAll) {
      // 删除所有重复任务
      for (let i = tasks.length - 1; i >= 0; i--) {
        if (tasks[i].repeatId === repeatId) {
          tasks.splice(i, 1)
        }
      }
    }
    
    return tasks
  }

  // 计算任务状态
  calculateTaskStatus(task) {
    if (task.completed) {
      return 'completed'
    }
    
    const now = new Date()
    const taskDate = new Date(task.date)
    
    // 如果有结束时间，使用结束时间判断
    if (task.endTime) {
      const [hours, minutes] = task.endTime.split(':').map(Number)
      const taskEndDateTime = new Date(taskDate)
      taskEndDateTime.setHours(hours, minutes, 0, 0)
      
      if (now > taskEndDateTime) {
        return 'overdue'
      }
    } else {
      // 如果没有结束时间，使用日期判断
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      
      if (taskDate < today) {
        return 'overdue'
      }
    }
    
    // 如果有开始时间，判断是否已开始
    if (task.startTime) {
      const [hours, minutes] = task.startTime.split(':').map(Number)
      const taskStartDateTime = new Date(taskDate)
      taskStartDateTime.setHours(hours, minutes, 0, 0)
      
      if (now >= taskStartDateTime) {
        return 'in-progress'
      }
    }
    
    return 'pending'
  }

  // 判断是否应该在指定日期创建任务
  shouldCreateTaskOnDate(currentDate, originalDate, repeatType) {
    switch (repeatType) {
      case 'daily':
        return true
      
      case 'weekdays':
        const dayOfWeek = currentDate.getDay()
        return dayOfWeek >= 1 && dayOfWeek <= 5 // 周一到周五
      
      case 'weekly':
        return currentDate.getDay() === originalDate.getDay()
      
      case 'monthly':
        return currentDate.getDate() === originalDate.getDate()
      
      default:
        return false
    }
  }

  // 生成任务ID
  generateTaskId() {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  // 生成重复任务ID
  generateRepeatId() {
    return 'repeat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  // 获取任务统计
  getTaskStats(tasks) {
    const total = tasks.length
    const completed = tasks.filter(task => task.completed).length
    const pending = tasks.filter(task => task.status === 'pending').length
    const inProgress = tasks.filter(task => task.status === 'in-progress').length
    const overdue = tasks.filter(task => task.status === 'overdue').length
    
    return {
      total,
      completed,
      pending,
      inProgress,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  }

  // 按日期分组任务
  groupTasksByDate(tasks) {
    const grouped = {}
    tasks.forEach(task => {
      if (!grouped[task.date]) {
        grouped[task.date] = []
      }
      grouped[task.date].push(task)
    })
    return grouped
  }

  // 按标签分组任务
  groupTasksByTag(tasks) {
    const grouped = {}
    tasks.forEach(task => {
      const tag = task.tag || '无标签'
      if (!grouped[tag]) {
        grouped[tag] = []
      }
      grouped[tag].push(task)
    })
    return grouped
  }

  // 搜索任务
  searchTasks(tasks, searchTerm) {
    if (!searchTerm) {
      return tasks
    }
    
    const searchTermLower = searchTerm.toLowerCase()
    return tasks.filter(task => {
      const titleMatch = task.title && task.title.toLowerCase().includes(searchTermLower)
      const descriptionMatch = task.description && task.description.toLowerCase().includes(searchTermLower)
      const tagMatch = task.tag && task.tag.toLowerCase().includes(searchTermLower)
      return titleMatch || descriptionMatch || tagMatch
    })
  }
}

export const taskService = new TaskService()