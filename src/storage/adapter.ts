import type { Highlight } from "../core/highlights";
import {
  getHighlightStorageKeys,
  HIGHLIGHTS_KEY,
  IS_PREMIUM_KEY,
  toHighlightStorageState,
  TRIAL_START_TS_KEY,
} from "./schema";
import type { HighlightKeyValueStorage, HighlightStorageAdapter } from "./types";

export function createHighlightStorageAdapter(storageArea: HighlightKeyValueStorage): HighlightStorageAdapter {
  return {
    async load() {
      const data = await storageArea.get(getHighlightStorageKeys());
      return toHighlightStorageState(data);
    },

    async saveHighlights(highlights: Highlight[]): Promise<void> {
      await storageArea.set({ [HIGHLIGHTS_KEY]: highlights });
    },

    async savePremium(isPremium: boolean): Promise<void> {
      await storageArea.set({ [IS_PREMIUM_KEY]: isPremium });
    },

    async saveTrialStartTs(trialStartTs: number): Promise<void> {
      await storageArea.set({ [TRIAL_START_TS_KEY]: trialStartTs });
    },
  };
}
