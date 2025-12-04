import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

console.log('Loaded vitest.config.mts')
 
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    exclude: [
      ...configDefaults.exclude,
      '**/.next/**',
      '**/dist/**',
    ],
    coverage: {
      enabled: true,
      provider: 'v8',
      exclude: ['./src/generated/**', '**/*.config.{ts,mts,js,mjs}', './scripts/**'],
    },
  },
})