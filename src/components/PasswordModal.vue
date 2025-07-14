<template>
  <div v-if="showModal" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>修改密码</h2>
        <button class="close-btn" @click="closeModal">&times;</button>
      </div>
      
      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="currentPassword">当前密码</label>
            <input
              id="currentPassword"
              v-model="form.currentPassword"
              type="password"
              required
              :disabled="loading"
              placeholder="请输入当前密码"
            />
          </div>
          
          <div class="form-group">
            <label for="newPassword">新密码</label>
            <input
              id="newPassword"
              v-model="form.newPassword"
              type="password"
              required
              :disabled="loading"
              placeholder="密码至少8位，包含字母和数字"
            />
            <div class="password-strength">
              <div class="strength-bar">
                <div 
                  class="strength-fill" 
                  :class="passwordStrengthClass"
                  :style="{ width: passwordStrengthWidth }"
                ></div>
              </div>
              <span class="strength-text" :class="passwordStrengthClass">
                {{ passwordStrengthText }}
              </span>
            </div>
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">确认新密码</label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              required
              :disabled="loading"
              placeholder="请再次输入新密码"
            />
          </div>
          
          <div v-if="error" class="error-message">
            {{ error }}
          </div>
          
          <div v-if="success" class="success-message">
            {{ success }}
          </div>
          
          <div class="form-actions">
            <button
              type="button"
              class="cancel-btn"
              @click="closeModal"
              :disabled="loading"
            >
              取消
            </button>
            <button
              type="submit"
              class="submit-btn"
              :disabled="loading || !isFormValid"
            >
              <span v-if="loading" class="loading-spinner"></span>
              {{ loading ? '修改中...' : '确认修改' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '../store/modules/authStore'

export default {
  name: 'PasswordModal',
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'success'],
  setup(props, { emit }) {
    const authStore = useAuthStore()
    
    const showModal = ref(props.show)
    const loading = ref(false)
    const error = ref('')
    const success = ref('')
    
    const form = ref({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    
    // 监听props变化
    watch(() => props.show, (newVal) => {
      showModal.value = newVal
      if (newVal) {
        resetForm()
      }
    })
    
    // 密码强度计算
    const passwordStrength = computed(() => {
      const password = form.value.newPassword
      if (!password) return 0
      
      let score = 0
      
      // 长度检查
      if (password.length >= 8) score += 1
      if (password.length >= 12) score += 1
      
      // 字符类型检查
      if (/[a-z]/.test(password)) score += 1
      if (/[A-Z]/.test(password)) score += 1
      if (/[0-9]/.test(password)) score += 1
      if (/[^a-zA-Z0-9]/.test(password)) score += 1
      
      return Math.min(score, 4)
    })
    
    const passwordStrengthClass = computed(() => {
      const strength = passwordStrength.value
      if (strength <= 1) return 'weak'
      if (strength <= 2) return 'fair'
      if (strength <= 3) return 'good'
      return 'strong'
    })
    
    const passwordStrengthWidth = computed(() => {
      return `${(passwordStrength.value / 4) * 100}%`
    })
    
    const passwordStrengthText = computed(() => {
      const strength = passwordStrength.value
      if (strength <= 1) return '弱'
      if (strength <= 2) return '一般'
      if (strength <= 3) return '良好'
      return '强'
    })
    
    // 表单验证
    const isFormValid = computed(() => {
      const { currentPassword, newPassword, confirmPassword } = form.value
      
      if (!currentPassword || !newPassword || !confirmPassword) return false
      
      // 新密码强度检查
      if (passwordStrength.value < 2) return false
      
      // 密码确认检查
      if (newPassword !== confirmPassword) return false
      
      // 新密码不能与当前密码相同
      if (currentPassword === newPassword) return false
      
      return true
    })
    
    // 重置表单
    const resetForm = () => {
      form.value = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
      error.value = ''
      success.value = ''
    }
    
    // 关闭模态框
    const closeModal = () => {
      if (success.value) {
        // 如果修改成功，延迟关闭以显示成功消息
        setTimeout(() => {
          showModal.value = false
          emit('close')
        }, 1500)
      } else {
        showModal.value = false
        emit('close')
      }
    }
    
    // 处理表单提交
    const handleSubmit = async () => {
      if (!isFormValid.value || loading.value) return
      
      loading.value = true
      error.value = ''
      success.value = ''
      
      try {
        const { currentPassword, newPassword } = form.value
        
        await authStore.updatePassword({
          currentPassword,
          newPassword
        })
        
        success.value = '密码修改成功！'
        emit('success')
        
        // 自动关闭模态框
        setTimeout(() => {
          closeModal()
        }, 1500)
        
      } catch (err) {
        error.value = err.message || '密码修改失败，请重试'
      } finally {
        loading.value = false
      }
    }
    
    return {
      showModal,
      loading,
      error,
      success,
      form,
      isFormValid,
      passwordStrengthClass,
      passwordStrengthWidth,
      passwordStrengthText,
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
  max-width: 450px;
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

.password-strength {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.strength-bar {
  flex: 1;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s;
  border-radius: 2px;
}

.strength-fill.weak {
  background: #ef4444;
}

.strength-fill.fair {
  background: #f59e0b;
}

.strength-fill.good {
  background: #3b82f6;
}

.strength-fill.strong {
  background: #10b981;
}

.strength-text {
  font-size: 12px;
  font-weight: 500;
  min-width: 30px;
}

.strength-text.weak {
  color: #ef4444;
}

.strength-text.fair {
  color: #f59e0b;
}

.strength-text.good {
  color: #3b82f6;
}

.strength-text.strong {
  color: #10b981;
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

.success-message {
  background: #f0fff4;
  color: #22543d;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  border: 1px solid #9ae6b4;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancel-btn {
  padding: 12px 20px;
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover:not(:disabled) {
  background: #e9ecef;
}

.submit-btn {
  padding: 12px 20px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 100px;
}

.submit-btn:hover:not(:disabled) {
  background: #4338ca;
}

.submit-btn:disabled,
.cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
</style>