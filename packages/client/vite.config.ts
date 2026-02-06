import fs from 'node:fs';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf-8'),
);

export default defineConfig({
  plugins: [vue()],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  resolve: {
    alias: {
      '@fluxpolis/client': path.resolve(__dirname, './src'),
      '@fluxpolis/simulation': path.resolve(__dirname, '../simulation/src'),
      '@fluxpolis/eventbus': path.resolve(__dirname, '../eventbus/src'),
    },
  },
  server: {
    port: 3000,
  },
});
