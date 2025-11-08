import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // 👈 frontend runs here
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // 👈 backend (FastAPI)
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
