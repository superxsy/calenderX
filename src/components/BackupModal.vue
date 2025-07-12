<template>
  <!-- 备份管理模态框 -->
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>数据管理</h3>
        <button @click="closeModal" class="close-btn">×</button>
      </div>
      
      <div class="modal-body">
        <!-- 备份设置 -->
        <div class="section">
          <h4>自动备份设置</h4>
          <div class="backup-settings">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="backupSettings.enabled"
                @change="saveBackupSettings"
              >
              <span>启用自动备份</span>
            </label>
            
            <div v-if="backupSettings.enabled" class="backup-interval">
              <label for="backupInterval">备份间隔:</label>
              <select 
                id="backupInterval"
                v-model="backupSettings.interval"
                @change="saveBackupSettings"
                class="form-select"
              >
                <option value="5">5分钟</option>
                <option value="10">10分钟</option>
                <option value="30">30分钟</option>
                <option value="60">1小时</option>
              </select>
            </div>
            
            <div v-if="backupSettings.enabled" class="backup-status">
              <span class="status-text">
                {{ autoBackupStatus }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- 手动备份 -->
        <div class="section">
          <h4>手动备份</h4>
          <div class="manual-backup">
            <p class="section-description">创建当前数据的备份副本</p>
            <button @click="createManualBackup" class="btn btn-primary" :disabled="isCreatingBackup">
              <span v-if="isCreatingBackup">创建中...</span>
              <span v-else>创建备份</span>
            </button>
          </div>
        </div>
        
        <!-- 备份历史 -->
        <div class="section">
          <h4>备份历史</h4>
          <div class="backup-history">
            <div v-if="backupHistory.length === 0" class="empty-state">
              <p>暂无备份记录</p>
            </div>
            
            <div v-else class="backup-list">
              <div 
                v-for="backup in paginatedBackups" 
                :key="backup.id" 
                class="backup-item"
              >
                <div class="backup-info">
                  <div class="backup-name">{{ backup.name }}</div>
                  <div class="backup-meta">
                    <span class="backup-date">{{ formatBackupDate(backup.timestamp) }}</span>
                    <span class="backup-size">{{ formatBackupSize(backup.size) }}</span>
                    <span class="backup-count">{{ backup.taskCount }} 个任务</span>
                  </div>
                </div>
                
                <div class="backup-actions">
                  <button 
                    @click="restoreBackup(backup)"
                    class="btn btn-sm btn-secondary"
                    :disabled="isRestoring"
                    title="恢复此备份"
                  >
                    恢复
                  </button>
                  <button 
                    @click="downloadBackup(backup)"
                    class="btn btn-sm btn-outline"
                    title="下载备份文件"
                  >
                    下载
                  </button>
                  <button 
                    @click="deleteBackup(backup)"
                    class="btn btn-sm btn-danger"
                    title="删除备份"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
            
            <!-- 分页控制 -->
            <div v-if="totalPages > 1" class="pagination">
              <button
                @click="currentPage = Math.max(1, currentPage - 1)"
                :disabled="currentPage === 1"
                class="page-btn"
              >
                上一页
              </button>
              
              <span class="page-info">
                第 {{ currentPage }} 页，共 {{ totalPages }} 页
              </span>
              
              <button
                @click="currentPage = Math.min(totalPages, currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="page-btn"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
        
        <!-- 数据导入导出 -->
        <div class="section">
          <h4>数据导入导出</h4>
          <div class="import-export">
            <div class="export-section">
              <p class="section-description">导出所有任务数据为 JSON 文件</p>
              <button @click="exportTasks" class="btn btn-outline">
                导出数据
              </button>
            </div>
            
            <div class="import-section">
              <p class="section-description">从 JSON 文件导入任务数据</p>
              <div class="import-controls">
                <input 
                  ref="fileInput"
                  type="file" 
                  accept=".json"
                  @change="handleFileSelect"
                  class="file-input"
                  style="display: none;"
                >
                <button @click="$refs.fileInput.click()" class="btn btn-outline">
                  选择文件
                </button>
                
                <div v-if="selectedFile" class="file-info">
                  <span class="file-name">{{ selectedFile.name }}</span>
                  <div class="import-options">
                    <label class="radio-option">
                      <input type="radio" v-model="importMode" value="replace">
                      <span>替换现有数据</span>
                    </label>
                    <label class="radio-option">
                      <input type="radio" v-model="importMode" value="append">
                      <span>追加到现有数据</span>
                    </label>
                  </div>
                  <button @click="importTasks" class="btn btn-primary" :disabled="isImporting">
                    <span v-if="isImporting">导入中...</span>
                    <span v-else>开始导入</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 存储信息 -->
        <div class="section">
          <h4>存储信息</h4>
          <div class="storage-info">
            <div class="storage-item">
              <span class="storage-label">已用存储:</span>
              <span class="storage-value">{{ formatStorageSize(storageUsage.used) }}</span>
            </div>
            <div class="storage-item">
              <span class="storage-label">总存储:</span>
              <span class="storage-value">{{ formatStorageSize(storageUsage.total) }}</span>
            </div>
            <div class="storage-item">
              <span class="storage-label">使用率:</span>
              <span class="storage-value" :class="{ 'text-warning': storageUsage.percentage > 80 }">
                {{ storageUsage.percentage.toFixed(1) }}%
              </span>
            </div>
            
            <div class="storage-bar">
              <div 
                class="storage-progress" 
                :style="{ width: storageUsage.percentage + '%' }"
                :class="{ 'warning': storageUsage.percentage > 80 }"
              ></div>
            </div>
            
            <button 
              v-if="storageUsage.percentage > 80"
              @click="cleanupStorage"
              class="btn btn-warning btn-sm"
              :disabled="isCleaning"
            >
              <span v-if="isCleaning">清理中...</span>
              <span v-else>清理存储</span>
            </button>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button @click="closeModal" class="btn btn-secondary">
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { useBackupStore } from '../store/modules/backupStore'
import { useTaskStore } from '../store/modules/taskStore'
import { storageService } from '../services/storageService'
import { dateService } from '../services/dateService'

export default {
  name: 'BackupModal',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'backup-created', 'backup-restored', 'data-imported'],
  setup() {
    const backupStore = useBackupStore()
    const taskStore = useTaskStore()
    
    return {
      backupStore,
      taskStore
    }
  },
  data() {
    return {
      currentPage: 1,
      itemsPerPage: 5,
      selectedFile: null,
      importMode: 'append',
      isCreatingBackup: false,
      isRestoring: false,
      isImporting: false,
      isCleaning: false
    }
  },
  computed: {
    backupSettings() {
      return {
        enabled: this.backupStore.autoBackupEnabled,
        interval: this.backupStore.autoBackupInterval
      }
    },
    
    backupHistory() {
      return this.backupStore.formattedBackups
    },
    
    paginatedBackups() {
      const start = (this.currentPage - 1) * this.itemsPerPage
      const end = start + this.itemsPerPage
      return this.backupHistory.slice(start, end)
    },
    
    totalPages() {
      return Math.ceil(this.backupHistory.length / this.itemsPerPage)
    },
    
    autoBackupStatus() {
      if (!this.backupSettings.enabled) {
        return '自动备份已禁用'
      }
      
      const lastBackup = this.backupHistory[0]
      if (!lastBackup) {
        return '尚未创建备份'
      }
      
      const timeDiff = Date.now() - lastBackup.timestamp
      const minutesDiff = Math.floor(timeDiff / (1000 * 60))
      
      if (minutesDiff < this.backupSettings.interval) {
        const nextBackup = this.backupSettings.interval - minutesDiff
        return `下次备份: ${nextBackup} 分钟后`
      } else {
        return '备份已就绪'
      }
    },
    
    storageUsage() {
      const info = storageService.getStorageInfo()
      return {
        used: info.totalSize,
        total: info.estimatedQuota,
        percentage: info.usagePercentage
      }
    }
  },
  watch: {
    isVisible(newVal) {
      if (newVal) {
        this.loadBackupHistory()
        this.currentPage = 1
      }
    }
  },
  methods: {
    closeModal() {
      this.$emit('close')
    },
    
    saveBackupSettings() {
      this.backupStore.setAutoBackup(
        this.backupSettings.enabled,
        this.backupSettings.interval
      )
    },
    
    async createManualBackup() {
      this.isCreatingBackup = true
      
      try {
        const tasks = this.taskStore.tasks
        const backup = await this.backupStore.createBackup(tasks, 'manual')
        this.$emit('backup-created', backup)
        this.loadBackupHistory()
      } catch (error) {
        console.error('创建备份失败:', error)
        // 这里可以显示错误消息
      } finally {
        this.isCreatingBackup = false
      }
    },
    
    async restoreBackup(backup) {
      if (!confirm(`确定要恢复备份 "${backup.name}" 吗？这将替换当前所有数据。`)) {
        return
      }
      
      this.isRestoring = true
      
      try {
        await this.backupStore.restoreBackup(backup.id)
        this.$emit('backup-restored', backup)
        this.closeModal()
      } catch (error) {
        console.error('恢复备份失败:', error)
        // 这里可以显示错误消息
      } finally {
        this.isRestoring = false
      }
    },
    
    downloadBackup(backup) {
      this.backupStore.exportBackup(backup.id)
    },
    
    async deleteBackup(backup) {
      if (!confirm(`确定要删除备份 "${backup.name}" 吗？`)) {
        return
      }
      
      try {
        await this.backupStore.deleteBackup(backup.id)
        this.loadBackupHistory()
        
        // 如果当前页没有数据了，回到上一页
        if (this.paginatedBackups.length === 0 && this.currentPage > 1) {
          this.currentPage--
        }
      } catch (error) {
        console.error('删除备份失败:', error)
      }
    },
    
    exportTasks() {
      this.taskStore.exportTasks()
    },
    
    handleFileSelect(event) {
      const file = event.target.files[0]
      if (file && file.type === 'application/json') {
        this.selectedFile = file
      } else {
        alert('请选择有效的 JSON 文件')
        event.target.value = ''
      }
    },
    
    async importTasks() {
      if (!this.selectedFile) {
        return
      }
      
      this.isImporting = true
      
      try {
        const reader = new FileReader()
        reader.onload = async (e) => {
          try {
            const data = JSON.parse(e.target.result)
            await this.taskStore.importTasks(data, this.importMode)
            this.$emit('data-imported', { mode: this.importMode, count: data.length })
            this.selectedFile = null
            this.$refs.fileInput.value = ''
          } catch (error) {
            console.error('导入数据失败:', error)
            alert('导入失败：文件格式不正确')
          } finally {
            this.isImporting = false
          }
        }
        reader.readAsText(this.selectedFile)
      } catch (error) {
        console.error('读取文件失败:', error)
        this.isImporting = false
      }
    },
    
    async cleanupStorage() {
      if (!confirm('确定要清理存储空间吗？这将删除一些非关键数据。')) {
        return
      }
      
      this.isCleaning = true
      
      try {
        storageService.cleanup()
        // 重新加载存储信息
        this.$forceUpdate()
      } catch (error) {
        console.error('清理存储失败:', error)
      } finally {
        this.isCleaning = false
      }
    },
    
    loadBackupHistory() {
      this.backupStore.loadBackups()
    },
    
    formatBackupDate(timestamp) {
      return dateService.formatDateTime(new Date(timestamp))
    },
    
    formatBackupSize(size) {
      if (size < 1024) {
        return size + ' B'
      } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(1) + ' KB'
      } else {
        return (size / (1024 * 1024)).toFixed(1) + ' MB'
      }
    },
    
    formatStorageSize(bytes) {
      if (bytes < 1024) {
        return bytes + ' B'
      } else if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(1) + ' KB'
      } else {
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
      }
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.5em;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.close-btn:hover {
  background: #f0f0f0;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #eee;
  text-align: right;
}

.section {
  margin-bottom: 32px;
}

.section:last-child {
  margin-bottom: 0;
}

.section h4 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 1.2em;
  font-weight: 600;
}

