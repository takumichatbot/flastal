import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/controllers/**', 'src/utils/**'],
      exclude: ['src/controllers/adminController.js'],
      thresholds: {
        lines: 20,
        functions: 20,
      },
    },
    testTimeout: 15000,
  },
});
