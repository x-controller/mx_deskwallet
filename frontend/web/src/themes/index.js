import { defineAsyncComponent } from 'vue'

/**
 * 界面风格注册表：每种风格提供自己的页面、全局消息与确认框组件。
 * 页面按路由 name 索引，由 ThemedView 按当前风格解析；stores / utils / router 两套风格共用。
 */
const lazy = (loader) => defineAsyncComponent(loader)

export const themes = {
  classic: {
    views: {
      home: lazy(() => import('./classic/views/home/Index.vue')),
      unlock: lazy(() => import('./classic/views/unlock/Index.vue')),
      'not-found': lazy(() => import('./classic/views/NotFound.vue')),
    },
    Message: lazy(() => import('./classic/components/MxMessage.vue')),
    Confirm: lazy(() => import('./classic/components/MxConfirm.vue')),
  },
  material: {
    views: {
      home: lazy(() => import('./material/views/home/Index.vue')),
      unlock: lazy(() => import('./material/views/unlock/Index.vue')),
      'not-found': lazy(() => import('./material/views/NotFound.vue')),
    },
    Message: lazy(() => import('./material/components/MdSnackbar.vue')),
    Confirm: lazy(() => import('./material/components/MdConfirm.vue')),
    /** 风格激活时执行一次：按种子色生成并注入 Material 配色 */
    setup: () => import('./material/colors.js').then((m) => m.applyMaterialColors()),
  },
}
