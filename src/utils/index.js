// 工具函数统一导出文件

export { default as colorUtils } from './colorUtils'
export { default as dateUtils } from './dateUtils'
export { default as taskUtils } from './taskUtils'
export { default as validationUtils } from './validationUtils'

export default {
  colorUtils: () => import('./colorUtils'),
  dateUtils: () => import('./dateUtils'),
  taskUtils: () => import('./taskUtils'),
  validationUtils: () => import('./validationUtils')
}