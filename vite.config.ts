/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => `index.js`,
    },
    rollupOptions: {
      // Externalize all peer/shared packages so consumers supply a single copy.
      // Critical for React context identity: @sudobility/building_blocks (ApiProvider,
      // Auth) and @sudobility/components/auth must NOT be bundled, or the app shell
      // wrapper would read different provider instances than the host app's.
      external: [
        /^react(\/|$)/,
        'react-dom',
        /^@sudobility\//,
        /^@tanstack\//,
        /^@heroicons\//,
        /^@revenuecat\//,
      ],
      output: {
        exports: 'named',
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
