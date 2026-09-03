import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  server: {
    host: '0.0.0.0',
    port: 8081,
    headers: {
      'Cache-Control': 'no-store',
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.xlsx'],
  build: {
    // تحسين حجم الملفات
    target: 'es2020',
    cssMinify: true,
    rollupOptions: {
      output: {
        // فصل المكتبات الكبيرة لتحسين التخزين المؤقت
        manualChunks: {
          'xlsx': ['xlsx'],
          'leaflet': ['leaflet', 'react-leaflet'],
        }
      }
    }
  },
}));
