import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Thay bang 3001 cho Kiosk neu chay cung luc tren may tinh
    host: true,
    proxy: {
      // Tu dong chuyen huong call API ve backend khi test local
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        ws: true // Ho tro WebSocket cho Kiosk
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  }
})
