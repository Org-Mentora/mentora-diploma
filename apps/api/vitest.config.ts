import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts', 'src/**/*.test.ts'],
    hookTimeout: 120_000,
    env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' },
  },
});
