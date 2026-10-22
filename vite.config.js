import { defineConfig } from 'vite';

export default defineConfig({
  // 使用相對路徑，方便之後放進 Wallpaper Engine 或 Electron
  base: './',
  server: {
    open: true,
  },
});
