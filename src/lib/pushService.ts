import { deleteToken, getToken, onMessage, type Unsubscribe } from 'firebase/messaging';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, getMessagingIfSupported, VAPID_KEY } from '@/src/lib/firebase';
import {
  handleFirestoreError,
  isOfflineFirestoreError,
  OperationType,
} from '@/src/lib/firestoreError';
import { ensureAnonymousSession } from '@/src/lib/settingsService';
import { loadStoredPushMetadata, saveStoredPushMetadata } from '@/src/lib/storage';
import { BibleVersionId } from '@/src/types/bible';

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export interface PushActivationResult {
  success: boolean;
  permission: NotificationPermissionState;
  token?: string;
  subscriptionId?: string;
  cloudSynced?: boolean;
  reason?:
    | 'permission-denied'
    | 'permission-dismissed'
    | 'unsupported'
    | 'offline'
    | 'error';
  message: string;
}

export interface MobileNotificationInfo {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isStandalone: boolean;
  requiresIOSInstall: boolean;
  deviceLabel: string;
}

export function getMobileNotificationInfo(): MobileNotificationInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isMobile: false,
      isIOS: false,
      isAndroid: false,
      isStandalone: false,
      requiresIOSInstall: false,
      deviceLabel: 'Navigateur Web',
    };
  }
  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);
  const isMobile = isIOS || isAndroid || /mobile/.test(ua);
  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  const requiresIOSInstall = isIOS && !isStandalone;
  const deviceLabel = isIOS
    ? isStandalone
      ? 'iPhone / iPad (application installée)'
      : 'iPhone / iPad (Safari)'
    : isAndroid
      ? isStandalone
        ? 'Téléphone Android (application installée)'
        : 'Téléphone Android'
      : 'Ordinateur / Navigateur Web';

  return {
    isMobile,
    isIOS,
    isAndroid,
    isStandalone,
    requiresIOSInstall,
    deviceLabel,
  };
}

export function getBrowserNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionState;
}

function detectWebPlatform(): string {
  if (typeof navigator === 'undefined') return 'web';
  const ua = navigator.userAgent.toLowerCase();
  const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches;
  if (isStandalone) return 'pwa-standalone';
  if (/android|iphone|ipad|ipod|mobile/.test(ua)) return 'web-mobile';
  return 'web-desktop';
}

async function computeSubscriptionDocId(userId: string, fcmToken: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoded = new TextEncoder().encode(fcmToken);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    const hex = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 16);
    return `${userId}_${hex}`;
  }
  return `${userId}_web`;
}

async function getPushServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    return await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/firebase-cloud-messaging-push-scope',
    });
  } catch {
    try {
      return await navigator.serviceWorker.ready;
    } catch {
      return null;
    }
  }
}

async function showNotificationViaWorker(params: {
  title: string;
  body: string;
  tag: string;
  url?: string;
}): Promise<boolean> {
  const url = params.url || '/verset-du-jour';
  try {
    const registration = await getPushServiceWorkerRegistration();
    if (registration) {
      await registration.showNotification(params.title, {
        body: params.body,
        icon: '/assets/aistudio/IMG-20261024-WA0004_1__dd88a4ca.jpg',
        badge: '/pwa-192x192.png',
        tag: params.tag,
        data: { url },
      });
      return true;
    }
  } catch {
    // Fallback to Window Notification API below
  }

  try {
    new Notification(params.title, {
      body: params.body,
      icon: '/assets/aistudio/IMG-20261024-WA0004_1__dd88a4ca.jpg',
      tag: params.tag,
    });
    return true;
  } catch {
    return false;
  }
}

