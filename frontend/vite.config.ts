import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Inline CSS under 4KB to reduce render-blocking requests
    cssCodeSplit: true,
    // Minify CSS for faster delivery
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React ecosystem (loaded on every page)
          'vendor-react': ['react', 'react-dom'],
          
          // TanStack ecosystem
          'vendor-tanstack': [
            '@tanstack/react-query',
            '@tanstack/react-router',
          ],
          
          // PDF generation (only when printing badges)
          'pdf-tools': ['jspdf', 'jspdf-autotable', 'jsbarcode'],
          
          // Excel parsing (only when importing data)
          'excel-tools': ['exceljs'],
          
          // Charts (only on dashboard pages)
          'charts': ['recharts'],
          
          // QR/Barcode scanning (only on scan pages)
          'scanner': ['html5-qrcode', 'qrcode'],
          
          // HTML to canvas (only for badge preview)
          'html2canvas': ['html2canvas'],
        },
      },
    },
    // Suppress warning for chunks we intentionally allow to be large
    chunkSizeWarningLimit: 600,
  },
})
