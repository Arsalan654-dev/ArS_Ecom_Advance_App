import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({

  plugins: [react(), tailwindcss()],

  server: {
    open: true,
    hmr: {
      overlay: true,
      protocol: 'ws',
      host: 'localhost',
      port: 5173
    },
    watch: {
      usePolling: true,
      interval: 100,
      ignored: ['**/node_modules/**', '**/.git/**']
    }
  },
  optimizeDeps: {
    force: true
  }



})
