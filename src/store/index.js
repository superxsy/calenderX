// Pinia store 统一配置和导出
import { createPinia } from 'pinia'

// 创建 pinia 实例
export const pinia = createPinia()

// 导出各个 store
export { useTaskStore } from './modules/taskStore'
export { useCalendarStore } from './modules/calendarStore'
export { useBackupStore } from './modules/backupStore'
export { useUIStore } from './modules/uiStore'