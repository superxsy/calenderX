<template>
  <div class="user-profile">
    <!-- 未登录状态 -->
    <div v-if="!authStore.isLoggedIn" class="auth-actions">
      <button 
        class="auth-btn login-btn" 
        @click="showLogin"
        :disabled="authStore.loading"
      >
        登录
      </button>
      <button 
        class="auth-btn register-btn" 
        @click="showRegister"
        :disabled="authStore.loading"
      >
        注册
      </button>
    </div>
    
    <!-- 已登录状态 -->
    <div v-else class="user-info">
      <div class="user-avatar">
        <div class="avatar-circle">
          {{ userInitial }}
        </div>
        
        <!-- 同步状态指示器 -->
        <div v-if="taskStore.apiMode" class="sync-indicator" :class="syncStatusClass">
          <span class="sync-icon">{{ syncIcon }}</span>
        </div>
      </div>
      
      <div class="user-details">
        <div class="user-email">{{ authStore.user?.email }}</div>
        <div class="user-status">
          <span v-if="taskStore.apiMode" class="mode-badge api-mode">在线模式</span>
          <span v-else class="mode-badge local-mode">离线模式</span>
          
          <span v-if="taskStore.syncStatus.hasPending" class="pending-sync">
            ({{ taskStore.syncStatus.pendingCount }} 待同步)
          </span>
        </div>
      </div>
      
      <div class="user-actions">
        <button 
          class="action-btn sync-btn" 
          @click="syncData"
          :disabled="!taskStore.apiMode || authStore.loading || syncing"
          v-if="taskStore.apiMode"
          title="同步数据"
        >
          <span v-if="syncing" class="loading-spinner"></span>
          <span v-else>🔄</span>
        </button>
        
        <button 
          class="action-btn mode-btn" 
          @click="toggleMode"
          :disabled="authStore.loading"
          :title="taskStore.apiMode ? '切换到离线模式' : '切换到在线模式'"
        >
          {{ taskStore.apiMode ? '📶' : '📱' }}
        </button>
        
        <div class="dropdown" ref="dropdownRef">
          <button 
            class="action-btn menu-btn" 
            @click="toggleDropdown"
            :disabled="authStore.loading"
          >
            ⋮
          </button>
          
          <div v-if="showDropdown" class="dropdown-menu">
            <button class="dropdown-item" @click="refreshTasks">
              <span class="item-icon">🔄</span>
              刷新任务
            </button>
            <button class="dropdown-item" @click="showPasswordModal">
              <span class="item-icon">🔑</span>
              修改密码
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item logout" @click="handleLogout">
              <span class="item-icon">🚪</span>
              退出登录
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 登录模态框 -->
    <LoginModal
      :show="loginModalVisible"
      :default-mode="loginMode"
      @close="hideLoginModal"
      @success="handleAuthSuccess"
    />
    
    <!-- 修改密码模态框 -->
    <PasswordModal
      :show="passwordModalVisible"
      @close="hidePasswordModal"
      @success="handlePasswordSuccess"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../store/modules/authStore'
import { useTaskStore } from '../store/modules/taskStore'
import LoginModal from './LoginModal.vue'
import PasswordModal from './PasswordModal.vue'

