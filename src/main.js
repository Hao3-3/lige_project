import './style.css'
import router from './router'
import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import axios from 'axios'
// provide用法第一步，导出app
export const app =createApp(App)

//createApp(App).mount('#app')
app.use(router)
app.use(ElementPlus)
app.mount('#app')
