import { defineConfig, devices } from '@playwright/test'

// Testes ponta a ponta: sobem uma API própria (perfil local, H2 em memória) e um Vite apontando para ela,
// em portas diferentes das de desenvolvimento, para não esbarrar em servidores já abertos.
const PORTA_API = 8091
const PORTA_WEB = 5181
// No Windows, o cmd só acha o wrapper com o caminho explícito
const mvnw = process.platform === 'win32' ? '.\\mvnw.cmd' : './mvnw'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORTA_WEB}`,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
  webServer: [
    {
      command: `${mvnw} -q spring-boot:run -Dspring-boot.run.arguments=--server.port=${PORTA_API}`,
      cwd: '../backend',
      url: `http://127.0.0.1:${PORTA_API}/api/health`,
      timeout: 180_000,
      reuseExistingServer: false,
    },
    {
      command: `npx vite --port ${PORTA_WEB}`,
      env: { API_PORT: String(PORTA_API) },
      url: `http://127.0.0.1:${PORTA_WEB}`,
      timeout: 60_000,
      reuseExistingServer: false,
    },
  ],
})
