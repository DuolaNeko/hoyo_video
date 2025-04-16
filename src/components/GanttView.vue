<template>
  <div class="gantt-wrapper">
    <div ref="ganttContainer" class="gantt-container"></div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, reactive } from 'vue';
import { gantt } from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import gamesData from '../data/data.json';
// 中文本地化已内置在dhtmlx-gantt主文件中，无需单独导入

export default {
  name: 'GanttView',
  setup() {
    const ganttContainer = ref(null);
    const games = ref(gamesData.games);
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
    const loadData = async () => {
      try {
        // 创建一个合并所有选定游戏数据的对象
        const allTasks = {
          data: []
        };
        
        // 为每个选定的游戏加载数据
        for (const game of games.value) {
          const response = await fetch(`/data/${game}/event.json`);
          if (!response.ok) {
            console.warn(`无法加载 ${game} 的数据: ${response.status}`);
            continue;
          }
          
          const data = await response.json();
          const currentDate = new Date();
          
          // 处理数据
          Object.keys(data).forEach((key) => {
            const event = data[key];
            const startDate = new Date(event.start);
            const endDate = new Date(event.end);

            // 过滤进行中和未开始的任务
            if ((currentDate >= startDate && currentDate <= endDate) || currentDate < startDate) {
              allTasks.data.push({
                id: `${game}-${key}`, // 添加游戏前缀以避免ID冲突
                // title: `[${game}] ${event.title}`,
                game: game, // 添加游戏标识
                title: `${event.title}`,
                text: event.text, // 任务名称
                description: event.description,
                url: event.url,
                type: event.type,
                start_date: event.start,
                end_date: event.end,
                // 计算剩余天数
                remainDays: Math.ceil(
                  (currentDate >= startDate && currentDate <= endDate) 
                    ? (endDate - currentDate) / (1000 * 3600 * 24) 
                    : (endDate - startDate) / (1000 * 3600 * 24)
                ),
                open: true,
                post: event.post,
                game: game // 添加游戏标识
              });
            }
          });
        }
        
        // 添加排序逻辑
        allTasks.data.sort((a, b) => {
          if (a.remainDays !== b.remainDays) {
            return a.remainDays - b.remainDays;
          } else {
            return new Date(a.start_date) - new Date(b.start_date);
          }
        });
        
        console.log(allTasks);
        // 加载数据到甘特图
        gantt.clearAll();
        gantt.parse(allTasks);
      } catch (error) {
        console.error('加载数据失败:', error);
        gantt.message({type: "error", text: "数据加载失败，请稍后重试"});
      }
    };
    
    // 当复选框选择变化时重新加载数据
    const reloadData = () => {
      loadData();
    };
    

    // 自定义甘特图配置
    const customizeConfigs = () => {
      // 设置语言为中文
      gantt.i18n.setLocale("cn");
      
      // 根据任务类型和游戏设置不同的CSS类
      gantt.templates.task_class = (start, end, task) => {
        let classes = [];
        if (task.type) {
          classes.push(`task-type-${task.type}`);
        }
        if (task.game) {
          classes.push(`game-${task.game}`);
        }
        return classes.join(" ");
      };
      
      // 自定义工具提示，显示HTML内容
      gantt.templates.tooltip_text = (start, end, task) => {
        // 返回空字符串，因为我们使用onTaskClick处理点击事件
        return "";
      };
      
      // 配置工具提示显示HTML
      gantt.config.tooltip_timeout = 30000; // 设置工具提示显示时间较长
      gantt.config.show_quick_info = false; // 禁用默认的快速信息框
      
      // 启用工具提示插件
      gantt.plugins({
        tooltip: true
      });
      
      // 配置任务点击事件
      gantt.attachEvent("onTaskClick", (id, e) => {
        const task = gantt.getTask(id);
        if (task.description) {
          // 创建一个自定义的弹窗来显示HTML内容
          const modal = document.createElement("div");
          modal.className = "gantt-task-modal";
          
          // 创建模态框内容
          const modalContent = document.createElement("div");
          modalContent.className = "gantt-task-modal-content";
          
          // 创建模态框头部
          const modalHeader = document.createElement("div");
          modalHeader.className = "gantt-task-modal-header";
          
          // 创建标题
          const title = document.createElement("h3");
          title.textContent = task.text;
          
          // 创建关闭按钮
          const closeBtn = document.createElement("span");
          closeBtn.className = "gantt-task-modal-close";
          closeBtn.innerHTML = "&times;";
          
          // 创建模态框主体
          const modalBody = document.createElement("div");
          modalBody.className = "gantt-task-modal-body";
          // 使用innerHTML来渲染HTML内容
          modalBody.innerHTML = task.description;
          
          // 组装模态框
          modalHeader.appendChild(title);
          modalHeader.appendChild(closeBtn);
          modalContent.appendChild(modalHeader);
          modalContent.appendChild(modalBody);
          modal.appendChild(modalContent);
          
          document.body.appendChild(modal);
          
          // 创建一个统一的关闭弹窗函数
          const closeModal = () => {
            // 检查modal是否仍在文档中
            if (document.body.contains(modal)) {
              document.body.removeChild(modal);
            }
            // 确保移除事件监听器
            document.removeEventListener("keydown", handleEscKey);
          };
          
          // 添加关闭按钮事件
          closeBtn.addEventListener("click", closeModal);
          
          // 点击模态框外部关闭
          modal.addEventListener("click", (event) => {
            if (event.target === modal) {
              closeModal();
            }
          });
          
          // 添加ESC键关闭功能
          const handleEscKey = (event) => {
            if (event.key === "Escape" || event.keyCode === 27) {
              closeModal();
            }
          };
          
          document.addEventListener("keydown", handleEscKey);
          
          return false; // 阻止默认行为
        }
        return true; // 如果没有描述，允许默认行为
      });
      
      // 设置表头
      gantt.config.columns = [
        { name: "post", width: "140", label: "", align: "left", template: (task)=>{
          return `<div><img src="${task.post}" class="task-image" /></div>`;
        }},
        { name: "title", width: "200", label: "活动名称", align: "left"},
        { name: "start_date", width: "100", label: "开始日期", align: "left" },
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
      // 设置表头高度
      gantt.config.scale_height = 50;
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
      gantt.config.row_height = 80;
      gantt.config.bar_height = 50;
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
      ganttContainer,
      games,
      reloadData
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

/* 不同类型任务的样式 */
.gantt_task_line.task-type-other {
  background-color: #1890ff;
  border: 1px solid #0c75d4;
}

.gantt_task_line.task-type-ver_event {
  background-color: #fa8c16;
  border: 1px solid #d46b08;
}

.gantt_task_line.task-type-gacha{
  background-color: #722ed1;
  border: 1px solid #531dab;
}

/* 自定义任务模态框样式 */
.gantt-task-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.gantt-task-modal-content {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: auto;
  /* max-width: 1200px; */
  max-height: 80vh;
  overflow-y: auto;
  overflow-x: hidden;
}

.gantt-task-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #fff;
}

.gantt-task-modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: bold;
}

.gantt-task-modal-close {
  font-size: 24px;
  color: #999;
  cursor: pointer;
  transition: color 0.3s;
}

.gantt-task-modal-close:hover {
  color: #1890ff;
}

.gantt-task-modal-body {
  padding: 24px;
  line-height: 1.5;
}

/* 工具提示样式 */
.gantt_tooltip {
  background-color: white;
  border: 1px solid #e8e8e8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  padding: 10px;
  max-width: 300px;
}
</style>