import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Repo name — required as the Vite `base` when deploying to GitHub Pages at
// https://<username>.github.io/gym-coach-app/. Change this if you rename
// the repository.
const REPO_NAME = 'gym-coach-app'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Only prefix with the repo path when building for production (GitHub
  // Pages). The dev server should stay at the site root, or asset URLs
  // won't resolve and the page loads blank.
  base: command === 'build' ? `/${REPO_NAME}/` : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Gym Coach',
        short_name: 'Gym Coach',
        description: 'A personal bodybuilding coaching app — monthly planning, workout generation, and progression tracking.',
        theme_color: '#0B0D10',
        background_color: '#0B0D10',
        display: 'standalone',
        orientation: 'portrait',
        start_url: `/${REPO_NAME}/`,
        scope: `/${REPO_NAME}/`,
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache the app shell so it opens (with previously-loaded data)
        // even with no network — the offline requirement from the spec.
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
      devOptions: {
        // Lets you test the service worker with `npm run dev` too, not
        // just in a production build.
        enabled: true,
      },
    }),
  ],
}))
