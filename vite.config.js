import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// TEMPORARY DEBUG: minify:false keeps real function/variable names so the
// on-screen error says exactly which component failed. Remove after fixing.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: { minify: false, sourcemap: true },
})