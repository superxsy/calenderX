// 备份管理 Store
import { defineStore } from 'pinia'
import { backupService } from '../../services/backupService'

export const useBackupStore = defineStore('backup', {
  state: () => ({
    backups: [],
    autoBackupEnabled: true,
    autoBackupInterval: 60, // 分钟
    maxBackups: 10,
    loading: false,
    error: null,
    lastBackupTime: null
  }),

  getters: {
    // 格式化的备份列表
    formattedBackups: (state) => {
      return state.backups.map(backup => ({
        ...backup,
        formattedDate: new Date(backup.timestamp).toLocaleString('zh-CN'),
        size: backup.data ? JSON.stringify(backup.data).length : 0
      }))
    },

    // 最新备份信息
    latestBackup: (state) => {
      return state.backups.length > 0 ? state.backups[0] : null
    },

    // 备份统计
    backupStats: (state) => {
      const totalSize = state.backups.reduce((sum, backup) => {
        return sum + (backup.data ? JSON.stringify(backup.data).length : 0)
      }, 0)
      
      return {
        count: state.backups.length,
        totalSize,
        lastBackup: state.lastBackupTime
      }
    }
  },

  actions: {
    // 加载备份列表
    async loadBackups() {
      this.loading = true
      this.error = null
      try {
        this.backups = await backupService.loadBackups()
        if (this.backups.length > 0) {
          this.lastBackupTime = this.backups[0].timestamp
        }
      } catch (error) {
        this.error = error.message
        console.error('Failed to load backups:', error)
      } finally {
        this.loading = false
      }
    },

    // 创建备份
    async createBackup(tasks, type = 'manual', name = '') {
      this.loading = true
      this.error = null
      try {
        const backup = await backupService.createBackup(tasks, type, name)
        this.backups.unshift(backup)
        
        // 限制备份数量
        if (this.backups.length > this.maxBackups) {
          this.backups = this.backups.slice(0, this.maxBackups)
        }
        
        this.lastBackupTime = backup.timestamp
        await this.saveBackups()
        return backup
      } catch (error) {
        this.error = error.message
        console.error('Failed to create backup:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 恢复备份
    async restoreBackup(backupId) {
      try {
        console.log('backupStore.restoreBackup 开始，backupId:', backupId)
        console.log('当前备份列表:', this.backups.map(b => ({ id: b.id, name: b.name, taskCount: b.taskCount })))
        
        const backup = this.backups.find(b => b.id === backupId)
        if (!backup) {
          console.error('备份不存在，backupId:', backupId)
          throw new Error('备份不存在')
        }
        
        console.log('找到备份:', {
          id: backup.id,
          name: backup.name,
          type: backup.type,
          taskCount: backup.taskCount,
          dataExists: !!backup.data,
          dataType: typeof backup.data,
          isArray: Array.isArray(backup.data),
          dataLength: backup.data ? backup.data.length : 0
        })
        
        const result = await backupService.restoreBackup(backup)
        console.log('backupService.restoreBackup 返回结果:', {
          result,
          type: typeof result,
          isArray: Array.isArray(result),
          length: result ? result.length : 0
        })
        
        return result
      } catch (error) {
        this.error = error.message
        console.error('Failed to restore backup:', error)
        throw error
      }
    },

    // 删除备份
    async deleteBackup(backupId) {
      try {
        const index = this.backups.findIndex(b => b.id === backupId)
        if (index !== -1) {
          this.backups.splice(index, 1)
          await this.saveBackups()
        }
      } catch (error) {
        this.error = error.message
        console.error('Failed to delete backup:', error)
        throw error
      }
    },

    // 保存备份列表
    async saveBackups() {
      try {
        await backupService.saveBackups(this.backups)
      } catch (error) {
        this.error = error.message
        console.error('Failed to save backups:', error)
        throw error
      }
    },

    // 导出备份
    async exportBackup(backupId) {
      try {
        const backup = this.backups.find(b => b.id === backupId)
        if (!backup) {
          throw new Error('备份不存在')
        }
        
        return await backupService.exportBackup(backup)
      } catch (error) {
        this.error = error.message
        console.error('Failed to export backup:', error)
        throw error
      }
    },

    // 导入备份
    async importBackup(file) {
      this.loading = true
      this.error = null
      try {
        const backup = await backupService.importBackup(file)
        this.backups.unshift(backup)
        
        // 限制备份数量
        if (this.backups.length > this.maxBackups) {
          this.backups = this.backups.slice(0, this.maxBackups)
        }
        
        await this.saveBackups()
        return backup
      } catch (error) {
        this.error = error.message
        console.error('Failed to import backup:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 设置自动备份
    setAutoBackup(enabled, interval = 60) {
      this.autoBackupEnabled = enabled
      this.autoBackupInterval = interval
    },

    // 设置最大备份数量
    setMaxBackups(max) {
      this.maxBackups = max
      // 如果当前备份数量超过限制，删除多余的
      if (this.backups.length > max) {
        this.backups = this.backups.slice(0, max)
      }
    },

    // 清理旧备份
    async cleanupOldBackups() {
      try {
        const autoBackups = this.backups.filter(b => b.type === 'auto')
        if (autoBackups.length > this.maxBackups) {
          // 保留最新的备份，删除旧的
          const toDelete = autoBackups.slice(this.maxBackups)
          toDelete.forEach(backup => {
            const index = this.backups.findIndex(b => b.id === backup.id)
            if (index !== -1) {
              this.backups.splice(index, 1)
            }
          })
          await this.saveBackups()
        }
      } catch (error) {
        console.error('Failed to cleanup old backups:', error)
      }
    },

    // 清除错误
    clearError() {
      this.error = null
    }
  }
})