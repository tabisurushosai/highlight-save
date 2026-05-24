import type { Highlight } from "../core/highlights";
import type { HighlightStorageState } from "./types";

export const HIGHLIGHTS_KEY = "highlights";
export const IS_PREMIUM_KEY = "isPremium";
export const TRIAL_START_TS_KEY = "trial_start_ts";

const HIGHLIGHT_STORAGE_KEYS = [HIGHLIGHTS_KEY, IS_PREMIUM_KEY, TRIAL_START_TS_KEY];

interface HighlightStorageRawData {
  highlights?: unknown;
  isPremium?: unknown;
  trial_start_ts?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toHighlightList(value: unknown): Highlight[] {
  return Array.isArray(value) ? (value as Highlight[]) : [];
}

function toPremiumFlag(value: unknown): boolean {
  return value === true;
}

function toTrialStartTs(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

export function getHighlightStorageKeys(): string[] {
  return [...HIGHLIGHT_STORAGE_KEYS];
}

export function toHighlightStorageState(value: unknown): HighlightStorageState {
  const data = isRecord(value) ? (value as HighlightStorageRawData) : {};

  return {
    highlights: toHighlightList(data.highlights),
    isPremium: toPremiumFlag(data.isPremium),
    trialStartTs: toTrialStartTs(data.trial_start_ts),
  };
}
