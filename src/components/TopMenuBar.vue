<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from "vue-router"
import { getItem } from '../utils/menuItemGet'

const route = useRoute()
const router = useRouter()
const allTypesWithData = ref(null)
const allTypes = ref([])


const selectedGameOrAbout = computed(() => {
    return route.name === 'About' ? ['about'] :
        route.params.game ? [route.params.game] : []
})
const currentType = computed(() => {
    return route.query.type ? [route.query.type] : []
})

const loadTopMenuBarItems = async () => {
    try {
        const allTypesWithDataRe = await import(`../data/${selectedGameOrAbout.value[0]}/types.json`)
        allTypesWithData.value = allTypesWithDataRe.default
        allTypes.value = Object.keys(allTypesWithData.value).map(typeName =>
            getItem(typeName, typeName, null, null, null)
        )
    } catch (error) {
        console.error("Failed to load data:", error)
    }
}
onMounted(() => {
    loadTopMenuBarItems()
})
const handleClick = clickedType => {
    router.push({
        name: 'Videos',
        params: { game: selectedGameOrAbout.value[0] },
        query: { type: clickedType.key }
    })
}
</script>

<template>
    <a-menu class="width-100" v-model:openKeys="currentType" v-model:selectedKeys="currentType" mode="horizontal"
        :items="allTypes" @click="handleClick" />
</template>

<style scoped>
.width-100 {
    width: 100%;
}
</style>
