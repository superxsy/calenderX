// 认证状态管理 Store
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService, taskApiService } from '../../services'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)
  const error = ref(null)
  const loginForm = ref({
    email: '',
    password: ''
  })
  const registerForm = ref({
    email: '',
    password: '',
    confirmPassword: ''
  })

  // 计算属性
  const isLoggedIn = computed(() => {
    return isAuthenticated.value && user.value !== null
  })

  const userEmail = computed(() => {
    return user.value?.email || ''
  })

  const hasError = computed(() => {
    return error.value !== null
  })

  // 动作
  
  // 初始化认证状态
  const initializeAuth = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      // 检查是否有保存的token
      if (authService.isLoggedIn()) {
        const result = await authService.getCurrentUser()
        if (result.success) {
          user.value = result.user
          isAuthenticated.value = true
        } else {
          // token可能已过期，清除认证状态
          await logout()
        }
      }
    } catch (err) {
      console.error('初始化认证状态失败:', err)
      error.value = err.message
      await logout()
    } finally {
      isLoading.value = false
    }
  }

  // 用户登录
  const login = async (credentials) => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await authService.login(credentials)
      
      if (result.success) {
        user.value = result.user
        isAuthenticated.value = true
        
        // 清空表单
        loginForm.value = {
          email: '',
          password: ''
        }
        
        // 尝试同步离线数据
        await syncOfflineData()
        
        return { success: true, message: result.message }
      } else {
        error.value = result.error
        return { success: false, message: result.message }
      }
    } catch (err) {
      console.error('登录失败:', err)
      error.value = err.message
      return { success: false, message: '登录过程中发生错误' }
    } finally {
      isLoading.value = false
    }
  }

  // 用户注册
  const register = async (userData) => {
    try {
      isLoading.value = true
      error.value = null
      
      // 验证密码确认
      if (userData.password !== userData.confirmPassword) {
        error.value = '密码确认不匹配'
        return { success: false, message: '密码确认不匹配' }
      }
      
      const result = await authService.register(userData)
      
      if (result.success) {
        // 注册成功后自动登录
        const loginResult = await login({
          email: userData.email,
          password: userData.password
        })
        
        // 清空表单
        registerForm.value = {
          email: '',
          password: '',
          confirmPassword: ''
        }
        
        return loginResult
      } else {
        // 特殊处理邮箱已注册的情况
        if (result.error && result.error.includes('Email already registered')) {
          error.value = '该邮箱已注册，请直接登录'
          return { 
            success: false, 
            message: '该邮箱已注册，请直接登录',
            shouldSwitchToLogin: true
          }
        }
        
        error.value = result.error
        return { success: false, message: result.message }
      }
    } catch (err) {
      console.error('注册失败:', err)
      error.value = err.message
      return { success: false, message: '注册过程中发生错误' }
    } finally {
      isLoading.value = false
    }
  }

  // 用户登出
  const logout = async () => {
    try {
      isLoading.value = true
      
      const result = await authService.logout()
      
      // 清除状态
      user.value = null
      isAuthenticated.value = false
      error.value = null
      
      // 清空表单
      loginForm.value = {
        email: '',
        password: ''
      }
      registerForm.value = {
        email: '',
        password: '',
        confirmPassword: ''
      }
      
      return result
    } catch (err) {
      console.error('登出失败:', err)
      return { success: false, message: '登出过程中发生错误' }
    } finally {
      isLoading.value = false
    }
  }

  // 更新密码
  const updatePassword = async (passwordData) => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await authService.updatePassword(passwordData)
      
      if (!result.success) {
        error.value = result.error
      }
      
      return result
    } catch (err) {
      console.error('更新密码失败:', err)
      error.value = err.message
      return { success: false, message: '更新密码过程中发生错误' }
    } finally {
      isLoading.value = false
    }
  }

  // 请求密码重置
  const requestPasswordReset = async (email) => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await authService.requestPasswordReset(email)
      
      if (!result.success) {
        error.value = result.error
      }
      
      return result
    } catch (err) {
      console.error('请求密码重置失败:', err)
      error.value = err.message
      return { success: false, message: '请求密码重置过程中发生错误' }
    } finally {
      isLoading.value = false
    }
  }

  // 同步离线数据
  const syncOfflineData = async () => {
    try {
      const syncStatus = taskApiService.getSyncStatus()
      if (syncStatus.hasPending) {
        console.log(`开始同步 ${syncStatus.pendingCount} 个离线操作...`)
        const result = await taskApiService.syncPendingOperations()
        console.log('同步结果:', result)
        return result
      }
      return { success: true, message: '没有需要同步的数据' }
    } catch (err) {
      console.error('同步离线数据失败:', err)
      return { success: false, message: '同步失败' }
    }
  }

  // 清除错误
  const clearError = () => {
    error.value = null
  }

  // 更新登录表单
  const updateLoginForm = (field, value) => {
    loginForm.value[field] = value
  }

  // 更新注册表单
  const updateRegisterForm = (field, value) => {
    registerForm.value[field] = value
  }

  // 验证表单
  const validateLoginForm = () => {
    const errors = []
    
    if (!loginForm.value.email) {
      errors.push('邮箱不能为空')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginForm.value.email)) {
      errors.push('邮箱格式不正确')
    }
    
    if (!loginForm.value.password) {
      errors.push('密码不能为空')
    } else if (loginForm.value.password.length < 6) {
      errors.push('密码长度至少6位')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  const validateRegisterForm = () => {
    const errors = []
    
    if (!registerForm.value.email) {
      errors.push('邮箱不能为空')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.value.email)) {
      errors.push('邮箱格式不正确')
    }
    
    if (!registerForm.value.password) {
      errors.push('密码不能为空')
    } else if (registerForm.value.password.length < 6) {
      errors.push('密码长度至少6位')
    }
    
    if (!registerForm.value.confirmPassword) {
      errors.push('请确认密码')
    } else if (registerForm.value.password !== registerForm.value.confirmPassword) {
      errors.push('密码确认不匹配')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  return {
    // 状态
    user,
    isAuthenticated,
    isLoading,
    error,
    loginForm,
    registerForm,
    
    // 计算属性
    isLoggedIn,
    userEmail,
    hasError,
    
    // 动作
    initializeAuth,
    login,
    register,
    logout,
    updatePassword,
    requestPasswordReset,
    syncOfflineData,
    clearError,
    updateLoginForm,
    updateRegisterForm,
    validateLoginForm,
    validateRegisterForm
  }
})