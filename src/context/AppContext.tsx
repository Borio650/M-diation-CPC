import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import {
  activatePushNotifications,
  deactivatePushNotifications,
  getBrowserNotificationPermission,
  getMobileNotificationInfo,
  sendDeviceTestNotification,
  showDailyVerseNotification,
  subscribeToForegroundMessages,
  syncPushSubscriptionPreferences,
  type MobileNotificationInfo,
  type NotificationPermissionState,
  type PushActivationResult,
} from '@/src/lib/pushService';
import {
  ensureAnonymousSession,
  getInitialLocalSettings,
  loadUserSettingsFromFirestore,
  persistUserSettings,
} from '@/src/lib/settingsService';
import {
  loadFavoriteVerses,
  loadLastNotifiedDate,
  loadStoredPushMetadata,
  saveFavoriteVerses,
  saveLastNotifiedDate,
} from '@/src/lib/storage';
import {
  getDateKeyForTimezone,
  getMillisecondsUntilMidnight,
  getMillisecondsUntilTime,
} from '@/src/lib/timezone';
import { fetchDailyVerse } from '@/src/lib/verseService';
import { useOnlineStatus } from '@/src/hooks/useOnlineStatus';
import { AppRoute, BibleVersionId, DailyVerse, FavoriteVerse } from '@/src/types/bible';

export interface ToastNotice {
  id: number;
  type: 'success' | 'info' | 'warning' | 'error';
  text: string;
}

interface AppContextValue {
  route: AppRoute;
  navigate: (next: AppRoute) => void;
  isOnline: boolean;

  // Verse state
  todayDateKey: string;
  selectedDateKey: string;
  setSelectedDateKey: (dateKey: string) => void;
  verse: DailyVerse | null;
  verseLoading: boolean;
  verseStatus: 'ok' | 'offline-cache' | 'empty' | 'error';
  verseMessage?: string;
  reloadVerse: (dateKey?: string) => Promise<void>;

  // Preferences state
  preferredVersion: BibleVersionId;
  setPreferredVersion: (version: BibleVersionId) => Promise<void>;
  notificationEnabled: boolean;
  notificationTime: string;
  timezone: string;
  updateNotificationSchedule: (next: { notificationTime?: string; timezone?: string }) => Promise<void>;

  // Push notifications state
  permissionState: NotificationPermissionState;
  hasFcmSubscription: boolean;
  pushBusy: boolean;
  pushFeedback: PushActivationResult | null;
  mobileInfo: MobileNotificationInfo;
  enableNotifications: () => Promise<PushActivationResult>;
  disableNotifications: () => Promise<void>;
  testDeviceNotification: () => Promise<void>;

  // Auth status
  currentUser: User | null;
  anonymousAuthBlocked: boolean;

  // Favorites state
  favorites: FavoriteVerse[];
  isVerseFavorite: (reference: string) => boolean;
  toggleFavoriteVerse: (targetVerse: DailyVerse) => void;
  removeFavoriteVerse: (reference: string) => void;

  // Toast feedback
  toast: ToastNotice | null;
  showToast: (text: string, type?: ToastNotice['type']) => void;
  clearToast: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const VALID_ROUTES: AppRoute[] = [
  '/',
  '/verset-du-jour',
  '/versions-bibliques',
  '/favoris',
  '/parametres',
  '/a-propos',
];

function parseRouteFromPath(pathname: string): AppRoute {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (VALID_ROUTES.includes(clean as AppRoute)) {
    return clean as AppRoute;
  }
  return '/';
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialLocal = getInitialLocalSettings();
  const isOnline = useOnlineStatus();

  const [route, setRoute] = useState<AppRoute>(() =>
    typeof window !== 'undefined' ? parseRouteFromPath(window.location.pathname) : '/'
  );
  const [preferredVersion, setPreferredVersionState] = useState<BibleVersionId>(
    initialLocal.preferredVersion
  );
  const [notificationEnabled, setNotificationEnabled] = useState<boolean>(
    initialLocal.notificationEnabled
  );
  const [notificationTime, setNotificationTime] = useState<string>(initialLocal.notificationTime);
  const [timezone, setTimezone] = useState<string>(initialLocal.timezone);

  const [todayDateKey, setTodayDateKey] = useState<string>(() =>
    getDateKeyForTimezone(initialLocal.timezone)
  );
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() =>
    getDateKeyForTimezone(initialLocal.timezone)
  );

