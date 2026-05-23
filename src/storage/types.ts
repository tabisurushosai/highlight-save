import type { Highlight } from "../core/highlights";

export interface HighlightStorageState {
  highlights: Highlight[];
  isPremium: boolean;
  trialStartTs?: number;
}

export interface HighlightStorageAdapter {
  load(): Promise<HighlightStorageState>;
  saveHighlights(highlights: Highlight[]): Promise<void>;
  savePremium(isPremium: boolean): Promise<void>;
  saveTrialStartTs(trialStartTs: number): Promise<void>;
}
