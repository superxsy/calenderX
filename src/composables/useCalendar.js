// 日历相关组合式函数
import { ref, computed } from 'vue'
import { useCalendarStore } from '../store/modules/calendarStore'

export default function useCalendar() {
  const calendarStore = useCalendarStore()
  const searchTerm = ref('')

  // 计算属性
  const currentDateDisplay = computed(() => calendarStore.currentDateDisplay)
  const viewMode = computed(() => calendarStore.viewMode)

  /**
   * 导航到上一个/下一个时间段
   * @param {string} direction - 'prev' 或 'next'
   */
  const navigate = (direction) => {
    calendarStore.navigate(direction)
  }

  /**
   * 切换视图模式
   * @param {string} view - 'month', 'week', 'list'
   */
  const switchView = (view) => {
    calendarStore.switchView(view)
  }

  /**
   * 搜索框获得焦点时的处理
   */
  const onSearchFocus = () => {
    if (viewMode.value !== 'list') {
      switchView('list')
    }
  }

  /**
   * 搜索输入时的处理
   */
  const onSearchInput = () => {
    if (viewMode.value !== 'list') {
      switchView('list')
    }
  }

  /**
   * 初始化日历
   */
  const initCalendar = () => {
    calendarStore.renderCurrentView()
  }

  return {
    // 响应式数据
    searchTerm,
    
    // 计算属性
    currentDateDisplay,
    viewMode,
    
    // 方法
    navigate,
    switchView,
    onSearchFocus,
    onSearchInput,
    initCalendar
  }
}