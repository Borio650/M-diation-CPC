import { DEFAULT_VERSION } from '@/src/data/translations';
import { DEFAULT_TIMEZONE } from '@/src/lib/timezone';
import { BibleVersionId, DailyVerse, FavoriteVerse } from '@/src/types/bible';

const KEYS = {
  preferredVersion: 'meditation_cpc_preferred_version',
  notificationEnabled: 'meditation_cpc_notification_enabled',
  notificationTime: 'meditation_cpc_notification_time',
  timezone: 'meditation_cpc_timezone',
  cachedVerse: 'meditation_cpc_cached_verse',
  fcmToken: 'meditation_cpc_fcm_token',
  subscriptionId: 'meditation_cpc_subscription_id',
  lastNotifiedDate: 'meditation_cpc_last_notified_date',
  favorites: 'meditation_cpc_favorites',
} as const;

export interface LocalPreferences {
  preferredVersion: BibleVersionId;
  notificationEnabled: boolean;
  notificationTime: string;
  timezone: string;
}

function isValidVersionId(val: string | null): val is BibleVersionId {
  return val === 'lsg1910' || val === 'pdv' || val === 'fc' || val === 'kjf';
}

export function loadLocalPreferences(): LocalPreferences {
  try {
    const rawVersion = localStorage.getItem(KEYS.preferredVersion);
    const rawEnabled = localStorage.getItem(KEYS.notificationEnabled);
    const rawTime = localStorage.getItem(KEYS.notificationTime);
    const rawTz = localStorage.getItem(KEYS.timezone);

    return {
      preferredVersion: isValidVersionId(rawVersion) ? rawVersion : DEFAULT_VERSION,
      notificationEnabled: rawEnabled === 'true',
      notificationTime: rawTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(rawTime) ? rawTime : '07:00',
      timezone: rawTz && rawTz.length >= 2 ? rawTz : DEFAULT_TIMEZONE,
    };
  } catch {
    return {
      preferredVersion: DEFAULT_VERSION,
      notificationEnabled: false,
      notificationTime: '07:00',
      timezone: DEFAULT_TIMEZONE,
    };
  }
}

export function saveLocalPreferences(prefs: Partial<LocalPreferences>): void {
  try {
    if (prefs.preferredVersion) {
      localStorage.setItem(KEYS.preferredVersion, prefs.preferredVersion);
    }
    if (typeof prefs.notificationEnabled === 'boolean') {
      localStorage.setItem(KEYS.notificationEnabled, String(prefs.notificationEnabled));
    }
    if (prefs.notificationTime) {
      localStorage.setItem(KEYS.notificationTime, prefs.notificationTime);
    }
    if (prefs.timezone) {
      localStorage.setItem(KEYS.timezone, prefs.timezone);
    }
  } catch {
    // Stockage local indisponible (navigation privée stricte)
  }
}

export function saveCachedVerse(verse: DailyVerse): void {
  try {
    localStorage.setItem(KEYS.cachedVerse, JSON.stringify(verse));
  } catch {
    // Ignore quota errors
  }
}

export function loadCachedVerse(): DailyVerse | null {
  try {
    const raw = localStorage.getItem(KEYS.cachedVerse);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DailyVerse;
    if (!parsed || !parsed.date || !parsed.translations) return null;
    return { ...parsed, source: 'cache' };
  } catch {
    return null;
  }
}

export function saveStoredPushMetadata(fcmToken: string | null, subscriptionId: string | null): void {
  try {
    if (fcmToken) {
      localStorage.setItem(KEYS.fcmToken, fcmToken);
    } else {
      localStorage.removeItem(KEYS.fcmToken);
    }
    if (subscriptionId) {
      localStorage.setItem(KEYS.subscriptionId, subscriptionId);
    } else {
      localStorage.removeItem(KEYS.subscriptionId);
    }
  } catch {
    // Ignore storage errors
  }
}

export function loadStoredPushMetadata(): { fcmToken: string | null; subscriptionId: string | null } {
  try {
    return {
      fcmToken: localStorage.getItem(KEYS.fcmToken),
      subscriptionId: localStorage.getItem(KEYS.subscriptionId),
    };
  } catch {
    return { fcmToken: null, subscriptionId: null };
  }
}

export function loadFavoriteVerses(): FavoriteVerse[] {
  try {
    const raw = localStorage.getItem(KEYS.favorites);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is FavoriteVerse =>
        Boolean(item) &&
        typeof item.reference === 'string' &&
        typeof item.date === 'string' &&
        typeof item.translations === 'object' &&
        item.translations !== null
    );
  } catch {
    return [];
  }
}

export function saveFavoriteVerses(favorites: FavoriteVerse[]): void {
  try {
    localStorage.setItem(KEYS.favorites, JSON.stringify(favorites));
  } catch {
    // Ignore quota errors
  }
}

export function loadLastNotifiedDate(): string | null {
  try {
    return localStorage.getItem(KEYS.lastNotifiedDate);
  } catch {
    return null;
  }
}

export function saveLastNotifiedDate(dateKey: string): void {
  try {
    localStorage.setItem(KEYS.lastNotifiedDate, dateKey);
  } catch {
    // Ignore storage errors
  }
}

