<template>
  <div ref="ganttContainer" class="gantt-container"></div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';

const ganttContainer = ref(null);

const getDominantColor = (imageUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const colorCount = {};
      
      for (let i = 0; i < data.length; i += 4) {
        const rgb = `${data[i]},${data[i+1]},${data[i+2]}`;
        colorCount[rgb] = (colorCount[rgb] || 0) + 1;
      }
      
      const dominant = Object.entries(colorCount).reduce((a, b) => a[1] > b[1] ? a : b)[0];
      resolve(`rgb(${dominant})`);
    };
  });
};

const loadData = async () => {
  const response = await fetch('/event.json');
  const events = await response.json();
  
  const tasks = await Promise.all(Object.values(events).map(async (event) => ({
    id: event.post,
    text: event.title,
    start_date: new Date(event.start),
    end_date: new Date(event.end),
    color: await getDominantColor(event.post),
    progress: 100
  })));

  gantt.config.columns = [
    { name:"text", label:"活动名称", width:"*", tree:true },
    { name:"start_date", label:"开始时间", align:"center" },
    { name:"end_date", label:"结束时间", align:"center" },
    { name:"progress", label:"进度", align:"center" }
  ];

  const today = new Date();
  gantt.config.start_date = today;
  gantt.config.end_date = new Date(today.setDate(today.getDate() + 42));

  gantt.config.scale_unit = "day";
  gantt.config.step = 1;
  gantt.config.date_scale = "%d %M"

  gantt.init(ganttContainer.value);
  gantt.parse({ data: tasks });
};

onMounted(loadData);
</script>

<style>
.gantt-container {
  width: 100%;
  height: 100vh;
  padding: 20px;
}
</style>