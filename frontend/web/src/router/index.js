import { createRouter, createWebHashHistory } from 'vue-router'
import { useVaultStore } from '@/stores/vault'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('@/views/home/Index.vue') },
    { path: '/unlock', name: 'unlock', component: () => import('@/views/unlock/Index.vue') },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFound.vue') },
  ],
})

/** 金库未解锁时所有页面都回到解锁页 */
router.beforeEach(async (to) => {
  const vault = useVaultStore()
  await vault.init()
  const unlocked = vault.status === 'unlocked'
  if (!unlocked && to.name !== 'unlock') return { name: 'unlock' }
  if (unlocked && to.name === 'unlock') return { name: 'home' }
  return true
})

export default router
