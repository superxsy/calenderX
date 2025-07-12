<template>
  <div class="task-list">
    <!-- 过滤和视图切换区域 -->
    <div class="task-list-header">
      <div class="filter-controls">
        <select v-model="statusFilter" class="filter-select">
          <option value="all">所有状态</option>
          <option value="pending">待处理</option>
          <option value="in-progress">进行中</option>
          <option value="completed">已完成</option>
          <option value="overdue">已逾期</option>
        </select>
        
        <select v-model="tagFilter" class="filter-select">
          <option value="all">所有标签</option>
          <option v-for="tag in availableTags" :key="tag" :value="tag">{{ tag }}</option>
        </select>
      </div>
      
      <!-- 视图切换按钮 -->

    </div>

    <!-- 任务统计 -->
    <div class="task-stats">
      <div class="stat-item">
        <span class="stat-label">总计:</span>
        <span class="stat-value">{{ taskStats.total }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">已完成:</span>
        <span class="stat-value">{{ taskStats.completed }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">进行中:</span>
        <span class="stat-value">{{ taskStats.inProgress }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">逾期:</span>
        <span class="stat-value text-danger">{{ taskStats.overdue }}</span>
      </div>
    </div>

    <!-- 任务列表 -->
    <div class="task-items">
      <div v-if="filteredTasks.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <p class="empty-text">{{ emptyStateText }}</p>
      </div>
      
      <div
        v-for="task in paginatedTasks"
        :key="task.id"
        class="task-item"
        :class="{
          'completed': task.completed,
          'overdue': task.status === 'overdue',
          'in-progress': task.status === 'in-progress'
        }"
        @click="onTaskClick(task)"
      >
        <div class="task-main">
          <input
            type="checkbox"
            v-model="task.completed"
            @change="onTaskStatusChange(task)"
            @click.stop
            class="task-checkbox"
          >
          
          <div class="task-content">
            <div class="task-header">
              <span class="task-status" :title="getStatusText(task.status)">{{ statusSymbols[task.status] }}</span>
              <h3 class="task-title">{{ task.title }}</h3>
              <span v-if="task.tag" class="task-tag" :style="getTaskTagStyle(task)">{{ task.tag }}</span>
            </div>
            
            <div class="task-meta">
              <span class="task-date">
                <span class="meta-icon">📅</span>
                {{ formatTaskDate(task.date) }}
              </span>
              
              <span v-if="task.startTime" class="task-time">
                <span class="meta-icon">⏰</span>
                {{ task.startTime }}
                <span v-if="task.endTime"> - {{ task.endTime }}</span>
              </span>
              
              <span v-if="task.repeat && task.repeat !== 'none'" class="task-repeat">
                <span class="meta-icon">🔄</span>
                {{ getRepeatText(task.repeat) }}
              </span>
            </div>
            
            <p v-if="task.description" class="task-description">{{ task.description }}</p>
          </div>
        </div>
        
        <div class="task-actions">
          <button @click.stop="onTaskEdit(task)" class="action-btn edit-btn" title="编辑">
            ✏️
          </button>
          <button @click.stop="onTaskDelete(task)" class="action-btn delete-btn" title="删除">
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- 分页控制 -->
    <div v-if="totalPages > 1" class="pagination">
      <button
        @click="currentPage = Math.max(1, currentPage - 1)"
        :disabled="currentPage === 1"
        class="page-btn"
      >
        上一页
      </button>
      
      <span class="page-info">
        第 {{ currentPage }} 页，共 {{ totalPages }} 页
      </span>
      
      <button
        @click="currentPage = Math.min(totalPages, currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="page-btn"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script>
import { useTaskStore } from '../store/modules/taskStore'
import { useCalendarStore } from '../store/modules/calendarStore'
import { dateService } from '../services/dateService'

export default {
  name: 'TaskList',
  props: {
    searchQuery: {
      type: String,
      default: ''
    }
  },
  emits: ['task-click', 'task-edit', 'task-delete', 'task-status-change', 'search-focus', 'search-input'],
  setup() {
    const taskStore = useTaskStore()
    const calendarStore = useCalendarStore()

    return {
      taskStore,
      calendarStore
    }
  },
  data() {
    return {
      statusFilter: 'all',
      tagFilter: 'all',
      currentPage: 1,
      itemsPerPage: 20,
      statusSymbols: {
        pending: '⏳',
        'in-progress': '▶',
        completed: '✔',
        overdue: '⚠'
      }
    }
  },
  computed: {
    filteredTasks() {
      let tasks = this.taskStore.tasks
      
      // 搜索过滤
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase()
        tasks = tasks.filter(task => 
          task.title.toLowerCase().includes(query) ||
          (task.description && task.description.toLowerCase().includes(query)) ||
          (task.tag && task.tag.toLowerCase().includes(query))
        )
      }
      
      // 状态过滤
      if (this.statusFilter !== 'all') {
        tasks = tasks.filter(task => task.status === this.statusFilter)
      }
      
      // 标签过滤
      if (this.tagFilter !== 'all') {
        tasks = tasks.filter(task => task.tag === this.tagFilter)
      }
      
      // 按日期和时间排序
      return tasks.sort((a, b) => {
        const dateA = new Date(a.date + (a.startTime ? ` ${a.startTime}` : ''))
        const dateB = new Date(b.date + (b.startTime ? ` ${b.startTime}` : ''))
        return dateA - dateB
      })
    },
    
    paginatedTasks() {
      const start = (this.currentPage - 1) * this.itemsPerPage
      const end = start + this.itemsPerPage
      return this.filteredTasks.slice(start, end)
    },
    
    totalPages() {
      return Math.ceil(this.filteredTasks.length / this.itemsPerPage)
    },
    
    availableTags() {
      const tags = new Set()
      this.taskStore.tasks.forEach(task => {
        if (task.tag) {
          tags.add(task.tag)
        }
      })
      return Array.from(tags).sort()
    },
    
    taskStats() {
      const tasks = this.filteredTasks
      return {
        total: tasks.length,
        completed: tasks.filter(t => t.completed).length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        overdue: tasks.filter(t => t.status === 'overdue').length
      }
    },
    
    emptyStateText() {
      if (this.searchQuery.trim()) {
        return `没有找到包含 "${this.searchQuery}" 的任务`
      }
      if (this.statusFilter !== 'all' || this.tagFilter !== 'all') {
        return '没有符合筛选条件的任务'
      }
      return '还没有任务，点击添加按钮创建第一个任务吧！'
    }
  },
  watch: {
    searchQuery() {
      this.currentPage = 1
    },
    statusFilter() {
      this.currentPage = 1
    },
    tagFilter() {
      this.currentPage = 1
    }
  },
  methods: {
    onTaskClick(task) {
      this.$emit('task-click', task)
    },
    
    onTaskEdit(task) {
      this.$emit('task-edit', task)
    },
    
    onTaskDelete(task) {
      this.$emit('task-delete', task)
    },
    
    onTaskStatusChange(task) {
      this.$emit('task-status-change', task)
    },
    

    
    formatTaskDate(date) {
      return dateService.formatChineseDate(date)
    },
    
    getStatusText(status) {
      const statusMap = {
        pending: '待处理',
        'in-progress': '进行中',
        completed: '已完成',
        overdue: '已逾期'
      }
      return statusMap[status] || status
    },
    
    getRepeatText(repeat) {
      const repeatMap = {
        daily: '每天',
        weekdays: '工作日',
        weekly: '每周',
        monthly: '每月'
      }
      return repeatMap[repeat] || repeat
    },
    
    getTaskTagStyle(task) {
      const backgroundColor = task.tagColor || '#3498db'
      return {
        backgroundColor,
        color: this.getTextColor(backgroundColor)
      }
    },
    
    // 智能文字颜色计算
    getTextColor(backgroundColor) {
      if (!backgroundColor) return '#000000'
      
      let hex = backgroundColor.replace('#', '')
      
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
      }
      
      if (hex.length !== 6) {
        return '#000000'
      }
      
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b)
      
      return brightness > 128 ? '#000000' : '#ffffff'
    }
  }
}
</script>

