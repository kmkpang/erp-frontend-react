import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@component': path.resolve(__dirname, './src/components'),
      '@hook': path.resolve(__dirname, './src/hooks'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@module': path.resolve(__dirname, './src/module'),
      '@constant': path.resolve(__dirname, './src/constant'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
})