  const [verse, setVerse] = useState<DailyVerse | null>(null);
  const [verseLoading, setVerseLoading] = useState<boolean>(true);
  const [verseStatus, setVerseStatus] = useState<'ok' | 'offline-cache' | 'empty' | 'error'>('ok');
  const [verseMessage, setVerseMessage] = useState<string | undefined>(undefined);

  const [permissionState, setPermissionState] = useState<NotificationPermissionState>(() =>
    getBrowserNotificationPermission()
  );
  const [hasFcmSubscription, setHasFcmSubscription] = useState<boolean>(
    () => Boolean(loadStoredPushMetadata().fcmToken) && initialLocal.notificationEnabled
  );
  const [pushBusy, setPushBusy] = useState<boolean>(false);
  const [pushFeedback, setPushFeedback] = useState<PushActivationResult | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [anonymousAuthBlocked, setAnonymousAuthBlocked] = useState<boolean>(false);
  const [mobileInfo] = useState<MobileNotificationInfo>(() => getMobileNotificationInfo());
  const [favorites, setFavorites] = useState<FavoriteVerse[]>(() => loadFavoriteVerses());
  const [toast, setToast] = useState<ToastNotice | null>(null);

  const showToast = useCallback((text: string, type: ToastNotice['type'] = 'success') => {
    setToast({ id: Date.now(), type, text });
  }, []);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const navigate = useCallback((next: AppRoute) => {
    setRoute(next);
    if (typeof window !== 'undefined' && window.location.pathname !== next) {
      window.history.pushState({}, '', next);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseRouteFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Auth listener + silent anonymous sign-in attempt
  useEffect(() => {
    let active = true;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      setCurrentUser(user);
      if (user) {
        const remote = await loadUserSettingsFromFirestore(user.uid);
        if (remote && active) {
          if (remote.preferredVersion) setPreferredVersionState(remote.preferredVersion);
          if (typeof remote.notificationEnabled === 'boolean') {
            setNotificationEnabled(remote.notificationEnabled);
          }
          if (remote.notificationTime) setNotificationTime(remote.notificationTime);
          if (remote.timezone) {
            setTimezone(remote.timezone);
            const newToday = getDateKeyForTimezone(remote.timezone);
            setTodayDateKey(newToday);
          }
        }
      }
    });

    void ensureAnonymousSession().then((res) => {
      if (active && res.anonymousAuthBlocked) {
        setAnonymousAuthBlocked(true);
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, []);

  // Foreground FCM messages
  useEffect(() => {
    let unsub: (() => void) | null = null;
    void subscribeToForegroundMessages((msg) => {
      showToast(`${msg.title} — ${msg.body}`, 'info');
    }).then((fn) => {
      unsub = fn;
    });
    return () => {
      if (unsub) unsub();
    };
  }, [showToast]);

  // Keep browser notification permission synced with browser/OS settings
  useEffect(() => {
    const syncPermission = () => {
      setPermissionState(getBrowserNotificationPermission());
    };
    window.addEventListener('focus', syncPermission);
    document.addEventListener('visibilitychange', syncPermission);
    return () => {
      window.removeEventListener('focus', syncPermission);
      document.removeEventListener('visibilitychange', syncPermission);
    };
  }, []);

  // Automatic midnight refresh in the selected timezone
  useEffect(() => {
    const computedToday = getDateKeyForTimezone(timezone);
    setTodayDateKey((prev) => {
      if (prev !== computedToday && selectedDateKey === prev) {
        setSelectedDateKey(computedToday);
      }
      return computedToday;
    });

    const msUntilMidnight = getMillisecondsUntilMidnight(timezone);
    const timer = window.setTimeout(() => {
      const freshToday = getDateKeyForTimezone(timezone);
      setTodayDateKey(freshToday);
      setSelectedDateKey(freshToday);
    }, msUntilMidnight);

    return () => window.clearTimeout(timer);
  }, [timezone, selectedDateKey]);

  // Planification locale quotidienne via Service Worker à l'heure et au fuseau choisis
  useEffect(() => {
    if (!notificationEnabled || permissionState !== 'granted') return;

    let timer: number | undefined;
    const checkAndNotify = () => {
      const activeDate = getDateKeyForTimezone(timezone);
      if (loadLastNotifiedDate() === activeDate) return;

      const msUntilTarget = getMillisecondsUntilTime(timezone, notificationTime);
      if (msUntilTarget === null) {
        saveLastNotifiedDate(activeDate);
        const verseForToday = verse && verse.date === activeDate ? verse : null;
        void showDailyVerseNotification({
          dateKey: activeDate,
          reference: verseForToday?.reference,
          verseText: verseForToday?.translations[preferredVersion],
        });
      } else {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          const currentActiveDate = getDateKeyForTimezone(timezone);
          if (loadLastNotifiedDate() === currentActiveDate) return;
          saveLastNotifiedDate(currentActiveDate);
          const verseForToday = verse && verse.date === currentActiveDate ? verse : null;
          void showDailyVerseNotification({
            dateKey: currentActiveDate,
            reference: verseForToday?.reference,
            verseText: verseForToday?.translations[preferredVersion],
          });
        }, msUntilTarget);
      }
    };

    checkAndNotify();
    const handleResume = () => {
      if (document.visibilityState === 'visible') {
        checkAndNotify();
      }
    };
    document.addEventListener('visibilitychange', handleResume);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleResume);
    };
  }, [notificationEnabled, permissionState, timezone, notificationTime, verse, preferredVersion]);

  const reloadVerse = useCallback(
    async (dateToLoad?: string) => {
      const targetDate = dateToLoad || selectedDateKey;
      setVerseLoading(true);
      try {
        const res = await fetchDailyVerse(targetDate, { isOnline });
        setVerse(res.verse);
        setVerseStatus(res.status);
        setVerseMessage(res.message);
      } finally {
        setVerseLoading(false);
      }
    },
    [selectedDateKey, isOnline]
  );

  useEffect(() => {
    void reloadVerse(selectedDateKey);
  }, [selectedDateKey, reloadVerse]);

  const setPreferredVersion = useCallback(
    async (version: BibleVersionId) => {
      setPreferredVersionState(version);
      const syncRes = await persistUserSettings(
        {
          preferredVersion: version,
          notificationEnabled,
          notificationTime,
          timezone,
        },
        currentUser?.uid
      );
      if (syncRes.anonymousAuthBlocked) {
        setAnonymousAuthBlocked(true);
      }
      if (notificationEnabled) {
        await syncPushSubscriptionPreferences({
          active: true,
          timezone,
          notificationTime,
          preferredVersion: version,
        });
      }
      showToast('Traduction mise à jour et enregistrée.', 'success');
    },
    [notificationEnabled, notificationTime, timezone, currentUser?.uid, showToast]
  );

  const updateNotificationSchedule = useCallback(
    async (next: { notificationTime?: string; timezone?: string }) => {
      const nextTime = next.notificationTime || notificationTime;
      const nextTz = next.timezone || timezone;
      setNotificationTime(nextTime);
      setTimezone(nextTz);

      if (next.timezone) {
        const nextToday = getDateKeyForTimezone(nextTz);
        setTodayDateKey(nextToday);
        setSelectedDateKey(nextToday);
      }

      const syncRes = await persistUserSettings(
        {
          preferredVersion,
          notificationEnabled,
          notificationTime: nextTime,
          timezone: nextTz,
        },
        currentUser?.uid
      );
      if (syncRes.anonymousAuthBlocked) {
        setAnonymousAuthBlocked(true);
      }

      if (notificationEnabled) {
        await syncPushSubscriptionPreferences({
          active: true,
          timezone: nextTz,
          notificationTime: nextTime,
          preferredVersion,
        });
      }

      showToast('Paramètres de rappel enregistrés.', 'success');
    },
    [preferredVersion, notificationEnabled, notificationTime, timezone, currentUser?.uid, showToast]
  );

  const enableNotifications = useCallback(async (): Promise<PushActivationResult> => {
    setPushBusy(true);
    try {
      const result = await activatePushNotifications({
        timezone,
        notificationTime,
        preferredVersion,
      });
      setPermissionState(result.permission);
      setPushFeedback(result);

      if (result.success) {
        if (getMillisecondsUntilTime(timezone, notificationTime) === null) {
          saveLastNotifiedDate(getDateKeyForTimezone(timezone));
        }
        setNotificationEnabled(true);
        setHasFcmSubscription(Boolean(result.token));
        await persistUserSettings(
          {
            preferredVersion,
            notificationEnabled: true,
            notificationTime,
            timezone,
          },
          currentUser?.uid
        );
        showToast(result.message, 'success');
      } else {
        showToast(result.message, result.reason === 'permission-denied' ? 'warning' : 'info');
      }
      return result;
    } finally {
      setPushBusy(false);
    }
  }, [timezone, notificationTime, preferredVersion, currentUser?.uid, showToast]);

  const disableNotifications = useCallback(async () => {
    setPushBusy(true);
    try {
      await deactivatePushNotifications();
      setNotificationEnabled(false);
      setHasFcmSubscription(false);
      setPushFeedback({
        success: true,
        permission: getBrowserNotificationPermission(),
        message: 'Les notifications quotidiennes ont été désactivées pour cet appareil.',
      });
      await persistUserSettings(
        {
          preferredVersion,
          notificationEnabled: false,
          notificationTime,
          timezone,
        },
        currentUser?.uid
      );
      showToast('Notifications quotidiennes désactivées.', 'info');
    } finally {
      setPushBusy(false);
    }
  }, [preferredVersion, notificationTime, timezone, currentUser?.uid, showToast]);

  const testDeviceNotification = useCallback(async () => {
    const res = await sendDeviceTestNotification();
    showToast(res.message, res.ok ? 'success' : 'warning');
  }, [showToast]);

  const isVerseFavorite = useCallback(
    (reference: string) => favorites.some((fav) => fav.reference === reference),
    [favorites]
  );

  const toggleFavoriteVerse = useCallback(
    (targetVerse: DailyVerse) => {
      const exists = favorites.some((fav) => fav.reference === targetVerse.reference);
      if (exists) {
        const next = favorites.filter((fav) => fav.reference !== targetVerse.reference);
        setFavorites(next);
        saveFavoriteVerses(next);
        showToast(`${targetVerse.reference} retiré de vos favoris.`, 'info');
      } else {
        const entry: FavoriteVerse = {
          reference: targetVerse.reference,
          date: targetVerse.date,
          book: targetVerse.book,
          chapter: targetVerse.chapter,
          verse: targetVerse.verse,
          translations: targetVerse.translations,
          savedVersion: preferredVersion,
          savedAt: new Date().toISOString(),
        };
        const next = [entry, ...favorites];
        setFavorites(next);
        saveFavoriteVerses(next);
        showToast(`${targetVerse.reference} enregistré dans vos favoris.`, 'success');
      }
    },
    [favorites, preferredVersion, showToast]
  );

  const removeFavoriteVerse = useCallback(
    (reference: string) => {
      const next = favorites.filter((fav) => fav.reference !== reference);
      setFavorites(next);
      saveFavoriteVerses(next);
      showToast(`${reference} retiré de vos favoris.`, 'info');
    },
    [favorites, showToast]
  );

  return (
    <AppContext.Provider
      value={{
        route,
        navigate,
        isOnline,
        todayDateKey,
        selectedDateKey,
        setSelectedDateKey,
        verse,
        verseLoading,
        verseStatus,
        verseMessage,
        reloadVerse,
        preferredVersion,
        setPreferredVersion,
        notificationEnabled,
        notificationTime,
        timezone,
        updateNotificationSchedule,
        permissionState,
        hasFcmSubscription,
        pushBusy,
        pushFeedback,
        mobileInfo,
        enableNotifications,
        disableNotifications,
        testDeviceNotification,
        currentUser,
        anonymousAuthBlocked,
        favorites,
        isVerseFavorite,
        toggleFavoriteVerse,
        removeFavoriteVerse,
        toast,
        showToast,
        clearToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
