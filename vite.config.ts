import { copyFileSync, cpSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

const requiredExtensionFiles = [
  "manifest.json",
  "icons/icon16.png",
  "icons/icon48.png",
  "icons/icon128.png",
] as const;

function copyRequiredFile(assetPath: string, distDir: string): void {
  const outputPath = resolve(distDir, assetPath);

  mkdirSync(dirname(outputPath), { recursive: true });
  copyFileSync(resolve(__dirname, assetPath), outputPath);
}

function copyExtensionAssets(): Plugin {
  return {
    name: "copy-extension-assets",
    writeBundle() {
      const distDir = resolve(__dirname, "dist");

      for (const assetPath of requiredExtensionFiles) {
        copyRequiredFile(assetPath, distDir);
      }
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
