<template>
  <!-- 任务模态框 -->
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ isEditing ? '编辑任务' : '新建任务' }}</h3>
        <button @click="closeModal" class="close-btn">×</button>
      </div>
      
      <form @submit.prevent="saveTask" class="task-form">
        <!-- 任务标题 -->
        <div class="form-group">
          <label for="taskTitle">任务标题 *</label>
          <input
            id="taskTitle"
            type="text"
            v-model="taskForm.title"
            placeholder="请输入任务标题"
            required
            class="form-input"
            :class="{ 'error': errors.title }"
          >
          <span v-if="errors.title" class="error-text">{{ errors.title }}</span>
        </div>
        
        <!-- 任务描述 -->
        <div class="form-group">
          <label for="taskDescription">任务描述</label>
          <textarea
            id="taskDescription"
            v-model="taskForm.description"
            placeholder="请输入任务描述（可选）"
            rows="3"
            class="form-textarea"
          ></textarea>
        </div>
        
        <!-- 日期和时间 -->
        <div class="form-row">
          <div class="form-group">
            <label for="taskDate">日期 *</label>
            <input
              id="taskDate"
              type="date"
              v-model="taskForm.date"
              required
              class="form-input"
              :class="{ 'error': errors.date }"
            >
            <span v-if="errors.date" class="error-text">{{ errors.date }}</span>
          </div>
          
          <div class="form-group">
            <label for="taskStartTime">开始时间</label>
            <input
              id="taskStartTime"
              type="time"
              v-model="taskForm.startTime"
              class="form-input"
            >
          </div>
          
          <div class="form-group">
            <label for="taskEndTime">结束时间</label>
            <input
              id="taskEndTime"
              type="time"
              v-model="taskForm.endTime"
              class="form-input"
              :class="{ 'error': errors.endTime }"
            >
            <span v-if="errors.endTime" class="error-text">{{ errors.endTime }}</span>
          </div>
        </div>
        
        <!-- 标签设置 -->
        <div class="form-group">
          <label for="taskTag">标签</label>
          <input
            id="taskTag"
            type="text"
            v-model="taskForm.tag"
            placeholder="请输入标签名称"
            class="form-input"
            list="tagSuggestions"
          >
          <datalist id="tagSuggestions">
            <option v-for="tag in availableTags" :key="tag" :value="tag"></option>
          </datalist>
        </div>
        
        <!-- 标签颜色选择 -->
        <div class="form-group">
          <label>标签颜色</label>
          <div class="color-selection">
            <!-- 预设颜色 -->
            <div class="color-section">
              <h4>预设颜色</h4>
              <div class="color-grid">
                <div
                  v-for="color in presetColors"
                  :key="color"
                  class="color-option"
                  :class="{ 'selected': taskForm.tagColor === color }"
                  :style="{ backgroundColor: color }"
                  @click="selectColor(color)"
                  :title="color"
                ></div>
              </div>
            </div>
            
            <!-- 历史使用颜色 -->
            <div v-if="usedColors.length > 0" class="color-section">
              <h4>最近使用</h4>
              <div class="color-grid">
                <div
                  v-for="color in usedColors"
                  :key="color"
                  class="color-option"
                  :class="{ 'selected': taskForm.tagColor === color }"
                  :style="{ backgroundColor: color }"
                  @click="selectColor(color)"
                  :title="color"
                ></div>
              </div>
            </div>
            
            <!-- 自定义颜色 -->
            <div class="color-section">
              <h4>自定义颜色</h4>
              <div class="custom-color-input">
                <input
                  type="color"
                  v-model="customColor"
                  @change="selectColor(customColor)"
                  class="color-picker"
                >
                <input
                  type="text"
                  v-model="customColor"
                  @input="selectColor(customColor)"
                  placeholder="#000000"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  class="color-input"
                >
              </div>
            </div>
          </div>
        </div>
        
        <!-- 重复设置 -->
        <div class="form-group">
          <label for="taskRepeat">重复</label>
          <select id="taskRepeat" v-model="taskForm.repeat" class="form-select">
            <option value="none">不重复</option>
            <option value="daily">每天</option>
            <option value="weekdays">工作日</option>
            <option value="weekly">每周</option>
            <option value="monthly">每月</option>
          </select>
        </div>
        
        <!-- 重复任务编辑选项 -->
        <div v-if="isEditing && originalTask && originalTask.repeat && originalTask.repeat !== 'none'" class="form-group">
          <label>编辑重复任务</label>
          <div class="repeat-edit-options">
            <label class="radio-option">
              <input type="radio" v-model="editRepeatOption" value="single">
              <span>仅编辑此任务</span>
            </label>
            <label class="radio-option">
              <input type="radio" v-model="editRepeatOption" value="all">
              <span>编辑所有重复任务</span>
            </label>
          </div>
        </div>
        
        <!-- 表单按钮 -->
        <div class="form-actions">
          <button type="button" @click="closeModal" class="btn btn-secondary">
            取消
          </button>
          <button 
            v-if="isEditing" 
            type="button" 
            @click="showDeleteConfirm" 
            class="btn btn-danger"
          >
            删除
          </button>
          <button type="submit" class="btn btn-primary" :disabled="!isFormValid">
            {{ isEditing ? '保存' : '创建' }}
          </button>
        </div>
      </form>
    </div>
  </div>
  
  <!-- 删除确认模态框 -->
  <div v-if="showDeleteModal" class="modal-overlay" @click="cancelDelete">
    <div class="modal-content delete-modal" @click.stop>
      <div class="modal-header">
        <h3>确认删除</h3>
        <button @click="cancelDelete" class="close-btn">×</button>
      </div>
      
      <div class="modal-body">
        <p>确定要删除任务 "{{ taskForm.title }}" 吗？</p>
        
        <!-- 重复任务删除选项 -->
        <div v-if="originalTask && originalTask.repeat && originalTask.repeat !== 'none'" class="delete-options">
          <label class="radio-option">
            <input type="radio" v-model="deleteRepeatOption" value="single">
            <span>仅删除此任务</span>
          </label>
          <label class="radio-option">
            <input type="radio" v-model="deleteRepeatOption" value="all">
            <span>删除所有重复任务</span>
          </label>
        </div>
      </div>
      
      <div class="modal-footer">
        <button @click="cancelDelete" class="btn btn-secondary">取消</button>
        <button @click="confirmDelete" class="btn btn-danger">确认删除</button>
      </div>
    </div>
  </div>
