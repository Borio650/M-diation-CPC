export const DEFAULT_TIMEZONE = 'Africa/Abidjan';

export interface TimezoneOption {
  value: string;
  label: string;
}

export const SUPPORTED_TIMEZONES: TimezoneOption[] = [
  { value: 'Africa/Abidjan', label: 'Afrique de l’Ouest — Abidjan / GMT (UTC+0)' },
  { value: 'Africa/Dakar', label: 'Dakar (UTC+0)' },
  { value: 'Africa/Lagos', label: 'Douala / Yaoundé / Lagos (UTC+1)' },
  { value: 'Africa/Kinshasa', label: 'Kinshasa / Brazzaville (UTC+1)' },
  { value: 'Europe/Paris', label: 'Paris / Bruxelles / Genève (UTC+1/+2)' },
  { value: 'America/Toronto', label: 'Montréal / Toronto (UTC-5/-4)' },
  { value: 'Indian/Antananarivo', label: 'Antananarivo (UTC+3)' },
  { value: 'UTC', label: 'Temps universel coordonné (UTC)' },
];

/**
 * Calcule la date YYYY-MM-DD dans le fuseau horaire choisi (par défaut Africa/Abidjan).
 */
export function getDateKeyForTimezone(timeZone: string = DEFAULT_TIMEZONE, now: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);

    const map: Record<string, string> = {};
    for (const part of parts) {
      map[part.type] = part.value;
    }
    return `${map.year}-${map.month}-${map.day}`;
  } catch {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: DEFAULT_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);

    const map: Record<string, string> = {};
    for (const part of parts) {
      map[part.type] = part.value;
    }
    return `${map.year}-${map.month}-${map.day}`;
  }
}

/**
 * Formate une date YYYY-MM-DD en français lisible (ex: Mercredi 25 novembre 2026).
 */
export function formatFrenchDate(dateKey: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return dateKey;
  const [y, m, d] = dateKey.split('-').map((n) => parseInt(n, 10));
  const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const formatted = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(dateObj);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/**
 * Calcule le nombre de millisecondes restantes jusqu'à minuit (00:00:02) dans le fuseau horaire donné.
 */
export function getMillisecondsUntilMidnight(timeZone: string = DEFAULT_TIMEZONE): number {
  const now = new Date();
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(now);

    const map: Record<string, string> = {};
    for (const part of parts) {
      map[part.type] = part.value;
    }
    const hour = parseInt(map.hour === '24' ? '0' : map.hour, 10);
    const minute = parseInt(map.minute, 10);
    const second = parseInt(map.second, 10);
    const elapsedSeconds = hour * 3600 + minute * 60 + second;
    const remainingSeconds = Math.max(2, 86400 - elapsedSeconds + 2);
    return remainingSeconds * 1000;
  } catch {
    return 60 * 60 * 1000;
  }
}

export function addDaysToDateKey(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split('-').map((n) => parseInt(n, 10));
  const next = new Date(Date.UTC(y, m - 1, d + deltaDays));
  const yy = next.getUTCFullYear();
  const mm = String(next.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(next.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}
