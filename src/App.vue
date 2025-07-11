<template>
  <div id="app">
    <div class="app-container">
      <!-- 头部 -->
      <header class="header">
        <div class="header-left">
          <h1>日历任务管理器</h1>
        </div>
        <div class="header-center">
          <button @click="navigate(-1)" class="nav-btn">&#9664;</button>
          <h2 class="current-date">{{ currentDateDisplay }}</h2>
          <button @click="navigate(1)" class="nav-btn">&#9654;</button>
        </div>
        <div class="header-right">
          <div class="view-toggle">
            <button @click="switchView('month')" :class="{ active: viewMode === 'month' }" class="view-btn">月</button>
            <button @click="switchView('week')" :class="{ active: viewMode === 'week' }" class="view-btn">周</button>
            <button @click="switchView('list')" :class="{ active: viewMode === 'list' }" class="view-btn">列表</button>
          </div>
          <button @click="openTaskModal()" class="add-task-btn">添加任务</button>
          <div class="data-management">
            <button @click="exportTasks" class="export-btn">导出数据</button>
            <input type="file" ref="importFile" @change="importTasks" accept=".json" style="display: none;">
            <button @click="$refs.importFile.click()" class="import-btn">导入数据</button>
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
          @day-click="openTaskModal"
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
          @search-focus="onSearchFocus"
          @search-input="onSearchInput"
        />
      </div>

      <!-- 任务模态框组件 -->
      <TaskModal
        :is-visible="showTaskModal"
        :task="editingTask"
        :selected-date="selectedDate"
        @close="closeTaskModal"
        @save="saveTask"
        @delete="showDeleteConfirm"
      />

      <!-- 备份管理模态框组件 -->
      <BackupModal
        :is-visible="showBackupModal"
        @close="closeBackupModal"
      />

      <!-- 删除确认模态框 -->
      <div v-if="showDeleteConfirmModal" class="modal-overlay" @click="cancelDelete">
        <div class="modal-content delete-confirm-modal" @click.stop>
          <div class="modal-header">
            <h3>确认删除</h3>
          </div>
          <div class="modal-body">
            <p>{{ deleteConfirmMessage }}</p>
          </div>
          <div class="modal-footer">
            <button type="button" @click="cancelDelete" class="btn-cancel">取消</button>
            <button type="button" @click="confirmDelete" class="btn-delete">确认删除</button>
          </div>
        </div>
      </div>

      <!-- 通用消息模态框 -->
      <div v-if="showMessageModal" class="modal-overlay" @click="closeMessageModal">
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
            <button v-if="messageModalType === 'confirm'" type="button" @click="cancelMessageModal" class="btn-cancel">取消</button>
            <button type="button" @click="confirmMessageModal" class="btn-primary" :class="{
              'btn-success': messageModalType === 'success',
              'btn-error': messageModalType === 'error',
              'btn-confirm': messageModalType === 'confirm'
            }">
              {{ messageModalType === 'confirm' ? '确定' : '知道了' }}
            </button>
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
      editingTask: null,
      selectedDate: null,
      showDeleteConfirmModal: false,
      deleteConfirmMessage: '',
      deleteTaskToConfirm: null,
      showMessageModal: false,
      messageModalType: 'info',
      messageModalTitle: '',
      messageModalContent: '',
      messageModalCallback: null
    }
  },
  computed: {
    currentDateDisplay() {
      return this.calendarStore.currentDateDisplay
    },
    viewMode() {
      return this.calendarStore.viewMode
    }
  },
  methods: {
    navigate(direction) {
      this.calendarStore.navigate(direction)
    },
    switchView(view) {
      this.calendarStore.switchView(view)
    },
    openTaskModal(task = null, date = null) {
      this.editingTask = task
      this.selectedDate = date
      this.showTaskModal = true
    },
    closeTaskModal() {
      this.showTaskModal = false
      this.editingTask = null
      this.selectedDate = null
    },
    openBackupModal() {
      this.showBackupModal = true
    },
    closeBackupModal() {
      this.showBackupModal = false
    },
    saveTask(eventData) {
      try {
        const { task, isEditing, editOption, originalTask } = eventData
        if (isEditing) {
          this.taskStore.updateTask(originalTask.id, task, editOption)
        } else {
          this.taskStore.addTask(task)
        }
        this.closeTaskModal()
        this.showMessage('success', '保存成功', '任务已保存')
      } catch (error) {
        console.error('保存任务失败:', error)
        this.showMessage('error', '保存失败', '保存任务失败，请重试')
      }
    },
    updateTaskStatus(task) {
      this.taskStore.updateTaskStatus(task.id, task.completed)
    },
    showDeleteConfirm(task, options = {}) {
      this.deleteTaskToConfirm = task
      if (task.recurring) {
        this.deleteConfirmMessage = '这是一个重复任务，您要删除所有重复任务还是仅删除当前任务？'
      } else {
        this.deleteConfirmMessage = `确定要删除任务 "${task.title}" 吗？`
      }
      this.showDeleteConfirmModal = true
    },
    confirmDelete() {
      if (this.deleteTaskToConfirm) {
        this.taskStore.deleteTask(this.deleteTaskToConfirm.id)
        this.showMessage('success', '删除成功', '任务已删除')
      }
      this.cancelDelete()
    },
    cancelDelete() {
      this.showDeleteConfirmModal = false
      this.deleteConfirmMessage = ''
      this.deleteTaskToConfirm = null
    },
    exportTasks() {
      try {
        const tasks = this.taskStore.getAllTasks()
        const dataStr = JSON.stringify(tasks, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `calendar-tasks-${dateService.formatDate(new Date(), 'YYYY-MM-DD')}.json`
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
            this.showMessage('confirm', '导入确认', 
              `将导入 ${tasks.length} 个任务，是否替换现有任务？`, 
              () => {
                this.taskStore.importTasks(tasks, true)
                this.showMessage('success', '导入成功', '任务数据已导入')
              },
              () => {
                this.taskStore.importTasks(tasks, false)
                this.showMessage('success', '导入成功', '任务数据已追加')
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
    }
  },
  async mounted() {
    // 初始化应用
    await this.taskStore.loadTasks()
    await this.backupStore.loadBackups()
    this.calendarStore.render()
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
}

.header-center {
  display: flex;
  align-items: center;
  gap: 15px;
}

.nav-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.3s ease;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.current-date {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 500;
  min-width: 200px;
  text-align: center;
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
  background: #4CAF50;
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.add-task-btn:hover {
  background: #45a049;
  transform: translateY(-1px);
}

.data-management {
  display: flex;
  gap: 10px;
}

.export-btn,
.import-btn,
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

.export-btn:hover,
.import-btn:hover,
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
  color: #333;
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

.delete-confirm-modal .modal-body {
  text-align: center;
  padding: 30px 20px;
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
  color: #4CAF50;
}

.message-modal-error .message-icon {
  color: #f44336;
}

.message-modal-confirm .message-icon {
  color: #ff9800;
}

.message-modal-info .message-icon {
  color: #2196F3;
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
  background: #dc3545;
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
  background: #007bff;
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-success {
  background: #28a745;
}

.btn-success:hover {
  background: #1e7e34;
}

.btn-error {
  background: #dc3545;
}

.btn-error:hover {
  background: #c82333;
}

.btn-confirm {
  background: #ffc107;
  color: #212529;
}

.btn-confirm:hover {
  background: #e0a800;
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
