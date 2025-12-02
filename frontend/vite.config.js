import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss'; 
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.VITE_API_URL;

export default defineConfig({
  plugins: [react(), tailwindcss()], 
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
  server: {
    proxy: {
      '/register': {
        target: API_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/register/, '/register')
      },
      '/login': {
       target: API_URL,
       changeOrigin: true,
       rewrite: (path) => path.replace(/^\/login/, '/login')
      },
      '/isauth': {
       target: API_URL,
       changeOrigin: true,
       rewrite: (path) => path.replace(/^\/isauth/, '/isauth')
      },
       '/poll_list': {
       target: API_URL,
       changeOrigin: true,
       rewrite: (path) => path.replace(/^\/poll_list/, '/poll_list')
      },
       '/poll/': {
       target: API_URL,
       changeOrigin: true,
       rewrite: (path) => path.replace(/^\/poll\/([a-zA-Z0-9]+)/, '/poll/$1')
      },
       '^/vote/vote_./[^/]+/[^/]+$': {
       target: API_URL,
       changeOrigin: true,
       rewrite: (path) => path,
      },
      '/logout': {
       target: API_URL,
       changeOrigin: true,
       rewrite: (path) => path.replace(/^\/logout/, '/logout')
     },
    }
  }
});
