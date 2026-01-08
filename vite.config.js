import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  server: {
    host: '0.0.0.0', // Permite acceso desde cualquier dispositivo en la red
    port: 5173,
    strictPort: false,
  },
  preview: {
    host: '0.0.0.0', // Para el modo preview también
    port: 4173,
  },
})
