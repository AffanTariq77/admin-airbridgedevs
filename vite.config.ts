import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5179,
    proxy: {
      "/api": {
        target: "http://localhost:5050",
        changeOrigin: true,
      },
      // So the admin panel can preview uploads through the same relative
      // /uploads/... path that gets stored in the database
      "/uploads": {
        target: "http://localhost:5050",
        changeOrigin: true,
      },
    },
  },
});
