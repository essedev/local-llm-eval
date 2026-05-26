import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 51750,
    proxy: {
      '/api': 'http://127.5.5.5:8005'
    }
  }
    })