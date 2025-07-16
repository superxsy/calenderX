import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '../App.vue'

// 模拟fetch响应
const mockTasks = [
  {
    id: 'test-1',
    title: '测试任务',
    description: '这是一个测试任务',
    date: '2024-08-15',
    tag: 'work',
    status: 'pending'
  }
]

describe('App.vue', () => {
  let wrapper

  beforeEach(() => {
    const pinia = createPinia()
    wrapper = mount(App, {
      global: {
        plugins: [pinia]
      }
    })
  })

  const appTitle = '日历任务管理器'

  it('应该正确渲染应用标题', () => {
    expect(wrapper.find('h1').text()).toBe(appTitle)
  })

  it('应该包含视图切换按钮', () => {
    const viewButtons = wrapper.findAll('.view-btn')
    expect(viewButtons).toHaveLength(3)
    expect(viewButtons[0].text()).toBe('月')
    expect(viewButtons[1].text()).toBe('周')
    expect(viewButtons[2].text()).toBe('列表')
  })

  it('应该包含搜索输入框', () => {
    const searchInput = wrapper.find('.search-input')
    expect(searchInput.exists()).toBe(true)
    expect(searchInput.attributes('placeholder')).toBe('搜索任务...')
  })

  it('应该包含导航按钮', () => {
    const prevBtn = wrapper.find('.nav-btn:first-child')
    const nextBtn = wrapper.find('.nav-btn:last-child')
    expect(prevBtn.exists()).toBe(true)
    expect(nextBtn.exists()).toBe(true)
  })

  it('应该正确切换视图模式', async () => {
    const weekBtn = wrapper.findAll('.view-btn')[1]
    await weekBtn.trigger('click')
    expect(wrapper.vm.calendarStore.viewMode).toBe('week')

    const listBtn = wrapper.findAll('.view-btn')[2]
    await listBtn.trigger('click')
    expect(wrapper.vm.calendarStore.viewMode).toBe('list')
  })

  it('应该正确过滤搜索结果', async () => {
    await wrapper.vm.$nextTick()

    wrapper.vm.taskStore.tasks = mockTasks
    wrapper.vm.taskStore.setSearchTerm('测试')
    await wrapper.vm.$nextTick()

    const filteredTasks = wrapper.vm.taskStore.filteredTasks
    expect(filteredTasks).toHaveLength(1)
    expect(filteredTasks[0].title).toBe('测试任务')
  })

  it('应该正确显示当前日期', () => {
    wrapper.vm.calendarStore.setCurrentDate('2024-08-15')
    const dateDisplay = wrapper.vm.calendarStore.currentDateDisplay
    expect(dateDisplay).toContain('2024')
    expect(dateDisplay).toContain('8')
  })

  it('应该正确计算月视图天数', () => {
    wrapper.vm.taskStore.tasks = mockTasks
    wrapper.vm.calendarStore.setCurrentDate('2024-08-15')
    wrapper.vm.calendarStore.renderMonthView()

    expect(wrapper.vm.calendarStore.monthDays).toBeDefined()
    expect(wrapper.vm.calendarStore.monthDays.length).toBeGreaterThan(0)
    const dayWith15 = wrapper.vm.calendarStore.monthDays.find(day => day.day === 15)
    expect(dayWith15).toBeDefined()
    expect(dayWith15.tasks).toHaveLength(1)
  })
})