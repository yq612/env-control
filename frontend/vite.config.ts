import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import ElementPlus from "unplugin-element-plus/vite";

export default defineConfig({
  plugins: [vue(), ElementPlus({})],
  build: {
    lib: {
      entry: "./src/main.ts",
      name: "envControl",
      fileName: (format) => `env-control.${format}.js`,
    },
    outDir: "../extension/source/static",
  },
});
