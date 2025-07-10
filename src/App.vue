<template>
  <div id="app">
    <div class="app-container">
      <!-- 头部 -->
      <header class="header">
        <div class="header-left">
          <h1>日历任务</h1>
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
            <div class="task" v-for="task in day.tasks" :key="task.id" :style="{ backgroundColor: task.tagColor || '#3498db' }" :class="{ 'completed': task.completed }">
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
            <div class="task" v-for="task in day.tasks" :key="task.id" :style="{ backgroundColor: task.tagColor || '#3498db' }" :class="{ 'completed': task.completed }">
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
            <span v-if="task.tag" class="task-tag" :style="{ backgroundColor: task.tagColor || '#3498db' }">{{ task.tag }}</span>
          </div>
        </div>
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
              <input type="text" v-model="taskForm.customTagName" placeholder="输入标签名称（可选）">
            </div>
            
            <div v-if="taskForm.customTagName" class="form-group">
              <label>标签颜色:</label>
              <input type="color" v-model="taskForm.customTagColor">
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
      taskTags: {}
    };
  },
  computed: {
    currentDateDisplay() {
      return this.currentDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
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
  methods: {
    async loadTasks() {
      try {
        // 首先尝试从本地存储加载
        const localTasks = localStorage.getItem('calendar-tasks');
        if (localTasks) {
          this.tasks = JSON.parse(localTasks);
          this.render();
          return;
        }
        
        // 如果本地存储没有，则从JSON文件加载
        const response = await fetch('/calendar-tasks.json');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        this.tasks = await response.json();
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
        // 如果是重复任务，设置默认编辑选项
        this.editRecurringOption = task.recurring ? 'single' : 'single';
      } else {
        // 新建模式
        this.resetTaskForm();
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
    }
  },
  mounted() {
    this.loadTasks();
  }
};
</script>

<style>
/* 样式将保持在 style.css 中 */
</style>
