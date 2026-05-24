import type { Highlight } from "../core/highlights";
import type {
  HighlightStorageAdapter,
  HighlightStorageBackend,
  HighlightStorageItems,
  HighlightStorageState,
} from "./types";

const HIGHLIGHTS_KEY = "highlights";
const IS_PREMIUM_KEY = "isPremium";
const TRIAL_START_TS_KEY = "trial_start_ts";
const STORAGE_KEYS = [HIGHLIGHTS_KEY, IS_PREMIUM_KEY, TRIAL_START_TS_KEY] as const;

interface ChromeStorageData {
  highlights?: unknown;
  isPremium?: unknown;
  trial_start_ts?: unknown;
}

function createContentChromeStorageBackend(storageArea: chrome.storage.StorageArea): HighlightStorageBackend {
  return {
    async get(keys: readonly string[]): Promise<HighlightStorageItems> {
      return storageArea.get([...keys]);
    },

    async set(items: HighlightStorageItems): Promise<void> {
      await storageArea.set(items);
    },
  };
}

function toHighlightList(value: unknown): Highlight[] {
  return Array.isArray(value) ? (value as Highlight[]) : [];
}

function toHighlightStorageState(value: HighlightStorageItems): HighlightStorageState {
  const data = value as ChromeStorageData;
  const trialStartTs = typeof data.trial_start_ts === "number" ? data.trial_start_ts : undefined;

  return {
    highlights: toHighlightList(data.highlights),
    isPremium: data.isPremium === true,
    trialStartTs,
  };
}

export function createContentChromeHighlightStorage(
  storageArea: chrome.storage.StorageArea = chrome.storage.local,
): HighlightStorageAdapter {
  const storageBackend = createContentChromeStorageBackend(storageArea);

  return {
    async load(): Promise<HighlightStorageState> {
      return toHighlightStorageState(await storageBackend.get([...STORAGE_KEYS]));
    },

    async saveHighlights(highlights: Highlight[]): Promise<void> {
      await storageBackend.set({ [HIGHLIGHTS_KEY]: highlights });
    },

    async savePremium(isPremium: boolean): Promise<void> {
      await storageBackend.set({ [IS_PREMIUM_KEY]: isPremium });
    },

    async saveTrialStartTs(trialStartTs: number): Promise<void> {
      await storageBackend.set({ [TRIAL_START_TS_KEY]: trialStartTs });
    },
  };
}

export const contentChromeHighlightStorage = createContentChromeHighlightStorage();
