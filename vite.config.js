import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    open: true, // 启动后自动在浏览器打开
    proxy: {
      // 高德 WebService 接口走本地代理，绕开浏览器对 restapi.amap.com 的连接干扰
      '/amap': {
        target: 'https://restapi.amap.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/amap/, ''),
      },
    },
  },
})
