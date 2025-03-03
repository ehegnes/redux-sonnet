import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const port = parseInt(env.VITE_PORT, 10) ?? 3000

  return {
    plugins: [
      react(),
      tsconfigPaths()
    ],
    server: {
      port,
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
  }
})