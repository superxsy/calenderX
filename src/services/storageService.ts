// 存储服务 - 封装本地存储相关的操作
class StorageService {
  constructor() {
    this.storage = localStorage
    this.prefix = 'calendarX_'
  }

  // 获取完整的存储键名
  getKey(key: string) {
    return this.prefix + key
  }

  // 设置存储项
  setItem(key: string, value: any) {
    try {
      const serializedValue = JSON.stringify(value)
      this.storage.setItem(this.getKey(key), serializedValue)
      return true
    } catch (error) {
      console.error('Failed to set storage item:', error)
      
      // 如果是存储空间不足的错误，尝试清理
      if (error.name === 'QuotaExceededError') {
        this.cleanup()
        // 再次尝试存储
        try {
          const serializedValue = JSON.stringify(value)
          this.storage.setItem(this.getKey(key), serializedValue)
          return true
        } catch (retryError) {
          console.error('Failed to set storage item after cleanup:', retryError)
          throw new Error('存储空间不足，请清理浏览器数据')
        }
      }
      
      throw error
    }
  }

  // 获取存储项
  getItem(key: string) {
    try {
      const item = this.storage.getItem(this.getKey(key))
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error('Failed to get storage item:', error)
      return null
    }
  }

  // 删除存储项
  removeItem(key: string) {
    try {
      this.storage.removeItem(this.getKey(key))
      return true
    } catch (error) {
      console.error('Failed to remove storage item:', error)
      return false
    }
  }

  // 检查存储项是否存在
  hasItem(key: string) {
    return this.storage.getItem(this.getKey(key)) !== null
  }

  // 获取所有应用相关的存储键
  getAllKeys() {
    const keys = []
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i)
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length))
      }
    }
    return keys
  }

  // 获取所有应用相关的存储项
  getAllItems() {
    const items = {}
    const keys = this.getAllKeys()
    
    keys.forEach(key => {
      items[key] = this.getItem(key)
    })
    
    return items
  }

  // 清空所有应用相关的存储项
  clear() {
    const keys = this.getAllKeys()
    keys.forEach(key => {
      this.removeItem(key)
    })
    return true
  }

  // 获取存储使用情况
  getStorageInfo() {
    try {
      const items = this.getAllItems()
      let totalSize = 0
      const itemSizes = {}
      
      Object.keys(items).forEach(key => {
        const size = JSON.stringify(items[key]).length
        itemSizes[key] = size
        totalSize += size
      })
      
      // 估算可用空间（大多数浏览器限制为5-10MB）
      const estimatedQuota = 5 * 1024 * 1024 // 5MB
      const usagePercentage = (totalSize / estimatedQuota) * 100
      
      return {
        totalSize,
        itemSizes,
        estimatedQuota,
        usagePercentage: Math.min(usagePercentage, 100),
        itemCount: Object.keys(items).length
      }
    } catch (error) {
      console.error('Failed to get storage info:', error)
      return {
        totalSize: 0,
        itemSizes: {},
        estimatedQuota: 0,
        usagePercentage: 0,
        itemCount: 0
      }
    }
  }

  // 清理存储空间
  cleanup() {
    try {
      const storageInfo = this.getStorageInfo()
      
      // 如果使用率超过80%，进行清理
      if (storageInfo.usagePercentage > 80) {
        console.warn('Storage usage is high, performing cleanup...')
        
        // 清理策略：删除最大的非关键存储项
        const sortedItems = Object.entries(storageInfo.itemSizes)
          .sort(([,a], [,b]) => b - a)
        
        // 保护关键数据
        const protectedKeys = ['calendar-tasks', 'calendar-backups']
        
        for (const [key, size] of sortedItems) {
          if (!protectedKeys.includes(key) && size > 1000) {
            this.removeItem(key)
            console.log(`Cleaned up storage item: ${key} (${size} bytes)`)
            
            // 重新检查使用率
            const newInfo = this.getStorageInfo()
            if (newInfo.usagePercentage < 70) {
              break
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to cleanup storage:', error)
    }
  }

  // 导出存储数据
  exportData() {
    try {
      const data = this.getAllItems()
      return {
        data,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      }
    } catch (error) {
      console.error('Failed to export storage data:', error)
      throw new Error('导出数据失败')
    }
  }

  // 导入存储数据
  importData(importData, options = {}) {
    try {
      const { overwrite = false, backup = true } = options
      
      // 如果需要备份，先备份当前数据
      let backupData = null
      if (backup) {
        backupData = this.exportData()
      }
      
      // 验证导入数据格式
      if (!importData || !importData.data) {
        throw new Error('导入数据格式无效')
      }
      
      const { data } = importData
      
      // 导入数据
      Object.keys(data).forEach(key => {
        if (overwrite || !this.hasItem(key)) {
          this.setItem(key, data[key])
        }
      })
      
      return {
        success: true,
        importedKeys: Object.keys(data),
        backupData
      }
    } catch (error) {
      console.error('Failed to import storage data:', error)
      throw new Error('导入数据失败: ' + error.message)
    }
  }

  // 检查浏览器存储支持
  isSupported() {
    try {
      const testKey = '__storage_test__'
      this.storage.setItem(testKey, 'test')
      this.storage.removeItem(testKey)
      return true
    } catch (error) {
      return false
    }
  }

  // 监听存储变化（跨标签页同步）
  onStorageChange(callback) {
    const handleStorageChange = (event) => {
      if (event.key && event.key.startsWith(this.prefix)) {
        const key = event.key.substring(this.prefix.length)
        const oldValue = event.oldValue ? JSON.parse(event.oldValue) : null
        const newValue = event.newValue ? JSON.parse(event.newValue) : null
        
        callback({
          key,
          oldValue,
          newValue,
          storageArea: event.storageArea
        })
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // 返回取消监听的函数
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }

  // 批量操作
  batch(operations) {
    const results = []
    const errors = []
    
    operations.forEach((operation, index) => {
      try {
        const { type, key, value } = operation
        let result
        
        switch (type) {
          case 'set':
            result = this.setItem(key, value)
            break
          case 'get':
            result = this.getItem(key)
            break
          case 'remove':
            result = this.removeItem(key)
            break
          default:
            throw new Error(`Unknown operation type: ${type}`)
        }
        
        results.push({ index, success: true, result })
      } catch (error) {
        errors.push({ index, error: error.message })
        results.push({ index, success: false, error: error.message })
      }
    })
    
    return {
      results,
      errors,
      successCount: results.filter(r => r.success).length,
      errorCount: errors.length
    }
  }
}

export const storageService = new StorageService()