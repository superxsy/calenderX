<template>
  <div class="calendar-view">
    <!-- 日历头部导航 -->
    <div class="calendar-header">
      <div class="calendar-navigation">
        <button @click="navigate(-1)" class="nav-btn">&#9664;</button>
        <h2 class="current-date">{{ currentDateDisplay }}</h2>
        <button @click="navigate(1)" class="nav-btn">&#9654;</button>
      </div>

    </div>

    <!-- 日历内容 -->
    <div class="calendar-content">
      <!-- 星期标题 -->
      <div class="calendar-days-of-week" v-if="viewMode === 'month' || viewMode === 'week'">
        <div v-for="dayName in ['日', '一', '二', '三', '四', '五', '六']" :key="dayName">{{ dayName }}</div>
      </div>

      <!-- 月视图 -->
      <div class="calendar-grid" v-if="viewMode === 'month'">
        <div 
          class="calendar-day" 
          :class="{ 'is-empty': !day.day, 'is-today': isToday(day.date) }" 
          v-for="(day, index) in monthDays" 
          :key="index" 
          @click="day.day ? onDayClick(day.date) : null"
        >
          <div class="day-number">{{ day.day }}</div>
          <div class="tasks">
            <div 
              class="task" 
              v-for="task in day.tasks" 
              :key="task.id" 
              :style="getTaskStyle(task)" 
              :class="{ 'completed': task.completed }"
            >
              <input 
                type="checkbox" 
                v-model="task.completed" 
                @change="onTaskStatusChange(task)"
                @click.stop
                class="task-checkbox"
              >
              <span @click.stop="onTaskClick(task)" class="task-title">{{ task.title }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 周视图 -->
      <div v-else-if="viewMode === 'week'" class="week-view">
        <div 
          class="calendar-day" 
          :class="{ 'is-today': isToday(day.date) }"
          v-for="day in weekDays" 
          :key="day.date" 
          @click="onDayClick(day.date)"
        >
          <div class="day-number">{{ day.day }}</div>
          <div class="tasks">
            <div 
              class="task" 
              v-for="task in day.tasks" 
              :key="task.id" 
              :style="getTaskStyle(task)" 
              :class="{ 'completed': task.completed }"
            >
              <input 
                type="checkbox" 
                v-model="task.completed" 
                @change="onTaskStatusChange(task)"
                @click.stop
                class="task-checkbox"
              >
              <span @click.stop="onTaskClick(task)" class="task-title">{{ task.title }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 列表视图 -->
      <div v-else-if="viewMode === 'list'" class="list-view">
        <div 
          class="task-list-item" 
          v-for="task in filteredTasks" 
          :key="task.id" 
          :class="{ 'completed': task.completed }"
        >
          <div class="task-details">
            <input 
              type="checkbox" 
              v-model="task.completed" 
              @change="onTaskStatusChange(task)"
              @click.stop
              class="task-checkbox"
            >
            <span class="task-status" :title="task.status">{{ statusSymbols[task.status] }}</span>
            <span @click="onTaskClick(task)" class="task-title">{{ task.title }}</span>
            <span class="task-date">{{ task.date }}</span>
            <span 
              v-if="task.tag" 
              class="task-tag" 
              :style="getTaskStyle(task)"
            >{{ task.tag }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useCalendarStore } from '../store/modules/calendarStore'
import { useTaskStore } from '../store/modules/taskStore'
import { dateService } from '../services/dateService'

export default {
  name: 'CalendarView',
  emits: ['task-click', 'day-click', 'task-status-change', 'view-change'],
  setup() {
    const calendarStore = useCalendarStore()
    const taskStore = useTaskStore()

    return {
      calendarStore,
      taskStore
    }
  },
  computed: {
    currentDateDisplay() {
      return this.calendarStore.currentDateDisplay
    },
    viewMode() {
      return this.calendarStore.viewMode
    },
    monthDays() {
      return this.calendarStore.monthDays
    },
    weekDays() {
      return this.calendarStore.weekDays
    },
    filteredTasks() {
      return this.taskStore.filteredTasks
    },
    statusSymbols() {
      return {
        pending: '⏳',
        'in-progress': '▶',
        completed: '✔',
        overdue: '⚠'
      }
    }
  },
  methods: {
    navigate(direction) {
      this.calendarStore.navigate(direction)
    },
    switchView(view) {
      this.calendarStore.switchView(view)
      this.$emit('view-change', view)
    },
    onDayClick(date) {
      this.$emit('day-click', date)
    },
    onTaskClick(task) {
      this.$emit('task-click', task)
    },
    onTaskStatusChange(task) {
      this.$emit('task-status-change', task)
    },
    isToday(date) {
      if (!date) return false
      return dateService.isToday(date)
    },
    getTaskStyle(task) {
      const backgroundColor = task.tagColor || '#3498db'
      return {
        backgroundColor,
        color: this.getTextColor(backgroundColor),
        fontWeight: this.getFontWeight(backgroundColor),
        fontSize: this.getFontSize(backgroundColor),
        textShadow: this.getTextShadow(backgroundColor)
      }
    },
    // 根据背景颜色计算合适的文字颜色 - 始终返回白色字体
    getTextColor(backgroundColor) {
      // 在任何情况下都返回白色字体
      return '#ffffff'
    },
    
    // 根据背景颜色获取合适的字体粗细
    getFontWeight(backgroundColor) {
      if (!backgroundColor) return 'normal'
      
      // 移除 # 号并确保是6位十六进制
      let hex = backgroundColor.replace('#', '')
      if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('')
      }
      
      if (hex.length !== 6 || !/^[0-9A-Fa-f]+$/.test(hex)) {
        return 'normal'
      }
      
      // 转换为 RGB
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      
      // 计算亮度
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b)
      
      // 浅色背景使用更粗的字体，深色背景使用较细的字体
      return brightness > 128 ? '900' : '100'
    },
    
    // 根据背景颜色获取字体大小调整 - 统一字体大小
    getFontSize(backgroundColor) {
      // 现在所有字体都是白色，统一使用标准字体大小
      return '1em'
    },
    
    // 根据背景颜色获取文字阴影效果
    getTextShadow(backgroundColor) {
      if (!backgroundColor) return 'none'
      
      // 移除 # 号并确保是6位十六进制
      let hex = backgroundColor.replace('#', '')
      if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('')
      }
      
      if (hex.length !== 6 || !/^[0-9A-Fa-f]+$/.test(hex)) {
        return 'none'
      }
      
      // 转换为 RGB
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      
      // 计算亮度
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b)
      
      // 浅色背景给黑字添加轻微阴影增强视觉效果
      return brightness > 128 ? '0 0 1px rgba(0,0,0,0.3)' : 'none'
    }
  },
  mounted() {
    // 初始化日历视图
    this.calendarStore.renderCurrentView()
  }
}
</script>

