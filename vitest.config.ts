import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: [
      {
        find: /^next\/server$/,
        replacement: path.resolve(__dirname, './node_modules/next/server.js'),
      },
      {
        find: /^next\/navigation$/,
        replacement: path.resolve(__dirname, './node_modules/next/navigation.js'),
      },
      {
        find: /^next\/headers$/,
        replacement: path.resolve(__dirname, './node_modules/next/headers.js'),
      },
      {
        find: /^next\/cache$/,
        replacement: path.resolve(__dirname, './node_modules/next/cache.js'),
      },
      {
        find: '@',
        replacement: path.resolve(__dirname, './src'),
      },
    ],
  },
});
