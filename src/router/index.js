import { createRouter, createWebHistory } from 'vue-router'
import CreateSticker from '@/layouts/CreateSticker.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: CreateSticker,
      children: []
    }
  ]
})

export default router
