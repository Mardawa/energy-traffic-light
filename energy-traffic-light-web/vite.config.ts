import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin({
    babel: {
      plugins: ['@emotion/babel-plugin']
    }
  })],
  base: '/energy-traffic-light/',
  build: {
    target: 'esnext',
  },
});