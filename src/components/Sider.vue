<script setup>
import { getItem } from '../utils/menuItemGet'
import gamesListData from "../data/data.json"
import { ref, reactive, computed, onMounted, onUnmounted, h } from 'vue'
import { useRoute, useRouter } from "vue-router"
import { InfoCircleOutlined, createFromIconfontCN } from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()

const gamesList = reactive(gamesListData.games)
const gameIconName = reactive(gamesListData.icons)
const IconFont = createFromIconfontCN({
    scriptUrl: '//at.alicdn.com/t/c/font_4881579_1z7gxtmeqtb.js',
})
const sideBarItems = reactive([])
const selectedGameOrAbout = computed(() => {
    return route.name === 'About' ? ['about'] :
        route.params.game ? [route.params.game] : []
})

/** 检测屏幕大小并调整侧边栏 */
const collapsed = ref(false)    // 当前收起状态
const collapsedWidth = ref(80)  // 收缩宽度，设置为 0 会出现特殊 trigger
const collapsible = ref(false)  // 是否可收起
const checkScreenSize = () => {
    const width = window.innerWidth
    if (width >= 1200) {
        collapsed.value = false
        collapsible.value = false
    } else if (width >= 768) {
        collapsed.value = true
        collapsible.value = true
        collapsedWidth.value = 80
    } else {
        collapsed.value = true
        collapsible.value = true
        collapsedWidth.value = 0
    }
}
onMounted(() => {
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
})
onUnmounted(() => {
    window.removeEventListener('resize', checkScreenSize)
})

const loadSidebarItems = async () => {
    for (const [index, game] of gamesList.entries()) {
        sideBarItems.push(
            getItem(game, game, () => h(IconFont, { type: gameIconName[index] }), null, null)
        )
    }
}

const handleClick = sidebarItems => {
    router.push(`/${sidebarItems.key}`)
    if (collapsible.value) {
        collapsed.value = true
    }
}
onMounted(() => {
    loadSidebarItems()
})

</script>

<template>
    <a-layout-sider v-model:collapsed="collapsed" :collapsedWidth="collapsedWidth" :collapsible="collapsible"
        theme="light" class="content-sider">
        <a-flex vertical justify="space-between" style="height: 100%;">
            <a-menu id="gamesMenu" class="sider-menu" v-model:openKeys="selectedGameOrAbout"
                v-model:selectedKeys="selectedGameOrAbout" mode="inline" :items="sideBarItems" @click="handleClick"
                style="padding-top: 5px;"></a-menu>
            <a-menu id="bottomMenu" class="sider-menu" v-model:openKeys="selectedGameOrAbout"
                v-model:selectedKeys="selectedGameOrAbout" mode="inline"
                :items="[getItem('关于', 'about', h(InfoCircleOutlined), null, null)]" @click="handleClick"></a-menu>
        </a-flex>

    </a-layout-sider>
</template>

<style scoped>
.sider-menu {
    border-inline-end: none !important;
}

.icons-list :deep(.anticon) {
    margin-right: 6px;
    font-size: 24px;
}

.content-sider {
    background-color: white;
    border-inline-end: 1px solid rgba(5, 5, 5, 0.06);
}
</style>
