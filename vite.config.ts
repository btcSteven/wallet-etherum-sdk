import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  server: {
    host: '0.0.0.0',  // 允许外部访问
    port: 3000,       // 设置端口
  },
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Yaw',
      fileName: (format) => `yaw.${format}.js`,
    },
    rollupOptions: {
      // 确保外部依赖不会被打包
      external: [],
      output: {
        globals: {},
      },
    },
  },
});
