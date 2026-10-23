const LOCALE = 'it-IT';

const dateFormat = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });
const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const monthFormat = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' });
const shortMonthFormat = new Intl.DateTimeFormat(LOCALE, { month: 'short' });
const numberFormat = new Intl.NumberFormat(LOCALE);
const percentFormat = new Intl.NumberFormat(LOCALE, { style: 'percent', maximumFractionDigits: 0 });
const decimalFormat = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 });
const relativeFormat = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });

function toDate(value: string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: string | null | undefined): string {
  const date = value ? toDate(value) : null;
  return date ? dateFormat.format(date) : '-';
}

export function formatDateTime(value: string | null | undefined): string {
  const date = value ? toDate(value) : null;
  return date ? dateTimeFormat.format(date) : '-';
}

/** Formats a "YYYY-MM" period, e.g. "marzo 2026". */
export function formatPeriod(period: string): string {
  const date = toDate(`${period}-01T12:00:00Z`);
  return date ? monthFormat.format(date) : period;
}

/** Short month label ("mar") for a "YYYY-MM" period. */
export function formatShortMonth(period: string): string {
  const date = toDate(`${period}-01T12:00:00Z`);
  return date ? shortMonthFormat.format(date) : period;
}

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

/** Number with at most one decimal digit, it-IT separators ("3,5"). */
export function formatDecimal(value: number): string {
  return decimalFormat.format(value);
}

/** Formats a 0..1 ratio as a percentage. */
export function formatPercent(ratio: number): string {
  return percentFormat.format(ratio);
}

const DAY_MS = 86_400_000;

/** Whole days from `now` to `value` (negative when in the past). */
export function daysFromNow(value: string, now: Date = new Date()): number | null {
  const date = toDate(value);
  return date ? Math.round((date.getTime() - now.getTime()) / DAY_MS) : null;
}

/** "tra 3 giorni", "ieri", "5 giorni fa". */
export function formatRelativeDays(value: string, now: Date = new Date()): string {
  const days = daysFromNow(value, now);
  return days === null ? '-' : relativeFormat.format(days, 'day');
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
