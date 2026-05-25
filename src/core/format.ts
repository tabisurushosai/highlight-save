export type SupportedLocale = "ja" | "en";

interface LocaleFormat {
  intlLocale: string;
  dateTimeOptions: Intl.DateTimeFormatOptions;
}

const LOCALE_FORMATS: Record<SupportedLocale, LocaleFormat> = {
  ja: {
    intlLocale: "ja-JP",
    dateTimeOptions: {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    },
  },
  en: {
    intlLocale: "en-US",
    dateTimeOptions: {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    },
  },
};

export function normalizeLocale(locale?: string): string | undefined {
  const trimmedLocale = locale?.trim();

  return trimmedLocale ? trimmedLocale.replace(/_/g, "-") : undefined;
}

export function resolveSupportedLocale(locale?: string): SupportedLocale {
  const language = normalizeLocale(locale)?.toLowerCase().split("-")[0];

  return language === "en" ? "en" : "ja";
}

function getLocaleFormat(locale?: string): LocaleFormat {
  return LOCALE_FORMATS[resolveSupportedLocale(locale)];
}

export function formatLocalizedNumber(value: number, locale?: string): string {
  return new Intl.NumberFormat(getLocaleFormat(locale).intlLocale).format(value);
}

export function formatLocalizedCurrency(value: number, currency: string, locale?: string): string {
  return new Intl.NumberFormat(getLocaleFormat(locale).intlLocale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatLocalizedDateTime(timestamp: number, locale?: string): string {
  const localeFormat = getLocaleFormat(locale);

  return new Intl.DateTimeFormat(
    localeFormat.intlLocale,
    localeFormat.dateTimeOptions,
  ).format(new Date(timestamp));
}
