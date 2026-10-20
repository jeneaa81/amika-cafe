import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/amika-cafe/',
  plugins: [
    react(),
    tailwindcss(),
    cssInjectedByJsPlugin(),
  ],
})
