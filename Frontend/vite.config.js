import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "image.png"],
      manifest: {
        name: "Attendance System",
        short_name: "Attendance",
        description: "A comprehensive college attendance tracking system",
        theme_color: "#1e1e2f",
        background_color: "#1e1e2f",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/image.png",
            sizes: "192x192 512x512",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/image.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          }
        ],
      },
    }),
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
