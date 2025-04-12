<template>
  <a-config-provider :locale="zhCN">
    <div class="calendar-container">
      <a-calendar @select="handleDateClick">
        <template #dateCellRender="{ current }">
          <div class="date-cell" @click="handleCellClick(current)">
            <ul class="events">
              <li v-for="item in getListData(current)" :key="item.id">
                <a-badge :status="item.type" :text="item.title" />
              </li>
            </ul>
          </div>
        </template>
      </a-calendar>

      <!-- 详情展示区域 -->
      <div v-if="selectedDate" class="details-panel">
        <h3>{{ selectedDate.format('YYYY年MM月DD日') }} 的活动提醒</h3>
        <div v-if="selectedEvents.length > 0">
          <a-card v-for="event in selectedEvents" :key="event.id" class="event-card">
            <h4>{{ event.title }}</h4>
            <p>🗓️ 时间：{{ event.start.format('YYYY-MM-DD') }} 至 {{ event.end.format('YYYY-MM-DD') }}</p>
            <a-image
              v-if="event.post"
              :src="event.post"
              :preview="false"
              class="event-image"
            />
          </a-card>
        </div>
        <a-empty v-else description="当天没有活动安排" />
      </div>
    </div>
  </a-config-provider>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { ConfigProvider as AConfigProvider } from 'ant-design-vue';
import zhCN from 'ant-design-vue/es/locale/zh_CN';
 
dayjs.locale('zh-cn');

const route = useRoute();
const events = ref([]);
const selectedDate = ref(null);
const selectedEvents = ref([]);

/**
 * 声明方法：解析日期字符串
 * @param dateString
 */
const parseDate = (dateString) => {
  return dayjs(dateString, 'YYYY-MM-DD'); // 明确日期格式
};

/**
 * 加载事件数据 
 */
const loadEvents = async () => {
  try {
    const gamePath = route.params.game;
    const response = await fetch(`src/data/${gamePath}/event.json`); // 建议将数据放在 public 目录
    const data = await response.json();
    
    events.value = Object.keys(data).map(key => ({
      id: key,
      title: data[key].title,
      type: 'success',
      start: parseDate(data[key].start),
      end: parseDate(data[key].end),
      post: data[key].post
    }));
    console.log(events.value); // 打印处理后的数据
  } catch (error) {
    console.error('加载事件数据失败:', error);
  }
};

/**
 * 数据映射
 * @param current 
 */
const getListData = (current) => {
  const currentDay = dayjs(current.$d);
  
  return events.value.filter(event => {
    // 仅匹配开始日或结束日
    return currentDay.isSame(event.start, 'day') 
          // || currentDay.isSame(event.end, 'day');
  });
};

const handleCellClick = (current) => {
  selectedDate.value = dayjs(current.$d).startOf('day');
  selectedEvents.value = events.value.filter(event => {
    const date = selectedDate.value;
    return date.isSame(event.start, 'day') || date.isSame(event.end, 'day');
  });
};

onMounted(loadEvents);
</script>

<style scoped>
/* .calendar-container {
  max-width: 1200px;
  margin: 20px auto;
  padding: 20px;
} */

.date-cell {
  height: 100%;
  cursor: pointer;
  transition: background 0.3s;
}

.date-cell:hover {
  background: #f0f2f5;
}

.events {
  margin: 0;
  padding: 0;
  list-style: none;
}

.events li {
  margin-bottom: 4px;
}

.details-panel {
  margin-top: 30px;
  padding: 20px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
}

.event-card {
  margin-bottom: 16px;
}

.event-card h4 {
  color: #1890ff;
  margin-bottom: 8px;
}

.event-image {
  margin-top: 12px;
  border-radius: 4px;
}
</style>