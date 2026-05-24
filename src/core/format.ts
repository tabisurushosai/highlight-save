export type SupportedLocale = "ja" | "en";

export function normalizeLocale(locale?: string): string | undefined {
  const trimmedLocale = locale?.trim();

  return trimmedLocale ? trimmedLocale.replace(/_/g, "-") : undefined;
}

export function resolveSupportedLocale(locale?: string): SupportedLocale {
  const language = normalizeLocale(locale)?.toLowerCase().split("-")[0];

  return language === "en" ? "en" : "ja";
}

export function formatLocalizedNumber(value: number, locale?: string): string {
  return new Intl.NumberFormat(normalizeLocale(locale)).format(value);
}

export function formatLocalizedCurrency(value: number, currency: string, locale?: string): string {
  return new Intl.NumberFormat(normalizeLocale(locale), {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatLocalizedDateTime(timestamp: number, locale?: string): string {
  return new Intl.DateTimeFormat(normalizeLocale(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}
