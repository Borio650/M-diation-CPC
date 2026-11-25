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
  webPushActive?: boolean;
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

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBuffersEqual(a: ArrayBuffer | null, b: Uint8Array<ArrayBuffer>): boolean {
  if (!a) return false;
  const viewA = new Uint8Array(a);
  if (viewA.length !== b.length) return false;
  for (let i = 0; i < viewA.length; i += 1) {
    if (viewA[i] !== b[i]) return false;
  }
  return true;
}

async function waitForWorkerActive(registration: ServiceWorkerRegistration): Promise<void> {
  if (registration.active) return;
  const worker = registration.installing || registration.waiting;
  if (!worker) return;
  await new Promise<void>((resolve) => {
    const timer = window.setTimeout(resolve, 4000);
    worker.addEventListener('statechange', () => {
      if (worker.state === 'activated') {
        window.clearTimeout(timer);
        resolve();
      }
    });
  });
}

async function getMainServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    let reg = await navigator.serviceWorker.getRegistration('/');
    if (!reg) {
      reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    }
    await waitForWorkerActive(reg);
    return reg;
  } catch {
    try {
      return await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 3000)),
      ]);
    } catch {
      return null;
    }
  }
}

async function getFcmServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    return await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/firebase-cloud-messaging-push-scope',
    });
  } catch {
    return null;
  }
}

async function fetchServerVapidPublicKey(): Promise<string | null> {
  try {
    const res = await fetch('/api/push/vapid-public-key', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as { publicKey?: string };
    return typeof data.publicKey === 'string' && data.publicKey.length > 20 ? data.publicKey : null;
  } catch {
    return null;
  }
}

async function subscribeBrowserWebPush(params: {
  timezone: string;
  notificationTime: string;
  preferredVersion: BibleVersionId;
}): Promise<{ active: boolean; subscription?: PushSubscription; endpoint?: string }> {
  if (typeof window === 'undefined' || !('PushManager' in window)) {
    return { active: false };
  }

  const registration = await getMainServiceWorkerRegistration();
  if (!registration || !registration.pushManager) {
    return { active: false };
  }

  const publicKey = await fetchServerVapidPublicKey();
  if (!publicKey) {
    return { active: false };
  }

  const appServerKey = urlBase64ToUint8Array(publicKey);

  try {
    let sub = await registration.pushManager.getSubscription();
    if (sub && !arrayBuffersEqual(sub.options?.applicationServerKey || null, appServerKey)) {
      await sub.unsubscribe().catch(() => false);
      sub = null;
    }

    if (!sub) {
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey,
      });
    }

    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: sub.toJSON(),
        timezone: params.timezone,
        notificationTime: params.notificationTime,
        preferredVersion: params.preferredVersion,
      }),
    });

    if (!res.ok) {
      return { active: false };
    }

    return { active: true, subscription: sub, endpoint: sub.endpoint };
  } catch {
    return { active: false };
  }
}

export async function ensureWebPushSubscriptionSynced(params: {
  timezone: string;
  notificationTime: string;
  preferredVersion: BibleVersionId;
}): Promise<boolean> {
  if (getBrowserNotificationPermission() !== 'granted') return false;
  const result = await subscribeBrowserWebPush(params);
  return result.active;
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

async function showNotificationViaWorker(params: {
  title: string;
  body: string;
  tag: string;
  url?: string;
}): Promise<boolean> {
  const url = params.url || '/verset-du-jour';
  try {
    const registration =
      (await getMainServiceWorkerRegistration()) || (await getFcmServiceWorkerRegistration());
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

  // 1. Abonnement Web Push W3C principal (permet l'envoi serveur même application fermée)
  const webPush = await subscribeBrowserWebPush(params);

  // 2. Synchronisation Firebase Cloud Messaging / Firestore (complémentaire, non bloquante)
  const fcmSw = await getFcmServiceWorkerRegistration();
  const messaging = await getMessagingIfSupported();
  let fcmToken = '';
  if (messaging && fcmSw) {
    try {
      fcmToken = await getToken(
        messaging,
        VAPID_KEY
          ? { vapidKey: VAPID_KEY, serviceWorkerRegistration: fcmSw }
          : { serviceWorkerRegistration: fcmSw }
      );
    } catch {
      fcmToken = '';
    }
  }

  let subscriptionId: string | undefined;
  let cloudSynced = webPush.active;

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
    body: `Rappel quotidien activé pour ${params.notificationTime} (${params.timezone}). Vous recevrez votre verset même lorsque l’application est fermée.`,
    tag: 'meditation-cpc-activated',
    url: '/verset-du-jour',
  });

  return {
    success: true,
    permission: 'granted',
    token: fcmToken || undefined,
    subscriptionId,
    cloudSynced,
    webPushActive: webPush.active,
    message: webPush.active
      ? `Notifications activées avec succès. Vous recevrez votre verset chaque jour à ${params.notificationTime} (${params.timezone}), même lorsque l’application est fermée.`
      : `Notifications activées sur cet appareil pour ${params.notificationTime} (${params.timezone}).`,
  };
}

export async function syncPushSubscriptionPreferences(params: {
  active: boolean;
  timezone: string;
  notificationTime: string;
  preferredVersion: BibleVersionId;
}): Promise<void> {
  // Synchronisation serveur Web Push
  try {
    const registration = await getMainServiceWorkerRegistration();
    const sub = await registration?.pushManager?.getSubscription();
    if (sub) {
      const res = await fetch('/api/push/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          active: params.active,
          timezone: params.timezone,
          notificationTime: params.notificationTime,
          preferredVersion: params.preferredVersion,
        }),
      });
      if (res.status === 404 && params.active) {
        await subscribeBrowserWebPush(params);
      }
    } else if (params.active && getBrowserNotificationPermission() === 'granted') {
      await subscribeBrowserWebPush(params);
    }
  } catch {
    // Ignore transient network errors during preference sync
  }

  // Synchronisation Firestore optionnelle
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
  try {
    const registration = await getMainServiceWorkerRegistration();
    const sub = await registration?.pushManager?.getSubscription();
    if (sub) {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      }).catch(() => undefined);
      await sub.unsubscribe().catch(() => false);
    }
  } catch {
    // Ignore unsubscribe errors
  }

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
 * Envoie une vraie notification Web Push depuis le serveur vers cet appareil
 * (reçue même si l'application est en arrière-plan ou fermée), avec repli local hors ligne.
 */
export async function sendDeviceTestNotification(params?: {
  timezone?: string;
  notificationTime?: string;
  preferredVersion?: BibleVersionId;
}): Promise<{ ok: boolean; message: string }> {
  const permission = getBrowserNotificationPermission();
  if (permission !== 'granted') {
    return {
      ok: false,
      message: 'Autorisez d’abord les notifications sur cet appareil avant d’effectuer un test.',
    };
  }

  const syncParams = {
    timezone: params?.timezone || 'Africa/Abidjan',
    notificationTime: params?.notificationTime || '07:00',
    preferredVersion: params?.preferredVersion || 'lsg1910',
  };

  try {
    const subResult = await subscribeBrowserWebPush(syncParams);
    if (subResult.active && subResult.subscription) {
      const res = await fetch('/api/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subResult.subscription.toJSON(),
          timezone: syncParams.timezone,
          preferredVersion: syncParams.preferredVersion,
        }),
      });
      if (res.ok) {
        return {
          ok: true,
          message: 'Notification Web Push envoyée depuis le serveur vers votre appareil.',
        };
      }
    }
  } catch {
    // Fall back to direct worker notification below
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
