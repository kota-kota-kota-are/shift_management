/**
 * Utility functions for the shift management system.
 */

/**
 * Generate a unique ID using timestamp + random string.
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

/**
 * Format a Date as "YYYY-MM-DD".
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Format a Date as "HH:mm".
 */
export function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Parse a "YYYY-MM-DD" string into a Date (local timezone, midnight).
 */
export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Get an array of all dates in the specified month.
 */
export function getMonthDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const count = getDaysInMonth(year, month);
  for (let d = 1; d <= count; d++) {
    days.push(new Date(year, month - 1, d));
  }
  return days;
}

/**
 * Get the Mon-Sun week that contains the given date.
 * Returns an array of 7 Dates starting from Monday.
 */
export function getWeekDays(date: Date): Date[] {
  const day = date.getDay(); // 0=Sun ... 6=Sat
  // offset so Monday = 0
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() + mondayOffset);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
  }
  return days;
}

/**
 * Check if the given date is today.
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Check if two dates fall on the same calendar day.
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Get the number of days in the specified month (1-indexed month).
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Get the day-of-week (0=Sunday) of the first day of the specified month.
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

/**
 * Calculate actual working minutes from HH:mm start/end times and break minutes.
 * Handles overnight shifts (end < start).
 */
export function calculateWorkingMinutes(
  startTime: string,
  endTime: string,
  breakMinutes: number
): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);

  let startTotal = sh * 60 + sm;
  let endTotal = eh * 60 + em;

  // Overnight shift: add 24 hours to end time
  if (endTotal <= startTotal) {
    endTotal += 24 * 60;
  }

  return endTotal - startTotal - breakMinutes;
}

/**
 * Combine class names, filtering out falsy values.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Format year and month as "YYYY-MM".
 */
export function formatYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/**
 * Parse a "YYYY-MM" string into year and month numbers.
 */
export function parseYearMonth(yearMonth: string): { year: number; month: number } {
  const [y, m] = yearMonth.split("-").map(Number);
  return { year: y, month: m };
}

/**
 * Return the current time as an ISO 8601 string.
 */
export function nowISO(): string {
  return new Date().toISOString();
}
