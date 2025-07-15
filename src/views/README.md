# 📱 Views 视图层

页面级组件层，负责整个应用的页面结构和路由视图，采用组件化设计，提供完整的用户界面和交互体验。

## 📁 视图结构

```
views/
├── CalendarView.vue      # 日历主视图
├── TaskView.vue          # 任务管理视图
├── SettingsView.vue      # 设置页面
├── BackupView.vue        # 备份管理视图
├── AuthView.vue          # 认证页面
└── components/           # 视图专用组件
    ├── calendar/         # 日历视图组件
    ├── task/            # 任务视图组件
    ├── settings/        # 设置视图组件
    └── auth/            # 认证视图组件
```

## 🎯 核心视图页面

### 📅 CalendarView.vue
**日历主视图 - 应用核心页面**

**功能特性：**
- 月视图和周视图切换
- 任务显示和快速编辑
- 日期导航和选择
- 任务拖拽重新安排
- 响应式布局适配

**组件结构：**
```vue
<template>
  <div class="calendar-view">
    <!-- 顶部导航栏 -->
    <CalendarHeader 
      :current-date="currentDate"
      :view-mode="viewMode"
      @navigate="handleNavigate"
      @view-change="handleViewChange"
    />
    
    <!-- 日历主体 -->
    <CalendarGrid 
      :view-mode="viewMode"
      :current-date="currentDate"
      :tasks="currentTasks"
      @task-click="handleTaskClick"
      @date-click="handleDateClick"
      @task-drop="handleTaskDrop"
    />
    
    <!-- 任务详情侧边栏 -->
    <TaskSidebar 
      v-if="selectedTask"
      :task="selectedTask"
      @close="selectedTask = null"
      @save="handleTaskSave"
    />
    
    <!-- 快速添加任务 -->
    <QuickAddTask 
      :selected-date="selectedDate"
      @add="handleQuickAdd"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCalendarStore, useTaskStore, useUiStore } from '@/store'
import CalendarHeader from './components/calendar/CalendarHeader.vue'
import CalendarGrid from './components/calendar/CalendarGrid.vue'
import TaskSidebar from './components/task/TaskSidebar.vue'
import QuickAddTask from './components/task/QuickAddTask.vue'

const calendarStore = useCalendarStore()
const taskStore = useTaskStore()
const uiStore = useUiStore()

// 响应式数据
const selectedTask = ref(null)
const selectedDate = ref(new Date())

// 计算属性
const currentDate = computed(() => calendarStore.currentDate)
const viewMode = computed(() => calendarStore.viewMode)
const currentTasks = computed(() => {
  return taskStore.getTasksByDateRange(
    calendarStore.viewStartDate,
    calendarStore.viewEndDate
  )
})

// 事件处理
const handleNavigate = (direction) => {
  calendarStore.navigate(direction)
}

const handleViewChange = (mode) => {
  calendarStore.setViewMode(mode)
}

const handleTaskClick = (task) => {
  selectedTask.value = task
}

const handleDateClick = (date) => {
  selectedDate.value = date
  calendarStore.setCurrentDate(date)
}

const handleTaskDrop = async (task, newDate) => {
  await taskStore.updateTask(task.id, { date: newDate })
  uiStore.showNotification('任务日期已更新', 'success')
}

const handleTaskSave = async (taskData) => {
  await taskStore.updateTask(selectedTask.value.id, taskData)
  selectedTask.value = null
  uiStore.showNotification('任务已保存', 'success')
}

const handleQuickAdd = async (taskData) => {
  await taskStore.addTask({
    ...taskData,
    date: selectedDate.value
  })
  uiStore.showNotification('任务已添加', 'success')
}

// 生命周期
onMounted(async () => {
  await taskStore.loadTasks()
  calendarStore.setCurrentDate(new Date())
})
</script>
```

### 📝 TaskView.vue
**任务管理视图 - 任务列表和详细管理**

**功能特性：**
- 任务列表展示和分组
- 高级搜索和过滤
- 批量操作管理
- 任务统计分析
- 导入导出功能

