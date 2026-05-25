import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../Backend/wwwroot',
    emptyOutDir: true,
  },
  server: {
    historyApiFallback: true,
    hmr: {
      overlay: false
    },
    fs: {
      strict: false
    }
  }
})