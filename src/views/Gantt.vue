<template>
  <div class="events-container">
    <h1 class="events-title">活动日历-甘特图</h1>
    <Calendar />
  </div>
</template>

<script setup>
import Calendar from '../components/GanttView.vue';
</script>

<style scoped>
.events-container {
  padding: 24px;
}

.events-title {
  margin-bottom: 24px;
  color: #1890ff;
  font-size: 24px;
}
</style>