// 颜色处理工具函数

/**
 * 智能文字颜色计算方法
 * @param {string} backgroundColor - 背景颜色（十六进制）
 * @returns {string} 适合的文字颜色
 */
export function getTextColor(backgroundColor) {
  if (!backgroundColor) return '#000000'
  
  // 移除 # 号
  let hex = backgroundColor.replace('#', '')
  
  // 处理3位十六进制颜色（如 #000 -> #000000）
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  }
  
  // 确保是6位十六进制
  if (hex.length !== 6) {
    return '#000000' // 默认返回黑色
  }
  
  // 将十六进制转换为 RGB
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // 计算相对亮度 (使用 WCAG 标准)
  const brightness = (0.299 * r + 0.587 * g + 0.114 * b)
  
  // 如果亮度大于 128，使用黑色文字；否则使用白色文字
  return brightness > 128 ? '#000000' : '#ffffff'
}

/**
 * 根据背景颜色获取合适的字体粗细
 * @param {string} backgroundColor - 背景颜色（十六进制）
 * @returns {string} 字体粗细值
 */
export function getFontWeight(backgroundColor) {
  if (!backgroundColor) return 'normal'
  
  // 移除 # 号并确保是6位十六进制
  let hex = backgroundColor.replace('#', '')
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('')
  }
  
  if (hex.length !== 6 || !/^[0-9A-Fa-f]+$/.test(hex)) {
    return 'normal'
  }
  
  // 转换为 RGB
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // 计算亮度
  const brightness = (0.299 * r + 0.587 * g + 0.114 * b)
  
  // 浅色背景使用更粗的字体，深色背景使用较细的字体
  return brightness > 128 ? '900' : '100'
}

/**
 * 根据背景颜色获取字体大小调整
 * @param {string} backgroundColor - 背景颜色（十六进制）
 * @returns {string} 字体大小值
 */
export function getFontSize(backgroundColor) {
  if (!backgroundColor) return '1em'
  
  // 移除 # 号并确保是6位十六进制
  let hex = backgroundColor.replace('#', '')
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('')
  }
  
  if (hex.length !== 6 || !/^[0-9A-Fa-f]+$/.test(hex)) {
    return '1em'
  }
  
  // 转换为 RGB
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // 计算亮度
  const brightness = (0.299 * r + 0.587 * g + 0.114 * b)

  // 浅色背景稍微增大字体，深色背景保持正常
  return brightness > 128 ? '1em' : '0.9em'
}

/**
 * 根据背景颜色获取文字阴影效果
 * @param {string} backgroundColor - 背景颜色（十六进制）
 * @returns {string} 文字阴影值
 */
export function getTextShadow(backgroundColor) {
  if (!backgroundColor) return 'none'
  
  // 移除 # 号并确保是6位十六进制
  let hex = backgroundColor.replace('#', '')
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('')
  }
  
  if (hex.length !== 6 || !/^[0-9A-Fa-f]+$/.test(hex)) {
    return 'none'
  }
  
  // 转换为 RGB
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // 计算亮度
  const brightness = (0.299 * r + 0.587 * g + 0.114 * b)
  
  // 浅色背景给黑字添加轻微阴影增强视觉效果
  return brightness > 128 ? '0 0 1px rgba(0,0,0,0.3)' : 'none'
}

/**
 * 获取任务样式对象
 * @param {Object} task - 任务对象
 * @returns {Object} 样式对象
 */
export function getTaskStyle(task) {
  const backgroundColor = task.tagColor || '#3498db'
  return {
    backgroundColor,
    color: getTextColor(backgroundColor),
    fontWeight: getFontWeight(backgroundColor),
    fontSize: getFontSize(backgroundColor),
    textShadow: getTextShadow(backgroundColor)
  }
}

export default {
  getTextColor,
  getFontWeight,
  getFontSize,
  getTextShadow,
  getTaskStyle
}