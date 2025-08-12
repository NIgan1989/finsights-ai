import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '@/backend': path.resolve(__dirname, './backend'),
        '@/components': path.resolve(__dirname, './backend/components'),
        '@/services': path.resolve(__dirname, './services'),
        '@/templates': path.resolve(__dirname, './templates'),
      }
    },
    server: {
      port: 5173,
      proxy: {
        '/auth': 'http://localhost:3001',
        '/api': 'http://localhost:3001'
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom']
    }
  };
});
