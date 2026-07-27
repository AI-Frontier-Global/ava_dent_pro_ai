import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync(fileURLToPath(new URL('./config.json', import.meta.url)), 'utf-8'));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: config.network?.host || '0.0.0.0',
    port: config.ports?.web || 5173,
    proxy: {
      '/bridge-api': {
        target: `http://localhost:${config.ports?.bridge || 3001}`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bridge-api/, '/api'),
      },
    },
  },
});
