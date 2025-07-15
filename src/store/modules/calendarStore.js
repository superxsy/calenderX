// 日历管理 Store
import { defineStore } from 'pinia'
import { useTaskStore } from './taskStore'

export const useCalendarStore = defineStore('calendar', {
  state: () => ({
    currentDate: new Date(),
    viewMode: 'month', // 'month', 'week', 'list'
    monthDays: [],
    weekDays: []
  }),

  getters: {
    // 当前日期显示格式
    currentDateDisplay: (state) => {
      return state.currentDate.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: 'long' 
      })
    },

    // 当前年份
    currentYear: (state) => state.currentDate.getFullYear(),

    // 当前月份 (0-11)
    currentMonth: (state) => state.currentDate.getMonth(),

    // 当前日期
    currentDay: (state) => state.currentDate.getDate(),

    // 是否为今天
    isToday: (state) => (date) => {
      const today = new Date()
      const checkDate = new Date(date)
      return today.toDateString() === checkDate.toDateString()
    },

    // 获取月视图的周名称
    weekNames: () => ['一', '二', '三', '四', '五', '六', '日']
  },

  actions: {
    // 设置当前日期
    setCurrentDate(date) {
      this.currentDate = new Date(date)
      this.renderCurrentView()
    },

    // 切换视图模式
    switchView(mode) {
      this.viewMode = mode
      this.renderCurrentView()
    },

    // 导航到上一个/下一个时间段
    navigate(direction) {
      const newDate = new Date(this.currentDate)
      
      if (this.viewMode === 'month') {
        newDate.setMonth(newDate.getMonth() + direction)
      } else if (this.viewMode === 'week') {
        newDate.setDate(newDate.getDate() + (7 * direction))
      }
      
      this.currentDate = newDate
      this.renderCurrentView()
    },

    // 渲染当前视图
    renderCurrentView() {
      if (this.viewMode === 'month') {
        this.renderMonthView()
      } else if (this.viewMode === 'week') {
        this.renderWeekView()
      }
      // list 视图不需要特殊渲染
    },

    // 渲染月视图
    renderMonthView() {
      const taskStore = useTaskStore()
      const year = this.currentDate.getFullYear()
      const month = this.currentDate.getMonth()
      const firstDayOfMonth = new Date(year, month, 1)
      const lastDayOfMonth = new Date(year, month + 1, 0)
      const daysInMonth = lastDayOfMonth.getDate()
      // 调整为周一开始：周日(0)变为6，周一(1)变为0，周二(2)变为1，以此类推
      const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7

      const days = []
      
      // 添加上个月末尾的日期
      const prevMonth = new Date(year, month, 0)
      const prevMonthDays = prevMonth.getDate()
      for (let i = startDayOfWeek - 1; i >= 0; i--) {
        const date = new Date(year, month - 1, prevMonthDays - i)
        const dateString = this.formatDate(date)
        const tasksForDay = taskStore.getTasksByDate(dateString)
        
        days.push({ 
          date: dateString, 
          day: prevMonthDays - i, 
          tasks: tasksForDay,
          isEmpty: true, // 标记为非当前月份
          isToday: this.isToday(dateString)
        })
      }

      // 添加当前月份的每一天
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i)
        const dateString = this.formatDate(date)
        const tasksForDay = taskStore.getTasksByDate(dateString)
        
        days.push({ 
          date: dateString, 
          day: i, 
          tasks: tasksForDay,
          isEmpty: false,
          isToday: this.isToday(dateString)
        })
      }

      // 动态计算所需的周数，确保完整显示月份
      // 如果当前天数不足35天（5周），则使用35天
      // 如果超过35天，则使用42天（6周）
      const minCells = 35
      const maxCells = 42
      const totalCells = days.length <= minCells ? minCells : maxCells
      const remainingCells = totalCells - days.length
      
      for (let i = 1; i <= remainingCells; i++) {
        const date = new Date(year, month + 1, i)
        const dateString = this.formatDate(date)
        const tasksForDay = taskStore.getTasksByDate(dateString)
        
        days.push({ 
          date: dateString, 
          day: i, 
          tasks: tasksForDay,
          isEmpty: true, // 标记为非当前月份
          isToday: this.isToday(dateString)
        })
      }

      this.monthDays = days
    },

    // 渲染周视图
    renderWeekView() {
      const taskStore = useTaskStore()
      const year = this.currentDate.getFullYear()
      const month = this.currentDate.getMonth()
      const day = this.currentDate.getDate()
      // 调整为周一开始：周日(0)变为6，周一(1)变为0，周二(2)变为1，以此类推
      const dayOfWeek = (this.currentDate.getDay() + 6) % 7

      const week = []
      const startOfWeek = new Date(year, month, day - dayOfWeek)

      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek)
        date.setDate(date.getDate() + i)
        const dateString = this.formatDate(date)
        const tasksForDay = taskStore.getTasksByDate(dateString)
        
        week.push({ 
          date: dateString, 
          day: date.getDate(), 
          tasks: tasksForDay,
          isToday: this.isToday(dateString)
        })
      }

      this.weekDays = week
    },

    // 格式化日期为 YYYY-MM-DD
    formatDate(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },

    // 跳转到今天
    goToToday() {
      this.setCurrentDate(new Date())
    },

    // 跳转到指定日期
    goToDate(date) {
      this.setCurrentDate(new Date(date))
    }
  }
})