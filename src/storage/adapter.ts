import type { Highlight } from "../core/highlights";
import {
  getHighlightStorageKeys,
  HIGHLIGHTS_KEY,
  IS_PREMIUM_KEY,
  toHighlightStorageState,
  TRIAL_START_TS_KEY,
} from "./schema";
import type { HighlightStorageAdapter, HighlightStorageBackend } from "./types";

export function createHighlightStorageAdapter(storageBackend: HighlightStorageBackend): HighlightStorageAdapter {
  return {
    async load() {
      const data = await storageBackend.get(getHighlightStorageKeys());
      return toHighlightStorageState(data);
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
