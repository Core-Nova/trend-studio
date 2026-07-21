import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import { imagetools } from 'vite-imagetools'

// Base URL strategy:
//   - custom domain (default GitHub Pages with CNAME → root)    → '/'
//   - GitHub Pages without custom domain (user.github.io/repo/) → set VITE_BASE_PATH='/trend-studio/'
const basePath = process.env.VITE_BASE_PATH ?? '/'

export default defineConfig({
  plugins: [
    react(),
    imagetools(),
    ViteImageOptimizer({
      png: { quality: 80 },
      jpeg: { quality: 80 },
      jpg: { quality: 80 },
      webp: { quality: 80 },
    })
  ],
  base: basePath,
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.js']
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      }
    }
  }
})
