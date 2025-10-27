import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => ({
  // base: "/", // Use absolute paths for Vercel
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:5174",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  // Serve from root in development to avoid 404s
  // base is only needed for production when deploying under a subpath
  // Remove or set appropriately during deploy
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
