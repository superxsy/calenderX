// 日期服务 - 封装日期相关的工具函数
class DateService {
  constructor() {
    this.weekNames = ['日', '一', '二', '三', '四', '五', '六']
    this.monthNames = [
      '一月', '二月', '三月', '四月', '五月', '六月',
      '七月', '八月', '九月', '十月', '十一月', '十二月'
    ]
  }

  // 格式化日期为 YYYY-MM-DD
  formatDate(date: any) {
    if (!date) return ''
    
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''
    
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    
    return `${year}-${month}-${day}`
  }

  // 格式化时间为 HH:MM
  formatTime(date: any) {
    if (!date) return ''
    
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''
    
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    
    return `${hours}:${minutes}`
  }

  // 格式化日期时间为 YYYY-MM-DD HH:MM
  formatDateTime(date: any) {
    if (!date) return ''
    
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''
    
    return `${this.formatDate(d)} ${this.formatTime(d)}`
  }

  // 格式化为中文日期显示
  formatChineseDate(date: any) {
    if (!date) return ''
    
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''
    
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const day = d.getDate()
    
    return `${year}年${month}月${day}日`
  }

  // 格式化为相对时间（如：今天、昨天、明天）
  formatRelativeDate(date: any) {
    if (!date) return ''
    
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''
    
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const dateStr = this.formatDate(d)
    const todayStr = this.formatDate(today)
    const yesterdayStr = this.formatDate(yesterday)
    const tomorrowStr = this.formatDate(tomorrow)
    
    if (dateStr === todayStr) {
      return '今天'
    } else if (dateStr === yesterdayStr) {
      return '昨天'
    } else if (dateStr === tomorrowStr) {
      return '明天'
    } else {
      return this.formatChineseDate(d)
    }
  }

  // 解析日期字符串
  parseDate(dateString: string) {
    if (!dateString) return null
    
    const date = new Date(dateString)
    return isNaN(date.getTime()) ? null : date
  }

  // 获取今天的日期字符串
  getToday() {
    return this.formatDate(new Date())
  }

  // 获取昨天的日期字符串
  getYesterday() {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return this.formatDate(yesterday)
  }

  // 获取明天的日期字符串
  getTomorrow() {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return this.formatDate(tomorrow)
  }

  // 判断是否为今天
  isToday(date: any) {
    if (!date) return false
    
    const d = new Date(date)
    const today = new Date()
    
    return d.getFullYear() === today.getFullYear() &&
           d.getMonth() === today.getMonth() &&
           d.getDate() === today.getDate()
  }

  // 判断是否为过去的日期
  isPast(date: any) {
    if (!date) return false
    
    const d = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return d < today
  }

  // 判断是否为未来的日期
  isFuture(date: any) {
    if (!date) return false
    
    const d = new Date(date)
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    
    return d > today
  }

  // 判断是否为工作日（周一到周五）
  isWeekday(date: any) {
    if (!date) return false
    
    const d = new Date(date)
    const dayOfWeek = d.getDay()
    
    return dayOfWeek >= 1 && dayOfWeek <= 5
  }

  // 判断是否为周末
  isWeekend(date) {
    if (!date) return false
    
    const d = new Date(date)
    const dayOfWeek = d.getDay()
    
    return dayOfWeek === 0 || dayOfWeek === 6
  }

  // 获取星期几的中文名称
  getWeekName(date) {
    if (!date) return ''
    
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''
    
    return this.weekNames[d.getDay()]
  }

  // 获取月份的中文名称
  getMonthName(date) {
    if (!date) return ''
    
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''
    
    return this.monthNames[d.getMonth()]
  }

  // 获取月份的第一天
  getFirstDayOfMonth(date) {
    if (!date) return null
    
    const d = new Date(date)
    if (isNaN(d.getTime())) return null
    
    return new Date(d.getFullYear(), d.getMonth(), 1)
  }

  // 获取月份的最后一天
  getLastDayOfMonth(date) {
    if (!date) return null
    
    const d = new Date(date)
    if (isNaN(d.getTime())) return null
    
    return new Date(d.getFullYear(), d.getMonth() + 1, 0)
  }