</template>

<script>
import { useTaskStore } from '../store/modules/taskStore'
import { validationService } from '../services/validationService'
import { dateService } from '../services/dateService'

export default {
  name: 'TaskModal',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    task: {
      type: Object,
      default: null
    },
    selectedDate: {
      type: String,
      default: null
    }
  },
  emits: ['close', 'save', 'delete'],
  setup() {
    const taskStore = useTaskStore()
    return { taskStore }
  },
  data() {
    return {
      taskForm: {
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        tag: '',
        tagColor: '#3498db',
        repeat: 'none',
        completed: false
      },
      originalTask: null,
      editRepeatOption: 'single',
      deleteRepeatOption: 'single',
      showDeleteModal: false,
      customColor: '#3498db',
      errors: {},
      presetColors: [
        '#3498db', '#e74c3c', '#2ecc71', '#f39c12',
        '#9b59b6', '#1abc9c', '#34495e', '#e67e22',
        '#95a5a6', '#f1c40f', '#8e44ad', '#16a085',
        '#2c3e50', '#d35400', '#7f8c8d', '#27ae60'
      ]
    }
  },
  computed: {
    isEditing() {
      return !!this.task
    },
    
    availableTags() {
      return this.taskStore.availableTags
    },
    
    usedColors() {
      return this.taskStore.usedColors
    },
    
    isFormValid() {
      return this.taskForm.title.trim() && 
             this.taskForm.date && 
             Object.keys(this.errors).length === 0
    }
  },
  watch: {
    isVisible(newVal) {
      if (newVal) {
        this.initForm()
        this.validateForm()
      } else {
        this.resetForm()
      }
    },
    
    task: {
      handler() {
        if (this.isVisible) {
          this.initForm()
        }
      },
      deep: true
    },
    
    'taskForm.title'() {
      // 实时验证标题
      if (this.taskForm.title.trim()) {
        delete this.errors.title
      } else {
        this.errors.title = '任务标题不能为空'
      }
    },
    
    'taskForm.date'() {
      // 实时验证日期
      if (this.taskForm.date) {
        if (dateService.isValidDate(this.taskForm.date)) {
          delete this.errors.date
        } else {
          this.errors.date = '日期格式不正确'
        }
      } else {
        this.errors.date = '请选择日期'
      }
    },
    
    'taskForm.startTime'() {
      this.validateTime()
    },
    
    'taskForm.endTime'() {
      this.validateTime()
    }
  },
  methods: {
    initForm() {
      if (this.task) {
        // 编辑模式
        this.originalTask = { ...this.task }
        this.taskForm = {
          title: this.task.title || '',
          description: this.task.description || '',
          date: this.task.date || '',
          startTime: this.task.startTime || '',
          endTime: this.task.endTime || '',
          tag: this.task.tag || '',
          tagColor: this.task.tagColor || '#3498db',
          repeat: this.task.repeat || 'none',
          completed: this.task.completed || false
        }
        this.customColor = this.taskForm.tagColor
      } else {
        // 新建模式
        this.originalTask = null
        this.taskForm = {
          title: '',
          description: '',
          date: this.selectedDate || dateService.getToday(),
          startTime: '',
          endTime: '',
          tag: '',
          tagColor: '#3498db',
          repeat: 'none',
          completed: false
        }
        this.customColor = '#3498db'
      }
      
      this.editRepeatOption = 'single'
      this.deleteRepeatOption = 'single'
      this.errors = {}
    },
    
    resetForm() {
      this.taskForm = {
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        tag: '',
        tagColor: '#3498db',
        repeat: 'none',
        completed: false
      }
      this.originalTask = null
      this.editRepeatOption = 'single'
      this.deleteRepeatOption = 'single'
      this.showDeleteModal = false
      this.customColor = '#3498db'
      this.errors = {}
    },
    
    validateForm() {
      this.errors = {}
      
      // 验证标题
      if (!this.taskForm.title.trim()) {
        this.errors.title = '任务标题不能为空'
      }
      
      // 验证日期
      if (!this.taskForm.date) {
        this.errors.date = '请选择日期'
      } else if (!dateService.isValidDate(this.taskForm.date)) {
        this.errors.date = '日期格式不正确'
      }
      
      this.validateTime()
    },
    
    validateTime() {
      if (this.taskForm.startTime && this.taskForm.endTime) {
        if (this.taskForm.startTime >= this.taskForm.endTime) {
          this.errors.endTime = '结束时间必须晚于开始时间'
        } else {
          delete this.errors.endTime
        }
      } else {
        delete this.errors.endTime
      }
    },
    
    selectColor(color) {
      this.taskForm.tagColor = color
      this.customColor = color
    },
    
    saveTask() {
      this.validateForm()
      
      if (!this.isFormValid) {
        return
      }
      
      const taskData = {
        ...this.taskForm,
        id: this.originalTask?.id || this.generateTaskId(),
        status: this.calculateTaskStatus()
      }
      
      // 添加颜色到历史记录
      if (this.taskForm.tagColor) {
        this.taskStore.addToUsedColors(this.taskForm.tagColor)
      }
      
      this.$emit('save', {
        task: taskData,
        isEditing: this.isEditing,
        editOption: this.editRepeatOption,
        originalTask: this.originalTask
      })
      
      this.closeModal()
    },
    
    showDeleteConfirm() {
      this.showDeleteModal = true
    },
    
    confirmDelete() {
      this.$emit('delete', {
        task: this.originalTask,
        deleteOption: this.deleteRepeatOption
      })
      
      this.showDeleteModal = false
      this.closeModal()
    },
    
    cancelDelete() {
      this.showDeleteModal = false
    },
    
    closeModal() {
      this.$emit('close')
    },
    
    generateTaskId() {
      return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    },
    
    calculateTaskStatus() {
      if (this.taskForm.completed) {
        return 'completed'
      }
      
      const today = dateService.getToday()
      const taskDate = this.taskForm.date
      
      if (taskDate < today) {
        return 'overdue'
      } else if (taskDate === today) {
        return 'in-progress'
      } else {
        return 'pending'
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
  max-width: 600px;
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

.task-form {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  color: #333;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.form-input.error {
  border-color: #e74c3c;
}

.error-text {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 4px;
  display: block;
}

.color-selection {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 16px;
  background: #f8f9fa;
}

.color-section {
  margin-bottom: 16px;
}

.color-section:last-child {
  margin-bottom: 0;
}

.color-section h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
  font-weight: 600;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.color-option:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.color-option.selected {
  border-color: #333;
  transform: scale(1.1);
  box-shadow: 0 0 0 2px rgba(51, 51, 51, 0.3);
}

.custom-color-input {
  display: flex;
  gap: 12px;
  align-items: center;
}

.color-picker {
  width: 50px;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
}

.color-input {
  flex: 1;
  max-width: 120px;
}

.repeat-edit-options,
.delete-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.radio-option:hover {
  background: #f0f0f0;
}

.radio-option input[type="radio"] {
  margin: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
  min-width: 80px;
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

.btn-secondary:hover {
  background: #7f8c8d;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background: #c0392b;
}

.delete-modal {
  max-width: 400px;
}

.modal-body {
  padding: 20px 24px;
}

.modal-body p {
  margin: 0 0 16px 0;
  color: #333;
  line-height: 1.5;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 10px;
  }
  
  .modal-content {
    max-height: 95vh;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .color-grid {
    grid-template-columns: repeat(6, 1fr);
  }
  
  .custom-color-input {
    flex-direction: column;
    align-items: stretch;
  }
  
  .color-input {
    max-width: none;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>