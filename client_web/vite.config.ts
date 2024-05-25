import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import topLevelAwait from 'vite-plugin-top-level-await';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), topLevelAwait()],
  server: {
    watch: {
      usePolling: true,
    },
    hmr: true,
    host: '0.0.0.0',
    proxy: {
      '/wsapi': {
        target: 'ws://localhost:9982',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/wsapi/, '')
      }
    },
  },
})
