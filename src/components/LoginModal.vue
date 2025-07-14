<template>
  <div v-if="showModal" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ isLogin ? '登录' : '注册' }}</h2>
        <button class="close-btn" @click="closeModal">&times;</button>
      </div>
      
      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="email">邮箱</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              :disabled="loading"
              placeholder="请输入邮箱地址"
            />
          </div>
          
          <div class="form-group">
            <label for="password">密码</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              :disabled="loading"
              :class="{ 'input-error': !isLogin && form.password && form.password.length < 8 }"
              :placeholder="isLogin ? '请输入密码' : '密码至少8位，包含字母和数字'"
            />
            <div v-if="!isLogin && form.password && form.password.length < 8" class="field-error">
              密码至少需要8位字符
            </div>
          </div>
          
          <div v-if="!isLogin" class="form-group">
            <label for="confirmPassword">确认密码</label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              required
              :disabled="loading"
              :class="{ 'input-error': showPasswordMismatch }"
              placeholder="请再次输入密码"
            />
            <div v-if="showPasswordMismatch" class="field-error">
              密码确认不匹配
            </div>
          </div>
          
          <div v-if="error" class="error-message">
            {{ error }}
          </div>
          
          <div class="form-actions">
            <button
              type="submit"
              class="submit-btn"
              :disabled="loading || !isFormValid"
            >
              <span v-if="loading" class="loading-spinner"></span>
              {{ loading ? '处理中...' : (isLogin ? '登录' : '注册') }}
            </button>
          </div>
        </form>
        
        <div class="form-footer">
          <p>
            {{ isLogin ? '还没有账户？' : '已有账户？' }}
            <button
              type="button"
              class="link-btn"
              @click="toggleMode"
              :disabled="loading"
            >
              {{ isLogin ? '立即注册' : '立即登录' }}
            </button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick } from 'vue'
import { useAuthStore } from '../store/modules/authStore'

