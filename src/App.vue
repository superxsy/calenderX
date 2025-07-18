<template>
  <div id="app">
    <div class="app-container">
      <!-- 头部 -->
      <header class="header">
        <div class="header-left">
          <h1>日历任务管理器</h1>
        </div>

        <div class="header-right">
          <div class="view-toggle">
            <button @click="switchView('month')" :class="{ active: viewMode === 'month' }" class="view-btn">月</button>
            <button @click="switchView('week')" :class="{ active: viewMode === 'week' }" class="view-btn">周</button>
            <button @click="switchView('list')" :class="{ active: viewMode === 'list' }" class="view-btn">列表</button>
          </div>
          <button @click="openTaskModal()" class="add-task-btn">添加任务</button>
          <div class="data-management">
            <button @click="openBackupModal" class="backup-btn">备份管理</button>
          </div>
        </div>
      </header>

      <!-- 搜索和过滤 -->
      <div class="search-container">
        <input 
          type="text" 
          v-model="searchTerm" 
          @focus="onSearchFocus" 
          @input="onSearchInput" 
          placeholder="搜索任务..." 
          class="search-input"
        >
      </div>

      <!-- 主要内容区域 -->
      <div class="main-content">
        <!-- 日历视图组件 -->
        <CalendarView 
          v-if="viewMode !== 'list'"
          @task-click="openTaskModal"
          @day-click="onDayClick"
          @task-status-change="updateTaskStatus"
        />
        
        <!-- 任务列表组件 -->
        <TaskList 
          v-if="viewMode === 'list'"
          :search-query="searchTerm"
          @task-click="openTaskModal"
          @task-edit="openTaskModal"
          @task-delete="showDeleteConfirm"
          @task-status-change="updateTaskStatus"
        />
      </div>

      <!-- 任务模态框组件 -->
      <TaskModal
        :is-visible="showTaskModal"
        :task="selectedTask"
        :selected-date="selectedDate"
        @close="closeTaskModal"
        @save="saveTask"
        @delete="showDeleteConfirm"
      />

      <!-- 备份管理模态框组件 -->
      <BackupModal
        :is-visible="showBackupModal"
        @close="closeBackupModal"
        @show-message="showMessage"
      />



      <!-- 通用消息模态框 -->
      <div v-if="showMessageModal" class="modal-overlay">
        <div class="modal-content message-modal" :class="`message-modal-${messageModalType}`" @click.stop>
          <div class="modal-header">
            <h3>{{ messageModalTitle }}</h3>
          </div>
          <div class="modal-body">
            <div class="message-icon">
              <span v-if="messageModalType === 'success'">✓</span>
              <span v-else-if="messageModalType === 'error'">✗</span>
              <span v-else-if="messageModalType === 'confirm'">?</span>
              <span v-else>ℹ</span>
            </div>
            <p v-html="messageModalContent"></p>
          </div>
          <div class="modal-footer">
            <!-- 重复任务删除的特殊按钮布局 -->
            <template v-if="messageModalType === 'confirm' && messageModalTitle === '删除重复任务'">
              <button type="button" @click="closeMessageModal" class="btn-cancel">取消</button>
              <button type="button" @click="deleteSingleTask" class="btn-single-delete">仅删除当前任务</button>
              <button type="button" @click="deleteAllTasks" class="btn-all-delete">删除所有重复任务</button>
            </template>
            <!-- 普通确认对话框 -->
            <template v-else>
              <button v-if="messageModalType === 'confirm'" type="button" @click="cancelMessageModal" class="btn-cancel">取消</button>
              <button type="button" @click="confirmMessageModal" class="btn-primary" :class="{
                'btn-success': messageModalType === 'success',
                'btn-error': messageModalType === 'error',
                'btn-confirm': messageModalType === 'confirm'
              }">
                {{ messageModalType === 'confirm' ? '确定' : '知道了' }}
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useCalendarStore } from './store/modules/calendarStore'
import { useTaskStore } from './store/modules/taskStore'
import { useBackupStore } from './store/modules/backupStore'
import CalendarView from './components/CalendarView.vue'
import TaskList from './components/TaskList.vue'
import TaskModal from './components/TaskModal.vue'
import BackupModal from './components/BackupModal.vue'
import { dateService } from './services/dateService'
import { storageService } from './services/storageService'

