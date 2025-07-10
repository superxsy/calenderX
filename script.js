// 日历应用主类
class CalendarApp {
    constructor() {
        this.currentDate = new Date();
        this.viewMode = 'month'; // 'month', 'week' 或 'list'
        this.tasks = [];
        this.selectedTask = null;
        this.draggedTask = null;
        this.fileHandle = null; // 文件句柄
        // 存储重复任务的完成状态：{taskId_date: status}
        this.recurringTaskCompletions = JSON.parse(localStorage.getItem('recurringTaskCompletions')) || {};
        
        // 任务状态符号
        this.statusSymbols = {
            pending: '⏳',
            'in-progress': '▶',
            completed: '✔',
            overdue: '⚠'
        };
        
        // 任务标记配置
        this.taskTags = {
            work: { name: '工作', color: '#3498db' },
            personal: { name: '个人', color: '#27ae60' },
            important: { name: '重要', color: '#e74c3c' },
            meeting: { name: '会议', color: '#9b59b6' },
            study: { name: '学习', color: '#f39c12' },
            health: { name: '健康', color: '#1abc9c' }
        };
        
        this.init();
    }

    async init() {
        this.bindEvents();
        this.updateStorageStatus();
        this.tasks = await this.loadTasks();
        this.render();
        this.updateCurrentDateDisplay();
    }

    // 更新存储状态显示
    updateStorageStatus() {
        const statusElement = document.getElementById('storageStatus');
        const statusText = statusElement.querySelector('.status-text');
        
        if ('showOpenFilePicker' in window) {
            statusElement.className = 'storage-status file-system';
            if (this.fileHandle) {
                statusText.textContent = `存储方式: 本地文件 (${this.fileHandle.name || '未命名文件'})`;
            } else {
                statusText.textContent = '存储方式: 本地文件系统 (未选择文件)';
            }
        } else {
            statusElement.className = 'storage-status local-storage';
            statusText.textContent = '存储方式: 浏览器本地存储 (localStorage)';
        }
    }
    
    // 绑定色块选择器事件
    bindTagSelector() {
        const tagOptions = document.querySelectorAll('.tag-option');
        tagOptions.forEach(option => {
            option.addEventListener('click', () => {
                // 移除其他选中状态
                tagOptions.forEach(opt => opt.classList.remove('selected'));
                // 添加当前选中状态
                option.classList.add('selected');
                // 更新隐藏字段值
                document.getElementById('selectedTag').value = option.dataset.tag;
            });
        });
        
        // 默认选中第一个
        if (tagOptions.length > 0) {
            tagOptions[0].classList.add('selected');
        }
    }
    
    // 绑定列表视图筛选器事件
    bindListViewFilters() {
        if (!this.selectedFilterTags) {
            this.selectedFilterTags = new Set(); // 存储选中的标记
        }
        
        const filterOptions = document.querySelectorAll('.filter-tag-option');
        filterOptions.forEach(option => {
            option.addEventListener('click', () => {
                const tag = option.dataset.tag;
                
                if (option.classList.contains('selected')) {
                    // 取消选中
                    option.classList.remove('selected');
                    this.selectedFilterTags.delete(tag);
                } else {
                    // 选中
                    option.classList.add('selected');
                    this.selectedFilterTags.add(tag);
                }
                
                if (this.viewMode === 'list') {
                    this.renderListView();
                }
            });
        });
    }
    
    // 切换任务完成状态
    async toggleTaskCompletion(taskId, event, specificDate = null) {
        event.stopPropagation();
        
        // 检查是否是重复任务的特定日期实例
        if (taskId.includes('_')) {
            const [originalTaskId, dateStr] = taskId.split('_');
            const completionKey = `${originalTaskId}_${dateStr}`;
            
            // 切换该特定日期的完成状态
            const currentStatus = this.recurringTaskCompletions[completionKey] || 'pending';
            this.recurringTaskCompletions[completionKey] = currentStatus === 'completed' ? 'pending' : 'completed';
            
            // 保存重复任务完成状态
            localStorage.setItem('recurringTaskCompletions', JSON.stringify(this.recurringTaskCompletions));
        } else {
            // 普通任务或重复任务的原始状态
            const task = this.tasks.find(t => t.id == taskId);
            if (task) {
                task.status = task.status === 'completed' ? 'pending' : 'completed';
                await this.saveTasks();
            }
        }
        
        this.render();
    }

