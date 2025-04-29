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
      name: 'Yaw',
      fileName: (format) => `yaw.${format}.js`,
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        banner: `/*! Wallet SDK VSESION ${packageJson.version} */`,
        footer: `/*! Wallet SDK VSESION ${packageJson.version} */`,
      },
    },
  },
  define: {
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(packageJson.version),
  },
});