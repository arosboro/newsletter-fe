import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import GlobalsPolyfills from '@esbuild-plugins/node-globals-polyfill';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), VitePWA({ registerType: 'autoUpdate' })],
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
