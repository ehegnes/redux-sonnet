import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

const PORT = 3000

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths()
  ],
  define: {
    VITE_PORT: PORT
  },
  server: {
    port: PORT,
    proxy: {
      "/api": {
        // Required for GitHub API CORS resolution.
        target: "https://api.github.com",
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => path.replace("/api/", ""),
        configure: (proxy) => {
          proxy.on("error", (err) => {
            console.error("[proxy] error", err)
          })
          proxy.on("proxyReq", (_proxyReq, req) => {
            console.log("[proxy] request:", req.method, req.url)
          })
          proxy.on("proxyRes", (proxyRes, req) => {
            console.log("[proxy] response:", proxyRes.statusCode, req.url)
          })
        }
      }
    }
  }
})