export default {
  name: 'LoginModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    defaultMode: {
      type: String,
      default: 'login', // 'login' or 'register'
      validator: value => ['login', 'register'].includes(value)
    }
  },
  emits: ['close', 'success'],
  setup(props, { emit }) {
    const authStore = useAuthStore()
    
    const showModal = ref(props.show)
    const isLogin = ref(props.defaultMode === 'login')
    const loading = ref(false)
    const error = ref('')
    const showPasswordMismatch = ref(false)
    
    const form = ref({
      email: '',
      password: '',
      confirmPassword: ''
    })
    
    let passwordCheckTimeout = null
    
    // 监听props变化
    watch(() => props.show, (newVal) => {
      showModal.value = newVal
      if (newVal) {
        resetForm()
      }
    })
    
    watch(() => props.defaultMode, (newVal) => {
      isLogin.value = newVal === 'login'
    })
    
    // 监听确认密码变化，使用防抖机制
    watch(() => form.value.confirmPassword, (newVal) => {
      if (passwordCheckTimeout) {
        clearTimeout(passwordCheckTimeout)
      }
      
      if (!isLogin.value && newVal && newVal.length > 0) {
        passwordCheckTimeout = setTimeout(() => {
          showPasswordMismatch.value = !passwordsMatch.value
        }, 500) // 500ms 延迟
      } else {
        showPasswordMismatch.value = false
      }
    })
    
    // 监听密码变化，重置错误状态
    watch(() => form.value.password, () => {
      showPasswordMismatch.value = false
      if (passwordCheckTimeout) {
        clearTimeout(passwordCheckTimeout)
      }
    })
    
    // 密码匹配检查
    const passwordsMatch = computed(() => {
      if (isLogin.value) return true
      const { password, confirmPassword } = form.value
      const match = password === confirmPassword
      
      // 调试信息
      if (password && confirmPassword) {
        console.log('密码比较调试:', {
          password: `"${password}" (长度: ${password.length})`,
          confirmPassword: `"${confirmPassword}" (长度: ${confirmPassword.length})`,
          match: match,
          passwordBytes: Array.from(password).map(c => c.charCodeAt(0)),
          confirmPasswordBytes: Array.from(confirmPassword).map(c => c.charCodeAt(0))
        })
      }
      
      return match
    })
    
    // 表单验证
    const isFormValid = computed(() => {
      const { email, password, confirmPassword } = form.value
      
      if (!email || !password) return false
      
      // 邮箱格式验证
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) return false
      
      // 密码强度验证
      if (password.length < 8) return false
      
      // 注册时需要确认密码
      if (!isLogin.value && !passwordsMatch.value) return false
      
      return true
    })
    
    // 重置表单
    const resetForm = () => {
      form.value = {
        email: '',
        password: '',
        confirmPassword: ''
      }
      error.value = ''
    }
    
    // 切换登录/注册模式
    const toggleMode = () => {
      isLogin.value = !isLogin.value
      error.value = ''
      form.value.confirmPassword = ''
    }
    
    // 关闭模态框
    const closeModal = () => {
      showModal.value = false
      emit('close')
    }
    
    // 处理表单提交
    const handleSubmit = async () => {
      // 调试信息：检查表单提交时的验证状态
      console.log('表单提交调试:', {
        isFormValid: isFormValid.value,
        passwordsMatch: passwordsMatch.value,
        isLogin: isLogin.value,
        formData: {
          email: form.value.email,
          password: `"${form.value.password}" (长度: ${form.value.password.length})`,
          confirmPassword: `"${form.value.confirmPassword}" (长度: ${form.value.confirmPassword.length})`
        }
      })
      
      if (!isFormValid.value || loading.value) {
        console.log('表单验证失败，阻止提交')
        return
      }
      
      loading.value = true
      error.value = ''
      
      try {
        const { email, password } = form.value
        let result
        
        if (isLogin.value) {
          // 登录
          console.log('开始登录请求')
          result = await authStore.login({ email, password })
          console.log('登录结果:', result)
        } else {
          // 注册
          console.log('开始注册请求')
          result = await authStore.register({ 
            email, 
            password, 
            confirmPassword: form.value.confirmPassword 
          })
          console.log('注册结果:', result)
        }
        
        console.log('处理结果:', { result, success: result?.success })
        
        if (result && result.success) {
          // 成功后关闭模态框
          console.log('操作成功，关闭模态框')
          emit('success', { mode: isLogin.value ? 'login' : 'register' })
          closeModal()
        } else {
          // 检查是否需要切换到登录模式
          if (result?.shouldSwitchToLogin && !isLogin.value) {
            console.log('邮箱已注册，切换到登录模式')
            isLogin.value = true
            error.value = result.message
            // 保留邮箱，清空确认密码
            form.value.confirmPassword = ''
          } else {
            // 显示错误信息
            console.log('操作失败:', result)
            error.value = result?.message || '操作失败，请重试'
          }
        }
        
      } catch (err) {
        error.value = err.message || '操作失败，请重试'
      } finally {
        loading.value = false
      }
    }
    
    return {
      showModal,
      isLogin,
      loading,
      error,
      form,
      isFormValid,
      passwordsMatch,
      showPasswordMismatch,
      toggleMode,
      closeModal,
      handleSubmit
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
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}

.modal-header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #666;
}

.modal-body {
  padding: 0 24px 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #4f46e5;
}

.form-group input:disabled {
  background: #f9f9f9;
  cursor: not-allowed;
}

.input-error {
  border-color: #e53e3e !important;
}

.field-error {
  color: #e53e3e;
  font-size: 12px;
  margin-top: 4px;
}

.error-message {
  background: #fee;
  color: #c53030;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  border: 1px solid #fed7d7;
}

.form-actions {
  margin-bottom: 20px;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.submit-btn:hover:not(:disabled) {
  background: #4338ca;
  transform: translateY(-1px);
}

.submit-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  width: 16px;
  height: 16px;
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

.form-footer {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.form-footer p {
  margin: 0;
  color: #666;
}

.link-btn {
  background: none;
  border: none;
  color: #4f46e5;
  cursor: pointer;
  font-weight: 600;
  text-decoration: underline;
  padding: 0;
  margin-left: 4px;
}

.link-btn:hover:not(:disabled) {
  color: #4338ca;
}

.link-btn:disabled {
  color: #9ca3af;
  cursor: not-allowed;
}
</style>