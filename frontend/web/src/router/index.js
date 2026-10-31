import { createRouter, createWebHashHistory } from 'vue-router'
import { useVaultStore } from '@/stores/vault'
import ThemedView from '@/themes/ThemedView.vue'

/** 页面组件由 ThemedView 按当前界面风格从 themes 注册表解析，路由 name 即注册表里的键 */
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: ThemedView },
    { path: '/unlock', name: 'unlock', component: ThemedView },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: ThemedView },
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
