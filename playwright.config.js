// Playwright — configuracion del E2E de navegador (ADR-FE-004).
//
// baseURL parametrizado por perfil (ADR-FE-004 v1.1.0, precision 1):
//   - dev:    webpack serve en :3001 (cross-origin contra api:8000)
//   - deploy: same-origin via Django serve_spa
// Override con PW_BASE_URL. Entorno autoritativo: WSL (L-010); el verde
// no se declara desde el contenedor.
//
// testMatch '*.e2e.js' evita colision con jest (que toma *.spec/*.test).
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.js',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PW_BASE_URL || 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
            || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
          args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
        },
      },
    },
  ],
});
