// UI状态管理 Store
import { defineStore } from 'pinia'

export const useUIStore = defineStore('ui', {
  state: () => ({
    // 模态框状态
    modals: {
      task: false,
      backup: false,
      delete: false,
      message: false
    },
    
    // 消息状态
    message: {
      title: '',
      content: '',
      type: 'info', // 'info', 'success', 'error', 'confirm'
      show: false,
      confirmCallback: null,
      cancelCallback: null
    },
    
    // 加载状态
    loading: {
      global: false,
      tasks: false,
      backup: false
    },
    
    // 主题配置
    theme: {
      current: 'default',
      presetColors: {
        default: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'],
        warm: ['#ff6b6b', '#feca57', '#ff9ff3', '#fd79a8', '#fdcb6e', '#e17055', '#fab1a0', '#e84393'],
        cool: ['#4ecdc4', '#45b7d1', '#54a0ff', '#5f27cd', '#00d2d3', '#0984e3', '#6c5ce7', '#a29bfe'],
        nature: ['#96ceb4', '#6c5ce7', '#fd79a8', '#fdcb6e', '#55a3ff', '#00b894', '#00cec9', '#81ecec']
      }
    },
    
    // 侧边栏状态
    sidebar: {
      collapsed: false,
      activeTab: 'calendar'
    },
    
    // 任务表单状态
    taskForm: {
      isEditing: false,
      editingTask: null,
      showColorOptions: false,
      showRepeatOptions: false,
      repeatEditOption: 'current' // 'current' | 'all'
    },
    
    // 备份管理状态
    backupManagement: {
      selectedBackup: null,
      showDetails: false
    },
    
    // 通知状态
    notifications: [],
    
    // 响应式设计
    responsive: {
      isMobile: false,
      isTablet: false,
      screenWidth: window.innerWidth
    }
  }),

  getters: {
    // 当前主题的预设颜色
    currentPresetColors: (state) => {
      return state.theme.presetColors[state.theme.current] || state.theme.presetColors.default
    },
    
    // 是否有活跃的模态框
    hasActiveModal: (state) => {
      return Object.values(state.modals).some(isOpen => isOpen)
    },
    
    // 是否正在加载
    isLoading: (state) => {
      return Object.values(state.loading).some(isLoading => isLoading)
    },
    
    // 未读通知数量
    unreadNotifications: (state) => {
      return state.notifications.filter(n => !n.read).length
    }
  },

  actions: {
    // 模态框管理
    openModal(modalName, data = null) {
      this.modals[modalName] = true
      
      // 特殊处理任务模态框
      if (modalName === 'task') {
        if (data) {
          this.taskForm.isEditing = true
          this.taskForm.editingTask = data
        } else {
          this.taskForm.isEditing = false
          this.taskForm.editingTask = null
        }
      }
      
      // 特殊处理备份模态框
      if (modalName === 'backup' && data) {
        this.backupManagement.selectedBackup = data
      }
    },
    
    closeModal(modalName) {
      this.modals[modalName] = false
      
      // 重置相关状态
      if (modalName === 'task') {
        this.resetTaskForm()
      }
      
      if (modalName === 'backup') {
        this.backupManagement.selectedBackup = null
        this.backupManagement.showDetails = false
      }
      
      if (modalName === 'message') {
        this.resetMessage()
      }
    },
    
    closeAllModals() {
      Object.keys(this.modals).forEach(modalName => {
        this.closeModal(modalName)
      })
    },
    
    // 消息管理
    showMessage(title, content, type = 'info', confirmCallback = null, cancelCallback = null) {
      this.message = {
        title,
        content,
        type,
        show: true,
        confirmCallback,
        cancelCallback
      }
      this.modals.message = true
    },
    
    showSuccess(title, content) {
      this.showMessage(title, content, 'success')
    },
    
    showError(title, content) {
      this.showMessage(title, content, 'error')
    },
    
    showConfirm(title, content, confirmCallback, cancelCallback = null) {
      this.showMessage(title, content, 'confirm', confirmCallback, cancelCallback)
    },
    
    resetMessage() {
      this.message = {
        title: '',
        content: '',
        type: 'info',
        show: false,
        confirmCallback: null,
        cancelCallback: null
      }
    },
    
    // 加载状态管理
    setLoading(type, isLoading) {
      this.loading[type] = isLoading
    },
    
    // 主题管理
    setTheme(themeName) {
      if (this.theme.presetColors[themeName]) {
        this.theme.current = themeName
      }
    },
    
    // 任务表单状态管理
    resetTaskForm() {
      this.taskForm = {
        isEditing: false,
        editingTask: null,
        showColorOptions: false,
        showRepeatOptions: false,
        repeatEditOption: 'current'
      }
    },
    
    setTaskFormState(key, value) {
      this.taskForm[key] = value
    },
    
    // 通知管理
    addNotification(notification) {
      const id = Date.now() + Math.random()
      this.notifications.unshift({
        id,
        timestamp: new Date(),
        read: false,
        ...notification
      })
      
      // 限制通知数量
      if (this.notifications.length > 50) {
        this.notifications = this.notifications.slice(0, 50)
      }
    },
    
    markNotificationAsRead(id) {
      const notification = this.notifications.find(n => n.id === id)
      if (notification) {
        notification.read = true
      }
    },
    
    markAllNotificationsAsRead() {
      this.notifications.forEach(n => n.read = true)
    },
    
    removeNotification(id) {
      const index = this.notifications.findIndex(n => n.id === id)
      if (index !== -1) {
        this.notifications.splice(index, 1)
      }
    },
    
    clearAllNotifications() {
      this.notifications = []
    },
    
    // 响应式设计
    updateScreenSize() {
      this.responsive.screenWidth = window.innerWidth
      this.responsive.isMobile = window.innerWidth < 768
      this.responsive.isTablet = window.innerWidth >= 768 && window.innerWidth < 1024
    },
    
    // 侧边栏管理
    toggleSidebar() {
      this.sidebar.collapsed = !this.sidebar.collapsed
    },
    
    setSidebarTab(tab) {
      this.sidebar.activeTab = tab
    }
  }
})