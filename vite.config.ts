import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Wallet.ia',
        short_name: 'Wallet.ia',
        description: 'Gestiona tus finanzas en pareja de forma simple',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot}']
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["emoji-mart", "@emoji-mart/react", "@emoji-mart/data"],
  },
  build: {
    commonjsOptions: {
      include: [/emoji-mart/, /node_modules/],
    },
    /**
     * Manual chunks: divide el bundle en piezas más pequeñas que el navegador
     * puede descargar en paralelo. Las dependencias grandes se separan del
     * código de la app para que los cambios de código no invaliden el cache
     * de las librerías (que cambian menos frecuentemente).
     */
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('@supabase/supabase-js')) return 'supabase';
          if (id.includes('framer-motion')) return 'framer';
          if (id.includes('emoji-mart') || id.includes('@emoji-mart')) return 'emoji';
        },
      },
    },
  },
});
