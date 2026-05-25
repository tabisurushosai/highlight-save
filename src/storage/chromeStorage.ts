import { createHighlightStorageAdapter } from "./adapter";
import { createChromeStorageBackend } from "./chromeBackend";
import type { ChromeStorageArea } from "./chromeBackend";
import type { HighlightStorageAdapter } from "./types";

export function createChromeHighlightStorage(
  storageArea: ChromeStorageArea = chrome.storage.local,
): HighlightStorageAdapter {
  return createHighlightStorageAdapter(createChromeStorageBackend(storageArea));
}

export const chromeHighlightStorage = createChromeHighlightStorage();
