// 任务相关组合式函数
import { useTaskStore } from '../store/modules/taskStore'
import { dateService } from '../services/dateService'

export default function useTask() {
  const taskStore = useTaskStore()

  /**
   * 保存任务
   * @param {Object} eventData - 任务事件数据
   * @param {Function} onSuccess - 成功回调
   * @param {Function} onError - 错误回调
   */
  const saveTask = async (eventData, onSuccess, onError) => {
    try {
      const { task, isEditing, editOption, originalTask } = eventData
      console.log('保存任务数据:', { task, isEditing, editOption, originalTask })
      
      if (isEditing) {
        console.log('更新任务:', originalTask.id, task)
        await taskStore.updateTask(originalTask.id, task)
        console.log('任务更新完成')
      } else {
        console.log('添加新任务:', task)
        await taskStore.addTask(task)
        console.log('新任务添加完成')
      }
      
      if (onSuccess) onSuccess('保存成功', '任务已保存')
      return true
    } catch (error) {
      console.error('保存任务失败:', error)
      if (onError) onError('保存失败', '保存任务失败，请重试')
      return false
    }
  }

  /**
   * 更新任务状态
   * @param {Object} task - 任务对象
   */
  const updateTaskStatus = (task) => {
    taskStore.updateTaskStatus(task.id, task.completed)
  }

  /**
   * 删除任务
   * @param {string} taskId - 任务ID
   * @param {Function} onSuccess - 成功回调
   */
  const deleteTask = (taskId, onSuccess) => {
    taskStore.deleteTask(taskId)
    if (onSuccess) onSuccess('删除成功', '任务已删除')
  }

  /**
   * 导出任务数据
   * @param {Function} onSuccess - 成功回调
   * @param {Function} onError - 错误回调
   */
  const exportTasks = (onSuccess, onError) => {
    try {
      const tasks = taskStore.getAllTasks()
      const dataStr = JSON.stringify(tasks, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `calendar-tasks-${dateService.formatDate(new Date(), 'YYYY-MM-DD')}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      if (onSuccess) onSuccess('导出成功', '任务数据已导出')
    } catch (error) {
      console.error('导出失败:', error)
      if (onError) onError('导出失败', '导出任务数据失败，请重试')
    }
  }

  /**
   * 导入任务数据
   * @param {Event} event - 文件输入事件
   * @param {Function} onConfirm - 确认回调
   * @param {Function} onSuccess - 成功回调
   * @param {Function} onError - 错误回调
   */
  const importTasks = (event, onConfirm, onSuccess, onError) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const tasks = JSON.parse(e.target.result)
        if (Array.isArray(tasks)) {
          if (onConfirm) {
            onConfirm(
              `将导入 ${tasks.length} 个任务，是否替换现有任务？`,
              () => {
                taskStore.importTasks(tasks, true)
                if (onSuccess) onSuccess('导入成功', '任务数据已导入')
              },
              () => {
                taskStore.importTasks(tasks, false)
                if (onSuccess) onSuccess('导入成功', '任务数据已追加')
              }
            )
          }
        } else {
          if (onError) onError('导入失败', '文件格式不正确')
        }
      } catch (error) {
        console.error('导入失败:', error)
        if (onError) onError('导入失败', '文件解析失败，请检查文件格式')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  /**
   * 加载任务数据
   */
  const loadTasks = async () => {
    await taskStore.loadTasks()
  }

  return {
    // 方法
    saveTask,
    updateTaskStatus,
    deleteTask,
    exportTasks,
    importTasks,
    loadTasks,
    
    // Store 引用
    taskStore
  }
}