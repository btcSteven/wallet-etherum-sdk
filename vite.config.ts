import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Yaako',
      fileName: (format) => `yaw.${format}.js`,
      formats: ['es', 'umd', 'iife'],
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        banner: `/*! Yaako Wallet SDK VSESION ${packageJson.version} */`,
        footer: `/*! Yaako Wallet SDK VSESION ${packageJson.version} */`,
      },
    },
  },
  define: {
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(packageJson.version),
  },
});