**核心功能：**
```vue
<template>
  <div class="task-view">
    <!-- 搜索和过滤工具栏 -->
    <TaskToolbar 
      v-model:search="searchQuery"
      v-model:filters="activeFilters"
      :task-stats="taskStats"
      @bulk-action="handleBulkAction"
      @export="handleExport"
    />
    
    <!-- 任务列表 -->
    <TaskList 
      :tasks="filteredTasks"
      :loading="loading"
      :selected-tasks="selectedTasks"
      @task-select="handleTaskSelect"
      @task-edit="handleTaskEdit"
      @task-delete="handleTaskDelete"
      @task-toggle="handleTaskToggle"
    />
    
    <!-- 任务编辑模态框 -->
    <TaskEditModal 
      v-if="editingTask"
      :task="editingTask"
      @save="handleTaskSave"
      @close="editingTask = null"
    />
    
    <!-- 批量操作确认 -->
    <BulkActionModal 
      v-if="bulkAction"
      :action="bulkAction"
      :tasks="selectedTasks"
      @confirm="handleBulkConfirm"
      @cancel="bulkAction = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useTaskStore, useUiStore } from '@/store'
import TaskToolbar from './components/task/TaskToolbar.vue'
import TaskList from './components/task/TaskList.vue'
import TaskEditModal from './components/task/TaskEditModal.vue'
import BulkActionModal from './components/task/BulkActionModal.vue'

const taskStore = useTaskStore()
const uiStore = useUiStore()

// 响应式数据
const searchQuery = ref('')
const activeFilters = ref({})
const selectedTasks = ref([])
const editingTask = ref(null)
const bulkAction = ref(null)

// 计算属性
const loading = computed(() => taskStore.loading)
const taskStats = computed(() => taskStore.taskStats)
const filteredTasks = computed(() => {
  return taskStore.getFilteredTasks(searchQuery.value, activeFilters.value)
})

// 监听搜索变化
watch(searchQuery, (newQuery) => {
  taskStore.setSearchQuery(newQuery)
})

watch(activeFilters, (newFilters) => {
  taskStore.setFilters(newFilters)
}, { deep: true })

// 事件处理
const handleTaskSelect = (task, selected) => {
  if (selected) {
    selectedTasks.value.push(task)
  } else {
    const index = selectedTasks.value.findIndex(t => t.id === task.id)
    if (index > -1) {
      selectedTasks.value.splice(index, 1)
    }
  }
}

const handleTaskEdit = (task) => {
  editingTask.value = task
}

const handleTaskDelete = async (task) => {
  if (confirm('确定要删除这个任务吗？')) {
    await taskStore.deleteTask(task.id)
    uiStore.showNotification('任务已删除', 'success')
  }
}

const handleTaskToggle = async (task) => {
  await taskStore.updateTask(task.id, { 
    completed: !task.completed 
  })
}

const handleTaskSave = async (taskData) => {
  if (editingTask.value.id) {
    await taskStore.updateTask(editingTask.value.id, taskData)
  } else {
    await taskStore.addTask(taskData)
  }
  editingTask.value = null
  uiStore.showNotification('任务已保存', 'success')
}

const handleBulkAction = (action) => {
  if (selectedTasks.value.length === 0) {
    uiStore.showNotification('请先选择任务', 'warning')
    return
  }
  bulkAction.value = action
}

const handleBulkConfirm = async () => {
  const taskIds = selectedTasks.value.map(t => t.id)
  
  switch (bulkAction.value) {
    case 'delete':
      await taskStore.deleteTasks(taskIds)
      uiStore.showNotification(`已删除 ${taskIds.length} 个任务`, 'success')
      break
    case 'complete':
      await taskStore.updateTasks(taskIds, { completed: true })
      uiStore.showNotification(`已完成 ${taskIds.length} 个任务`, 'success')
      break
    case 'archive':
      await taskStore.updateTasks(taskIds, { archived: true })
      uiStore.showNotification(`已归档 ${taskIds.length} 个任务`, 'success')
      break
  }
  
  selectedTasks.value = []
  bulkAction.value = null
}

const handleExport = async () => {
  const data = await taskStore.exportTasks()
  // 触发下载
  const blob = new Blob([JSON.stringify(data, null, 2)], { 
    type: 'application/json' 
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tasks-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  uiStore.showNotification('任务数据已导出', 'success')
}
</script>
```

### ⚙️ SettingsView.vue
**设置页面 - 应用配置和偏好设置**

**功能特性：**
- 主题和外观设置
- 数据管理配置
- 通知和提醒设置
- 导入导出配置
- 账户和认证设置

### 💾 BackupView.vue
**备份管理视图 - 数据备份和恢复**

**功能特性：**
- 创建和管理备份
- 备份历史查看
- 数据导入导出
- 自动备份配置
- 云端同步设置

### 🔐 AuthView.vue
**认证页面 - 用户登录和注册**

**功能特性：**
- 用户登录表单
- 注册新账户
- 密码重置
- 第三方登录集成
- 会话管理

## 🧩 视图专用组件

### 📅 Calendar 组件系列

