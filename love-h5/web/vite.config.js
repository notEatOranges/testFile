import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'

export default defineConfig({
  plugins: [vue(), Icons({ compiler: 'vue3' })],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8090', changeOrigin: true },
      '/files': { target: 'http://localhost:8090', changeOrigin: true },
      '/ws': { target: 'ws://localhost:8090', ws: true }
    }
  },
  build: {
    // 直接构建进 Spring Boot 静态资源目录：一个 jar 就是整个网站
    outDir: '../server/src/main/resources/static',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500
  }
})
