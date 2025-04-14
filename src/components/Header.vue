<script setup>
import { ref, h } from 'vue'
import { SearchOutlined, GithubOutlined, CalendarOutlined } from '@ant-design/icons-vue'
import { useRouter } from "vue-router"

const router = useRouter()
const handleTitleClick = () => {
    router.push({ path: '/' })
}
const handleGHButtonClick = () => {
    window.open('https://github.com/Trrrrw/hoyo_video')
}
const handleSearchButtonClick = () => {
    router.push({ path: '/search' })
}
const handleCalendarButtonClick = () => {
    router.push({ path: '/events' })
}
const handleGanttButtonClick = () => {
    router.push({ path: '/gantt' })
}
</script>

<template>
    <a-page-header style="padding-top: 0; padding-bottom: 0;">
        <template #title>
            <img src="../assets/logos/logo.png" @click="handleTitleClick"
                style="height: 40px !important;padding: 0 5px 3px 0;" />
            <span @click="handleTitleClick" style="height: 80%; cursor: pointer;">
                影像档案架
            </span>
        </template>
        <template #extra>
            <a-button type="text" :icon="h(CalendarOutlined)" key="3" @click="handleCalendarButtonClick" title="活动日历" />
            <a-button type="text" :icon="h(CalendarOutlined)" key="4" @click="handleGanttButtonClick" title="活动日历-甘特图" />
            <a-button type="text" :icon="h(SearchOutlined)" key="2" @click="handleSearchButtonClick" title="搜索" />
            <a-button type="text" :icon="h(GithubOutlined)" key="1" @click="handleGHButtonClick" title="GitHub" />
        </template>
    </a-page-header>
</template>

<style scoped></style>
