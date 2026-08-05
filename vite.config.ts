import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json'

/**
 * Content-Security-Policy — YALNIZCA üretim build'ine enjekte edilir (dev'de Vite'ın
 * HMR websocket'i ve enjekte ettiği script'leri bozmamak için hariç tutulur).
 *
 * connect-src, uygulamanın GERÇEKTEN bağlandığı tüm origin'leri listeler: Firebase
 * RTDB (https + wss) ve Auth (googleapis) + kur kaynakları + (native'de) Vercel proxy.
 * Biri eksik olsaydı ilgili senkron/kur isteği "refused" olur, işlevi bozardı - bu yüzden
 * liste kaynak koddaki fetch hedefleriyle birlikte güncellenmeli.
 *
 * script-src 'self': satır-içi ve harici enjekte edilen script çalıştırmayı engeller
 * (XSS'in en zararlı biçimi). PWA kaydı ayrı registerSW.js dosyası (self) olduğundan,
 * inline stil enjekte eden kütüphaneler ise style-src 'unsafe-inline' ile karşılandığından
 * mevcut işlevsellik bozulmaz.
 */
function cspMeta(apiBase?: string): string {
  const connect = [
    "'self'",
    'https://finans.truncgil.com',
    'https://api.genelpara.com',
    'https://api.exchangerate-api.com',
    'https://*.firebaseio.com',
    'https://*.firebasedatabase.app',
    'wss://*.firebaseio.com',
    'wss://*.firebasedatabase.app',
    'https://*.googleapis.com',
    ...(apiBase ? [apiBase] : []),
  ].join(' ')
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connect}`,
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
  ].join('; ')
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBase = env.VITE_API_BASE_URL?.replace(/\/$/, '') || undefined

  return {
    // Sürüm tek kaynaktan: package.json. Eskiden SettingsPage'de elle yazılıydı ve
    // build.gradle'dan kaymıştı (arayüz v1.1.0 derken yüklü sürüm 1.0.1'di).
    define: { __APP_VERSION__: JSON.stringify(pkg.version) },
    plugins: [
      react(),
      tailwindcss(),
      // CSP'yi üretim index.html'ine <head> içine ekle (dev'de atlanır).
      mode === 'production' && {
        name: 'inject-csp',
        transformIndexHtml: {
          order: 'post' as const,
          handler(html: string) {
            return html.replace(
              '</title>',
              `</title>\n    <meta http-equiv="Content-Security-Policy" content="${cspMeta(apiBase)}" />`,
            )
          },
        },
      },
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'BenimKasam - Kişisel Kasa Takipçisi',
          short_name: 'BenimKasam',
          description: 'Döviz ve altın varlıklarınızı takip edin',
          theme_color: '#1e3a5f',
          background_color: '#f8fafc',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          categories: ['finance', 'utilities'],
          icons: [
            { src: 'icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
            { src: 'icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
            { src: 'icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
            { src: 'icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
            { src: 'icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
            { src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
            { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/finans\.truncgil\.com\/.*/i,
              handler: 'NetworkFirst',
              options: { cacheName: 'api-rates', expiration: { maxEntries: 10, maxAgeSeconds: 300 } },
            },
            {
              urlPattern: /\/api\/rates/,
              handler: 'NetworkFirst',
              options: { cacheName: 'api-proxy-rates', expiration: { maxEntries: 10, maxAgeSeconds: 300 } },
            },
          ],
        },
      }),
    ],
  }
})
