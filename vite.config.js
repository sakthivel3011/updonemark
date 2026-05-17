import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: {
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate"
    }
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false
      },
      includeAssets: ['favicon.ico', 'logo192.png', 'logo512.png', 'sitemap.xml', 'robots.txt'],
      manifest: {
        name: 'UpDone Mark',
        short_name: 'UpDone Mark',
        description: 'Smart QR Attendance for College Events',
        theme_color: '#0B7A75',
        background_color: '#040F16',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'app-icon.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'app-icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'app-icon.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'app-icon.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,xml,txt}'],
        navigateFallbackDenylist: [/^\/sitemap\.xml$/, /^\/robots\.txt$/, /^\/bingsiteauth\.xml$/, /^\/googleaeb8c0922c2970d5\.html$/],
        runtimeCaching: [{
          urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
          handler: 'NetworkFirst',
          options: { cacheName: 'firestore-cache', expiration: { maxAgeSeconds: 86400 } }
        }]
      }
    })
  ]
});