    // 绑定事件监听器
    bindEvents() {
        // 导航按钮
        document.getElementById('prevBtn').addEventListener('click', () => this.navigate(-1));
        document.getElementById('nextBtn').addEventListener('click', () => this.navigate(1));
        
        // 视图切换
        document.getElementById('monthViewBtn').addEventListener('click', () => this.switchView('month'));
        document.getElementById('weekViewBtn').addEventListener('click', () => this.switchView('week'));
        document.getElementById('listViewBtn').addEventListener('click', () => this.switchView('list'));
        
        // 列表视图筛选器和时间范围
        this.bindListViewFilters();
        
        document.getElementById('timeRange').addEventListener('change', () => {
            if (this.viewMode === 'list') {
                this.renderListView();
            }
        });
        
        // 色块选择器事件
        this.bindTagSelector();
        
        // 任务表单提交
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTask();
        });
        
        // 文件操作
        document.getElementById('openFileBtn').addEventListener('click', () => this.openTaskFile());
        document.getElementById('saveFileBtn').addEventListener('click', () => this.saveTasks());
        document.getElementById('saveAsBtn').addEventListener('click', () => this.saveAsNewFile());
        
        // 添加任务
        document.getElementById('addTaskBtn').addEventListener('click', () => this.openTaskModal());
        
        // 搜索
        document.getElementById('searchBtn').addEventListener('click', () => this.searchTasks());
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchTasks();
        });
        
        // 模态框
        document.querySelector('.close').addEventListener('click', () => this.closeTaskModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeTaskModal());
        document.getElementById('taskForm').addEventListener('submit', (e) => this.saveTask(e));
        
        // 点击模态框外部关闭
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('taskModal');
            if (e.target === modal) {
                this.closeTaskModal();
            }
        });
    }

    // 导航到上一个/下一个时间段
    navigate(direction) {
        if (this.viewMode === 'month') {
            this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        } else {
            this.currentDate.setDate(this.currentDate.getDate() + (direction * 7));
        }
        this.render();
        this.updateCurrentDateDisplay();
    }

    // 切换视图模式
    switchView(mode) {
        this.viewMode = mode;
        
        // 更新按钮状态
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(mode + 'ViewBtn').classList.add('active');
        
        // 更新日历容器类
        const calendar = document.getElementById('calendar');
        calendar.className = `calendar ${mode}-view`;
        
        // 显示/隐藏相应的视图
        const calendarElement = document.getElementById('calendar');
        const listViewElement = document.getElementById('listViewContainer');
        
        if (mode === 'list') {
            calendarElement.style.display = 'none';
            if (listViewElement) {
                listViewElement.style.display = 'block';
                this.renderListView();
            }
        } else {
            calendarElement.style.display = 'block';
            if (listViewElement) {
                listViewElement.style.display = 'none';
            }
            this.render();
        }
        
        this.updateCurrentDateDisplay();
    }

    // 更新当前日期显示
    updateCurrentDateDisplay() {
        const options = { year: 'numeric', month: 'long' };
        if (this.viewMode === 'week') {
            const weekStart = this.getWeekStart(this.currentDate);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            
            document.getElementById('currentDate').textContent = 
                `${weekStart.getFullYear()}年${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`;
        } else {
            document.getElementById('currentDate').textContent = 
                `${this.currentDate.getFullYear()}年${this.currentDate.getMonth() + 1}月`;
        }
    }

    // 渲染日历
    render() {
        const calendar = document.getElementById('calendar');
        calendar.innerHTML = '';
        
        if (this.viewMode === 'month') {
            this.renderMonthView(calendar);
        } else if (this.viewMode === 'week') {
            this.renderWeekView(calendar);
        } else if (this.viewMode === 'list') {
            this.renderListView();
        }
    }

    // 渲染月视图
    renderMonthView(container) {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // 创建日历头部
        const header = document.createElement('div');
        header.className = 'calendar-header';
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        weekdays.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.textContent = day;
            header.appendChild(dayHeader);
        });
        container.appendChild(header);
        
        // 创建日历网格
        const grid = document.createElement('div');
        grid.className = 'calendar-grid';
        
        // 获取月份的第一天和最后一天
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        // 生成42个日期格子（6周）
        for (let i = 0; i < 42; i++) {
            const cellDate = new Date(startDate);
            cellDate.setDate(startDate.getDate() + i);
            
            const dayCell = this.createDayCell(cellDate, month);
            grid.appendChild(dayCell);
        }
        
        container.appendChild(grid);
    }

    // 渲染周视图
    renderWeekView(container) {
        const weekStart = this.getWeekStart(this.currentDate);
        
        // 创建日历头部
        const header = document.createElement('div');
        header.className = 'calendar-header';
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        weekdays.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.textContent = day;
            header.appendChild(dayHeader);
        });
        container.appendChild(header);
        
        // 创建日历网格
        const grid = document.createElement('div');
        grid.className = 'calendar-grid';
        
        // 生成7天
        for (let i = 0; i < 7; i++) {
            const cellDate = new Date(weekStart);
            cellDate.setDate(weekStart.getDate() + i);
            
            const dayCell = this.createDayCell(cellDate, cellDate.getMonth());
            grid.appendChild(dayCell);
        }
        
        container.appendChild(grid);
    }

    // 创建日期单元格
    createDayCell(date, currentMonth) {
        const dayCell = document.createElement('div');
        dayCell.className = 'day-cell';
        
        // 添加样式类
        if (date.getMonth() !== currentMonth) {
            dayCell.classList.add('other-month');
        }
        
        if (this.isToday(date)) {
            dayCell.classList.add('today');
        }
        
        // 日期数字
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();
        dayCell.appendChild(dayNumber);
        
        // 添加任务
        const dayTasks = this.getTasksForDate(date);
        dayTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            dayCell.appendChild(taskElement);
        });
        
        // 添加拖拽事件
        this.addDragDropEvents(dayCell, date);
        
        // 双击添加任务
        dayCell.addEventListener('dblclick', () => {
            this.openTaskModal(date);
        });
        
        return dayCell;
    }

    // 创建任务元素
    createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.tag || ''} ${task.status}`;
        taskElement.draggable = true;
        taskElement.dataset.taskId = task.id;
        
        const statusSymbol = this.statusSymbols[task.status] || '';
        const isCompleted = task.status === 'completed';
        
        taskElement.innerHTML = `
            <div class="task-content" style="display: flex; align-items: center; justify-content: space-between;">
                <div class="task-info">
                    <div class="task-title">
                        <span class="task-status">${statusSymbol}</span>
                        ${task.title}
                    </div>
                    ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                </div>
                <div class="task-checkbox ${isCompleted ? 'completed' : ''}" data-task-id="${task.id}"></div>
            </div>
        `;
        
        // 任务拖拽事件
        taskElement.addEventListener('dragstart', (e) => {
            this.draggedTask = task;
            taskElement.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        
        taskElement.addEventListener('dragend', () => {
            taskElement.classList.remove('dragging');
            this.draggedTask = null;
        });
        
        // 勾选圆圈事件
        const checkbox = taskElement.querySelector('.task-checkbox');
        checkbox.addEventListener('click', (e) => {
            this.toggleTaskCompletion(task.id, e);
        });
        
        // 点击编辑任务
        taskElement.addEventListener('click', (e) => {
            if (!e.target.closest('.task-checkbox')) {
                e.stopPropagation();
                // 如果是重复任务实例，编辑原始任务
                const originalTask = task.originalId ? this.tasks.find(t => t.id === task.originalId) : task;
                this.openTaskModal(null, originalTask || task);
            }
        });
        
        return taskElement;
    }

    // 添加拖拽事件
    addDragDropEvents(dayCell, date) {
        dayCell.addEventListener('dragover', (e) => {
            e.preventDefault();
            dayCell.classList.add('drag-over');
        });
        
        dayCell.addEventListener('dragleave', () => {
            dayCell.classList.remove('drag-over');
        });
        
        dayCell.addEventListener('drop', async (e) => {
            e.preventDefault();
            dayCell.classList.remove('drag-over');
            
            if (this.draggedTask) {
                await this.moveTask(this.draggedTask, date);
            }
        });
    }

    // 移动任务到新日期
    async moveTask(task, newDate) {
        task.date = this.formatDate(newDate);
        await this.saveTasks();
        this.render();
    }

    // 获取指定日期的任务
    getTasksForDate(date) {
        const dateStr = this.formatDate(date);
        const tasksForDate = [];
        
        this.tasks.forEach(task => {
            if (task.date === dateStr) {
                // 直接匹配的任务
                tasksForDate.push(task);
            } else if (this.isRecurringTask(task, date)) {
                // 重复任务，需要检查特定日期的完成状态
                const completionKey = `${task.id}_${dateStr}`;
                const specificStatus = this.recurringTaskCompletions[completionKey] || task.status;
                
                tasksForDate.push({
                    ...task,
                    status: specificStatus,
                    isRecurring: true,
                    originalId: task.id,
                    id: `${task.id}_${dateStr}`
                });
            }
        });
        
        return tasksForDate;
    }
    
    // 展开重复任务到指定时间范围
    expandRecurringTasks(days = 30) {
        const expandedTasks = [];
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + days);
        
        this.tasks.forEach(task => {
            const taskDate = new Date(task.date);
            
            if (task.repeat === 'none' || !task.repeat) {
                // 非重复任务，只在时间范围内显示
                if (taskDate >= today && taskDate <= endDate) {
                    expandedTasks.push({
                        ...task,
                        tag: task.tag || 'work',
                        expandedDate: taskDate,
                        isExpanded: false
                    });
                }
            } else {
                // 重复任务，生成所有实例
                const instances = this.generateRecurringInstances(task, today, endDate);
                expandedTasks.push(...instances);
            }
        });
        
        return expandedTasks;
    }
    
    // 生成重复任务的实例
    generateRecurringInstances(task, startDate, endDate) {
        const instances = [];
        const taskDate = new Date(task.date);
        let currentDate = new Date(Math.max(taskDate.getTime(), startDate.getTime()));
        
        while (currentDate <= endDate) {
            let shouldInclude = false;
            
            switch (task.repeat) {
                case 'daily':
                    shouldInclude = true;
                    break;
                case 'weekdays':
                    const dayOfWeek = currentDate.getDay();
                    shouldInclude = dayOfWeek >= 1 && dayOfWeek <= 5; // 周一到周五
                    break;
                case 'weekly':
                    shouldInclude = currentDate.getDay() === taskDate.getDay();
                    break;
                case 'monthly':
                    shouldInclude = currentDate.getDate() === taskDate.getDate();
                    break;
            }
            
            if (shouldInclude) {
                const dateStr = this.formatDate(currentDate);
                const completionKey = `${task.id}_${dateStr}`;
                const specificStatus = this.recurringTaskCompletions[completionKey] || task.status;
                
                instances.push({
                    ...task,
                    tag: task.tag || 'work',
                    expandedDate: new Date(currentDate),
                    isExpanded: true,
                    originalId: task.id,
                    id: `${task.id}_${dateStr}`,
                    status: specificStatus
                });
            }
            
            // 移动到下一天
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return instances;
    }

    // 检查是否为重复任务
    isRecurringTask(task, date) {
        if (task.repeat === 'none') return false;
        
        const taskDate = new Date(task.date);
        const checkDate = new Date(date);
        
        // 任务日期必须在检查日期之前或相同
        if (taskDate > checkDate) return false;
        
        switch (task.repeat) {
            case 'daily':
                return true;
            case 'weekdays':
                return checkDate.getDay() >= 1 && checkDate.getDay() <= 5;
            case 'weekly':
                return taskDate.getDay() === checkDate.getDay();
            case 'monthly':
                return taskDate.getDate() === checkDate.getDate();
            default:
                return false;
        }
    }

    // 打开任务模态框
    openTaskModal(date = null, task = null) {
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        const title = document.getElementById('modalTitle');
        
        if (task) {
            // 编辑模式
            title.textContent = '编辑任务';
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskDate').value = task.date;
            document.getElementById('taskStatus').value = task.status;
            document.getElementById('taskRepeat').value = task.repeat || 'none';
            
            // 设置标记选择器
            this.setTagSelector(task.tag || 'work');
            this.selectedTask = task;
        } else {
            // 添加模式
            title.textContent = '添加任务';
            form.reset();
            if (date) {
                document.getElementById('taskDate').value = this.formatDate(date);
            } else {
                document.getElementById('taskDate').value = this.formatDate(new Date());
            }
            
            // 设置默认标记
            this.setTagSelector('work');
            this.selectedTask = null;
        }
        
        modal.style.display = 'block';
    }
    
    // 设置标记选择器状态
    setTagSelector(tag) {
        const tagOptions = document.querySelectorAll('.tag-option');
        tagOptions.forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.tag === tag) {
                option.classList.add('selected');
            }
        });
        document.getElementById('selectedTag').value = tag;
    }

    // 关闭任务模态框
    closeTaskModal() {
        document.getElementById('taskModal').style.display = 'none';
        this.selectedTask = null;
    }

    // 保存任务
    async saveTask(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const taskData = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            date: document.getElementById('taskDate').value,
            tag: document.getElementById('selectedTag').value,
            status: document.getElementById('taskStatus').value,
            repeat: document.getElementById('taskRepeat').value
        };
        
        if (!taskData.title.trim()) {
            alert('请输入任务标题');
            return;
        }
        
        if (this.selectedTask) {
            // 更新现有任务
            Object.assign(this.selectedTask, taskData);
        } else {
            // 创建新任务
            taskData.id = Date.now().toString();
            this.tasks.push(taskData);
        }
        
        await this.saveTasks();
        this.closeTaskModal();
        this.render();
    }

    // 搜索任务
    searchTasks() {
        const query = document.getElementById('searchInput').value.toLowerCase();
        if (!query) {
            this.render();
            return;
        }
        
        // 高亮匹配的任务
        const taskElements = document.querySelectorAll('.task-item');
        taskElements.forEach(element => {
            const taskId = element.dataset.taskId;
            const task = this.tasks.find(t => t.id === taskId);
            
            if (task && (task.title.toLowerCase().includes(query) || 
                        (task.description && task.description.toLowerCase().includes(query)))) {
                element.style.border = '2px solid #f39c12';
                element.style.boxShadow = '0 0 10px rgba(243, 156, 18, 0.5)';
            } else {
                element.style.border = '';
                element.style.boxShadow = '';
            }
        });
    }

    // 工具方法
    getWeekStart(date) {
        const start = new Date(date);
        start.setDate(date.getDate() - date.getDay());
        return start;
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    // 渲染列表视图
    renderListView() {
        const timeRange = parseInt(document.getElementById('timeRange').value);
        const expandedTasks = this.expandRecurringTasks(timeRange);
        
        // 筛选任务
        let filteredTasks = expandedTasks;
        if (this.selectedFilterTags && this.selectedFilterTags.size > 0) {
            filteredTasks = expandedTasks.filter(task => 
                this.selectedFilterTags.has(task.tag || 'work')
            );
        }
        
        // 按日期排序
        filteredTasks.sort((a, b) => a.expandedDate - b.expandedDate);
        
        // 按日期分组
        const tasksByDate = new Map();
        filteredTasks.forEach(task => {
            const dateKey = this.formatDate(task.expandedDate);
            if (!tasksByDate.has(dateKey)) {
                tasksByDate.set(dateKey, []);
            }
            tasksByDate.get(dateKey).push(task);
        });
        
        this.renderTaskTable(tasksByDate);
    }
    
    renderTaskTable(tasksByDate) {
        const tableHeader = document.getElementById('taskTableHeader');
        const tableBody = document.getElementById('taskTableBody');
        
        // 清空表格
        tableBody.innerHTML = '';
        
        // 重建表头
        const selectedTags = Array.from(this.selectedFilterTags || []);
        let headerHTML = '<tr><th class="date-column">日期</th>';
        
        if (selectedTags.length === 0) {
            headerHTML += '<th class="task-column">任务</th>';
        } else {
            selectedTags.forEach(tag => {
                const tagInfo = this.taskTags[tag];
                headerHTML += `
                    <th class="tag-column">
                        <div class="tag-column-header">
                            <div class="tag-column-color" style="background-color: ${tagInfo.color}"></div>
                        </div>
                    </th>
                `;
            });
        }
        
        headerHTML += '</tr>';
        tableHeader.innerHTML = headerHTML;
        
        // 渲染表格行
        tasksByDate.forEach((tasks, dateStr) => {
            const date = new Date(dateStr);
            const row = document.createElement('tr');
            
            // 日期列
            const dateCell = document.createElement('td');
            dateCell.className = 'date-cell';
            
            const today = new Date();
            const isToday = this.formatDate(date) === this.formatDate(today);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            
            if (isToday) dateCell.classList.add('today');
            if (isWeekend) dateCell.classList.add('weekend');
            
            dateCell.textContent = this.formatDateForTable(date);
            row.appendChild(dateCell);
            
            if (selectedTags.length === 0) {
                // 单列模式：显示所有任务
                const taskCell = document.createElement('td');
                taskCell.className = 'task-column';
                
                const tasksContainer = document.createElement('div');
                tasks.forEach(task => {
                    const taskElement = this.createTableTaskElement(task);
                    tasksContainer.appendChild(taskElement);
                });
                
                taskCell.appendChild(tasksContainer);
                row.appendChild(taskCell);
            } else {
                // 多列模式：按标记分列
                selectedTags.forEach(tag => {
                    const tagCell = document.createElement('td');
                    tagCell.className = 'tag-column';
                    
                    const tagTasks = tasks.filter(task => (task.tag || 'work') === tag);
                    const tasksContainer = document.createElement('div');
                    
                    tagTasks.forEach(task => {
                        const taskElement = this.createTableTaskElement(task);
                        tasksContainer.appendChild(taskElement);
                    });
                    
                    tagCell.appendChild(tasksContainer);
                    row.appendChild(tagCell);
                });
            }
            
            tableBody.appendChild(row);
        });
    }
    
    createTableTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = `task-cell ${task.status}`;
        
        const statusSymbol = this.statusSymbols[task.status] || '';
        const tagColor = this.taskTags[task.tag]?.color || '#007bff';
        const isCompleted = task.status === 'completed';
        
        taskElement.innerHTML = `
            <div class="task-tag-indicator" style="background-color: ${tagColor}"></div>
            <div class="task-info">
                <div class="task-title">
                    <span class="task-status">${statusSymbol}</span>
                    ${task.title}
                    ${task.isExpanded ? ' <small>(重复)</small>' : ''}
                </div>
                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
            </div>
            <div class="task-checkbox ${isCompleted ? 'completed' : ''}" data-task-id="${task.id}"></div>
        `;
        
        // 勾选圆圈事件
        const checkbox = taskElement.querySelector('.task-checkbox');
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleTaskCompletion(task.id, e);
        });
        
        // 点击编辑任务
        taskElement.addEventListener('click', (e) => {
            if (!e.target.closest('.task-checkbox')) {
                const originalTask = this.tasks.find(t => t.id === (task.originalId || task.id));
                if (originalTask) {
                    this.openTaskModal(null, originalTask);
                }
            }
        });
        
        return taskElement;
    }
    
    formatDateForTable(date) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        if (this.formatDate(date) === this.formatDate(today)) {
            return '今天';
        } else if (this.formatDate(date) === this.formatDate(tomorrow)) {
            return '明天';
        } else {
            return date.toLocaleDateString('zh-CN', {
                month: 'short',
                day: 'numeric',
                weekday: 'short'
            });
        }
    }

    // 数据持久化 - 使用本地文件系统
    async loadTasks() {
        try {
            // 检查是否支持File System Access API
            if (!('showOpenFilePicker' in window)) {
                console.warn('浏览器不支持File System Access API，回退到localStorage');
                return this.loadTasksFromLocalStorage();
            }

            // 尝试从之前保存的文件句柄加载
            if (this.fileHandle) {
                const file = await this.fileHandle.getFile();
                const content = await file.text();
                return JSON.parse(content);
            }

            // 如果没有文件句柄，尝试从localStorage加载（兼容性）
            return this.loadTasksFromLocalStorage();
        } catch (error) {
            console.error('加载任务失败:', error);
            return this.loadTasksFromLocalStorage();
        }
    }

    async saveTasks() {
        try {
            // 检查是否支持File System Access API
            if (!('showSaveFilePicker' in window)) {
                console.warn('浏览器不支持File System Access API，使用localStorage');
                this.saveTasksToLocalStorage();
                return;
            }

            // 如果没有文件句柄，创建新文件
            if (!this.fileHandle) {
                await this.createNewFile();
            }

            // 写入文件
             const writable = await this.fileHandle.createWritable();
             await writable.write(JSON.stringify(this.tasks, null, 2));
             await writable.close();
             
             this.updateStorageStatus();
             console.log('任务已保存到本地文件');
        } catch (error) {
            console.error('保存任务失败:', error);
            // 回退到localStorage
            this.saveTasksToLocalStorage();
        }
    }

    // 创建新的任务文件
    async createNewFile() {
        try {
            this.fileHandle = await window.showSaveFilePicker({
                suggestedName: 'calendar-tasks.json',
                types: [{
                    description: '日历任务文件',
                    accept: { 'application/json': ['.json'] }
                }]
            });
        } catch (error) {
            if (error.name !== 'AbortError') {
                throw error;
            }
        }
    }

    // 打开现有任务文件
    async openTaskFile() {
        try {
            const [fileHandle] = await window.showOpenFilePicker({
                types: [{
                    description: '日历任务文件',
                    accept: { 'application/json': ['.json'] }
                }]
            });
            
            this.fileHandle = fileHandle;
            const file = await fileHandle.getFile();
            const content = await file.text();
            this.tasks = JSON.parse(content);
            this.updateStorageStatus();
            this.render();
            
            console.log('任务文件加载成功');
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('打开文件失败:', error);
                alert('打开文件失败: ' + error.message);
            }
        }
    }

    // 另存为新文件
    async saveAsNewFile() {
        const oldHandle = this.fileHandle;
        this.fileHandle = null;
        
        try {
            await this.saveTasks();
        } catch (error) {
            this.fileHandle = oldHandle;
            throw error;
        }
    }

    // localStorage兼容方法
    loadTasksFromLocalStorage() {
        const saved = localStorage.getItem('calendar-tasks');
        return saved ? JSON.parse(saved) : [];
    }

    saveTasksToLocalStorage() {
        localStorage.setItem('calendar-tasks', JSON.stringify(this.tasks));
    }

    // 更新任务状态（检查逾期）
    async updateTaskStatuses() {
        const today = new Date();
        const todayStr = this.formatDate(today);
        
        this.tasks.forEach(task => {
            if (task.status === 'pending' && task.date < todayStr) {
                task.status = 'overdue';
            }
        });
        
        await this.saveTasks();
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', async () => {
    const app = new CalendarApp();
    
    // 定期更新任务状态
    setInterval(async () => {
        await app.updateTaskStatuses();
        app.render();
    }, 60000); // 每分钟检查一次
    
    // 添加一些示例任务（仅在没有任何数据时）
    if (app.tasks.length === 0) {
        const sampleTasks = [
            {
                id: '1',
                title: '团队会议',
                tag: 'meeting',
                description: '讨论项目进度',
                date: new Date().toISOString().split('T')[0],
                status: 'pending',
                repeat: 'weekly'
            },
            {
                id: '2',
                title: '完成报告',
                tag: 'work',
                description: '月度工作总结',
                date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                status: 'in-progress',
                repeat: 'none'
            },
            {
                id: '3',
                title: '健身锻炼',
                tag: 'health',
                description: '晨跑30分钟',
                date: new Date().toISOString().split('T')[0],
                status: 'completed',
                repeat: 'daily'
            }
        ];
        
        app.tasks = sampleTasks;
        await app.saveTasks();
        app.render();
    }
});