#### CalendarHeader.vue
**日历头部导航**
```vue
<template>
  <div class="calendar-header">
    <div class="nav-controls">
      <button @click="$emit('navigate', 'prev')" class="nav-btn">
        <ChevronLeftIcon />
      </button>
      <h2 class="current-period">{{ formattedPeriod }}</h2>
      <button @click="$emit('navigate', 'next')" class="nav-btn">
        <ChevronRightIcon />
      </button>
    </div>
    
    <div class="view-controls">
      <button 
        v-for="mode in viewModes" 
        :key="mode"
        :class="['view-btn', { active: viewMode === mode }]"
        @click="$emit('view-change', mode)"
      >
        {{ mode === 'month' ? '月' : '周' }}
      </button>
    </div>
    
    <div class="action-controls">
      <button @click="goToToday" class="today-btn">今天</button>
      <button @click="$emit('add-task')" class="add-btn">
        <PlusIcon /> 添加任务
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  currentDate: Date,
  viewMode: String
})

const emit = defineEmits(['navigate', 'view-change', 'add-task'])

const viewModes = ['month', 'week']

const formattedPeriod = computed(() => {
  const date = props.currentDate
  if (props.viewMode === 'month') {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`
  } else {
    // 周视图显示周范围
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - date.getDay())
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    
    return `${startOfWeek.getMonth() + 1}月${startOfWeek.getDate()}日 - ${endOfWeek.getMonth() + 1}月${endOfWeek.getDate()}日`
  }
})

const goToToday = () => {
  emit('navigate', 'today')
}
</script>
```

#### CalendarGrid.vue
**日历网格主体**
```vue
<template>
  <div :class="['calendar-grid', `${viewMode}-view`]">
    <!-- 星期标题 -->
    <div class="weekday-headers">
      <div 
        v-for="day in weekdays" 
        :key="day"
        class="weekday-header"
      >
        {{ day }}
      </div>
    </div>
    
    <!-- 日期网格 -->
    <div class="date-grid">
      <CalendarCell 
        v-for="date in gridDates" 
        :key="date.toISOString()"
        :date="date"
        :tasks="getTasksForDate(date)"
        :is-current-month="isCurrentMonth(date)"
        :is-today="isToday(date)"
        :is-selected="isSelected(date)"
        @click="handleDateClick(date)"
        @task-click="handleTaskClick"
        @task-drop="handleTaskDrop"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import CalendarCell from './CalendarCell.vue'

const props = defineProps({
  viewMode: String,
  currentDate: Date,
  tasks: Array,
  selectedDate: Date
})

const emit = defineEmits(['date-click', 'task-click', 'task-drop'])

const weekdays = ['日', '一', '二', '三', '四', '五', '六']

// 计算网格日期
const gridDates = computed(() => {
  const dates = []
  const current = new Date(props.currentDate)
  
  if (props.viewMode === 'month') {
    // 月视图：显示完整月份 + 前后补齐
    const firstDay = new Date(current.getFullYear(), current.getMonth(), 1)
    const lastDay = new Date(current.getFullYear(), current.getMonth() + 1, 0)
    
    // 补齐前面的日期
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    // 生成42天（6周）
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      dates.push(date)
    }
  } else {
    // 周视图：显示当前周
    const startOfWeek = new Date(current)
    startOfWeek.setDate(current.getDate() - current.getDay())
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date)
    }
  }
  
  return dates
})

// 获取指定日期的任务
const getTasksForDate = (date) => {
  return props.tasks.filter(task => {
    const taskDate = new Date(task.date)
    return taskDate.toDateString() === date.toDateString()
  })
}

// 判断是否为当前月
const isCurrentMonth = (date) => {
  return date.getMonth() === props.currentDate.getMonth()
}