export default {
  name: 'UserProfile',
  components: {
    LoginModal,
    PasswordModal
  },
  setup() {
    const authStore = useAuthStore()
    const taskStore = useTaskStore()
    
    const loginModalVisible = ref(false)
    const passwordModalVisible = ref(false)
    const loginMode = ref('login')
    const showDropdown = ref(false)
    const dropdownRef = ref(null)
    const syncing = ref(false)
    
    // 计算用户头像首字母
    const userInitial = computed(() => {
      const email = authStore.user?.email
      return email ? email.charAt(0).toUpperCase() : 'U'
    })
    
    // 同步状态样式
    const syncStatusClass = computed(() => {
      if (!taskStore.syncStatus.isOnline) return 'offline'
      if (taskStore.syncStatus.hasPending) return 'pending'
      return 'synced'
    })
    
    // 同步状态图标
    const syncIcon = computed(() => {
      if (!taskStore.syncStatus.isOnline) return '⚠️'
      if (taskStore.syncStatus.hasPending) return '⏳'
      return '✅'
    })
    
    // 显示登录模态框
    const showLogin = () => {
      loginMode.value = 'login'
      loginModalVisible.value = true
    }
    
    // 显示注册模态框
    const showRegister = () => {
      loginMode.value = 'register'
      loginModalVisible.value = true
    }
    
    // 隐藏登录模态框
    const hideLoginModal = () => {
      loginModalVisible.value = false
    }
    
    // 显示密码修改模态框
    const showPasswordModal = () => {
      passwordModalVisible.value = true
      showDropdown.value = false
    }
    
    // 隐藏密码修改模态框
    const hidePasswordModal = () => {
      passwordModalVisible.value = false
    }
    
    // 切换下拉菜单
    const toggleDropdown = () => {
      showDropdown.value = !showDropdown.value
    }
    
    // 处理认证成功
    const handleAuthSuccess = async (data) => {
      console.log(`${data.mode === 'login' ? '登录' : '注册'}成功`)
      
      // 登录成功后加载任务
      if (data.mode === 'login') {
        await taskStore.loadTasks()
      }
    }
    
    // 处理密码修改成功
    const handlePasswordSuccess = () => {
      console.log('密码修改成功')
    }
    
    // 退出登录
    const handleLogout = async () => {
      try {
        await authStore.logout()
        showDropdown.value = false
        
        // 清空任务数据
        taskStore.tasks = []
        
        console.log('退出登录成功')
      } catch (error) {
        console.error('退出登录失败:', error)
      }
    }
    
    // 同步数据
    const syncData = async () => {
      if (syncing.value || !taskStore.apiMode) return
      
      syncing.value = true
      try {
        await taskStore.syncOfflineData()
        await taskStore.refreshTasks()
      } catch (error) {
        console.error('同步失败:', error)
      } finally {
        syncing.value = false
      }
    }
    
    // 切换在线/离线模式
    const toggleMode = () => {
      const newMode = !taskStore.apiMode
      taskStore.toggleApiMode(newMode)
      
      if (newMode && authStore.isLoggedIn) {
        // 切换到在线模式时加载任务
        taskStore.loadTasks()
      }
    }
    
    // 刷新任务
    const refreshTasks = async () => {
      showDropdown.value = false
      try {
        await taskStore.refreshTasks()
      } catch (error) {
        console.error('刷新任务失败:', error)
      }
    }
    
    // 点击外部关闭下拉菜单
    const handleClickOutside = (event) => {
      if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
        showDropdown.value = false
      }
    }
    
    // 网络状态监听
    const handleOnline = () => {
      taskStore.checkNetworkStatus()
    }
    
    const handleOffline = () => {
      taskStore.checkNetworkStatus()
    }
    
    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      
      // 初始化认证状态
      authStore.initializeAuth()
    })
    
    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    })
    
    return {
      authStore,
      taskStore,
      loginModalVisible,
      passwordModalVisible,
      loginMode,
      showDropdown,
      dropdownRef,
      syncing,
      userInitial,
      syncStatusClass,
      syncIcon,
      showLogin,
      showRegister,
      hideLoginModal,
      showPasswordModal,
      hidePasswordModal,
      toggleDropdown,
      handleAuthSuccess,
      handlePasswordSuccess,
      handleLogout,
      syncData,
      toggleMode,
      refreshTasks
    }
  }
}
</script>

<style scoped>
.user-profile {
  position: relative;
}

.auth-actions {
  display: flex;
  gap: 8px;
}

.auth-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.login-btn {
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
}

.login-btn:hover:not(:disabled) {
  background: #e9ecef;
}

.register-btn {
  background: #4f46e5;
  color: white;
}

.register-btn:hover:not(:disabled) {
  background: #4338ca;
}

.auth-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.user-avatar {
  position: relative;
}

.avatar-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #4f46e5;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.sync-indicator {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  border: 2px solid white;
}

.sync-indicator.synced {
  background: #10b981;
}

.sync-indicator.pending {
  background: #f59e0b;
}

.sync-indicator.offline {
  background: #ef4444;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-email {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-status {
  font-size: 12px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
}

.mode-badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
}

.api-mode {
  background: #dbeafe;
  color: #1e40af;
}

.local-mode {
  background: #fef3c7;
  color: #92400e;
}

.pending-sync {
  color: #f59e0b;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 100;
  min-width: 140px;
  margin-top: 4px;
}

.dropdown-item {
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background: #f3f4f6;
}

.dropdown-item:first-child {
  border-radius: 6px 6px 0 0;
}

.dropdown-item:last-child {
  border-radius: 0 0 6px 6px;
}

.dropdown-item.logout {
  color: #dc2626;
}

.dropdown-item.logout:hover {
  background: #fef2f2;
}

.dropdown-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 4px 0;
}

.item-icon {
  font-size: 12px;
  width: 16px;
  text-align: center;
}
</style>