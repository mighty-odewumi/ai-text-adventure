import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
  // server: {
  //   proxy: {
  //     '/manifest.json': {
  //       target: 'https://github.dev',
  //       changeOrigin: true,
  //       secure: false,
  //     },
  //   },
  // },
})
