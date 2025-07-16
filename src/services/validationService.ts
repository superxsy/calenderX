// 验证服务 - 封装数据验证相关的逻辑
import { dateService } from './dateService'

class ValidationService {
  constructor() {
    this.rules = {
      required: (value, message = '此字段为必填项') => {
        if (value === null || value === undefined || value === '') {
          return { isValid: false, message }
        }
        return { isValid: true }
      },
      
      minLength: (value, min, message) => {
        if (typeof value !== 'string' || value.length < min) {
          return { 
            isValid: false, 
            message: message || `最少需要${min}个字符` 
          }
        }
        return { isValid: true }
      },
      
      maxLength: (value, max, message) => {
        if (typeof value === 'string' && value.length > max) {
          return { 
            isValid: false, 
            message: message || `最多允许${max}个字符` 
          }
        }
        return { isValid: true }
      },
      
      date: (value, message = '请输入有效的日期格式') => {
        if (!dateService.isValidDate(value)) {
          return { isValid: false, message }
        }
        return { isValid: true }
      },
      
      time: (value, message = '请输入有效的时间格式') => {
        if (value && !dateService.isValidTime(value)) {
          return { isValid: false, message }
        }
        return { isValid: true }
      },
      
      email: (value, message = '请输入有效的邮箱地址') => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (value && !emailRegex.test(value)) {
          return { isValid: false, message }
        }
        return { isValid: true }
      },
      
      url: (value, message = '请输入有效的URL地址') => {
        try {
          if (value) {
            new URL(value)
          }
          return { isValid: true }
        } catch {
          return { isValid: false, message }
        }
      },
      
      color: (value, message = '请输入有效的颜色值') => {
        const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
        if (value && !colorRegex.test(value)) {
          return { isValid: false, message }
        }
        return { isValid: true }
      }
    }
  }

  // 验证单个字段
  validateField(value, rules) {
    const errors = []
    
    for (const rule of rules) {
      const { type, params = [], message } = rule
      
      if (this.rules[type]) {
        const result = this.rules[type](value, ...params, message)
        if (!result.isValid) {
          errors.push(result.message)
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // 验证任务数据
  validateTask(taskData) {
    const errors = []
    const { title, date, startTime, endTime, tag, tagColor } = taskData
    
    // 验证标题
    const titleValidation = this.validateField(title, [
      { type: 'required', message: '任务标题不能为空' },
      { type: 'maxLength', params: [100], message: '任务标题不能超过100个字符' }
    ])
    if (!titleValidation.isValid) {
      errors.push(...titleValidation.errors)
    }
    
    // 验证日期
    const dateValidation = this.validateField(date, [
      { type: 'required', message: '任务日期不能为空' },
      { type: 'date', message: '请输入有效的日期格式（YYYY-MM-DD）' }
    ])
    if (!dateValidation.isValid) {
      errors.push(...dateValidation.errors)
    }
    
    // 验证开始时间
    if (startTime) {
      const startTimeValidation = this.validateField(startTime, [
        { type: 'time', message: '请输入有效的开始时间格式（HH:MM）' }
      ])
      if (!startTimeValidation.isValid) {
        errors.push(...startTimeValidation.errors)
      }
    }
    
    // 验证结束时间
    if (endTime) {
      const endTimeValidation = this.validateField(endTime, [
        { type: 'time', message: '请输入有效的结束时间格式（HH:MM）' }
      ])
      if (!endTimeValidation.isValid) {
        errors.push(...endTimeValidation.errors)
      }
      
      // 验证时间逻辑
      if (startTime && endTime) {
        if (dateService.compareTime(startTime, endTime) >= 0) {
          errors.push('结束时间必须晚于开始时间')
        }
      }
    }
    
    // 验证标签
    if (tag) {
      const tagValidation = this.validateField(tag, [
        { type: 'maxLength', params: [20], message: '标签名称不能超过20个字符' }
      ])
      if (!tagValidation.isValid) {
        errors.push(...tagValidation.errors)
      }
    }
    
    // 验证标签颜色
    if (tagColor) {
      const colorValidation = this.validateField(tagColor, [
        { type: 'color', message: '请输入有效的颜色值（如：#FF0000）' }
      ])
      if (!colorValidation.isValid) {
        errors.push(...colorValidation.errors)
      }
    }
    
    // 验证描述长度
    if (taskData.description) {
      const descValidation = this.validateField(taskData.description, [
        { type: 'maxLength', params: [500], message: '任务描述不能超过500个字符' }
      ])
      if (!descValidation.isValid) {
        errors.push(...descValidation.errors)
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // 验证备份数据
  validateBackup(backupData) {
    const errors = []
    const { name, data } = backupData
    
    // 验证备份名称
    if (name) {
      const nameValidation = this.validateField(name, [
        { type: 'maxLength', params: [50], message: '备份名称不能超过50个字符' }
      ])
      if (!nameValidation.isValid) {
        errors.push(...nameValidation.errors)
      }
    }
    
    // 验证备份数据
    if (!Array.isArray(data)) {
      errors.push('备份数据格式错误，应为数组格式')
    } else {
      // 验证每个任务数据
      data.forEach((task, index) => {
        const taskValidation = this.validateTask(task)
        if (!taskValidation.isValid) {
          errors.push(`第${index + 1}个任务数据无效: ${taskValidation.errors.join(', ')}`)
        }
      })
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // 验证搜索关键词
  validateSearchTerm(searchTerm) {
    const errors = []
    
    if (searchTerm) {
      const searchValidation = this.validateField(searchTerm, [
        { type: 'maxLength', params: [50], message: '搜索关键词不能超过50个字符' }
      ])
      if (!searchValidation.isValid) {
        errors.push(...searchValidation.errors)
      }
      
      // 检查是否包含特殊字符（可选）
      const specialCharsRegex = /[<>"'&]/
      if (specialCharsRegex.test(searchTerm)) {
        errors.push('搜索关键词不能包含特殊字符')
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // 验证文件
  validateFile(file, options = {}) {
    const errors = []
    const {
      maxSize = 5 * 1024 * 1024, // 5MB
      allowedTypes = ['application/json'],
      allowedExtensions = ['.json']
    } = options
    
    if (!file) {
      errors.push('请选择文件')
      return { isValid: false, errors }
    }
    
    // 验证文件大小
    if (file.size > maxSize) {
      errors.push(`文件大小不能超过${Math.round(maxSize / 1024 / 1024)}MB`)
    }
    
    // 验证文件类型
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      errors.push(`不支持的文件类型，请选择${allowedTypes.join('、')}格式的文件`)
    }
    
    // 验证文件扩展名
    if (allowedExtensions.length > 0) {
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
      if (!allowedExtensions.includes(fileExtension)) {
        errors.push(`不支持的文件扩展名，请选择${allowedExtensions.join('、')}格式的文件`)
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // 验证表单数据
  validateForm(formData, schema) {
    const errors = {}
    let isValid = true
    
    Object.keys(schema).forEach(fieldName => {
      const fieldRules = schema[fieldName]
      const fieldValue = formData[fieldName]
      
      const fieldValidation = this.validateField(fieldValue, fieldRules)
      if (!fieldValidation.isValid) {
        errors[fieldName] = fieldValidation.errors
        isValid = false
      }
    })
    
    return {
      isValid,
      errors,
      fieldErrors: errors
    }
  }

  // 自定义验证规则
  addRule(name, validator) {
    if (typeof validator === 'function') {
      this.rules[name] = validator
    }
  }

  // 移除验证规则
  removeRule(name) {
    delete this.rules[name]
  }

  // 获取所有验证规则
  getRules() {
    return Object.keys(this.rules)
  }

  // 清理和标准化数据
  sanitizeTaskData(taskData) {
    const sanitized = { ...taskData }
    
    // 清理字符串字段
    if (sanitized.title) {
      sanitized.title = sanitized.title.trim()
    }
    if (sanitized.description) {
      sanitized.description = sanitized.description.trim()
    }
    if (sanitized.tag) {
      sanitized.tag = sanitized.tag.trim()
    }
    
    // 标准化颜色值
    if (sanitized.tagColor) {
      sanitized.tagColor = sanitized.tagColor.toUpperCase()
    }
    
    // 确保布尔值
    sanitized.completed = Boolean(sanitized.completed)
    
    // 移除空值
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] === '' || sanitized[key] === null || sanitized[key] === undefined) {
        delete sanitized[key]
      }
    })
    
    return sanitized
  }

  // 验证并清理任务数据
  validateAndSanitizeTask(taskData) {
    const sanitized = this.sanitizeTaskData(taskData)
    const validation = this.validateTask(sanitized)
    
    return {
      ...validation,
      data: sanitized
    }
  }
}

export const validationService = new ValidationService()