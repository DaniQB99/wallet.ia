import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
