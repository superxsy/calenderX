// 组合式函数统一导出文件

export { default as useCalendar } from './useCalendar'
export { default as useTask } from './useTask'
export { default as useModal } from './useModal'
export { default as useMessage } from './useMessage'

export default {
  useCalendar: () => import('./useCalendar'),
  useTask: () => import('./useTask'),
  useModal: () => import('./useModal'),
  useMessage: () => import('./useMessage')
}