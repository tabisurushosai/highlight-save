import type { HighlightStorageBackend, HighlightStorageItems } from "./types";

export function createChromeStorageBackend(storageArea: chrome.storage.StorageArea): HighlightStorageBackend {
  return {
    async read(keys: readonly string[]): Promise<HighlightStorageItems> {
      return storageArea.get([...keys]);
    },

    async write(items: HighlightStorageItems): Promise<void> {
      await storageArea.set(items);
    },
  };
}
