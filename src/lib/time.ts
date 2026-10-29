/** SQLite stores UTC as "YYYY-MM-DD HH:MM:SS". Safari cannot parse that form, so convert to ISO first. */
export function sqliteDateToMs(value: string) {
  const time = new Date(`${value.replace(" ", "T")}Z`).getTime();
  return Number.isNaN(time) ? Date.now() : time;
}

export function minutesSince(value: string, now = Date.now()) {
  return Math.max(0, (now - sqliteDateToMs(value)) / 60000);
}

export function relativeTime(value: string, now = Date.now()) {
  const seconds = Math.max(0, Math.round((now - sqliteDateToMs(value)) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min ago`;
}

export const SERVICE_LABELS: Record<string, string> = {
  WAITER: "Waiter",
  WATER: "Water",
  BILL: "Bill"
};
