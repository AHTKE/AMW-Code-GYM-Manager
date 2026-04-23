import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  base: "./",
  build: {
    target: "es2015",
    sourcemap: false,
  },
  server: {
    host: "::",
    // Unique dev port per project — prevents localStorage sharing across apps on localhost
    port: 8091,
    strictPort: false,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
