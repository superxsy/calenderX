// 消息模态框组合式函数
import { ref, reactive } from 'vue'

export default function useMessage() {
  const showMessageModal = ref(false)
  const messageModal = reactive({
    type: 'info',
    title: '',
    content: '',
    callback: null
  })

  /**
   * 显示消息模态框
   * @param {string} type - 消息类型：success, error, confirm, info
   * @param {string} title - 标题
   * @param {string} content - 内容
   * @param {Function} confirmCallback - 确认回调
   * @param {Function} cancelCallback - 取消回调
   */
  const showMessage = (type, title, content, confirmCallback = null, cancelCallback = null) => {
    messageModal.type = type
    messageModal.title = title
    messageModal.content = content
    messageModal.callback = { confirm: confirmCallback, cancel: cancelCallback }
    showMessageModal.value = true
  }

  /**
   * 关闭消息模态框
   */
  const closeMessageModal = () => {
    showMessageModal.value = false
    resetMessageModal()
  }

  /**
   * 确认消息模态框
   */
  const confirmMessageModal = () => {
    if (messageModal.callback?.confirm) {
      messageModal.callback.confirm()
    }
    closeMessageModal()
  }

  /**
   * 取消消息模态框
   */
  const cancelMessageModal = () => {
    if (messageModal.callback?.cancel) {
      messageModal.callback.cancel()
    }
    closeMessageModal()
  }

  /**
   * 重置消息模态框状态
   */
  const resetMessageModal = () => {
    messageModal.type = 'info'
    messageModal.title = ''
    messageModal.content = ''
    messageModal.callback = null
  }

  return {
    showMessageModal,
    messageModal,
    showMessage,
    closeMessageModal,
    confirmMessageModal,
    cancelMessageModal,
    resetMessageModal
  }
}