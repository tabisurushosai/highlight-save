import type { Highlight } from "../core/highlights";

export type HighlightStorageKey = "highlights" | "isPremium" | "trial_start_ts";

export interface HighlightStorageState {
  highlights: Highlight[];
  isPremium: boolean;
  trialStartTs?: number | undefined;
}

export type HighlightStorageItems = Partial<Record<HighlightStorageKey, unknown>>;

/**
 * Minimal async key-value boundary for platform storage.
 *
 * Chrome, native, and tests can implement this interface while reusable
 * highlight rules stay in src/core without platform imports.
 */
export interface HighlightStorageBackend {
  read(keys: readonly HighlightStorageKey[]): Promise<HighlightStorageItems>;
  write(items: HighlightStorageItems): Promise<void>;
}

/**
 * Application-facing storage contract used by UI/platform shells.
 */
export interface HighlightStorageAdapter {
  load(): Promise<HighlightStorageState>;
  saveHighlights(highlights: Highlight[]): Promise<void>;
  savePremium(isPremium: boolean): Promise<void>;
  saveTrialStartTs(trialStartTs: number): Promise<void>;
}
