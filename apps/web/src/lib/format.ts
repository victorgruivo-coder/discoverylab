const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  // API dates are calendar dates (YYYY-MM-DD); format them in UTC so a
  // timezone offset cannot shift the displayed day.
  timeZone: 'UTC',
});

/** Format an ISO calendar date (YYYY-MM-DD) for display. */
export function formatIsoDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return DATE_FORMATTER.format(date);
}

/** Today's local calendar date as YYYY-MM-DD, without UTC drift. */
export function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${now.getFullYear()}-${month}-${day}`;
}

/** First letter of the first and last name, e.g. "Alex Morgan" -> "AM". */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';

  return `${first}${last}`.toUpperCase() || '?';
}

/** Turn a lowercase enum value such as `active` into `Active`. */
export function formatEnumLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
