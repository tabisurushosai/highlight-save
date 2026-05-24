import { createHighlightStorageAdapter } from "./adapter";
import type { HighlightStorageAdapter, HighlightStorageBackend, HighlightStorageItems } from "./types";

function createChromeStorageBackend(storageArea: chrome.storage.StorageArea): HighlightStorageBackend {
  return {
    async get(keys: readonly string[]): Promise<HighlightStorageItems> {
      return storageArea.get([...keys]);
    },

    async set(items: HighlightStorageItems): Promise<void> {
      await storageArea.set(items);
    },
  };
}

export function createChromeHighlightStorage(
  storageArea: chrome.storage.StorageArea = chrome.storage.local,
): HighlightStorageAdapter {
  return createHighlightStorageAdapter(createChromeStorageBackend(storageArea));
}

export const chromeHighlightStorage = createChromeHighlightStorage();
