import type { Highlight } from "../core/highlights";

export interface HighlightStorageState {
  highlights: Highlight[];
  isPremium: boolean;
  trialStartTs?: number | undefined;
}

export type HighlightStorageItems = Record<string, unknown>;

export interface HighlightStorageBackend {
  read(keys: readonly string[]): Promise<HighlightStorageItems>;
  write(items: HighlightStorageItems): Promise<void>;
}

export interface HighlightStorageAdapter {
  load(): Promise<HighlightStorageState>;
  saveHighlights(highlights: Highlight[]): Promise<void>;
  savePremium(isPremium: boolean): Promise<void>;
  saveTrialStartTs(trialStartTs: number): Promise<void>;
}
