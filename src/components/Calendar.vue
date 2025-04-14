<template>
  <div class="gantt-container" ref="calendarContainer" :style="{ width: '100%' }">
    <!-- 甘特图布局 -->
    <div class="gantt-layout">
      <!-- 左侧任务名称列 -->
      <div class="task-names-column">
        <div class="header-placeholder"></div>
        <div class="task-list">
          <div 
            v-for="(event, index) in processedEvents" 
            :key="index" 
            class="task-name-cell"
            :style="{ top: `${event.row * 40}px`, height: '36px' }"
          >
            <img v-if="event.post" :src="event.post" class="task-image" alt="Event image" />
            <div class="task-title">{{ event.title }}</div>
          </div>
        </div>
      </div>
      
      <!-- 右侧时间轴和任务条 -->
      <div class="timeline-container">
        <!-- 顶部日期显示区域 -->
        <div class="date-header">
          <div v-for="(month, index) in monthRanges" :key="index" class="month-section" 
               :style="{ width: `${(month.days.length / totalDays) * 100}%` }">
            <div class="month-title">{{ month.name }}</div>
            <div class="days-container">
              <div v-for="(day, dayIndex) in month.days" :key="dayIndex" class="day-cell"
                   :class="{ 'today-cell': isToday(day.date) }"
                   :style="{ width: `${dayWidthPercent}%` }">
                {{ day.date.getDate() }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- 甘特图任务条区域 -->
        <div class="gantt-chart-area">
          <!-- 背景网格线 -->
          <div class="grid-lines">
            <!-- 使用单一循环遍历所有日期，确保网格线与日期单元格完全对齐 -->
            <div 
              v-for="(day, dayIndex) in Array.from({ length: totalDays }, (_, i) => i)" 
              :key="'grid-day-'+dayIndex" 
              class="grid-line" 
              :class="{ 
                'today-line': isToday(new Date(new Date(dateRange.start).setDate(dateRange.start.getDate() + dayIndex))),
                'month-boundary': dayIndex > 0 && new Date(new Date(dateRange.start).setDate(dateRange.start.getDate() + dayIndex)).getDate() === 1
              }"
              :style="{ 
                width: `${dayWidthPercent}%` 
              }">
            </div>
          </div>
          
          <!-- 任务条 -->
          <div 
            v-for="(event, index) in processedEvents" 
            :key="index" 
            class="gantt-bar"
            :style="{
              left: `${event.leftPercent}%`,
              width: `${event.widthPercent}%`,
              top: `${event.row * 40}px`,
              boxSizing: 'border-box'
            }"
          >
            <div class="bar-progress" :style="{ width: '100%' }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Calendar',
  data() {
    return {
      events: {},
      containerWidth: 0, // 容器宽度，用于计算百分比
      minDayWidth: 30 // 每天最小宽度（像素）
    }
  },
  created() {
    // 从JSON文件加载事件数据
    import('./event.json')
      .then(data => {
        this.events = data.default
      })
      .catch(error => {
        console.error('Failed to load events:', error)
      })
  },
  
  mounted() {
    // 获取容器宽度
    this.updateContainerWidth()
    // 监听窗口大小变化
    window.addEventListener('resize', this.updateContainerWidth)
  },
  
  beforeUnmount() {
    // 移除事件监听
    window.removeEventListener('resize', this.updateContainerWidth)
  },
  
  methods: {
    updateContainerWidth() {
      if (this.$refs.calendarContainer) {
        this.containerWidth = this.$refs.calendarContainer.clientWidth
        // 确保容器宽度足够显示所有日期
        const minRequiredWidth = this.totalDays * this.minDayWidth
        if (this.containerWidth < minRequiredWidth) {
          this.$refs.calendarContainer.style.width = `${minRequiredWidth}px`
          this.containerWidth = minRequiredWidth
        }
      }
    },
    
    // 判断日期是否为今天
    isToday(date) {
      if (!date || !(date instanceof Date)) return false
      const today = new Date()
      return date.getDate() === today.getDate() && 
             date.getMonth() === today.getMonth() && 
             date.getFullYear() === today.getFullYear()
    }
  },
  computed: {
    // 计算当前日期
    currentDate() {
      return new Date();
    },
    
    // 计算日期范围
    dateRange() {
      // 计算限制范围：当前日期-7天到当前日期+42天
      const now = this.currentDate;
      const startDate = new Date(now);
      startDate.setDate(now.getDate());
      
      const endDate = new Date(now);
      endDate.setDate(now.getDate() + 42);
      
      if (Object.keys(this.events).length === 0) {
        return {
          start: startDate,
          end: endDate
        }
      }
      
      // 根据事件计算日期范围，但限制在指定范围内
      const dates = [];
      Object.values(this.events).forEach(event => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        
        // 只添加在限制范围内的事件日期
        if (eventEnd >= startDate && eventStart <= endDate) {
          dates.push(eventStart > startDate ? eventStart : startDate);
          dates.push(eventEnd < endDate ? eventEnd : endDate);
        }
      });
      
      // 如果没有在范围内的事件，则使用限制范围
      if (dates.length === 0) {
        return {
          start: startDate,
          end: endDate
        }
      }
      
      // 确保日期范围不超出限制
      return {
        start: new Date(Math.max(startDate.getTime(), Math.min(...dates.map(d => d.getTime())))),
        end: new Date(Math.min(endDate.getTime(), Math.max(...dates.map(d => d.getTime()))))
      }
    },

    // 计算总天数
    totalDays() {
      return Math.ceil((this.dateRange.end - this.dateRange.start) / (1000 * 3600 * 24)) + 1
    },

    // 计算每天的宽度百分比
    dayWidthPercent() {
      return 100 / this.totalDays
    },

    // 生成月份分段数据
    monthRanges() {
      const months = []
      let current = new Date(this.dateRange.start)
      
      while (current <= this.dateRange.end) {
        const year = current.getFullYear()
        const month = current.getMonth()
        const monthStart = new Date(current.getFullYear(), current.getMonth(), 1)
        const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0)
        const days = []
        
        for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
          if (d >= this.dateRange.start && d <= this.dateRange.end) {
            days.push({ date: new Date(d) })
          }
        }
        
        months.push({
          name: `${month + 1}月`,
          days: [...days]
        })
        
        current = new Date(current.getFullYear(), current.getMonth() + 1, 1)
      }
      return months
    },

    // 处理事件布局
    processedEvents() {
      if (Object.keys(this.events).length === 0) return []
      
      // 转换事件日期并筛选在日期范围内的事件
      const events = Object.values(this.events)
        .map(event => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end)
        }))
        .filter(event => {
          // 只保留与日期范围有重叠的事件
          return event.end >= this.dateRange.start && event.start <= this.dateRange.end
        })
        .map(event => ({
          ...event,
          // 确保事件的开始和结束日期在日期范围内
          start: event.start < this.dateRange.start ? this.dateRange.start : event.start,
          end: event.end > this.dateRange.end ? this.dateRange.end : event.end
        }))

      // 按开始时间排序
      events.sort((a, b) => a.start - b.start)

      // 处理重叠
      const rows = []
      const processedEvents = events.map(event => {
        const startOffset = Math.floor(
          (event.start - this.dateRange.start) / (1000 * 3600 * 24)
        )
        const duration = Math.ceil(
          (event.end - event.start) / (1000 * 3600 * 24) + 1
        )
        
        let row = 0
        while (rows.some(r => r.row === row && 
          !(startOffset >= r.end || startOffset + duration <= r.start))) {
          row++
        }

        rows.push({
          start: startOffset,
          end: startOffset + duration,
          row
        })

        // 使用百分比计算位置和宽度
        const leftPercent = (startOffset / this.totalDays) * 100
        const widthPercent = (duration / this.totalDays) * 100

        return {
          ...event,
          leftPercent,
          widthPercent,
          row
        }
      })

      return processedEvents
    }
  }
}
</script>

