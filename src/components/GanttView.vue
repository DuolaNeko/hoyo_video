<template>
  <div class="gantt-wrapper">
    <div ref="ganttContainer" class="gantt-container"></div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { gantt } from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
// 中文本地化已内置在dhtmlx-gantt主文件中，无需单独导入

export default {
  name: 'GanttView',
  setup() {
    const ganttContainer = ref(null);
    
    // 初始化甘特图
    const initGantt = () => {
      // 配置甘特图
      gantt.config.date_format = "%Y-%m-%d";
      gantt.config.xml_date = "%Y-%m-%d";
      
      
      // 设置显示范围为今天起的42天
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 42);
      
      gantt.config.start_date = today;
      gantt.config.end_date = endDate;
      
      // 设置时间刻度
      gantt.config.scale_unit = "day";
      gantt.config.step = 1;
      gantt.config.date_scale = "%d";
      
      // 添加月份刻度
      gantt.config.subscales = [
        {unit: "month", step: 1, date: "%Y年 %m月"}  
      ];
      
      // 设置今天的特殊标记
      gantt.config.show_markers = true;
      
      // 启用标记插件
      gantt.plugins({
        marker: true
      });
      
      // 添加今天的标记
      const todayMarker = gantt.addMarker({
        start_date: today,
        css: "today-marker",
        text: "今天"
      });
      
      
      // 初始化甘特图
      gantt.init(ganttContainer.value);
      
      // 加载数据
      loadData();
    };
    
    // 从event.json加载数据
    const loadData = () => {
      // 使用绝对路径确保正确加载event.json
      fetch('/event.json')
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          // 转换数据格式为甘特图所需格式
          const tasks = {
            data: []
          };
          
          // 处理数据
          Object.keys(data).forEach((key, index) => {
            const event = data[key];
            const currentDate = new Date();
            const startDate = new Date(event.start);
            const endDate = new Date(event.end);

            // 过滤进行中和未开始的任务
            if ((currentDate >= startDate && currentDate <= endDate) || currentDate < startDate) {
              tasks.data.push({
                id: key,
                text: event.title,
                start_date: event.start,
                end_date: event.end,
                remainDays: Math.ceil(
                  (currentDate >= startDate && currentDate <= endDate) 
                    ? (endDate - currentDate) / (1000 * 3600 * 24) 
                    : (endDate - startDate) / (1000 * 3600 * 24)
                ),
                open: true,
                post: event.post
              });
            }
          });
          
          // 添加排序逻辑
          tasks.data.sort((a, b) => {
            if (a.remainDays !== b.remainDays) {
              return a.remainDays - b.remainDays;
            } else {
              return new Date(a.start_date) - new Date(b.start_date);
            }
          });
          
          console.log(tasks);
          // 加载数据到甘特图
          gantt.parse(tasks);
        })
        .catch(error => {
          console.error('加载数据失败:', error);
          gantt.message({type: "error", text: "数据加载失败，请稍后重试"});
        });
    };
    

    // 自定义甘特图配置
    const customizeConfigs = () => {
      // 设置语言为中文
      gantt.i18n.setLocale("cn");
      // 设置表头
      gantt.config.columns = [
        { name: "post", label: "", width: "*", align: "left", template: (task)=>{
          return `<div><img src="${task.post}" class="task-image" /></div>`;
        }},
        { name: "text", label: "任务名称", width: "*", align: "left"},
        { name: "start_date", width: "*", label: "开始日期", align: "left" },
        { name: "remainDays", width: "70", label: "剩余天数", align: "center" }
      ];
      
      // 只读模式
      // gantt.config.readonly = true;
      // gantt.config.click_drag = false;
      // 禁用任务条链接拖动功能
      gantt.config.drag_links = false;
      // 禁用任务条左右边缘拉动功能
      gantt.config.drag_resize = false;
      // 禁用任务条长按移动功能
      gantt.config.drag_move = false;
      // 禁用任务条拖动进度条功能
      gantt.config.drag_progress = false;
      // 设置甘特图滚动条的大小为25px
      gantt.config.scroll_size = 25;
      // gantt.config.bar_height = 20; // 调整任务条的高度

      // 设置工具提示和按钮文本
      gantt.locale.labels.new_task = "新任务";
      gantt.locale.labels.icon_save = "保存";
      gantt.locale.labels.icon_cancel = "取消";
      gantt.locale.labels.icon_details = "详情";
      gantt.locale.labels.icon_edit = "编辑";
      gantt.locale.labels.icon_delete = "删除";

      gantt.locale.labels.section_progress = "进度";
      gantt.locale.labels.section_description = "描述";

      gantt.locale.labels.error_loading = "数据加载失败";
      gantt.locale.labels.invalid_data = "无效数据";
      gantt.message.position = "top";

      // 设置任务行高 - 增加高度以确保有足够空间显示图片
      gantt.config.row_height = 50;
    };
    
    // 组件挂载后初始化甘特图
    onMounted(() => {
      customizeConfigs();
      initGantt();
      
      // 窗口大小变化时重新渲染甘特图
      window.addEventListener('resize', () => {
        gantt.render();
      });
    });
    
    // 组件卸载前清理事件监听
    onUnmounted(() => {
      window.removeEventListener('resize', () => {
        gantt.render();
      });
    });
    
    return {
      ganttContainer
    };
  }
};
</script>

<style>
.gantt-wrapper {
  width: 100%;
  height: 100%;
  padding: 20px;
}

.gantt-container {
  width: 100%;
  height: calc(100vh - 180px);
  min-height: 500px;
}

/* 今天标记样式 */
.today-marker {
  background-color: #ff5722;
  opacity: 0.6;
}

/* 自定义甘特图样式 */
.gantt_task_line {
  background-color: #1890ff;
  border-radius: 4px;
  border: 1px solid #0c75d4;
}

.gantt_task_content {
  color: #ffffff;
  font-weight: bold;
}

/* 表头样式 */
.gantt_scale_cell {
  font-weight: bold;
  color: #333;
}

/* 周末样式 */
.gantt_scale_cell.gantt_scale_cell_weekend {
  background-color: #f5f5f5;
}

.gantt_task_cell.gantt_weekend {
  background-color: #f9f9f9;
}


.task-image {
  width: 100%;
  max-height: 200px;
  object-fit: contain;
}
</style>