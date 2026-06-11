import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  plugins: [react(), svgr({ include: '**/*.svg?react' })],
  base: '/editor/',
  build: { outDir: 'build' },
  server: {
    port: 3001,
    strictPort: true,
    hmr: {
      clientPort: 5000
    }
  }
})
