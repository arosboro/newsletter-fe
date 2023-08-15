/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import GlobalsPolyfills from '@esbuild-plugins/node-globals-polyfill';
import path from 'path';
import wasmPack from 'vite-plugin-wasm-pack';

const wasmPackPlugin = wasmPack(['./newsletter_worker']);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), VitePWA({ registerType: 'autoUpdate' }), wasmPackPlugin],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@demox-labs/aleo-wallet-adapter-reactui': '@demox-labs/aleo-wallet-adapter-reactui/dist/',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      plugins: [
        GlobalsPolyfills({
          process: true,
          buffer: true,
        }),
      ],
    },
  },
});
