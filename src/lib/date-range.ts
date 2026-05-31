export type DateSearchParams = {
  startDate?: string;
  endDate?: string;
};

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDate(value: string | undefined, fallback: Date) {
  if (!value) return fallback;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export function dateRangeFromSearchParams(params: DateSearchParams) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const defaultStart = new Date(today);
  defaultStart.setDate(defaultStart.getDate() - 30);

  const start = parseDate(params.startDate, defaultStart);
  const endDay = parseDate(params.endDate, start);
  const endExclusive = new Date(endDay);
  endExclusive.setDate(endExclusive.getDate() + 1);

  return {
    start,
    end: endExclusive,
    startDate: isoDate(start),
    endDate: isoDate(endDay),
  };
}

export function groupDateKey(date: Date | null) {
  return date?.toISOString().slice(0, 10) ?? "No date";
}
