export const styleService = {
  getTaskStyle(task: any) {
    const backgroundColor = task.tagColor || 'var(--primary-color)'
    return {
      backgroundColor,
      color: this.getTextColor(backgroundColor),
      fontWeight: this.getFontWeight(backgroundColor),
      fontSize: this.getFontSize(backgroundColor),
      textShadow: this.getTextShadow(backgroundColor)
    }
  },

  getTaskTagStyle(task: any) {
    const backgroundColor = task.tagColor || 'var(--primary-color)'
    return {
      backgroundColor,
      color: this.getTextColor(backgroundColor)
    }
  },

  // always return white text color
  getTextColor() {
    return '#ffffff'
  },

  getFontWeight(backgroundColor: string) {
    if (!backgroundColor) return 'normal'
    let hex = backgroundColor.replace('#', '')
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('')
    }
    if (hex.length !== 6 || !/^[0-9A-Fa-f]+$/.test(hex)) {
      return 'normal'
    }
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b
    return brightness > 128 ? '900' : '100'
  },

  getFontSize() {
    return '1em'
  },

  getTextShadow(backgroundColor: string) {
    if (!backgroundColor) return 'none'
    let hex = backgroundColor.replace('#', '')
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('')
    }
    if (hex.length !== 6 || !/^[0-9A-Fa-f]+$/.test(hex)) {
      return 'none'
    }
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b
    return brightness > 128 ? '0 0 1px rgba(0,0,0,0.3)' : 'none'
  }
}
