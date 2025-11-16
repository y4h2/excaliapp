import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Fix for Excalidraw's Node.js global dependencies
  define: {
    'process.env': {},
    'process.platform': '"browser"',
    'process.version': '""',
    global: 'globalThis'
  }
})
