import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    alias: {
      '@': path.resolve(fileURLToPath(new URL('.', import.meta.url)), './src'),
      'server-only': path.resolve(fileURLToPath(new URL('.', import.meta.url)), './src/tests/__mocks__/server-only.js'),
    },
  },
});
