export const DEFAULT_CLINIC_TIME_ZONE = "Asia/Kolkata";

interface DateParts {
  year: number;
  month: number;
  day: number;
}

interface DateTimeParts extends DateParts {
  hour: number;
  minute: number;
  second: number;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function parseDateKey(dateKey: string): DateParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) {
    throw new Error(`Invalid clinic date key: ${dateKey}`);
  }

  return {
    year: Number(match[1]!),
    month: Number(match[2]!),
    day: Number(match[3]!),
  };
}

function getParts(date: Date, timeZone: string): DateTimeParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes) => {
    const value = parts.find((part) => part.type === type)?.value;
    if (!value) throw new Error(`Missing ${type} while formatting clinic date.`);
    return Number(value);
  };

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
    second: read("second"),
  };
}

export function getClinicDateKey(date: Date = new Date(), timeZone = DEFAULT_CLINIC_TIME_ZONE): string {
  const parts = getParts(date, timeZone);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

export function addDaysToClinicDateKey(dateKey: string, days: number): string {
  const parts = parseDateKey(dateKey);
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

export function clinicDateKeyToSessionDate(dateKey: string): Date {
  const parts = parseDateKey(dateKey);
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

function getTimeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = getParts(instant, timeZone);
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return localAsUtc - instant.getTime();
}

export function clinicDateTimeToUtcDate(
  dateKey: string,
  time: { hour?: number; minute?: number; second?: number; millisecond?: number } = {},
  timeZone = DEFAULT_CLINIC_TIME_ZONE
): Date {
  const parts = parseDateKey(dateKey);
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    time.hour ?? 0,
    time.minute ?? 0,
    time.second ?? 0,
    time.millisecond ?? 0
  );

  let candidate = new Date(localAsUtc);
  for (let i = 0; i < 3; i++) {
    candidate = new Date(localAsUtc - getTimeZoneOffsetMs(candidate, timeZone));
  }
  return candidate;
}

export function getClinicDayRange(date: Date = new Date(), timeZone = DEFAULT_CLINIC_TIME_ZONE) {
  const dateKey = getClinicDateKey(date, timeZone);
  const nextDateKey = addDaysToClinicDateKey(dateKey, 1);
  const start = clinicDateTimeToUtcDate(dateKey, {}, timeZone);
  const nextStart = clinicDateTimeToUtcDate(nextDateKey, {}, timeZone);

  return {
    dateKey,
    sessionDate: clinicDateKeyToSessionDate(dateKey),
    start,
    end: new Date(nextStart.getTime() - 1),
  };
}

export function getClinicSessionDateForDate(date: Date = new Date(), timeZone = DEFAULT_CLINIC_TIME_ZONE): Date {
  return clinicDateKeyToSessionDate(getClinicDateKey(date, timeZone));
}

export function isSameClinicDay(a: Date, b: Date = new Date(), timeZone = DEFAULT_CLINIC_TIME_ZONE): boolean {
  return getClinicDateKey(a, timeZone) === getClinicDateKey(b, timeZone);
}