<style scoped>
.gantt-container {
  position: relative;
  overflow-x: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #fffbf0;
  height: calc(100vh - 120px);
  min-height: 400px;
  width: 100%;
}

.gantt-layout {
  display: flex;
  height: 100%;
}

/* 左侧任务名称列样式 */
.task-names-column {
  width: 250px;
  min-width: 250px;
  border-right: 2px solid #e0c090;
  background-color: #fff8e8;
  display: flex;
  flex-direction: column;
  z-index: 10;
}

.header-placeholder {
  height: 80px;
  border-bottom: 2px solid #e0c090;
  background-color: #f0c080;
  padding: 8px;
  font-weight: bold;
  color: #8b4513;
  display: flex;
  align-items: flex-end;
}

.task-list {
  position: relative;
  flex: 1;
  overflow-y: auto;
}

.task-name-cell {
  position: absolute;
  left: 0;
  width: 100%;
  padding: 4px 12px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f0e0c0;
  background-color: #fff8e8;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.task-image {
  height: 28px;
  width: 28px;
  border-radius: 50%;
  margin-right: 8px;
  object-fit: cover;
  border: 1px solid #e0b070;
  flex-shrink: 0;
}

.task-title {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #8b4513;
  font-weight: bold;
}

/* 右侧时间轴和任务条区域 */
.timeline-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.date-header {
  display: flex;
  height: 80px;
  min-height: 80px;
  border-bottom: 2px solid #e0c090;
  z-index: 5;
}

.month-section {
  display: flex;
  flex-direction: column;
}

.month-title {
  padding: 8px;
  background: #f0c080;
  border-right: 1px solid #e0b070;
  text-align: center;
  font-weight: bold;
  color: #8b4513;
  height: 36px;
}

.days-container {
  display: flex;
  height: calc(100% - 36px);
}

.day-cell {
  height: 100%;
  border-right: 1px solid #f0e0c0;
  text-align: center;
  padding: 4px;
  color: #8b4513;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  flex-grow: 0;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.today-line {
  background-color: rgba(240, 128, 128, 0.1);
  border-right: 1px solid #f08080 !important;
  z-index: 2;
}

.today-cell {
  background-color: rgba(240, 128, 128, 0.1);
  font-weight: bold;
  color: #d04040 !important;
}

.gantt-chart-area {
  position: relative;
  flex: 1;
  overflow-y: auto;
}

/* 背景网格线 */
.grid-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
  display: flex;
}

.month-grid-container {
  position: relative;
  height: 100%;
}

.grid-line {
  position: relative;
  height: 100%;
  background-color: transparent;
  border-right: 1px solid #f0e0c0;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  flex-grow: 0;
  flex-shrink: 0;
  width: 100%;
}

.month-boundary {
  border-right: 2px solid #e0b070;
  z-index: 2;
}

/* 甘特图任务条 */
.gantt-bar {
  position: absolute;
  height: 24px;
  margin-top: 6px;
  background-color: rgba(240, 192, 128, 0.2);
  border-radius: 4px;
  border: 1px solid #e0b070;
  z-index: 2;
}

.bar-progress {
  height: 100%;
  background: linear-gradient(to right, #f0c080, #f0d090);
  border-radius: 3px;
}
</style>