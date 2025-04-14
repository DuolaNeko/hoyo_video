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
      
      // 设置语言为中文
      gantt.i18n.setLocale("cn");
      
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
      
      // 设置任务行高 - 增加高度以确保有足够空间显示图片
      gantt.config.row_height = 40;
      
      // 自定义任务模板，在进度条左侧显示图片
      gantt.templates.task_text = function(start, end, task){
        return task.text;
      };
      
      // 自定义任务左侧图标
      gantt.templates.leftside_text = function(start, end, task){
        if(task.post) {
          // 添加onerror处理，当图片加载失败时显示替代内容
          return `<div class="task-image-container"><img src="${task.post}" class="task-image" alt="${task.text}" onerror="this.onerror=null;this.src='https://fastcdn.mihoyo.com/content-v2/hk4e/50534/c1888e3a4a7c8e5e9b0264e16c532e0f_1682223740533881756.png';console.error('图片加载失败:',this.alt);"/></div>`;
        }
        return "";
      };
      
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
      
      // 自定义标签文本
      gantt.locale.labels.section_progress = "进度";
      gantt.locale.labels.section_description = "描述";
      
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
            tasks.data.push({
              id: key,
              text: event.title,
              start_date: event.start,
              end_date: event.end,
              progress: 0.5, // 默认进度值
              open: true,
              post: event.post // 添加post属性，用于显示图片
            });
          });
          
          // 加载数据到甘特图
          gantt.parse(tasks);
        })
        .catch(error => {
          console.error('加载数据失败:', error);
          gantt.message({type: "error", text: "数据加载失败，请稍后重试"});
        });
    };
    
    // 自定义错误提示信息
    const customizeErrorMessages = () => {
      gantt.locale.labels.error_loading = "数据加载失败";
      gantt.locale.labels.invalid_data = "无效数据";
      gantt.message.position = "top";
    
    };
    
    // 自定义甘特图文本
    const customizeLabels = () => {
      // 设置工具提示和按钮文本
      gantt.locale.labels.new_task = "新任务";
      gantt.locale.labels.icon_save = "保存";
      gantt.locale.labels.icon_cancel = "取消";
      gantt.locale.labels.icon_details = "详情";
      gantt.locale.labels.icon_edit = "编辑";
      gantt.locale.labels.icon_delete = "删除";
    };
    
    // 组件挂载后初始化甘特图
    onMounted(() => {
      customizeLabels();
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

/* 任务图片样式 */
.task-image-container {
  position: absolute;
  left: -30px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none; /* 确保图片不会阻挡鼠标事件 */
}

.task-image {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  object-fit: cover;
  box-shadow: 0 2px 6px rgba(0,0,0,0.4);
  border: 2px solid #ffffff;
  background-color: #fff; /* 添加背景色确保透明图片可见 */
}
</style>