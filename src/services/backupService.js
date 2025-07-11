// 备份服务 - 封装备份相关的业务逻辑
import { storageService } from './storageService'
import { dateService } from './dateService'

class BackupService {
  constructor() {
    this.BACKUP_STORAGE_KEY = 'calendar-backups'
    this.MAX_AUTO_BACKUPS = 10
  }

  // 加载备份列表
  async loadBackups() {
    try {
      const backups = storageService.getItem(this.BACKUP_STORAGE_KEY) || []
      // 按时间戳降序排序（最新的在前面）
      return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    } catch (error) {
      console.error('Failed to load backups:', error)
      return []
    }
  }

  // 保存备份列表
  async saveBackups(backups) {
    try {
      storageService.setItem(this.BACKUP_STORAGE_KEY, backups)
      return true
    } catch (error) {
      console.error('Failed to save backups:', error)
      throw new Error('保存备份失败')
    }
  }

  // 创建备份
  async createBackup(tasks, type = 'manual', name = '') {
    try {
      const timestamp = new Date().toISOString()
      const backup = {
        id: this.generateBackupId(),
        name: name || this.generateBackupName(type, timestamp),
        type, // 'manual' | 'auto'
        timestamp,
        taskCount: tasks.length,
        data: JSON.parse(JSON.stringify(tasks)), // 深拷贝
        size: JSON.stringify(tasks).length,
        version: '1.0'
      }
      
      return backup
    } catch (error) {
      console.error('Failed to create backup:', error)
      throw new Error('创建备份失败')
    }
  }

  // 自动备份
  async autoBackup(tasks) {
    try {
      const backups = await this.loadBackups()
      const autoBackups = backups.filter(backup => backup.type === 'auto')
      
      // 检查是否需要创建新的自动备份
      const lastAutoBackup = autoBackups[0]
      const now = new Date()
      
      if (!lastAutoBackup || this.shouldCreateAutoBackup(lastAutoBackup.timestamp, now)) {
        const backup = await this.createBackup(tasks, 'auto')
        backups.unshift(backup)
        
        // 清理旧的自动备份
        await this.cleanupAutoBackups(backups)
        
        await this.saveBackups(backups)
        return backup
      }
      
      return null
    } catch (error) {
      console.error('Auto backup failed:', error)
      return null
    }
  }

  // 判断是否应该创建自动备份
  shouldCreateAutoBackup(lastBackupTimestamp, currentTime) {
    const lastBackup = new Date(lastBackupTimestamp)
    const timeDiff = currentTime - lastBackup
    const hoursDiff = timeDiff / (1000 * 60 * 60)
    
    // 如果距离上次备份超过1小时，则创建新备份
    return hoursDiff >= 1
  }

  // 清理旧的自动备份
  async cleanupAutoBackups(backups) {
    const autoBackups = backups.filter(backup => backup.type === 'auto')
    
    if (autoBackups.length > this.MAX_AUTO_BACKUPS) {
      // 保留最新的备份，删除旧的
      const toDelete = autoBackups.slice(this.MAX_AUTO_BACKUPS)
      
      toDelete.forEach(backup => {
        const index = backups.findIndex(b => b.id === backup.id)
        if (index !== -1) {
          backups.splice(index, 1)
        }
      })
    }
  }

  // 恢复备份
  async restoreBackup(backup) {
    try {
      if (!backup || !backup.data) {
        throw new Error('备份数据无效')
      }
      
      // 验证备份数据格式
      if (!Array.isArray(backup.data)) {
        throw new Error('备份数据格式错误')
      }
      
      return backup.data
    } catch (error) {
      console.error('Failed to restore backup:', error)
      throw new Error('恢复备份失败: ' + error.message)
    }
  }

