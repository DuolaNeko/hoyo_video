import { createRouter, createWebHashHistory } from 'vue-router'

import Types from "../views/Types.vue"
import Videos from "../views/Videos.vue"
import Player from "../views/Player.vue"
import About from '../views/About.vue'
import Search from '../views/Search.vue'
import LatestUpdates from '../views/LatestUpdates.vue'
import BasicLayout from '../views/BasicLayout.vue'
import Gantt from '../views/Gantt.vue'


const routes = [
    {
        path: '/',
        name: 'Home',
        // redirect: '/原神',
        component: BasicLayout,
        children: [
            {
                path: '/',
                name: 'LatestUpdates',
                component: LatestUpdates,
            },
            {
                path: '/:game',
                name: 'Types',
                component: Types,
                beforeEnter: (to, from, next) => {
                    if (to.query.type) {
                        next({ name: 'Videos', params: { game: to.params.game }, query: to.query })
                    } else {
                        next()
                    }
                }
            },
            {
                path: '/:game',
                name: 'Videos',
                component: Videos,
            },
            {
                path: '/:game/video',
                name: 'Player',
                component: Player
            },
            {
                path: '/about',
                name: 'About',
                component: About
            },
            {
                path: '/gantt',
                name: 'Gantt',
                component: Gantt
            },
            {
                path: 'search',
                name: 'Search',
                component: Search
            }
        ]
    },
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

export default router