import { copyFileSync, cpSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

function copyExtensionAssets(): Plugin {
  return {
    name: "copy-extension-assets",
    writeBundle() {
      const distDir = resolve(__dirname, "dist");

      mkdirSync(distDir, { recursive: true });
      copyFileSync(resolve(__dirname, "manifest.json"), resolve(distDir, "manifest.json"));
      cpSync(resolve(__dirname, "icons"), resolve(distDir, "icons"), { recursive: true });
      cpSync(resolve(__dirname, "_locales"), resolve(distDir, "_locales"), { recursive: true });
    },
  };
}

export default defineConfig({
  plugins: [copyExtensionAssets()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        content: resolve(__dirname, "src/content.ts"),
        popup: resolve(__dirname, "popup.html"),
      },
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
});
