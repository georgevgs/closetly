// Postgres `date` columns expect YYYY-MM-DD.
export const toDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = padTwoDigits(date.getMonth() + 1);
  const day = padTwoDigits(date.getDate());
  return `${year}-${month}-${day}`;
};

const padTwoDigits = (value: number): string => {
  return String(value).padStart(2, "0");
};

// Anchored at noon so DST transitions don't shift the calendar day.
export const parseDateOnly = (isoDate: string): Date => {
  return new Date(`${isoDate}T12:00:00`);
};

// Whole calendar days between the dates, ignoring time-of-day.
export const calendarDaysBetween = (earlier: Date, later: Date): number => {
  const earlierMs = noonOf(earlier).getTime();
  const laterMs = noonOf(later).getTime();
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round((laterMs - earlierMs) / millisecondsPerDay);
};

const noonOf = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
};
