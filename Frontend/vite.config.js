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
      includeAssets: [
        "favicon.svg",
        "apple-touch-icon.png",
        "pwa-icon-192.png",
        "pwa-icon-512.png",
        "browserconfig.xml",
      ],
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
      },
      manifest: {
        id: "/",
        name: "AstraAttend",
        short_name: "AstraAttend",
        description: "Smart attendance management for admins, teachers, and students.",
        theme_color: "#090b10",
        background_color: "#090b10",
        display: "standalone",
        display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
        start_url: "/",
        scope: "/",
        orientation: "portrait",
        lang: "en-IN",
        dir: "ltr",
        categories: ["education", "productivity", "utilities"],
        shortcuts: [
          {
            name: "Open Admin Dashboard",
            short_name: "Admin",
            url: "/admin",
            description: "Jump directly into the admin workspace",
          },
          {
            name: "Open Student Dashboard",
            short_name: "Student",
            url: "/student",
            description: "Track live attendance and history",
          },
        ],
        icons: [
          {
            src: "/logo.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/logo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/logo.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/logo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      "/api": {
        target: "https://attendence-system-backend-1.onrender.com",
        changeOrigin: true,
      },
    },
  },
});