.section-description {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

.backup-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;
}

.backup-interval {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 24px;
}

.backup-status {
  margin-left: 24px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 14px;
  color: #666;
}

.status-text {
  font-style: italic;
}

.form-select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 14px;
}

.backup-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.backup-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #eee;
  border-radius: 6px;
  background: #f8f9fa;
}

.backup-info {
  flex: 1;
}

.backup-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.backup-meta {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #666;
}

.backup-actions {
  display: flex;
  gap: 8px;
}

.import-export {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.import-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-info {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f8f9fa;
}

.file-name {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
}

.import-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 8px 0;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 14px;
}

.storage-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.storage-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.storage-label {
  color: #666;
}

.storage-value {
  font-weight: 600;
  color: #333;
}

.storage-value.text-warning {
  color: #f39c12;
}

.storage-bar {
  width: 100%;
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
  margin: 8px 0;
}

.storage-progress {
  height: 100%;
  background: #3498db;
  transition: width 0.3s;
}

.storage-progress.warning {
  background: #f39c12;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.page-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.empty-state p {
  margin: 0;
  font-size: 16px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c0392b;
}

.btn-warning {
  background: #f39c12;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #e67e22;
}

.btn-outline {
  background: white;
  color: #3498db;
  border: 1px solid #3498db;
}

.btn-outline:hover {
  background: #3498db;
  color: white;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
  min-width: 50px;
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 10px;
  }
  
  .modal-content {
    max-height: 95vh;
  }
  
  .import-export {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .backup-item {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .backup-actions {
    justify-content: center;
  }
  
  .backup-meta {
    flex-direction: column;
    gap: 4px;
  }
}
</style>