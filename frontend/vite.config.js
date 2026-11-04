import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Porta da API para o proxy. Os testes ponta a ponta sobem uma API própria em outra porta.
const portaApi = process.env.API_PORT ?? '8080'

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
      '/api': `http://127.0.0.1:${portaApi}`,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    // Os testes ponta a ponta ficam em e2e/ e rodam pelo Playwright
    include: ['src/**/*.test.{js,jsx}'],
  },
})
