// 认证服务 - 封装用户认证相关的API调用
import { apiService } from './apiService'

class AuthService {
  constructor() {
    this.currentUser = null
    this.isAuthenticated = false
    this.initializeAuth()
  }

  // 初始化认证状态
  initializeAuth() {
    const token = apiService.getToken()
    if (token) {
      this.isAuthenticated = true
      // 可以在这里验证token有效性
      this.validateToken()
    }
  }

  // 用户注册
  async register(userData) {
    try {
      console.log('注册请求数据:', { email: userData.email, password: '***' })
      const response = await apiService.post('/auth/register', {
        email: userData.email,
        password: userData.password
      })
      
      console.log('注册响应:', response)
      return {
        success: true,
        user: response,
        message: '注册成功'
      }
    } catch (error) {
      console.error('注册错误:', error)
      return {
        success: false,
        error: error.message,
        message: '注册失败'
      }
    }
  }

  // 用户登录
  async login(credentials) {
    try {
      console.log('登录请求数据:', { email: credentials.email, password: '***' })
      const response = await apiService.post('/auth/login', {
        email: credentials.email,
        password: credentials.password
      })
      
      console.log('登录响应:', response)
      // 保存token
      apiService.setToken(response.access_token)
      this.isAuthenticated = true
      
      // 获取用户信息
      await this.getCurrentUser()
      
      return {
        success: true,
        token: response.access_token,
        user: this.currentUser,
        message: '登录成功'
      }
    } catch (error) {
      console.error('登录错误:', error)
      return {
        success: false,
        error: error.message,
        message: '登录失败'
      }
    }
  }

  // 用户登出
  async logout() {
    try {
      // 清除本地认证信息
      apiService.setToken(null)
      this.currentUser = null
      this.isAuthenticated = false
      
      return {
        success: true,
        message: '登出成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: '登出失败'
      }
    }
  }

  // 获取当前用户信息
  async getCurrentUser() {
    try {
      if (!this.isAuthenticated) {
        throw new Error('用户未登录')
      }
      
      // 注意：后端需要提供获取当前用户信息的接口
      // 这里暂时使用token解析或其他方式
      const response = await apiService.get('/auth/me')
      this.currentUser = response
      
      return {
        success: true,
        user: this.currentUser
      }
    } catch (error) {
      // 如果获取用户信息失败，可能token已过期
      this.logout()
      return {
        success: false,
        error: error.message
      }
    }
  }

  // 验证token有效性
  async validateToken() {
    try {
      const result = await this.getCurrentUser()
      return result.success
    } catch (error) {
      this.logout()
      return false
    }
  }

  // 检查是否已登录
  isLoggedIn() {
    return this.isAuthenticated && apiService.getToken()
  }

  // 获取用户信息
  getUser() {
    return this.currentUser
  }

  // 更新密码
  async updatePassword(passwordData) {
    try {
      const response = await apiService.put('/auth/password', {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword
      })
      
      return {
        success: true,
        message: '密码更新成功'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: '密码更新失败'
      }
    }
  }

  // 重置密码（发送重置邮件）
  async requestPasswordReset(email) {
    try {
      const response = await apiService.post('/auth/password-reset', {
        email: email
      })
      
      return {
        success: true,
        message: '密码重置邮件已发送'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: '发送重置邮件失败'
      }
    }
  }
}

export const authService = new AuthService()