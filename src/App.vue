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
        <input type="text" v-model="searchTerm" @focus="onSearchFocus" @input="onSearchInput" placeholder="搜索任务..." class="search-input">
      </div>

      <!-- 日历/列表视图 -->
      <div class="main-content">
        <div class="calendar-days-of-week" v-if="viewMode === 'month' || viewMode === 'week'">
        <div v-for="dayName in ['日', '一', '二', '三', '四', '五', '六']" :key="dayName">{{ dayName }}</div>
      </div>
      <div class="calendar-grid" v-if="viewMode === 'month'">
          <div class="calendar-day" :class="{ 'is-empty': !day.day }" v-for="(day, index) in monthDays" :key="index" @click="day.day ? openTaskModal(null, day.date) : null">
          <div class="day-number">{{ day.day }}</div>
          <div class="tasks">
            <div class="task" v-for="task in day.tasks" :key="task.id" 
                  :style="{ 
                    backgroundColor: task.tagColor || '#3498db', 
                    color: getTextColor(task.tagColor || '#3498db'),
                    fontWeight: getFontWeight(task.tagColor || '#3498db'),
                    fontSize: getFontSize(task.tagColor || '#3498db'),
                    textShadow: getTextShadow(task.tagColor || '#3498db')
                  }" 
                  :class="{ 'completed': task.completed }">
               <input 
                 type="checkbox" 
                 v-model="task.completed" 
                 @change="updateTaskStatus(task)"
                 @click.stop
                 class="task-checkbox"
               >
               <span @click.stop="openTaskModal(task)" class="task-title">{{ task.title }}</span>
             </div>
          </div>
        </div>
      </div>
      <div v-else-if="viewMode === 'week'" class="week-view">
        <div class="calendar-day" v-for="day in weekDays" :key="day.date" @click="openTaskModal(null, day.date)">
          <div class="day-number">{{ day.day }}</div>
          <div class="tasks">
            <div class="task" v-for="task in day.tasks" :key="task.id" 
                  :style="{ 
                    backgroundColor: task.tagColor || '#3498db', 
                    color: getTextColor(task.tagColor || '#3498db'),
                    fontWeight: getFontWeight(task.tagColor || '#3498db'),
                    fontSize: getFontSize(task.tagColor || '#3498db'),
                    textShadow: getTextShadow(task.tagColor || '#3498db')
                  }" 
                  :class="{ 'completed': task.completed }">
               <input 
                 type="checkbox" 
                 v-model="task.completed" 
                 @change="updateTaskStatus(task)"
                 @click.stop
                 class="task-checkbox"
               >
               <span @click.stop="openTaskModal(task)" class="task-title">{{ task.title }}</span>
             </div>
          </div>
        </div>
      </div>
      <div v-else-if="viewMode === 'list'" class="list-view">
        <div class="task-list-item" v-for="task in filteredTasks" :key="task.id" :class="{ 'completed': task.completed }">
          <div class="task-details">
            <input 
              type="checkbox" 
              v-model="task.completed" 
              @change="updateTaskStatus(task)"
              @click.stop
              class="task-checkbox"
            >
            <span class="task-status" :title="task.status">{{ statusSymbols[task.status] }}</span>
            <span @click="openTaskModal(task)" class="task-title">{{ task.title }}</span>
            <span class="task-date">{{ task.date }}</span>
            <span v-if="task.tag" class="task-tag" 
                   :style="{ 
                     backgroundColor: task.tagColor || '#3498db', 
                     color: getTextColor(task.tagColor || '#3498db'),
                     fontWeight: getFontWeight(task.tagColor || '#3498db'),
                     fontSize: getFontSize(task.tagColor || '#3498db'),
                     textShadow: getTextShadow(task.tagColor || '#3498db')
                   }">{{ task.tag }}</span>
          </div>
        </div>
      </div>
      </div>

      <!-- 备份管理模态框 -->
      <div v-if="showBackupModal" class="modal-overlay" @click="closeBackupModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>备份管理</h3>
            <button @click="closeBackupModal" class="close-btn">&times;</button>
          </div>
          <form class="task-form">
            <div class="form-group">
              <label>自动备份设置</label>
              <label class="setting-label">
                <input type="checkbox" v-model="autoBackup">
                开启自动备份（每小时）
              </label>
              <p class="last-backup">上次备份时间：{{ lastBackupTime }}</p>
            </div>

            <div class="form-group">
              <label>备份历史</label>
              <div v-if="backupHistory.length === 0" class="no-backups">没有备份记录</div>
              <div v-else class="backup-list">
                <div v-for="(backup, index) in backupHistory" :key="index" class="backup-item">
                  <div class="backup-info">
                    <div class="backup-date">{{ backup.time }}</div>
                    <div class="backup-details">
                      <span class="backup-type" :class="backup.type">{{ backup.type }}</span>
                      <span>{{ backup.taskCount }}个任务</span>
                    </div>
                  </div>
                  <div class="backup-actions">
                    <button @click="restoreBackup(index)" class="btn-save">恢复</button>
              <button @click="deleteBackup(index)" class="btn-delete">删除</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" @click="manualBackup" class="btn-save">立即备份</button>
            </div>
          </form>
        </div>
      </div>

      <!-- 任务模态框 -->
      <div v-if="showTaskModal" class="modal-overlay" @click="closeTaskModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>{{ editingTask ? '编辑任务' : '新建任务' }}</h3>
            <button @click="closeTaskModal" class="close-btn">&times;</button>
          </div>
          <form @submit.prevent="saveTask" class="task-form">
            <div class="form-group">
              <label for="taskTitle">任务名称</label>
              <input 
                type="text" 
                id="taskTitle" 
                v-model="taskForm.title" 
                required 
                placeholder="请输入任务名称"
              >
            </div>
            
            <div class="form-group">
              <label for="taskDescription">任务描述</label>
              <textarea 
                id="taskDescription" 
                v-model="taskForm.description" 
                placeholder="请输入任务描述（可选）"
                rows="3"
              ></textarea>
            </div>
            
            <div class="form-group">
              <label for="taskDate">任务日期</label>
              <input 
                type="date" 
                id="taskDate" 
                v-model="taskForm.date" 
                required
              >
            </div>
            
            <div class="form-group">
              <label for="taskStartTime">开始时间</label>
              <input 
                type="time" 
                id="taskStartTime" 
                v-model="taskForm.startTime"
              >
            </div>
            
            <div class="form-group">
              <label for="taskEndTime">结束时间</label>
              <input 
                type="time" 
                id="taskEndTime" 
                v-model="taskForm.endTime"
              >
            </div>
            
            <div class="form-group">
              <label>任务标签:</label>
              <input type="text" v-model="taskForm.customTagName" placeholder="输入标签名称（可选）" @focus="showTagColorOptions = true">
            </div>
            
            <div v-if="showTagColorOptions" class="form-group">
              <label>标签颜色:</label>
              <div class="color-selection">
                <!-- 预设颜色选项 -->
                <div class="color-presets">
                  <label class="color-section-label">推荐颜色:</label>
                  <div class="color-preset-grid">
                    <div 
                      v-for="preset in currentPresetColors" 
                      :key="preset.color"
                      class="color-option preset-color"
                      :class="{ active: taskForm.customTagColor === preset.color }"
                      :style="{ backgroundColor: preset.color }"
                      @click="taskForm.customTagColor = preset.color"
                      :title="`${preset.name} (${preset.color})`"
                    ></div>
                  </div>
                </div>
                
                <!-- 历史颜色选项 -->
                <div v-if="usedColors.length > 0" class="color-history">
                  <label class="color-section-label">最近使用:</label>
                  <div class="color-history-grid">
                    <div 
                      v-for="color in usedColors" 
                      :key="color"
                      class="color-option history-color"
                      :class="{ active: taskForm.customTagColor === color }"
                      :style="{ backgroundColor: color }"
                      @click="taskForm.customTagColor = color"
                      :title="color"
                    ></div>
                  </div>
                </div>
                
                <!-- 自定义颜色选择器 -->
                <div class="custom-color">
                  <label class="color-section-label">自定义颜色:</label>
                  <input type="color" v-model="taskForm.customTagColor" class="color-picker">
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label for="taskRepeat">重复设置</label>
              <select id="taskRepeat" v-model="taskForm.repeat" :disabled="editingTask && editingTask.recurring">
                <option value="none">不重复</option>
                <option value="daily">每天</option>
                <option value="weekdays">工作日（周一到周五）</option>
                <option value="weekly">每周</option>
                <option value="monthly">每月</option>
              </select>
            </div>
            
            <!-- 重复任务编辑选项 -->
            <div v-if="editingTask && editingTask.recurring" class="form-group">
              <label>编辑重复任务:</label>
              <div class="radio-group">
                <label class="radio-option">
                  <input type="radio" v-model="editRecurringOption" value="single">
                  <span>  仅修改当天</span>
                </label>
                <label class="radio-option">
                  <input type="radio" v-model="editRecurringOption" value="all">
                  <span>  修改所有重复任务</span>
                </label>
              </div>
            </div>
            
            <!-- 删除重复任务选项 -->
            <div v-if="editingTask && editingTask.recurring && showDeleteOptions" class="form-group">
              <label>删除重复任务:</label>
              <div class="radio-group">
                <label class="radio-option">
                  <input type="radio" v-model="deleteRecurringOption" value="single">
                  <span>  仅删除当天</span>
                </label>
                <label class="radio-option">
                  <input type="radio" v-model="deleteRecurringOption" value="all">
                  <span>  删除所有重复任务</span>
                </label>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" @click="closeTaskModal" class="btn-cancel">取消</button>
              <button v-if="editingTask" type="button" @click="showDeleteConfirm" class="btn-delete">删除</button>
              <button type="submit" class="btn-save">{{ editingTask ? '更新' : '保存' }}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>

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
 </template>

