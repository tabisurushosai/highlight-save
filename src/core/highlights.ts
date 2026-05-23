export interface Highlight {
  text: string;
  url: string;
  ts: number;
  tag?: string;
}

export interface CreateHighlightInput {
  text: string;
  url: string;
  ts: number;
  tag: string;
}

export const FREE_HIGHLIGHT_LIMIT = 20;
export const TRIAL_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

export function toHighlightList(value: unknown): Highlight[] {
  return Array.isArray(value) ? (value as Highlight[]) : [];
}

export function toPremiumFlag(value: unknown): boolean {
  return value === true;
}

export function createHighlight(input: CreateHighlightInput): Highlight {
  return {
    text: input.text,
    url: input.url,
    ts: input.ts,
    tag: input.tag,
  };
}

export function appendHighlight(highlights: Highlight[], highlight: Highlight): Highlight[] {
  return [...highlights, highlight];
}

export function canSaveHighlight(highlights: Highlight[], isPremium: boolean): boolean {
  return isPremium || highlights.length < FREE_HIGHLIGHT_LIMIT;
}

export function deleteHighlightByTimestamp(highlights: Highlight[], ts: number): Highlight[] {
  return highlights.filter((item) => item.ts !== ts);
}

export function getHighlightsForUrl(highlights: Highlight[], url: string): Highlight[] {
  return highlights.filter((item) => item.url === url);
}

export function getHighlightSnippet(text: string, maxLength = 50): string {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

export function getRemainingTrialDays(trialStartTs: number, now: number): number {
  const trialMs = TRIAL_DAYS * DAY_MS;
  const elapsed = now - trialStartTs;

  return Math.max(0, Math.ceil((trialMs - elapsed) / DAY_MS));
}
