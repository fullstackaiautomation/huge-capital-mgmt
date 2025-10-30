import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    base: '/',
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
    define: {
      // Environment variables will be injected at build time
      // Use process.env first (for CI/CD), fall back to .env file (for local dev)
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || ''),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || ''),
      'import.meta.env.VITE_GOOGLE_SHEETS_API_KEY': JSON.stringify(process.env.VITE_GOOGLE_SHEETS_API_KEY || env.VITE_GOOGLE_SHEETS_API_KEY || ''),
      'import.meta.env.VITE_GOOGLE_SHEETS_ID': JSON.stringify(process.env.VITE_GOOGLE_SHEETS_ID || env.VITE_GOOGLE_SHEETS_ID || ''),
    },
  }
})
