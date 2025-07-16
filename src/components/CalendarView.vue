<template>
  <div class="calendar-view">
    <!-- 日历头部导航 -->
    <div class="calendar-header">
      <div class="calendar-navigation">
        <button @click="navigate(-1)" class="nav-btn">&#9664;</button>
        <h2 class="current-date">{{ currentDateDisplay }}</h2>
        <button @click="navigate(1)" class="nav-btn">&#9654;</button>
        <button @click="goToToday" class="today-btn" title="回到今天">今天</button>
      </div>

    </div>

    <!-- 日历内容 -->
    <div class="calendar-content">
      <!-- 星期标题 -->
      <div class="calendar-days-of-week" v-if="viewMode === 'month' || viewMode === 'week'">
        <div v-for="dayName in ['一', '二', '三', '四', '五', '六', '日']" :key="dayName">{{ dayName }}</div>
      </div>

      <!-- 月视图 -->
      <div class="calendar-grid" v-if="viewMode === 'month'">
        <div 
          class="calendar-day" 
          :class="{ 'is-empty': day.isEmpty, 'is-today': isToday(day.date) }" 
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

<script lang="ts">
import { defineComponent } from 'vue'
import { useCalendarStore } from '../store/modules/calendarStore'
import { useTaskStore } from '../store/modules/taskStore'
import { dateService } from '../services/dateService'
import { styleService } from '../services/styleService'

export default defineComponent({
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
    goToToday() {
      this.calendarStore.goToToday()
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
      return styleService.getTaskStyle(task)
    }
  },
  mounted() {
    // 初始化日历视图
    this.calendarStore.renderCurrentView()
  }
})
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
  background: var(--primary-color);
  color: var(--white-color);
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

.nav-btn:hover {
  background: var(--primary-color-dark);
}

.today-btn {
  background: var(--success-color);
  color: var(--white-color);
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.3s;
}

.today-btn:hover {
  background: var(--success-color-dark, #27ae60);
  transform: translateY(-1px);
}

.current-date {
  margin: 0;
  font-size: 1.5em;
  color: var(--text-color);
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
  background: var(--border-color);
  margin-bottom: 1px;
}

.calendar-days-of-week > div {
  background: var(--light-background);
  padding: 10px;
  text-align: center;
  font-weight: bold;
  color: var(--muted-color);
  box-sizing: border-box;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: var(--border-color);
  min-height: 400px;
}

.week-view {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: var(--border-color);
  min-height: 300px;
}

.calendar-day {
  background: var(--background-color);
  padding: 8px;
  min-height: 80px;
  cursor: pointer;
  transition: background-color 0.3s;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.calendar-day:hover {
  background: var(--light-background);
}

.calendar-day.is-empty {
  background: #f8f9fa;
  cursor: default;
}

.calendar-day.is-empty .day-number {
  color: #bdc3c7;
}

.calendar-day.is-today {
  background: var(--today-background);
  border: 2px solid var(--info-color);
}

.day-number {
  font-weight: bold;
  margin-bottom: 5px;
  color: var(--text-color);
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
  background: var(--background-color);
  border-radius: 8px;
  overflow: hidden;
}

.task-list-item {
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.3s;
}

.task-list-item:hover {
  background: var(--light-background);
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
  color: var(--muted-color);
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