import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { initTheme } from '@/utils/theme'
import { initFont } from '@/utils/font'
import { installRpcTransport } from '@/utils/chain'
import './assets/styles/tokens.css'
import './assets/styles/global.css'

initTheme()
initFont()
installRpcTransport()

createApp(App).use(createPinia()).use(router).mount('#app')