  // 获取月份的天数
  getDaysInMonth(date) {
    const lastDay = this.getLastDayOfMonth(date)
    return lastDay ? lastDay.getDate() : 0
  }

  // 获取周的第一天（周日）
  getFirstDayOfWeek(date) {
    if (!date) return null
    
    const d = new Date(date)
    if (isNaN(d.getTime())) return null
    
    const dayOfWeek = d.getDay()
    const firstDay = new Date(d)
    firstDay.setDate(d.getDate() - dayOfWeek)
    
    return firstDay
  }

  // 获取周的最后一天（周六）
  getLastDayOfWeek(date) {
    if (!date) return null
    
    const d = new Date(date)
    if (isNaN(d.getTime())) return null
    
    const dayOfWeek = d.getDay()
    const lastDay = new Date(d)
    lastDay.setDate(d.getDate() + (6 - dayOfWeek))
    
    return lastDay
  }

  // 添加天数
  addDays(date, days) {
    if (!date) return null
    
    const d = new Date(date)
    if (isNaN(d.getTime())) return null
    
    d.setDate(d.getDate() + days)
    return d
  }

  // 添加月份
  addMonths(date, months) {
    if (!date) return null
    
    const d = new Date(date)
    if (isNaN(d.getTime())) return null
    
    d.setMonth(d.getMonth() + months)
    return d
  }

  // 添加年份
  addYears(date, years) {
    if (!date) return null
    
    const d = new Date(date)
    if (isNaN(d.getTime())) return null
    
    d.setFullYear(d.getFullYear() + years)
    return d
  }

  // 计算两个日期之间的天数差
  getDaysDifference(date1, date2) {
    if (!date1 || !date2) return 0
    
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0
    
    const timeDiff = Math.abs(d2.getTime() - d1.getTime())
    return Math.ceil(timeDiff / (1000 * 3600 * 24))
  }

  // 生成日期范围
  getDateRange(startDate, endDate) {
    if (!startDate || !endDate) return []
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return []
    
    const dates = []
    const current = new Date(start)
    
    while (current <= end) {
      dates.push(this.formatDate(current))
      current.setDate(current.getDate() + 1)
    }
    
    return dates
  }

  // 获取月份的所有日期
  getMonthDates(date) {
    if (!date) return []
    
    const d = new Date(date)
    if (isNaN(d.getTime())) return []
    
    const firstDay = this.getFirstDayOfMonth(d)
    const lastDay = this.getLastDayOfMonth(d)
    
    return this.getDateRange(firstDay, lastDay)
  }

  // 获取周的所有日期
  getWeekDates(date) {
    if (!date) return []
    
    const d = new Date(date)
    if (isNaN(d.getTime())) return []
    
    const firstDay = this.getFirstDayOfWeek(d)
    const lastDay = this.getLastDayOfWeek(d)
    
    return this.getDateRange(firstDay, lastDay)
  }

  // 验证日期格式
  isValidDate(dateString) {
    if (!dateString) return false
    
    // 检查格式 YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(dateString)) return false
    
    const date = new Date(dateString)
    return !isNaN(date.getTime()) && this.formatDate(date) === dateString
  }

  // 验证时间格式
  isValidTime(timeString) {
    if (!timeString) return false
    
    // 检查格式 HH:MM
    const timeRegex = /^\d{2}:\d{2}$/
    if (!timeRegex.test(timeString)) return false
    
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
  }

  // 比较时间（返回 -1, 0, 1）
  compareTime(time1, time2) {
    if (!time1 || !time2) return 0
    
    const [h1, m1] = time1.split(':').map(Number)
    const [h2, m2] = time2.split(':').map(Number)
    
    const minutes1 = h1 * 60 + m1
    const minutes2 = h2 * 60 + m2
    
    if (minutes1 < minutes2) return -1
    if (minutes1 > minutes2) return 1
    return 0
  }

  // 获取当前时间字符串
  getCurrentTime() {
    return this.formatTime(new Date())
  }

  // 获取当前日期时间字符串
  getCurrentDateTime() {
    return this.formatDateTime(new Date())
  }
}

export const dateService = new DateService()