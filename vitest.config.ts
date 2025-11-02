import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    alias: {
      '@': '/Users/brooksflannery/Documents/github/recall/src',
    },
  },
});