// 判断是否为今天
const isToday = (date) => {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

// 判断是否为选中日期
const isSelected = (date) => {
  return props.selectedDate && 
         date.toDateString() === props.selectedDate.toDateString()
}

// 事件处理
const handleDateClick = (date) => {
  emit('date-click', date)
}

const handleTaskClick = (task) => {
  emit('task-click', task)
}

const handleTaskDrop = (task, date) => {
  emit('task-drop', task, date)
}
</script>
```

### 📝 Task 组件系列

#### TaskList.vue
**任务列表组件**
```vue
<template>
  <div class="task-list">
    <div v-if="loading" class="loading-state">
      <LoadingSpinner />
      <p>加载任务中...</p>
    </div>
    
    <div v-else-if="tasks.length === 0" class="empty-state">
      <EmptyTasksIcon />
      <h3>暂无任务</h3>
      <p>点击添加按钮创建你的第一个任务</p>
    </div>
    
    <div v-else class="task-items">
      <TaskItem 
        v-for="task in tasks" 
        :key="task.id"
        :task="task"
        :selected="isSelected(task)"
        @select="handleSelect"
        @edit="handleEdit"
        @delete="handleDelete"
        @toggle="handleToggle"
      />
    </div>
  </div>
</template>

<script setup>
import TaskItem from './TaskItem.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import EmptyTasksIcon from '@/components/icons/EmptyTasksIcon.vue'

const props = defineProps({
  tasks: Array,
  loading: Boolean,
  selectedTasks: Array
})

const emit = defineEmits([
  'task-select', 
  'task-edit', 
  'task-delete', 
  'task-toggle'
])

const isSelected = (task) => {
  return props.selectedTasks.some(t => t.id === task.id)
}

const handleSelect = (task, selected) => {
  emit('task-select', task, selected)
}

const handleEdit = (task) => {
  emit('task-edit', task)
}

const handleDelete = (task) => {
  emit('task-delete', task)
}

const handleToggle = (task) => {
  emit('task-toggle', task)
}
</script>
```

## 🎨 视图设计原则

### 1. 组件职责分离
- **视图组件**：负责页面布局和数据协调
- **业务组件**：处理具体功能逻辑
- **UI组件**：提供可复用的界面元素

### 2. 数据流管理
```javascript
// 单向数据流
Store State → View Props → Child Components

// 事件向上传递
Child Components → View Events → Store Actions

// 示例：任务编辑流程
TaskItem (emit edit) → TaskView (handle) → Store (update)
```

### 3. 响应式设计
```vue
<template>
  <div class="responsive-view">
    <!-- 桌面端布局 -->
    <div class="desktop-layout hidden md:flex">
      <Sidebar />
      <MainContent />
    </div>
    
    <!-- 移动端布局 -->
    <div class="mobile-layout md:hidden">
      <MobileHeader />
      <MobileContent />
      <MobileNavigation />
    </div>
  </div>
</template>

<style scoped>
.responsive-view {
  @apply w-full h-full;
}

.desktop-layout {
  @apply flex-1 flex;
}

.mobile-layout {
  @apply flex flex-col h-full;
}

@media (max-width: 768px) {
  .calendar-grid {
    @apply text-sm;
  }
  
  .task-item {
    @apply p-2;
  }
}
</style>
```

### 4. 性能优化
```vue
<script setup>
import { computed, defineAsyncComponent } from 'vue'

// 懒加载重型组件
const TaskEditModal = defineAsyncComponent(() => 
  import('./components/task/TaskEditModal.vue')
)

// 计算属性缓存
const expensiveComputation = computed(() => {
  return props.tasks.reduce((acc, task) => {
    // 复杂计算逻辑
    return acc + task.complexity
  }, 0)
})

// 虚拟滚动大列表
const visibleTasks = computed(() => {
  const start = scrollTop.value / itemHeight
  const end = start + visibleCount
  return props.tasks.slice(start, end)
})
</script>
```

## 🧪 视图测试策略

### 组件单元测试
```javascript
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CalendarView from '@/views/CalendarView.vue'

describe('CalendarView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('should render calendar grid', () => {
    const wrapper = mount(CalendarView)
    expect(wrapper.find('.calendar-grid').exists()).toBe(true)
  })
  
  it('should handle date navigation', async () => {
    const wrapper = mount(CalendarView)
    const nextBtn = wrapper.find('[data-testid="next-month"]')
    
    await nextBtn.trigger('click')
    
    // 验证日期是否正确更新
    expect(wrapper.vm.currentDate.getMonth()).toBe(
      new Date().getMonth() + 1
    )
  })
  
  it('should display tasks for selected date', async () => {
    const wrapper = mount(CalendarView, {
      props: {
        tasks: [
          { id: 1, title: 'Test Task', date: '2025-01-15' }
        ]
      }
    })
    
    const dateCell = wrapper.find('[data-date="2025-01-15"]')
    await dateCell.trigger('click')
    
    expect(wrapper.find('.task-item').exists()).toBe(true)
    expect(wrapper.find('.task-item').text()).toContain('Test Task')
  })
})
```

### 集成测试
```javascript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import App from '@/App.vue'

describe('View Integration', () => {
  it('should navigate between views', async () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: CalendarView },
        { path: '/tasks', component: TaskView }
      ]
    })
    
    const wrapper = mount(App, {
      global: {
        plugins: [router]
      }
    })
    
    // 导航到任务视图
    await router.push('/tasks')
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.task-view').exists()).toBe(true)
  })
})
```

## 🚀 最佳实践

### 1. 组件设计
- 保持组件单一职责
- 使用 Props 向下传递数据
- 使用 Events 向上传递操作
- 合理使用插槽提高复用性

### 2. 状态管理
- 视图组件不直接修改 Store 状态
- 通过 Actions 处理业务逻辑
- 使用计算属性响应状态变化
- 避免在视图中进行复杂计算

### 3. 用户体验
- 提供加载状态反馈
- 实现错误边界处理
- 优化首屏加载时间
- 支持键盘导航和无障碍访问

### 4. 代码组织
- 按功能模块组织组件
- 提取可复用的业务逻辑
- 使用 TypeScript 增强类型安全
- 保持一致的命名规范

这种视图层架构确保了应用的可维护性、可扩展性和用户体验的一致性。
