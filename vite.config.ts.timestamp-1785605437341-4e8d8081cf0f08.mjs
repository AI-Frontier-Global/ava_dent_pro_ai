// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { fileURLToPath, URL } from "node:url";
import { readFileSync } from "node:fs";
var __vite_injected_original_import_meta_url = "file:///home/project/vite.config.ts";
var config = JSON.parse(readFileSync(fileURLToPath(new URL("./config.json", __vite_injected_original_import_meta_url)), "utf-8"));
var vite_config_default = defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
    }
  },
  optimizeDeps: {
    exclude: ["lucide-react"]
  },
  server: {
    host: config.network?.host || "0.0.0.0",
    port: config.ports?.web || 5173,
    proxy: {
      "/bridge-api": {
        target: `http://localhost:${config.ports?.bridge || 3001}`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bridge-api/, "/api")
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoLCBVUkwgfSBmcm9tICdub2RlOnVybCc7XG5pbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tICdub2RlOmZzJztcblxuY29uc3QgY29uZmlnID0gSlNPTi5wYXJzZShyZWFkRmlsZVN5bmMoZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL2NvbmZpZy5qc29uJywgaW1wb3J0Lm1ldGEudXJsKSksICd1dGYtOCcpKTtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIGJhc2U6ICcuLycsXG4gIHBsdWdpbnM6IFtyZWFjdCgpXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICB9LFxuICB9LFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBleGNsdWRlOiBbJ2x1Y2lkZS1yZWFjdCddLFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiBjb25maWcubmV0d29yaz8uaG9zdCB8fCAnMC4wLjAuMCcsXG4gICAgcG9ydDogY29uZmlnLnBvcnRzPy53ZWIgfHwgNTE3MyxcbiAgICBwcm94eToge1xuICAgICAgJy9icmlkZ2UtYXBpJzoge1xuICAgICAgICB0YXJnZXQ6IGBodHRwOi8vbG9jYWxob3N0OiR7Y29uZmlnLnBvcnRzPy5icmlkZ2UgfHwgMzAwMX1gLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9icmlkZ2UtYXBpLywgJy9hcGknKSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLG9CQUFvQjtBQUN0UCxPQUFPLFdBQVc7QUFDbEIsU0FBUyxlQUFlLFdBQVc7QUFDbkMsU0FBUyxvQkFBb0I7QUFIcUcsSUFBTSwyQ0FBMkM7QUFLbkwsSUFBTSxTQUFTLEtBQUssTUFBTSxhQUFhLGNBQWMsSUFBSSxJQUFJLGlCQUFpQix3Q0FBZSxDQUFDLEdBQUcsT0FBTyxDQUFDO0FBR3pHLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLE1BQU07QUFBQSxFQUNOLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLGNBQWMsSUFBSSxJQUFJLFNBQVMsd0NBQWUsQ0FBQztBQUFBLElBQ3REO0FBQUEsRUFDRjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLGNBQWM7QUFBQSxFQUMxQjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTSxPQUFPLFNBQVMsUUFBUTtBQUFBLElBQzlCLE1BQU0sT0FBTyxPQUFPLE9BQU87QUFBQSxJQUMzQixPQUFPO0FBQUEsTUFDTCxlQUFlO0FBQUEsUUFDYixRQUFRLG9CQUFvQixPQUFPLE9BQU8sVUFBVSxJQUFJO0FBQUEsUUFDeEQsY0FBYztBQUFBLFFBQ2QsU0FBUyxDQUFDLFNBQVMsS0FBSyxRQUFRLGlCQUFpQixNQUFNO0FBQUEsTUFDekQ7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
