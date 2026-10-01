import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  server: {
    // umožní přístup přes cloudflared/localtunnel apod. pro testování na iPadu
    allowedHosts: [".trycloudflare.com"],
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      workbox: {
        // Phaser chunk má ~1,5 MB; limit zvednutý, aby šel do offline cache
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      manifest: {
        name: "DevoDash – Ztišení",
        short_name: "DevoDash",
        description: "Denní ztišení pro děti – verše a hry k nim.",
        theme_color: "#166534",
        background_color: "#f5f5f4",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
    }),
  ],
});
