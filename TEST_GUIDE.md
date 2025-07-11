# 测试指南

## 测试框架

本项目使用以下测试技术栈：
- **Vitest**: 快速的单元测试框架，与 Vite 完美集成
- **@vue/test-utils**: Vue 组件测试工具
- **jsdom**: 浏览器环境模拟

## 运行测试

### 安装依赖
```bash
npm install
```

### 测试命令

```bash
# 运行测试（监听模式）
npm run test

# 运行测试（单次执行）
npm run test:run

# 运行测试（UI界面）
npm run test:ui
```

## 测试文件结构

```
src/
├── test/
│   ├── setup.js          # 测试环境设置
│   └── App.test.js       # App组件测试
└── App.vue               # 主应用组件
```

## 当前测试覆盖

### App.vue 组件测试
- ✅ 应用标题渲染
- ✅ 视图切换按钮
- ✅ 搜索输入框
- ✅ 导航按钮
- ✅ 视图模式切换功能
- ✅ 搜索过滤功能
- ✅ 日期显示
- ✅ 月视图渲染逻辑

## 添加新测试

在 `src/test/` 目录下创建新的测试文件，文件名以 `.test.js` 结尾。

### 测试示例

```javascript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import YourComponent from '../YourComponent.vue'

describe('YourComponent', () => {
  it('should render correctly', () => {
    const wrapper = mount(YourComponent)
    expect(wrapper.text()).toContain('Expected Text')
  })
})
```

## 测试最佳实践

1. **组件隔离**: 每个测试应该独立运行
2. **模拟依赖**: 使用 `vi.fn()` 模拟外部依赖
3. **清晰命名**: 测试名称应该清楚描述测试内容
4. **覆盖边界情况**: 测试正常情况和异常情况
5. **保持简单**: 每个测试只验证一个功能点

## 故障排除

### 常见问题

1. **PowerShell 执行策略错误**
   ```bash
   # 使用 cmd 替代
   cmd /c npm run test
   ```

2. **组件方法不存在**
   - 检查组件实际导出的方法
   - 确保测试中使用的方法名正确

3. **DOM 元素找不到**
   - 使用正确的选择器（class 而不是 id）
   - 确保组件已正确渲染