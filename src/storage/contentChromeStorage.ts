import type { Highlight } from "../core/highlights";
import type { HighlightStorageAdapter, HighlightStorageState } from "./types";

const HIGHLIGHTS_KEY = "highlights";
const IS_PREMIUM_KEY = "isPremium";
const TRIAL_START_TS_KEY = "trial_start_ts";
const STORAGE_KEYS = [HIGHLIGHTS_KEY, IS_PREMIUM_KEY, TRIAL_START_TS_KEY];

interface ChromeStorageData {
  highlights?: unknown;
  isPremium?: unknown;
  trial_start_ts?: unknown;
}

function toHighlightList(value: unknown): Highlight[] {
  return Array.isArray(value) ? (value as Highlight[]) : [];
}

export const contentChromeHighlightStorage: HighlightStorageAdapter = {
  async load(): Promise<HighlightStorageState> {
    const data = (await chrome.storage.local.get(STORAGE_KEYS)) as ChromeStorageData;
    const trialStartTs = typeof data.trial_start_ts === "number" ? data.trial_start_ts : undefined;

    return {
      highlights: toHighlightList(data.highlights),
      isPremium: data.isPremium === true,
      trialStartTs,
    };
  },

  async saveHighlights(highlights: Highlight[]): Promise<void> {
    await chrome.storage.local.set({ [HIGHLIGHTS_KEY]: highlights });
  },

  async savePremium(isPremium: boolean): Promise<void> {
    await chrome.storage.local.set({ [IS_PREMIUM_KEY]: isPremium });
  },

  async saveTrialStartTs(trialStartTs: number): Promise<void> {
    await chrome.storage.local.set({ [TRIAL_START_TS_KEY]: trialStartTs });
  },
};
