import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // `loadEnv` reads the .env files for this mode. Without it, variables in
  // frontend/.env are NOT visible on `process.env` inside this config file, so
  // a `process.env.X` lookup would silently fall through to the default.
  // The empty prefix loads every variable, not just the VITE_-prefixed ones.
  const env = loadEnv(mode, process.cwd(), '')

  // Where the dev server forwards `/api` requests. Only used by `vite dev`;
  // the production build talks to whatever domain serves it.
  const devApiTarget = env.DEV_API_URL || 'http://localhost:5000'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        // Import as `@/components/...` instead of long relative chains.
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      // In dev the app calls the relative path `/api` on its own origin and Vite
      // proxies it to Express. This mirrors production (where the API lives on
      // the same domain), so there is no CORS in either environment and no
      // environment-specific API URL to get wrong.
      proxy: {
        '/api': {
          target: devApiTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      // Split vendors so the main bundle stays small and cacheable. Vite 8 uses
      // rolldown, which requires a function here rather than a static object.
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined
            if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/.test(id)) {
              return 'react'
            }
            return 'vendor'
          },
        },
      },
    },
  }
})
