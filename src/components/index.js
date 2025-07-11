// 组件统一导出文件
// 在这里导出所有组件，方便其他文件导入

export { default as CalendarView } from './CalendarView.vue'
export { default as TaskList } from './TaskList.vue'
export { default as TaskModal } from './TaskModal.vue'
export { default as BackupModal } from './BackupModal.vue'

export default {
  CalendarView: () => import('./CalendarView.vue'),
  TaskList: () => import('./TaskList.vue'),
  TaskModal: () => import('./TaskModal.vue'),
  BackupModal: () => import('./BackupModal.vue')
}