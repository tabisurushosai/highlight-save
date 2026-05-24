import type { Highlight } from "../core/highlights";
import type {
  HighlightStorageAdapter,
  HighlightStorageBackend,
  HighlightStorageItems,
  HighlightStorageKey,
  HighlightStorageState,
} from "./types";

const HIGHLIGHTS_KEY = "highlights" satisfies HighlightStorageKey;
const IS_PREMIUM_KEY = "isPremium" satisfies HighlightStorageKey;
const TRIAL_START_TS_KEY = "trial_start_ts" satisfies HighlightStorageKey;
const STORAGE_KEYS = [HIGHLIGHTS_KEY, IS_PREMIUM_KEY, TRIAL_START_TS_KEY] as const satisfies readonly HighlightStorageKey[];

interface ContentChromeStorageArea {
  get(keys: readonly string[]): Promise<HighlightStorageItems>;
  set(items: HighlightStorageItems): Promise<void>;
}

function createContentChromeStorageBackend(storageArea: ContentChromeStorageArea): HighlightStorageBackend {
  return {
    async read(keys: readonly HighlightStorageKey[]): Promise<HighlightStorageItems> {
      return storageArea.get([...keys]);
    },

    async write(items: HighlightStorageItems): Promise<void> {
      await storageArea.set(items);
    },
  };
}

function toHighlightList(value: unknown): Highlight[] {
  return Array.isArray(value) ? (value as Highlight[]) : [];
}

function toHighlightStorageState(value: HighlightStorageItems): HighlightStorageState {
  return {
    highlights: toHighlightList(value[HIGHLIGHTS_KEY]),
    isPremium: value[IS_PREMIUM_KEY] === true,
    trialStartTs: typeof value[TRIAL_START_TS_KEY] === "number" ? value[TRIAL_START_TS_KEY] : undefined,
  };
}

export function createContentChromeHighlightStorage(
  storageArea: ContentChromeStorageArea = chrome.storage.local,
): HighlightStorageAdapter {
  const storageBackend = createContentChromeStorageBackend(storageArea);

  return {
    async load(): Promise<HighlightStorageState> {
      return toHighlightStorageState(await storageBackend.read(STORAGE_KEYS));
    },

    async saveHighlights(highlights: Highlight[]): Promise<void> {
      await storageBackend.write({ [HIGHLIGHTS_KEY]: highlights });
    },

    async savePremium(isPremium: boolean): Promise<void> {
      await storageBackend.write({ [IS_PREMIUM_KEY]: isPremium });
    },

    async saveTrialStartTs(trialStartTs: number): Promise<void> {
      await storageBackend.write({ [TRIAL_START_TS_KEY]: trialStartTs });
    },
  };
}

export const contentChromeHighlightStorage = createContentChromeHighlightStorage();