<script>
export default {
  data() {
    return {
      showBackupModal: false,
      autoBackup: false,
      autoBackupInterval: null,
      backupHistory: [],
      lastBackupTime: '无',
      currentDate: new Date(),
      viewMode: 'month', // 'month', 'week', 'list'
      tasks: [],
      monthDays: [],
      weekDays: [],
      searchTerm: '',
      showTaskModal: false,
      editingTask: null,
      editRecurringOption: 'single',
      showDeleteOptions: false,
      deleteRecurringOption: 'single',
      showDeleteConfirmModal: false,
      deleteConfirmMessage: '',
      showMessageModal: false,
      messageModalType: 'info', // 'info', 'success', 'error', 'confirm'
      messageModalTitle: '',
      messageModalContent: '',
      messageModalCallback: null,
      taskForm: {
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        customTagName: '',
        customTagColor: '#3498db',
        repeat: 'none',
        status: 'pending'
      },
      statusSymbols: {
        pending: '⏳',
        'in-progress': '▶',
        completed: '✔',
        overdue: '⚠'
      },
      taskTags: {},
      usedColors: [], // 存储用户使用过的颜色
      showTagColorOptions: false, // 控制标签颜色选项的显示
      // 主题配置 - 为未来主题功能预留
      currentTheme: 'default',
      themes: {
        default: {
          name: '默认主题',
          presetColors: [
            { name: '蓝色', color: '#3498db', category: 'primary' },
            { name: '绿色', color: '#2ecc71', category: 'success' },
            { name: '橙色', color: '#f39c12', category: 'warning' },
            { name: '红色', color: '#e74c3c', category: 'danger' },
            { name: '紫色', color: '#9b59b6', category: 'info' },
            { name: '青色', color: '#1abc9c', category: 'teal' },
            { name: '深蓝', color: '#34495e', category: 'dark' },
            { name: '灰色', color: '#95a5a6', category: 'secondary' },
            { name: '粉色', color: '#e91e63', category: 'pink' },
            { name: '靛蓝', color: '#6c5ce7', category: 'indigo' },
            { name: '黄绿', color: '#a4de6c', category: 'lime' },
            { name: '深橙', color: '#fd79a8', category: 'coral' }
          ]
        }
        // 未来可以添加更多主题，如 dark、colorful 等
      }
    };
  },
  computed: {
    currentDateDisplay() {
      return this.currentDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
    },
    // 获取当前主题的预设颜色
    currentPresetColors() {
      return this.themes[this.currentTheme]?.presetColors || [];
    },
    filteredTasks() {
      if (!this.searchTerm) {
        return this.tasks;
      }
      const searchTermLower = this.searchTerm.toLowerCase();
      return this.tasks.filter(task => {
        const titleMatch = task.title && task.title.toLowerCase().includes(searchTermLower);
        const descriptionMatch = task.description && task.description.toLowerCase().includes(searchTermLower);
        const tagMatch = task.tag && task.tag.toLowerCase().includes(searchTermLower);
        return titleMatch || descriptionMatch || tagMatch;
      });
    }
  },
  watch: {
    autoBackup(newVal) {
      if (newVal) {
        this.autoBackupInterval = setInterval(() => {
          const backup = {
            time: new Date().toLocaleString(),
            type: 'auto',
            taskCount: this.tasks.length,
            data: JSON.parse(JSON.stringify(this.tasks))
          };
          this.backupHistory.unshift(backup);
          if (this.backupHistory.length > 10) { // Keep last 10 auto backups
            this.backupHistory.pop();
          }
          this.saveBackupHistory();
        }, 3600000); // 1 hour
      } else {
        clearInterval(this.autoBackupInterval);
      }
    }
  },
  methods: {
    async loadTasks() {
      try {
        // 首先尝试从本地存储加载
        const localTasks = localStorage.getItem('calendar-tasks');
        if (localTasks) {
          this.tasks = JSON.parse(localTasks);
          this.loadUsedColors();
          this.render();
          return;
        }
        
        // 如果本地存储没有，则从JSON文件加载
        const response = await fetch('/calendar-tasks.json');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        this.tasks = await response.json();
        // 从现有任务中提取颜色
        this.extractColorsFromTasks();
        // 首次加载后保存到本地存储
        await this.saveTasks();
        this.render();
      } catch (error) {
        console.error('Failed to load tasks:', error);
        this.tasks = [];
      }
    },
    render() {
      if (this.viewMode === 'month') {
        this.renderMonthView();
      } else if (this.viewMode === 'week') {
        this.renderWeekView();
      } else {
        this.renderListView();
      }
    },
    
    renderMonthView() {
      const year = this.currentDate.getFullYear();
      const month = this.currentDate.getMonth();
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);
      const daysInMonth = lastDayOfMonth.getDate();
      const startDayOfWeek = firstDayOfMonth.getDay();

      const days = [];
      for (let i = 0; i < startDayOfWeek; i++) {
        days.push({ day: '', tasks: [] });
      }

      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const dateString = `${y}-${m}-${d}`;
        const tasksForDay = this.tasks.filter(task => task.date === dateString);
        days.push({ date: dateString, day: i, tasks: tasksForDay });
      }

      this.monthDays = days;
    },
    renderWeekView() {
      const year = this.currentDate.getFullYear();
      const month = this.currentDate.getMonth();
      const day = this.currentDate.getDate();
      const dayOfWeek = this.currentDate.getDay();

      const week = [];
      const startOfWeek = new Date(year, month, day - dayOfWeek);

      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + i);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const dateString = `${y}-${m}-${d}`;
        const tasksForDay = this.tasks.filter(task => task.date === dateString);
        week.push({ date: dateString, day: date.getDate(), tasks: tasksForDay });
      }

      this.weekDays = week;
    },
    renderListView() {
      // The list view is now rendered reactively using the 'filteredTasks' computed property.
      // No specific rendering logic is needed here anymore.
    },
    navigate(direction) {
      const newDate = new Date(this.currentDate);
      if (this.viewMode === 'month') {
        newDate.setMonth(newDate.getMonth() + direction);
      } else if (this.viewMode === 'week') {
        newDate.setDate(newDate.getDate() + (7 * direction));
      }
      this.currentDate = newDate;
      this.render();
    },
    switchView(view) {
      this.viewMode = view;
      this.render();
    },
    openTaskModal(task = null, date = null) {
      this.editingTask = task;
      if (task) {
        // 编辑现有任务
        this.taskForm = {
          title: task.title || '',
          description: task.description || '',
          date: task.date || '',
          startTime: task.startTime || '',
          endTime: task.endTime || '',
          customTagName: task.tag || '',
          customTagColor: task.tagColor || '#3498db',
          repeat: task.repeat || 'none',
          status: task.status || 'pending'
        };
        // 如果已有标签名称，显示颜色选项
        this.showTagColorOptions = !!(task.tag);
        // 如果是重复任务，设置默认编辑选项
        this.editRecurringOption = 'single';
      } else {
        // 新建模式
        this.resetTaskForm();
        this.showTagColorOptions = false;
        this.editRecurringOption = 'single';
        if (date) {
          this.taskForm.date = date;
        } else {
          // 默认设置为今天
          const today = new Date();
          this.taskForm.date = today.toISOString().split('T')[0];
        }
      }
      this.showTaskModal = true;
    },
    closeTaskModal() {
      this.showTaskModal = false;
      this.editingTask = null;
      this.showDeleteOptions = false;
      this.deleteRecurringOption = 'single';
      this.showDeleteConfirmModal = false;
      this.deleteConfirmMessage = '';
      this.showTagColorOptions = false;
      this.resetTaskForm();
    },
    resetTaskForm() {
      this.taskForm = {
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        tag: '',
        customTagName: '',
        customTagColor: '#3498db',
        repeat: 'none',
        status: 'pending'
      };
    },
    async saveTask() {
      try {
        if (!this.taskForm.title || !this.taskForm.date) {
          this.showMessage('error', '输入错误', '请填写任务标题和日期');
          return;
        }

        // 计算任务状态
        const taskDate = new Date(this.taskForm.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        taskDate.setHours(0, 0, 0, 0);
        
        let taskStatus = 'pending';
        if (taskDate.getTime() === today.getTime()) {
          taskStatus = 'in-progress';
        } else if (taskDate < today) {
          taskStatus = 'overdue';
        }

        // 处理自定义标签
        if (this.taskForm.customTagName) {
          const customTagKey = this.taskForm.customTagName.toLowerCase().replace(/\s+/g, '_');
          this.taskTags[customTagKey] = {
            name: this.taskForm.customTagName,
            color: this.taskForm.customTagColor
          };
          this.taskForm.tag = customTagKey;
        }

        const taskData = {
          id: this.editingTask ? this.editingTask.id : this.generateTaskId(),
          title: this.taskForm.title,
          description: this.taskForm.description,
          date: this.taskForm.date,
          startTime: this.taskForm.startTime,
          endTime: this.taskForm.endTime,
          tag: this.taskForm.customTagName || '',
          tagColor: this.taskForm.customTagName ? this.taskForm.customTagColor : '#3498db',
          repeat: this.taskForm.repeat,
          status: this.editingTask ? this.editingTask.status : taskStatus,
          completed: this.editingTask ? this.editingTask.completed : false
        };

        if (this.editingTask) {
          // 更新现有任务
          if (this.editingTask.recurring && this.editRecurringOption === 'all') {
            // 修改所有重复任务
            const recurringTasks = this.tasks.filter(t => 
              t.recurring && 
              t.recurring.originalDate === this.editingTask.recurring.originalDate &&
              t.recurring.type === this.editingTask.recurring.type
            );
            
            recurringTasks.forEach(task => {
              const index = this.tasks.findIndex(t => t.id === task.id);
              if (index !== -1) {
                this.tasks[index] = {
                  ...this.tasks[index],
                  title: taskData.title,
                  description: taskData.description,
                  startTime: taskData.startTime,
                  endTime: taskData.endTime,
                  tag: taskData.tag,
                  tagColor: taskData.tagColor
                  // 注意：不修改日期和重复设置
                };
              }
            });
          } else {
            // 仅修改当前任务
            const index = this.tasks.findIndex(t => t.id === this.editingTask.id);
            if (index !== -1) {
              this.tasks[index] = { 
                ...taskData, 
                id: this.editingTask.id,
                recurring: this.editingTask.recurring // 保持原有的重复信息
              };
            }
          }
        } else {
          // 创建新任务
          const newTasks = this.createTasksWithRepeat(taskData);
          this.tasks.push(...newTasks);
        }

        // 记录使用的颜色
        if (taskData.tag && taskData.tagColor) {
          this.addToUsedColors(taskData.tagColor);
        }

        // 保存到本地存储或服务器
        await this.saveTasks();
        this.render();
        this.closeTaskModal();
      } catch (error) {
        console.error('保存任务失败:', error);
        this.showMessage('error', '保存失败', '保存任务失败，请重试');
      }
    },
    createTasksWithRepeat(taskData) {
      const tasks = [];
      const baseTask = { ...taskData };
      delete baseTask.customTagName;
      delete baseTask.customTagColor;
      
      if (taskData.repeat === 'none') {
        // 不重复，只创建一个任务
        tasks.push({
          ...baseTask,
          id: this.generateTaskId()
        });
      } else {
        // 创建重复任务（半年内）
        const startDate = new Date(taskData.date);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 6); // 半年后
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
          if (this.shouldCreateTaskOnDate(currentDate, taskData.repeat, startDate)) {
            // 计算每个重复任务的状态
            const taskDate = new Date(currentDate);
            taskDate.setHours(0, 0, 0, 0);
            
            let taskStatus = 'pending';
            if (taskDate.getTime() === today.getTime()) {
              taskStatus = 'in-progress';
            } else if (taskDate < today) {
              taskStatus = 'overdue';
            }

            tasks.push({
              ...baseTask,
              id: this.generateTaskId(),
              date: currentDate.toISOString().split('T')[0],
              status: taskStatus,
              completed: false,
              recurring: {
                type: taskData.repeat,
                originalDate: taskData.date
              }
            });
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
      
      return tasks;
    },
    shouldCreateTaskOnDate(date, repeatType, originalDate) {
      switch (repeatType) {
        case 'daily':
          return true;
        case 'weekdays':
          const dayOfWeek = date.getDay();
          return dayOfWeek >= 1 && dayOfWeek <= 5; // 周一到周五
        case 'weekly':
          return date.getDay() === originalDate.getDay();
        case 'monthly':
          return date.getDate() === originalDate.getDate();
        default:
          return false;
      }
    },
    generateTaskId() {
      return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    async saveTasks() {
      // 这里可以实现保存到服务器的逻辑
      // 目前先保存到本地存储
      localStorage.setItem('calendar-tasks', JSON.stringify(this.tasks));
      // 同时保存历史颜色
      localStorage.setItem('used-colors', JSON.stringify(this.usedColors));
    },
    openBackupModal() {
      this.showBackupModal = true;
    },
    closeBackupModal() {
      this.showBackupModal = false;
    },
    manualBackup() {
      const backup = {
        time: new Date().toLocaleString(),
        type: 'manual',
        taskCount: this.tasks.length,
        data: JSON.parse(JSON.stringify(this.tasks))
      };
      this.backupHistory.unshift(backup);
      this.lastBackupTime = backup.time;
      this.saveBackupHistory();
      this.showMessage('success', '备份成功', `已成功备份 ${this.tasks.length} 个任务`);
    },
    restoreBackup(index) {
      const backup = this.backupHistory[index];
      this.tasks = JSON.parse(JSON.stringify(backup.data));
      this.saveTasks();
      this.closeBackupModal();
    },
    deleteBackup(index) {
      this.backupHistory.splice(index, 1);
      this.saveBackupHistory();
    },
    saveBackupHistory() {
      localStorage.setItem('backupHistory', JSON.stringify(this.backupHistory));
    },
    loadBackupHistory() {
      const history = localStorage.getItem('backupHistory');
      if (history) {
        this.backupHistory = JSON.parse(history);
        const lastManualBackup = this.backupHistory.find(b => b.type === 'manual');
        if(lastManualBackup) this.lastBackupTime = lastManualBackup.time;
      }
    },
    async updateTaskStatus(task) {
      // 更新任务状态
      if (task.completed) {
        task.status = 'completed';
      } else {
        // 根据日期重新计算状态
        const taskDate = new Date(task.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        taskDate.setHours(0, 0, 0, 0);
        
        if (taskDate.getTime() === today.getTime()) {
          task.status = 'in-progress';
        } else if (taskDate < today) {
          task.status = 'overdue';
        } else {
          task.status = 'pending';
        }
      }
      
      // 保存更改
      await this.saveTasks();
      this.render();
    },
    exportTasks() {
      try {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `calendar-tasks-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        this.showMessage('success', '导出成功', '任务数据导出成功！');
      } catch (error) {
        console.error('导出失败:', error);
        this.showMessage('error', '导出失败', '导出失败，请重试');
      }
    },
    showDeleteConfirm() {
      if (this.editingTask && this.editingTask.recurring) {
        if (this.showDeleteOptions) {
          // 已经显示了删除选项，现在显示确认模态框
          this.deleteConfirmMessage = this.deleteRecurringOption === 'all' 
            ? '确定要删除所有重复任务吗？此操作不可撤销！' 
            : '确定要删除当前任务吗？';
          this.showDeleteConfirmModal = true;
        } else {
          // 显示删除选项
          this.showDeleteOptions = true;
          this.deleteRecurringOption = 'single';
        }
      } else {
        // 对于普通任务，直接显示确认模态框
        this.deleteConfirmMessage = '确定要删除这个任务吗？';
        this.showDeleteConfirmModal = true;
      }
    },
    confirmDelete() {
      this.showDeleteConfirmModal = false;
      this.deleteTask();
    },
    cancelDelete() {
       this.showDeleteConfirmModal = false;
       this.deleteConfirmMessage = '';
     },
     // 通用消息模态框方法
     showMessage(type, title, content, callback = null) {
       this.messageModalType = type;
       this.messageModalTitle = title;
       this.messageModalContent = content;
       this.messageModalCallback = callback;
       this.showMessageModal = true;
     },
     closeMessageModal() {
       if (this.messageModalType !== 'confirm') {
         this.showMessageModal = false;
         this.resetMessageModal();
       }
     },
     confirmMessageModal() {
       this.showMessageModal = false;
       if (this.messageModalCallback) {
         this.messageModalCallback(true);
       }
       this.resetMessageModal();
     },
     cancelMessageModal() {
       this.showMessageModal = false;
       if (this.messageModalCallback) {
         this.messageModalCallback(false);
       }
       this.resetMessageModal();
     },
     resetMessageModal() {
       this.messageModalType = 'info';
       this.messageModalTitle = '';
       this.messageModalContent = '';
       this.messageModalCallback = null;
     },
    async deleteTask() {
      try {
        if (!this.editingTask) return;
        
        if (this.editingTask.recurring) {
          if (this.deleteRecurringOption === 'all') {
            // 删除所有重复任务
            const recurringTasks = this.tasks.filter(t => 
              t.recurring && 
              t.recurring.originalDate === this.editingTask.recurring.originalDate &&
              t.recurring.type === this.editingTask.recurring.type
            );
            
            // 从任务列表中移除所有相关的重复任务
            recurringTasks.forEach(task => {
              const index = this.tasks.findIndex(t => t.id === task.id);
              if (index !== -1) {
                this.tasks.splice(index, 1);
              }
            });
            
            this.showMessage('success', '删除成功', `已删除 ${recurringTasks.length} 个重复任务`);
          } else {
            // 仅删除当前任务
            const index = this.tasks.findIndex(t => t.id === this.editingTask.id);
            if (index !== -1) {
              this.tasks.splice(index, 1);
              this.showMessage('success', '删除成功', '已删除当前任务');
            }
          }
        } else {
          // 删除普通任务
          const index = this.tasks.findIndex(t => t.id === this.editingTask.id);
          if (index !== -1) {
            this.tasks.splice(index, 1);
            this.showMessage('success', '删除成功', '任务已删除');
          }
        }
        
        // 保存更改并关闭模态框
        await this.saveTasks();
        this.render();
        this.closeTaskModal();
      } catch (error) {
        console.error('删除任务失败:', error);
        this.showMessage('error', '删除失败', '删除任务失败，请重试');
      }
    },
    async importTasks(event) {
      try {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const importedTasks = JSON.parse(e.target.result);
            
            // 验证数据格式
            if (!Array.isArray(importedTasks)) {
              throw new Error('无效的数据格式');
            }
            
            // 询问用户是否要替换现有数据
            this.showMessage('confirm', '导入确认', '是否要替换现有的所有任务数据？<br/>点击"确定"替换，点击"取消"追加到现有数据。', (shouldReplace) => {
              if (shouldReplace) {
                this.tasks = importedTasks;
              } else {
                // 追加数据，避免ID冲突
                const existingIds = new Set(this.tasks.map(t => t.id));
                const newTasks = importedTasks.filter(task => !existingIds.has(task.id));
                this.tasks.push(...newTasks);
              }
              
              this.saveTasks().then(() => {
                this.render();
                const count = shouldReplace ? importedTasks.length : importedTasks.filter(task => !this.tasks.some(t => t.id === task.id)).length;
                this.showMessage('success', '导入成功', `成功导入 ${count} 个任务！`);
              });
            });
          } catch (parseError) {
            console.error('解析文件失败:', parseError);
            this.showMessage('error', '文件错误', '文件格式错误，请选择有效的JSON文件');
          }
        };
        reader.readAsText(file);
        
        // 清空文件输入，允许重复选择同一文件
        event.target.value = '';
      } catch (error) {
        console.error('导入失败:', error);
        this.showMessage('error', '导入失败', '导入失败，请重试');
      }
    },
    // 搜索相关方法
    onSearchFocus() {
      // 当用户点击搜索框时，自动切换到列表视图
      if (this.viewMode !== 'list') {
        this.switchView('list');
      }
    },
    onSearchInput() {
      // 当用户输入搜索内容时，确保在列表视图中
      if (this.viewMode !== 'list') {
        this.switchView('list');
      }
    },
    // 颜色管理方法
    addToUsedColors(color) {
      if (!color || color === '#3498db') return; // 跳过默认颜色
      
      // 如果颜色已存在，先移除它
      const index = this.usedColors.indexOf(color);
      if (index > -1) {
        this.usedColors.splice(index, 1);
      }
      
      // 将颜色添加到数组开头（最近使用的在前面）
      this.usedColors.unshift(color);
      
      // 限制历史颜色数量为10个
      if (this.usedColors.length > 10) {
        this.usedColors = this.usedColors.slice(0, 10);
      }
    },
    loadUsedColors() {
      try {
        const savedColors = localStorage.getItem('used-colors');
        if (savedColors) {
          this.usedColors = JSON.parse(savedColors);
        }
      } catch (error) {
        console.error('加载历史颜色失败:', error);
        this.usedColors = [];
      }
    },
    extractColorsFromTasks() {
      // 从现有任务中提取所有使用过的颜色
      const colors = new Set();
      this.tasks.forEach(task => {
        if (task.tagColor && task.tagColor !== '#3498db') {
          colors.add(task.tagColor);
        }
      });
      this.usedColors = Array.from(colors).slice(0, 10);
    },
    // 智能文字颜色计算方法
    getTextColor(backgroundColor) {
      if (!backgroundColor) return '#000000';
      
      // 移除 # 号
      let hex = backgroundColor.replace('#', '');
      
      // 处理3位十六进制颜色（如 #000 -> #000000）
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      
      // 确保是6位十六进制
      if (hex.length !== 6) {
        return '#000000'; // 默认返回黑色
      }
      
      // 将十六进制转换为 RGB
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      
      // 计算相对亮度 (使用 WCAG 标准)
      // 公式: (0.299 * R + 0.587 * G + 0.114 * B)
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
      
      // 如果亮度大于 128，使用黑色文字；否则使用白色文字
      return brightness > 128 ? '#000000' : '#ffffff';
    },
    
    // 根据背景颜色获取合适的字体粗细
    getFontWeight(backgroundColor) {
      if (!backgroundColor) return 'normal';
      
      // 移除 # 号并确保是6位十六进制
      let hex = backgroundColor.replace('#', '');
      if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
      }
      
      if (hex.length !== 6 || !/^[0-9A-Fa-f]+$/.test(hex)) {
        return 'normal';
      }
      
      // 转换为 RGB
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      
      // 计算亮度
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
      
      // 浅色背景使用更粗的字体，深色背景使用较细的字体
      return brightness > 128 ? '900' : '100';
    },
    
    // 根据背景颜色获取字体大小调整
    getFontSize(backgroundColor) {
      if (!backgroundColor) return '1em';
      
      // 移除 # 号并确保是6位十六进制
      let hex = backgroundColor.replace('#', '');
      if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
      }
      
      if (hex.length !== 6 || !/^[0-9A-Fa-f]+$/.test(hex)) {
        return '1em';
      }
      
      // 转换为 RGB
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      
      // 计算亮度
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b);

      // 浅色背景稍微增大字体，深色背景保持正常
      return brightness > 128 ? '1em' : '0.9em';
    },
    
    // 根据背景颜色获取文字阴影效果
    getTextShadow(backgroundColor) {
      if (!backgroundColor) return 'none';
      
      // 移除 # 号并确保是6位十六进制
      let hex = backgroundColor.replace('#', '');
      if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
      }
      
      if (hex.length !== 6 || !/^[0-9A-Fa-f]+$/.test(hex)) {
        return 'none';
      }
      
      // 转换为 RGB
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      
      // 计算亮度
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
      
      // 浅色背景给黑字添加轻微阴影增强视觉效果
      return brightness > 128 ? '0 0 1px rgba(0,0,0,0.3)' : 'none';
    },
    
    // 主题管理方法 - 为未来功能预留
    switchTheme(themeName) {
      if (this.themes[themeName]) {
        this.currentTheme = themeName;
        // 保存主题选择到本地存储
        localStorage.setItem('selected-theme', themeName);
        // 未来可以在这里添加更多主题切换逻辑
      }
    },
    
    loadThemeSettings() {
      try {
        const savedTheme = localStorage.getItem('selected-theme');
        if (savedTheme && this.themes[savedTheme]) {
          this.currentTheme = savedTheme;
        }
      } catch (error) {
        console.error('加载主题设置失败:', error);
        this.currentTheme = 'default';
      }
    },
    
    // 获取主题相关的颜色建议
    getColorSuggestions(category = null) {
      const presets = this.currentPresetColors;
      if (category) {
        return presets.filter(preset => preset.category === category);
      }
      return presets;
    }
  },
  mounted() {
    this.loadBackupHistory();
    this.loadThemeSettings();
    this.loadTasks();
  },
  beforeUnmount() {
    clearInterval(this.autoBackupInterval);
  }
};
</script>

<style>
/* 样式将保持在 style.css 中 */
</style>