<style scoped>
.task-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.task-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 10px;
}

.filter-controls {
  display: flex;
  gap: 12px;
}



.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 14px;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #3498db;
}

.task-stats {
  display: flex;
  justify-content: space-around;
  padding: 12px 16px;
  background: transparent;
  border-bottom: 1px solid #eee;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.stat-value.text-danger {
  color: #e74c3c;
}

.task-items {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  margin: 0;
}

.task-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid #eee;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
}

.task-item:hover {
  border-color: #3498db;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.task-item.completed {
  opacity: 0.7;
  background: #f8f9fa;
}

.task-item.overdue {
  border-left: 4px solid #e74c3c;
}

.task-item.in-progress {
  border-left: 4px solid #f39c12;
}

.task-main {
  flex: 1;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.task-checkbox {
  margin-top: 2px;
  cursor: pointer;
}

.task-content {
  flex: 1;
}

.task-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.task-status {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.task-title {
  flex: 1;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.task-item.completed .task-title {
  text-decoration: line-through;
}

.task-tag {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 6px;
  font-size: 14px;
  color: #666;
}

.meta-icon {
  margin-right: 4px;
}

.task-description {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.task-actions {
  display: flex;
  gap: 4px;
  margin-left: 12px;
}

.action-btn {
  padding: 6px 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
  transition: background-color 0.3s;
}

.action-btn:hover {
  background: #f0f0f0;
}

.edit-btn:hover {
  background: #e3f2fd;
}

.delete-btn:hover {
  background: #ffebee;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-top: 1px solid #eee;
  background: #f8f9fa;
}

.page-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #666;
}

@media (max-width: 768px) {
  .task-list-header {
    background: transparent;
  }
  
  .filter-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .task-list {
    padding: 10px;
  }
  
  .task-item {
    padding: 10px;
  }
  
  .task-stats {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .stat-item {
    flex: 1;
    min-width: 80px;
  }
  
  .task-meta {
    flex-direction: column;
    gap: 4px;
  }
  
  .task-actions {
    flex-direction: column;
  }
}
</style>