// API服务 - 封装后端API调用

class ApiService {
  constructor() {
    // 后端API基础URL
    this.baseURL = 'http://localhost:8000/api/v1'
    this.token = null
  }

  // 设置认证token
  setToken(token) {
    this.token = token
    // 保存到localStorage
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  // 获取认证token
  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token')
    }
    return this.token
  }

  // 通用请求方法
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const token = this.getToken()
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }

    // 添加认证头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    console.log('API请求:', {
      url: url,
      method: config.method || 'GET',
      headers: config.headers,
      body: config.body ? JSON.parse(config.body) : null
    })

    try {
      const response = await fetch(url, config)
      
      console.log('API响应状态:', response.status, response.statusText)
      
      // 处理认证失败
      if (response.status === 401) {
        this.setToken(null)
        throw new Error('认证失败，请重新登录')
      }

      // 处理其他错误
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API错误响应:', errorData)
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`)
      }

      // 返回JSON数据
      const responseData = await response.json()
      console.log('API响应数据:', responseData)
      return responseData
    } catch (error) {
      console.error('API请求失败:', error)
      throw error
    }
  }

  // GET请求
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' })
  }

  // POST请求
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // PUT请求
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // DELETE请求
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  }

  // 检查服务器连接
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseURL.replace('/api/v1', '')}/health`)
      return response.ok
    } catch (error) {
      return false
    }
  }
}

export const apiService = new ApiService()