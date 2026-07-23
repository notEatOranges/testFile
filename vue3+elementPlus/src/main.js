import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@/styles/element-plus.scss'
import '@/styles/global.scss'
import App from './App.vue'
import router from './router'
import { setupMock } from './mock'
import './assets/main.css'

// 设置 Mock API
setupMock()

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')