export default {
  name: 'App',
  components: {
    CalendarView,
    TaskList,
    TaskModal,
    BackupModal
  },
  setup() {
    const calendarStore = useCalendarStore()
    const taskStore = useTaskStore()
    const backupStore = useBackupStore()
    
    return {
      calendarStore,
      taskStore,
      backupStore
    }
  },
  data() {
    return {
      searchTerm: '',
      showTaskModal: false,
      showBackupModal: false,
      selectedTask: null,
      selectedDate: null,
      showMessageModal: false,
      messageModalType: 'info',
      messageModalTitle: '',
      messageModalContent: '',
      messageModalCallback: null
    }
  },
  computed: {
    viewMode() {
      return this.calendarStore.viewMode
    }
  },
  methods: {
    switchView(view) {
      this.calendarStore.switchView(view)
    },
    onDayClick(date) {
      this.openTaskModal(null, date)
    },
    openTaskModal(task = null, date = null) {
      this.selectedTask = task
      this.selectedDate = date
      this.showTaskModal = true
    },
    closeTaskModal() {
      this.showTaskModal = false
      this.selectedTask = null
      this.selectedDate = null
    },
    openBackupModal() {
      this.showBackupModal = true
    },
    closeBackupModal() {
      this.showBackupModal = false
    },
    async saveTask(eventData) {
      try {
        const { task, isEditing, editOption, originalTask } = eventData
        if (isEditing) {
          await this.taskStore.updateTask(originalTask.id, task, editOption)
        } else {
          await this.taskStore.addTask(task)
        }
        this.closeTaskModal()
      } catch (error) {
        console.error('保存任务失败:', error)
        this.showMessage('error', '保存失败', '保存任务失败，请重试')
      }
    },
    async updateTaskStatus(task) {
      try {
        await this.taskStore.updateTaskStatus(task)
      } catch (error) {
        console.error('更新任务状态失败:', error)
        this.showMessage('error', '更新失败', '更新任务状态失败，请重试')
      }
    },
    async showDeleteConfirm(eventData) {
      let task
      
      // 处理来自TaskModal的删除事件
      if (eventData && eventData.task) {
        task = eventData.task
        const { deleteOption } = eventData
        try {
          await this.taskStore.deleteTask(task.id, deleteOption || 'single')
          this.showMessage('success', '删除成功', '任务已删除')
        } catch (error) {
          console.error('删除任务失败:', error)
          this.showMessage('error', '删除失败', '删除任务失败，请重试')
        }
        return
      }
      
      // 处理来自TaskList的删除事件（直接传入task对象）
      if (eventData && eventData.id) {
        task = eventData
      }
      
      if (!task) {
        this.showMessage('error', '删除失败', '未找到要删除的任务')
        return
      }
      
      // 检查是否为重复任务
      if (task.repeatId) {
        // 重复任务，询问删除选项
        this.showMessage('confirm', '删除重复任务', 
          `这是一个重复任务（${this.getRepeatText(task.repeat)}），您要删除：<br/><br/>
          <strong>仅删除当前任务</strong> - 只删除选中的这一个任务<br/>
          <strong>删除所有重复任务</strong> - 删除整个重复任务系列`,
          async () => {
            // 删除所有重复任务
            try {
              await this.taskStore.deleteTask(task.id, 'all')
              this.showMessage('success', '删除成功', '所有重复任务已删除')
            } catch (error) {
              console.error('删除任务失败:', error)
              this.showMessage('error', '删除失败', '删除任务失败，请重试')
            }
          },
          async () => {
            // 只删除当前任务
            try {
              await this.taskStore.deleteTask(task.id, 'single')
              this.showMessage('success', '删除成功', '当前任务已删除')
            } catch (error) {
              console.error('删除任务失败:', error)
              this.showMessage('error', '删除失败', '删除任务失败，请重试')
            }
          }
        )
      } else {
        // 普通任务，直接删除
        this.showMessage('confirm', '确认删除', 
          `确定要删除任务「${task.title}」吗？`,
          async () => {
            try {
              await this.taskStore.deleteTask(task.id, 'single')
              this.showMessage('success', '删除成功', '任务已删除')
            } catch (error) {
              console.error('删除任务失败:', error)
              this.showMessage('error', '删除失败', '删除任务失败，请重试')
            }
          }
        )
      }
    },
    exportTasks() {
      try {
        const tasks = this.taskStore.getAllTasks()
        const dataStr = JSON.stringify(tasks, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `calendar-tasks-${dateService.formatDate(new Date())}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        this.showMessage('success', '导出成功', '任务数据已导出')
      } catch (error) {
        console.error('导出失败:', error)
        this.showMessage('error', '导出失败', '导出任务数据失败，请重试')
      }
    },
    importTasks(event) {
      const file = event.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const tasks = JSON.parse(e.target.result)
          if (Array.isArray(tasks)) {
            this.showMessage('confirm', '确认导入', 
              `检测到 ${tasks.length} 个任务，是否覆盖现有任务？`,
              () => {
                this.taskStore.importTasks(tasks, true)
                this.showMessage('success', '导入成功', '任务数据已导入并覆盖')
              },
              () => {
                this.taskStore.importTasks(tasks, false)
                this.showMessage('success', '导入成功', '任务数据已合并导入')
              }
            )
          } else {
            this.showMessage('error', '导入失败', '文件格式不正确')
          }
        } catch (error) {
          console.error('导入失败:', error)
          this.showMessage('error', '导入失败', '文件解析失败，请检查文件格式')
        }
      }
      reader.readAsText(file)
      event.target.value = ''
    },

    onSearchFocus() {
      if (this.viewMode !== 'list') {
        this.switchView('list')
      }
    },
    onSearchInput() {
      if (this.viewMode !== 'list') {
        this.switchView('list')
      }
    },
    showMessage(type, title, content, confirmCallback = null, cancelCallback = null) {
      this.messageModalType = type
      this.messageModalTitle = title
      this.messageModalContent = content
      this.messageModalCallback = { confirm: confirmCallback, cancel: cancelCallback }
      this.showMessageModal = true
    },
    closeMessageModal() {
      this.showMessageModal = false
      this.resetMessageModal()
    },
    confirmMessageModal() {
      if (this.messageModalCallback?.confirm) {
        this.messageModalCallback.confirm()
      }
      this.closeMessageModal()
    },
    cancelMessageModal() {
      if (this.messageModalCallback?.cancel) {
        this.messageModalCallback.cancel()
      }
      this.closeMessageModal()
    },
    resetMessageModal() {
      this.messageModalType = 'info'
      this.messageModalTitle = ''
      this.messageModalContent = ''
      this.messageModalCallback = null
    },
    getRepeatText(repeat) {
      const repeatMap = {
        daily: '每天',
        weekdays: '工作日',
        weekly: '每周',
        monthly: '每月'
      }
      return repeatMap[repeat] || repeat
    },
    deleteSingleTask() {
      if (this.messageModalCallback?.cancel) {
        this.messageModalCallback.cancel()
      }
      this.closeMessageModal()
    },
    deleteAllTasks() {
      if (this.messageModalCallback?.confirm) {
        this.messageModalCallback.confirm()
      }
      this.closeMessageModal()
    }
  },
  async mounted() {
    // 初始化应用
    await this.taskStore.loadTasks()
    await this.backupStore.loadBackups()
    this.calendarStore.renderCurrentView()
  },
  beforeUnmount() {
    // 清理资源
    this.backupStore.stopAutoBackup()
  }
}
</script>

<style scoped>
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.header-left h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
  color: white;
}



.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.view-toggle {
  display: flex;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 4px;
}

.view-btn {
  background: transparent;
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.view-btn.active,
.view-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.add-task-btn {
  background: var(--success-color);
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.add-task-btn:hover {
  background: var(--success-color);
  transform: translateY(-1px);
}

.data-management {
  display: flex;
  gap: 10px;
}

.backup-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.backup-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.search-container {
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  padding: 12px 20px;
  border: 2px solid #e1e5e9;
  border-radius: 25px;
  font-size: 1rem;
  outline: none;
  transition: all 0.3s ease;
  background: white;
}

.search-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.main-content {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  min-height: 500px;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 0;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e1e5e9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: var(--text-color);
  font-size: 1.3rem;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #e1e5e9;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}



.message-modal .modal-body {
  text-align: center;
  padding: 30px 20px;
}

.message-icon {
  font-size: 3rem;
  margin-bottom: 15px;
}

.message-modal-success .message-icon {
  color: var(--success-color);
}

.message-modal-error .message-icon {
  color: var(--error-color);
}

.message-modal-confirm .message-icon {
  color: var(--warning-color);
}

.message-modal-info .message-icon {
  color: var(--info-color);
}

/* 按钮样式 */
.btn-cancel {
  background: #6c757d;
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  background: #5a6268;
}

.btn-delete {
  background: var(--error-color);
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-delete:hover {
  background: #c82333;
}

.btn-primary {
  background: var(--primary-color);
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: var(--primary-color-dark);
}

.btn-success {
  background: var(--success-color);
}

.btn-success:hover {
  background: var(--success-color);
}

.btn-error {
  background: var(--error-color);
}

.btn-error:hover {
  background: var(--error-color);
}

.btn-confirm {
  background: var(--warning-color);
  color: #212529;
}

.btn-confirm:hover {
  background: var(--warning-color);
}

.btn-single-delete {
  background: var(--warning-color);
  border: none;
  color: #212529;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-single-delete:hover {
  background: var(--warning-color-dark);
}

.btn-all-delete {
  background: var(--error-color);
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-all-delete:hover {
  background: var(--error-color-dark);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 15px;
  }
  
  .header-center {
    order: -1;
  }
  
  .data-management {
    flex-wrap: wrap;
  }
  
  .modal-content {
    width: 95%;
    margin: 10px;
  }
}
</style>