export async function activatePushNotifications(params: {
  timezone: string;
  notificationTime: string;
  preferredVersion: BibleVersionId;
}): Promise<PushActivationResult> {
  const mobileInfo = getMobileNotificationInfo();
  if (mobileInfo.requiresIOSInstall) {
    return {
      success: false,
      permission: 'unsupported',
      reason: 'unsupported',
      message:
        'Sur iPhone et iPad, appuyez d’abord sur Partager dans Safari puis sur « Sur l’écran d’accueil », puis ouvrez l’application depuis votre écran d’accueil pour activer les notifications téléphone.',
    };
  }

  const currentPerm = getBrowserNotificationPermission();
  if (currentPerm === 'unsupported') {
    return {
      success: false,
      permission: 'unsupported',
      reason: 'unsupported',
      message:
        'Ce navigateur ne prend pas en charge les notifications Web Push. Sur téléphone, utilisez Chrome sur Android ou Safari sur iOS 16.4+ ajouté à l’écran d’accueil.',
    };
  }

  let permission: NotificationPermission;
  try {
    permission = await Notification.requestPermission();
  } catch {
    return {
      success: false,
      permission: getBrowserNotificationPermission(),
      reason: 'error',
      message: 'Impossible de demander l’autorisation de notification sur ce navigateur.',
    };
  }

  if (permission === 'denied') {
    return {
      success: false,
      permission: 'denied',
      reason: 'permission-denied',
      message:
        'Les notifications ont été refusées dans votre navigateur. Autorisez-les dans les paramètres du site (icône cadenas dans la barre d’adresse) puis réessayez.',
    };
  }

  if (permission !== 'granted') {
    return {
      success: false,
      permission: 'default',
      reason: 'permission-dismissed',
      message:
        'La demande d’autorisation a été fermée sans confirmation. Cliquez à nouveau sur « Activer les notifications » pour accepter.',
    };
  }

  const swRegistration = await getPushServiceWorkerRegistration();
  const messaging = await getMessagingIfSupported();

  let fcmToken = '';
  if (messaging && swRegistration) {
    try {
      // Si VITE_FIREBASE_VAPID_KEY est absent, on omet vapidKey afin que le SDK Firebase
      // utilise automatiquement sa clé Web Push par défaut intégrée.
      fcmToken = await getToken(
        messaging,
        VAPID_KEY
          ? { vapidKey: VAPID_KEY, serviceWorkerRegistration: swRegistration }
          : { serviceWorkerRegistration: swRegistration }
      );
    } catch {
      fcmToken = '';
    }
  }

  let subscriptionId: string | undefined;
  let cloudSynced = false;

  if (fcmToken) {
    saveStoredPushMetadata(fcmToken, null);
    const authRes = await ensureAnonymousSession();

    if (authRes.user) {
      const uid = authRes.user.uid;
      subscriptionId = await computeSubscriptionDocId(uid, fcmToken);
      const path = `push_subscriptions/${subscriptionId}`;

      try {
        const ref = doc(db, 'push_subscriptions', subscriptionId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          await updateDoc(ref, {
            fcmToken,
            platform: detectWebPlatform(),
            timezone: params.timezone,
            notificationTime: params.notificationTime,
            preferredVersion: params.preferredVersion,
            active: true,
            updatedAt: serverTimestamp(),
          });
        } else {
          await setDoc(ref, {
            userId: uid,
            fcmToken,
            platform: detectWebPlatform(),
            timezone: params.timezone,
            notificationTime: params.notificationTime,
            preferredVersion: params.preferredVersion,
            active: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        saveStoredPushMetadata(fcmToken, subscriptionId);
        cloudSynced = true;
      } catch (error) {
        if (!isOfflineFirestoreError(error)) {
          const msg = error instanceof Error ? error.message.toLowerCase() : '';
          if (msg.includes('permission') || msg.includes('insufficient')) {
            handleFirestoreError(error, OperationType.WRITE, path);
          }
        }
      }
    }
  }

  await showNotificationViaWorker({
    title: 'MÉDITATION CPC',
    body: `Rappel quotidien activé pour ${params.notificationTime} (${params.timezone}). Que la Parole de Dieu vous accompagne chaque jour.`,
    tag: 'meditation-cpc-activated',
    url: '/verset-du-jour',
  });

  return {
    success: true,
    permission: 'granted',
    token: fcmToken || undefined,
    subscriptionId,
    cloudSynced,
    message: `Notifications activées avec succès. Vous recevrez votre verset quotidien à ${params.notificationTime} (${params.timezone}).`,
  };
}

export async function syncPushSubscriptionPreferences(params: {
  active: boolean;
  timezone: string;
  notificationTime: string;
  preferredVersion: BibleVersionId;
}): Promise<void> {
  const { subscriptionId } = loadStoredPushMetadata();
  const uid = auth.currentUser?.uid;
  if (!subscriptionId || !uid) return;

  const path = `push_subscriptions/${subscriptionId}`;
  try {
    const ref = doc(db, 'push_subscriptions', subscriptionId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    await updateDoc(ref, {
      active: params.active,
      timezone: params.timezone,
      notificationTime: params.notificationTime,
      preferredVersion: params.preferredVersion,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    if (isOfflineFirestoreError(error)) return;
    const msg = error instanceof Error ? error.message.toLowerCase() : '';
    if (msg.includes('permission') || msg.includes('insufficient')) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
}

export async function deactivatePushNotifications(): Promise<void> {
  const { subscriptionId } = loadStoredPushMetadata();
  const uid = auth.currentUser?.uid;

  if (subscriptionId && uid) {
    const path = `push_subscriptions/${subscriptionId}`;
    try {
      const ref = doc(db, 'push_subscriptions', subscriptionId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, {
          active: false,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      if (!isOfflineFirestoreError(error)) {
        const msg = error instanceof Error ? error.message.toLowerCase() : '';
        if (msg.includes('permission') || msg.includes('insufficient')) {
          handleFirestoreError(error, OperationType.UPDATE, path);
        }
      }
    }
  }

  try {
    const messaging = await getMessagingIfSupported();
    if (messaging) {
      await deleteToken(messaging);
    }
  } catch {
    // Ignore token deletion failure when browser has already revoked permission
  }

  saveStoredPushMetadata(null, null);
}

export async function subscribeToForegroundMessages(
  onReceive: (payload: { title: string; body: string; url: string }) => void
): Promise<Unsubscribe | null> {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return null;

  return onMessage(messaging, (payload) => {
    const title = payload.notification?.title || payload.data?.title || 'MÉDITATION CPC';
    const body =
      payload.notification?.body ||
      payload.data?.body ||
      'Votre verset biblique du jour est disponible. Venez découvrir la Parole de Dieu.';
    const url = payload.fcmOptions?.link || payload.data?.url || '/verset-du-jour';
    onReceive({ title, body, url });
  });
}

export async function showDailyVerseNotification(params: {
  dateKey: string;
  reference?: string;
  verseText?: string;
}): Promise<boolean> {
  if (getBrowserNotificationPermission() !== 'granted') return false;
  const preview = params.verseText
    ? params.verseText.length > 110
      ? `${params.verseText.slice(0, 107)}…`
      : params.verseText
    : 'Votre verset biblique du jour est disponible. Venez découvrir la Parole de Dieu.';
  const title = params.reference ? `MÉDITATION CPC · ${params.reference}` : 'MÉDITATION CPC';
  return showNotificationViaWorker({
    title,
    body: preview,
    tag: `meditation-cpc-${params.dateKey}`,
    url: '/verset-du-jour',
  });
}

/**
 * Déclenche une notification système immédiate sur l'appareil (téléphone ou ordinateur)
 * lorsque la permission navigateur est déjà accordée, afin de vérifier la réception locale.
 */
export async function sendDeviceTestNotification(): Promise<{ ok: boolean; message: string }> {
  const permission = getBrowserNotificationPermission();
  if (permission !== 'granted') {
    return {
      ok: false,
      message: 'Autorisez d’abord les notifications sur cet appareil avant d’effectuer un test.',
    };
  }

  const shown = await showNotificationViaWorker({
    title: 'MÉDITATION CPC',
    body: 'Votre verset biblique du jour est disponible. Venez découvrir la Parole de Dieu.',
    tag: 'meditation-cpc-device-test',
    url: '/verset-du-jour',
  });

  if (shown) {
    return {
      ok: true,
      message: 'Notification de test affichée sur votre appareil.',
    };
  }
  return {
    ok: false,
    message: 'Impossible d’afficher la notification sur cet appareil.',
  };
}
