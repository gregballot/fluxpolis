import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@fluxpolis/simulation': path.resolve(__dirname, '../simulation/src'),
    },
  },
  server: {
    port: 3000,
  },
});
