import type { HighlightStorageBackend, HighlightStorageItems, HighlightStorageKey } from "./types";

export interface ChromeStorageArea {
  get(keys: readonly string[]): Promise<HighlightStorageItems>;
  set(items: HighlightStorageItems): Promise<void>;
}

export function createChromeStorageBackend(storageArea: ChromeStorageArea): HighlightStorageBackend {
  return {
    async read(keys: readonly HighlightStorageKey[]): Promise<HighlightStorageItems> {
      return storageArea.get([...keys]);
    },

    async write(items: HighlightStorageItems): Promise<void> {
      await storageArea.set(items);
    },
  };
}