<style scoped>
.calendar-view {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 10px;
}

.calendar-navigation {
  display: flex;
  align-items: center;
  gap: 15px;
}

.nav-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

.nav-btn:hover {
  background: #2980b9;
}

.current-date {
  margin: 0;
  font-size: 1.5em;
  color: #2c3e50;
  min-width: 200px;
  text-align: center;
}



.calendar-content {
  flex: 1;
}

.calendar-days-of-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #ddd;
  margin-bottom: 1px;
}

.calendar-days-of-week > div {
  background: #f8f9fa;
  padding: 10px;
  text-align: center;
  font-weight: bold;
  color: #666;
  box-sizing: border-box;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #ddd;
  min-height: 400px;
}

.week-view {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #ddd;
  min-height: 300px;
}

.calendar-day {
  background: white;
  padding: 8px;
  min-height: 80px;
  cursor: pointer;
  transition: background-color 0.3s;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.calendar-day:hover {
  background: #f8f9fa;
}

.calendar-day.is-empty {
  background: #f5f5f5;
  cursor: default;
}

.calendar-day.is-today {
  background: #e3f2fd;
  border: 2px solid #2196f3;
}

.day-number {
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}

.tasks {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.task {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: opacity 0.3s;
}

.task.completed {
  opacity: 0.6;
  text-decoration: line-through;
}

.task-checkbox {
  margin: 0;
  cursor: pointer;
}

.task-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-view {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.task-list-item {
  border-bottom: 1px solid #eee;
  transition: background-color 0.3s;
}

.task-list-item:hover {
  background: #f8f9fa;
}

.task-list-item.completed {
  opacity: 0.6;
}

.task-details {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-status {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.task-date {
  color: #666;
  font-size: 14px;
  margin-left: auto;
}

.task-tag {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

@media (max-width: 768px) {
  .calendar-day {
    min-height: 60px;
    padding: 4px;
  }
  
  .task {
    font-size: 10px;
    padding: 1px 4px;
  }
}
</style>