  // 导出备份
  async exportBackup(backup) {
    try {
      const exportData = {
        ...backup,
        exportedAt: new Date().toISOString(),
        exportVersion: '1.0'
      }
      
      const dataStr = JSON.stringify(exportData, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      
      // 创建下载链接
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `calendar-backup-${backup.name}-${dateService.formatDate(new Date())}.json`
      
      // 触发下载
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // 清理URL对象
      URL.revokeObjectURL(url)
      
      return true
    } catch (error) {
      console.error('Failed to export backup:', error)
      throw new Error('导出备份失败')
    }
  }

  // 导入备份
  async importBackup(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('请选择备份文件'))
        return
      }
      
      if (!file.name.endsWith('.json')) {
        reject(new Error('请选择有效的JSON备份文件'))
        return
      }
      
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target.result)
          
          // 验证导入数据格式
          if (!this.validateBackupData(importData)) {
            reject(new Error('备份文件格式无效'))
            return
          }
          
          // 创建新的备份记录
          const backup = {
            ...importData,
            id: this.generateBackupId(), // 生成新的ID
            type: 'imported',
            importedAt: new Date().toISOString()
          }
          
          resolve(backup)
        } catch (error) {
          reject(new Error('解析备份文件失败: ' + error.message))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('读取备份文件失败'))
      }
      
      reader.readAsText(file)
    })
  }

  // 验证备份数据格式
  validateBackupData(data) {
    if (!data || typeof data !== 'object') {
      return false
    }
    
    // 检查必要字段
    const requiredFields = ['id', 'name', 'timestamp', 'data']
    for (const field of requiredFields) {
      if (!(field in data)) {
        return false
      }
    }
    
    // 检查数据字段是否为数组
    if (!Array.isArray(data.data)) {
      return false
    }
    
    return true
  }

  // 导出所有数据
  async exportAllData(tasks, backups) {
    try {
      const exportData = {
        tasks,
        backups,
        exportedAt: new Date().toISOString(),
        version: '1.0',
        type: 'full-export'
      }
      
      const dataStr = JSON.stringify(exportData, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `calendar-full-export-${dateService.formatDate(new Date())}.json`
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
      
      return true
    } catch (error) {
      console.error('Failed to export all data:', error)
      throw new Error('导出数据失败')
    }
  }

  // 导入所有数据
  async importAllData(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('请选择数据文件'))
        return
      }
      
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target.result)
          
          // 验证导入数据格式
          if (!this.validateFullExportData(importData)) {
            reject(new Error('数据文件格式无效'))
            return
          }
          
          resolve({
            tasks: importData.tasks || [],
            backups: importData.backups || []
          })
        } catch (error) {
          reject(new Error('解析数据文件失败: ' + error.message))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('读取数据文件失败'))
      }
      
      reader.readAsText(file)
    })
  }

  // 验证完整导出数据格式
  validateFullExportData(data) {
    if (!data || typeof data !== 'object') {
      return false
    }
    
    // 检查必要字段
    if (!('tasks' in data) || !('backups' in data)) {
      return false
    }
    
    // 检查数据类型
    if (!Array.isArray(data.tasks) || !Array.isArray(data.backups)) {
      return false
    }
    
    return true
  }

  // 生成备份ID
  generateBackupId() {
    return 'backup_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  // 生成备份名称
  generateBackupName(type, timestamp) {
    const date = new Date(timestamp)
    const dateStr = dateService.formatDateTime(date)
    
    switch (type) {
      case 'auto':
        return `自动备份 ${dateStr}`
      case 'manual':
        return `手动备份 ${dateStr}`
      case 'imported':
        return `导入备份 ${dateStr}`
      default:
        return `备份 ${dateStr}`
    }
  }

  // 获取备份统计信息
  getBackupStats(backups) {
    const total = backups.length
    const manual = backups.filter(b => b.type === 'manual').length
    const auto = backups.filter(b => b.type === 'auto').length
    const imported = backups.filter(b => b.type === 'imported').length
    
    const totalSize = backups.reduce((sum, backup) => sum + (backup.size || 0), 0)
    const latestBackup = backups.length > 0 ? backups[0] : null
    
    return {
      total,
      manual,
      auto,
      imported,
      totalSize,
      latestBackup
    }
  }
}

export const backupService = new BackupService()