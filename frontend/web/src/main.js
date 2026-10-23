import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { initTheme } from '@/utils/theme'
import { installRpcTransport } from '@/utils/chain'
import './assets/styles/tokens.css'
import './assets/styles/global.css'

initTheme()
installRpcTransport()

createApp(App).use(createPinia()).use(router).mount('#app')
