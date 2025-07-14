// 通用模态框组合式函数
import { ref } from 'vue'

export default function useModal() {
  const showTaskModal = ref(false)
  const showBackupModal = ref(false)
  const showDeleteConfirmModal = ref(false)
  const editingTask = ref(null)
  const selectedDate = ref(null)
  const deleteConfirmMessage = ref('')
  const deleteTaskToConfirm = ref(null)

  /**
   * 打开任务模态框
   * @param {Object} task - 任务对象（编辑时）
   * @param {string} date - 选中的日期（新建时）
   */
  const openTaskModal = (task = null, date = null) => {
    editingTask.value = task
    selectedDate.value = date
    showTaskModal.value = true
  }

  /**
   * 关闭任务模态框
   */
  const closeTaskModal = () => {
    showTaskModal.value = false
    editingTask.value = null
    selectedDate.value = null
  }

  /**
   * 打开备份管理模态框
   */
  const openBackupModal = () => {
    showBackupModal.value = true
  }

  /**
   * 关闭备份管理模态框
   */
  const closeBackupModal = () => {
    showBackupModal.value = false
  }

  /**
   * 显示删除确认模态框
   * @param {Object} task - 要删除的任务
   * @param {Object} options - 删除选项
   */
  const showDeleteConfirm = (task, options = {}) => {
    deleteTaskToConfirm.value = task
    if (task.recurring) {
      deleteConfirmMessage.value = '这是一个重复任务，您要删除所有重复任务还是仅删除当前任务？'
    } else {
      deleteConfirmMessage.value = `确定要删除任务 "${task.title}" 吗？`
    }
    showDeleteConfirmModal.value = true
  }

  /**
   * 取消删除
   */
  const cancelDelete = () => {
    showDeleteConfirmModal.value = false
    deleteConfirmMessage.value = ''
    deleteTaskToConfirm.value = null
  }

  return {
    // 任务模态框
    showTaskModal,
    editingTask,
    selectedDate,
    openTaskModal,
    closeTaskModal,
    
    // 备份模态框
    showBackupModal,
    openBackupModal,
    closeBackupModal,
    
    // 删除确认模态框
    showDeleteConfirmModal,
    deleteConfirmMessage,
    deleteTaskToConfirm,
    showDeleteConfirm,
    cancelDelete
  }
}