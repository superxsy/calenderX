// 测试环境设置文件
import { vi } from 'vitest'

// 模拟全局fetch API
global.fetch = vi.fn()

// 模拟localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
})

// 清理每个测试后的状态
afterEach(() => {
  vi.clearAllMocks()
})