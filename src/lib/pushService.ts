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
  reason?:
    | 'permission-denied'
    | 'permission-dismissed'
    | 'unsupported'
    | 'missing-vapid'
    | 'auth-required'
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

  const messaging = await getMessagingIfSupported();
  if (!messaging) {
    return {
      success: false,
      permission: 'granted',
      reason: 'unsupported',
      message:
        'Firebase Cloud Messaging n’est pas supporté dans ce contexte de navigation (vérifiez HTTPS et les cookies/Service Workers).',
    };
  }

  if (!VAPID_KEY) {
    return {
      success: false,
      permission: 'granted',
      reason: 'missing-vapid',
      message:
        'Autorisation navigateur accordée, mais la clé publique Web Push (VITE_FIREBASE_VAPID_KEY) n’est pas encore configurée dans l’environnement.',
    };
  }

  let swRegistration: ServiceWorkerRegistration;
  try {
    swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/firebase-cloud-messaging-push-scope',
    });
  } catch (err) {
    return {
      success: false,
      permission: 'granted',
      reason: 'error',
      message:
        err instanceof Error
          ? `Échec d’enregistrement du Service Worker de notifications : ${err.message}`
          : 'Échec d’enregistrement du Service Worker de notifications.',
    };
  }

  let fcmToken = '';
  try {
    fcmToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });
  } catch (err) {
    return {
      success: false,
      permission: 'granted',
      reason: 'error',
      message:
        err instanceof Error
          ? `Impossible d’obtenir le jeton FCM : ${err.message}`
          : 'Impossible d’obtenir le jeton Firebase Cloud Messaging.',
    };
  }

  if (!fcmToken) {
    return {
      success: false,
      permission: 'granted',
      reason: 'error',
      message: 'Aucun jeton d’enregistrement FCM n’a été retourné par le navigateur.',
    };
  }

  const authRes = await ensureAnonymousSession();
  if (!authRes.user) {
    saveStoredPushMetadata(fcmToken, null);
    return {
      success: false,
      permission: 'granted',
      token: fcmToken,
      reason: 'auth-required',
      message: authRes.anonymousAuthBlocked
        ? 'Jeton FCM généré, mais l’authentification anonyme Firebase doit être activée dans la console Firebase pour enregistrer votre abonnement dans Firestore.'
        : 'Impossible d’authentifier la session pour enregistrer l’abonnement.',
    };
  }

  const uid = authRes.user.uid;
  const subscriptionId = await computeSubscriptionDocId(uid, fcmToken);
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
    return {
      success: true,
      permission: 'granted',
      token: fcmToken,
      subscriptionId,
      message: `Notifications activées avec succès. Vous recevrez votre verset quotidien à ${params.notificationTime} (${params.timezone}).`,
    };
  } catch (error) {
    if (isOfflineFirestoreError(error)) {
      return {
        success: false,
        permission: 'granted',
        reason: 'offline',
        message: 'Connexion Internet requise pour finaliser l’enregistrement de l’abonnement.',
      };
    }
    const msg = error instanceof Error ? error.message.toLowerCase() : '';
    if (msg.includes('permission') || msg.includes('insufficient')) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
    return {
      success: false,
      permission: 'granted',
      reason: 'error',
      message: 'Erreur lors de la sauvegarde de l’abonnement push.',
    };
  }
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

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/firebase-cloud-messaging-push-scope',
    });
    await registration.showNotification('MÉDITATION CPC', {
      body: 'Votre verset biblique du jour est disponible. Venez découvrir la Parole de Dieu.',
      icon: '/assets/aistudio/IMG-20261024-WA0004_1__dd88a4ca.jpg',
      badge: '/pwa-192x192.png',
      tag: 'meditation-cpc-device-test',
      data: { url: '/verset-du-jour' },
    });
    return {
      ok: true,
      message: 'Notification de test affichée sur votre appareil.',
    };
  } catch {
    try {
      new Notification('MÉDITATION CPC', {
        body: 'Votre verset biblique du jour est disponible. Venez découvrir la Parole de Dieu.',
        icon: '/assets/aistudio/IMG-20261024-WA0004_1__dd88a4ca.jpg',
      });
      return {
        ok: true,
        message: 'Notification de test affichée sur votre appareil.',
      };
    } catch {
      return {
        ok: false,
        message: 'Impossible d’afficher la notification sur cet appareil.',
      };
    }
  }
}
