import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig(({ mode }) => {
  const base = mode === 'cloudflare' ? '/obligo/' : '/';
  return {
    base,
    build: {
      outDir: mode === 'cloudflare' ? 'cloudflare-dist/obligo' : 'dist',
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['icon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'Obligo',
          short_name: 'Obligo',
          description: 'What needs my attention today?',
          id: base,
          start_url: base,
          scope: base,
          display: 'standalone',
          theme_color: '#176b50',
          background_color: '#f6f7f9',
          icons: [
            { src: `${base}icon-192.png`, sizes: '192x192', type: 'image/png' },
            {
              src: `${base}icon-512.png`,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: `${base}icon-maskable.png`,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          navigateFallback: `${base}index.html`,
          cleanupOutdatedCaches: true,
        },
      }),
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      clearMocks: true,
    },
  };
});
