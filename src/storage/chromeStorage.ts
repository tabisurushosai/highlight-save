import { createHighlightStorageAdapter } from "./adapter";

export const chromeHighlightStorage = createHighlightStorageAdapter(chrome.storage.local);
