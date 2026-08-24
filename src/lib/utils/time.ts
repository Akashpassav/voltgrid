/** IST offset from UTC in minutes. */
const IST_OFFSET_MIN = 330;

export function istParts(from: Date = new Date()): {
  hour: number;
  minute: number;
  weekday: number;
  minutesFromMidnight: number;
  iso: string;
} {
  const utc = from.getTime() + from.getTimezoneOffset() * 60_000;
  const ist = new Date(utc + IST_OFFSET_MIN * 60_000);
  const hour = ist.getHours();
  const minute = ist.getMinutes();
  const weekday = ist.getDay();
  return {
    hour,
    minute,
    weekday,
    minutesFromMidnight: hour * 60 + minute,
    iso: ist.toISOString().replace("Z", "+05:30"),
  };
}

export function clockFromMinutes(minutes: number, base = new Date()): Date {
  const utc = base.getTime() + base.getTimezoneOffset() * 60_000;
  const ist = new Date(utc + IST_OFFSET_MIN * 60_000);
  ist.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  const asUtc = ist.getTime() - IST_OFFSET_MIN * 60_000;
  return new Date(asUtc);
}

export function formatTimeIst(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatDuration(totalMinutes: number): string {
  const m = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h === 0) return `${rem} min`;
  return `${h}h ${rem}m`;
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

/** Traffic multiplier by IST hour. Evening peak is the worst on GST Road. */
export function trafficByHour(hour: number): number {
  if (hour >= 8 && hour < 10) return 1.32;
  if (hour >= 10 && hour < 16) return 1.08;
  if (hour >= 16 && hour < 17) return 1.2;
  if (hour >= 17 && hour < 21) return 1.42;
  if (hour >= 21 && hour < 23) return 1.1;
  return 0.92;
}

export function occupancyBiasByHour(hour: number): number {
  if (hour >= 18 && hour < 21) return 0.34;
  if (hour >= 8 && hour < 10) return 0.18;
  if (hour >= 10 && hour < 16) return -0.08;
  if (hour >= 16 && hour < 18) return 0.12;
  return -0.16;
}

export function isWeekend(weekday: number): boolean {
  return weekday === 0 || weekday === 6;
}
