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
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
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
