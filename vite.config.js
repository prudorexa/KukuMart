import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',          // new deploys replace the old app silently
      includeAssets: ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'KukuMart — Fresh Chicken Nairobi',
        short_name: 'KukuMart',
        description: "Nairobi's freshest chicken delivered to your door.",
        lang: 'en',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#C8290A',
        background_color: '#ffffff',
        categories: ['food', 'shopping'],
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Shop chicken', url: '/shop', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',   // client-side routes work offline too
        // NOTE: Supabase API/auth calls are deliberately NOT cached (orders, login,
        // stock must always be live). Only fonts and product photos are cached.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-css' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'product-images',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 14 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
