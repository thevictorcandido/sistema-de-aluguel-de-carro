import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    // IPv4 explícito: com "localhost", o Vite pode escutar só em ::1 e o navegador não conectar
    host: '127.0.0.1',
    port: 5173,
    // Falha com aviso se a porta estiver ocupada, em vez de subir em outra
    strictPort: true,
    // Mesma origem para front e API durante o desenvolvimento, sem CORS
    proxy: {
      '/api': 'http://127.0.0.1:8080',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})
