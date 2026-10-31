import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { initTheme } from '@/utils/theme'
import { initFont } from '@/utils/font'
import { installRpcTransport } from '@/utils/chain'
import '@fontsource/roboto/latin-400.css'
import '@fontsource/roboto/latin-500.css'
import '@fontsource/roboto/latin-700.css'
import './assets/styles/base.css'
import './themes/classic/styles/tokens.css'
import './themes/classic/styles/global.css'
import './themes/material/styles/tokens.css'
import './themes/material/styles/global.css'

initTheme()
initFont()
installRpcTransport()

createApp(App).use(createPinia()).use(router).mount('#app')
