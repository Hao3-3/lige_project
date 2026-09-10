import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { spawn } from 'child_process'

// 开发时自动启动后端服务（Express + SQL Server），无需单独开终端
function backendServer() {
  let child = null
  return {
    name: 'backend-server',
    configureServer(server) {
      child = spawn('node', ['server/index.js'], {
        stdio: 'inherit',
        shell: false,
      })
      child.on('error', (e) => console.error('[backend] 启动失败：', e.message))
      child.on('exit', (code) => console.log(`[backend] 后端已退出，code=${code}`))
      server.httpServer?.once('close', () => {
        if (child) child.kill()
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), backendServer()],
  server: {
    open: true, // 启动后自动在浏览器打开
    port: 5173, // 固定端口，避免漂移到 5174 导致打不开
    strictPort: true, // 端口被占用时直接报错，不自动换端口
    proxy: {
      // 高德 WebService 接口走本地代理，绕开浏览器对 restapi.amap.com 的连接干扰
      '/amap': {
        target: 'https://restapi.amap.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/amap/, ''),
      },
      // 后端登录/注册/站点接口转发到 Express 服务
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
