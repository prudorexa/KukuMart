import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'


// TEMPORARY DEBUG: minify:false keeps real function/variable names so the
// on-screen error says exactly which component failed. Remove after fixing.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: { minify: false, sourcemap: true },
})

 plugins: [react(), tailwindcss(), VitePWA({
     registerType: 'autoUpdate',
     manifest: {
       name: 'KukuMart',
       short_name: 'KukuMart',
       theme_color: '#C8290A',
       background_color: '#ffffff',
       display: 'standalone',
       icons: [
         { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
         { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
       ],
     },
   })]