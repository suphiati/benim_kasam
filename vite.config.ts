import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'BenimKasam - Kişisel Kasa Takipçisi',
        short_name: 'BenimKasam',
        description: 'Döviz ve altın varlıklarınızı takip edin',
        theme_color: '#1e3a5f',
        background_color: '#f8fafc',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.genelpara\.com\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-rates', expiration: { maxEntries: 10, maxAgeSeconds: 300 } },
          },
          {
            urlPattern: /^https:\/\/finans\.truncgil\.com\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-rates-fallback', expiration: { maxEntries: 10, maxAgeSeconds: 300 } },
          },
        ],
      },
    }),
  ],
})
