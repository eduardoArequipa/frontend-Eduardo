import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    viteCompression({ algorithm: 'gzip' }), // Comprime usando Gzip
    viteCompression({ algorithm: 'brotliCompress' }), // Comprime usando Brotli
    visualizer({
      filename: './dist/bundle-report.html',
      open: true, // Abre automáticamente el HTML del reporte
      gzipSize: true,
      brotliSize: true
    })
  ],
  build: {
    sourcemap: true, // Para inspeccionar mejor qué incluye cada archivo
    rollupOptions: {
      output: {
        manualChunks: {
          // Opcional: divide React y otras dependencias grandes en chunks separados
          react: ['react', 'react-dom'],
        },
      },
    },
  },
});
