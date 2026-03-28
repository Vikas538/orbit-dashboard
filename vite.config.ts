import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8005,
    proxy: {
      '/sessions': 'http://localhost:8000',
      '/internal': 'http://localhost:8000',
    },
  },
})
