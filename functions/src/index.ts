import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import crypto from 'crypto';

const app = getApps().length ? getApp() : initializeApp();
const databaseId = process.env.FIRESTORE_DATABASE_ID || '(default)';
const db = databaseId && databaseId !== '(default)' ? getFirestore(app, databaseId) : getFirestore(app);
const messaging = getMessaging(app);

interface PushSubscriptionDoc {
  userId: string;
  fcmToken: string;
  platform: string;
  timezone: string;
  notificationTime: string;
  preferredVersion?: string;
  active: boolean;
}

interface DailyVerseDoc {
  date: string;
  reference: string;
  translations: Record<string, string>;
}

function getLocalDateAndMinutes(now: Date, timeZone: string): { dateStr: string; totalMinutes: number } {
  let tz = timeZone || 'Africa/Abidjan';
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now);

    const map: Record<string, string> = {};
    for (const p of parts) {
      map[p.type] = p.value;
    }
    const hour = parseInt(map.hour === '24' ? '0' : map.hour, 10);
    const minute = parseInt(map.minute, 10);
    return {
      dateStr: `${map.year}-${map.month}-${map.day}`,
      totalMinutes: hour * 60 + minute,
    };
  } catch {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Abidjan',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now);

    const map: Record<string, string> = {};
    for (const p of parts) {
      map[p.type] = p.value;
    }
    const hour = parseInt(map.hour === '24' ? '0' : map.hour, 10);
    const minute = parseInt(map.minute, 10);
    return {
      dateStr: `${map.year}-${map.month}-${map.day}`,
      totalMinutes: hour * 60 + minute,
    };
  }
}

function parseMinutes(hhmm: string): number {
  const [h, m] = (hhmm || '07:00').split(':').map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return 7 * 60;
  return h * 60 + m;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex').slice(0, 24);
}

function isInvalidTokenError(code?: string): boolean {
  return (
    code === 'messaging/registration-token-not-registered' ||
    code === 'messaging/invalid-registration-token' ||
    code === 'messaging/invalid-argument'
  );
}

async function dispatchDailyVerseNotifications(now = new Date()): Promise<{
  checked: number;
  sent: number;
  skippedDuplicate: number;
  deactivatedInvalid: number;
  errors: number;
}> {
  const snapshot = await db.collection('push_subscriptions').where('active', '==', true).get();

  let checked = 0;
  let sent = 0;
  let skippedDuplicate = 0;
  let deactivatedInvalid = 0;
  let errors = 0;

  const verseCache = new Map<string, DailyVerseDoc | null>();

  for (const subDoc of snapshot.docs) {
    checked += 1;
    const sub = subDoc.data() as PushSubscriptionDoc;
    if (!sub.fcmToken || !sub.userId) continue;

    const tz = sub.timezone || 'Africa/Abidjan';
    const { dateStr, totalMinutes } = getLocalDateAndMinutes(now, tz);
    const targetMinutes = parseMinutes(sub.notificationTime || '07:00');

    // Fenêtre d'envoi de 5 minutes correspondant à la fréquence du Cloud Scheduler (*/5 * * * *)
    const diff = totalMinutes - targetMinutes;
    if (diff < 0 || diff >= 5) {
      continue;
    }

    const tokenId = hashToken(sub.fcmToken);
    const logId = `${dateStr}_${tokenId}`;
    const logRef = db.collection('notification_logs').doc(logId);

    // Prévention stricte des doublons via transaction atomique (1 notification max / jour / appareil)
    const shouldSend = await db.runTransaction(async (tx) => {
      const existingLog = await tx.get(logRef);
      if (existingLog.exists && existingLog.data()?.status === 'sent') {
        return false;
      }
      tx.set(logRef, {
        userId: sub.userId,
        tokenId,
        date: dateStr,
        status: 'pending',
        sentAt: FieldValue.serverTimestamp(),
        error: '',
      });
      return true;
    });

    if (!shouldSend) {
      skippedDuplicate += 1;
      continue;
    }

    if (!verseCache.has(dateStr)) {
      const verseSnap = await db.collection('daily_verses').doc(dateStr).get();
      verseCache.set(dateStr, verseSnap.exists ? (verseSnap.data() as DailyVerseDoc) : null);
    }
    const verseDoc = verseCache.get(dateStr);
    const preferredVersion = sub.preferredVersion || 'lsg1910';
    const verseReference = verseDoc?.reference || '';

    try {
      await messaging.send({
        token: sub.fcmToken,
        notification: {
          title: 'MÉDITATION CPC',
          body: 'Votre verset biblique du jour est disponible. Venez découvrir la Parole de Dieu.',
        },
        data: {
          url: '/verset-du-jour',
          date: dateStr,
          reference: verseReference,
          preferredVersion,
        },
        webpush: {
          headers: {
            Urgency: 'normal',
          },
          notification: {
            title: 'MÉDITATION CPC',
            body: 'Votre verset biblique du jour est disponible. Venez découvrir la Parole de Dieu.',
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: `meditation-cpc-${dateStr}`,
          },
          fcmOptions: {
            link: '/verset-du-jour',
          },
        },
      });

      await logRef.update({
        status: 'sent',
        sentAt: FieldValue.serverTimestamp(),
        error: '',
      });
      sent += 1;
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string; message?: string };
      const errCode = firebaseErr?.code || 'unknown';
      const errMsg = (firebaseErr?.message || String(err)).slice(0, 480);

      await logRef.update({
        status: 'error',
        sentAt: FieldValue.serverTimestamp(),
        error: errMsg,
      });

      if (isInvalidTokenError(errCode)) {
        await subDoc.ref.update({
          active: false,
          updatedAt: FieldValue.serverTimestamp(),
        });
        deactivatedInvalid += 1;
      } else {
        errors += 1;
      }
      logger.error('Erreur envoi FCM', { subscriptionId: subDoc.id, errCode, errMsg });
    }
  }

  return { checked, sent, skippedDuplicate, deactivatedInvalid, errors };
}

/**
 * Cloud Function planifiée via Cloud Scheduler toutes les 5 minutes.
 * Envoie une notification Web Push unique par jour et par appareil abonné selon son heure et son fuseau horaire.
 */
export const sendDailyVerseNotifications = onSchedule(
  {
    schedule: 'every 5 minutes',
    timeZone: 'UTC',
    region: 'europe-west1',
    memory: '256MiB',
  },
  async () => {
    const summary = await dispatchDailyVerseNotifications(new Date());
    logger.info('Résumé envoi notifications MÉDITATION CPC', summary);
  }
);

/**
 * Point d'entrée HTTP sécurisé permettant à un administrateur vérifié de déclencher une vérification manuelle.
 */
export const triggerDailyNotifications = onRequest(
  { region: 'europe-west1' },
  async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentification requise.' });
      return;
    }

    try {
      const { getAuth } = await import('firebase-admin/auth');
      const token = authHeader.slice('Bearer '.length);
      const decoded = await getAuth(app).verifyIdToken(token);
      if (decoded.email !== 'dalougouboris650@gmail.com' || !decoded.email_verified) {
        res.status(403).json({ error: 'Accès administrateur requis.' });
        return;
      }

      const summary = await dispatchDailyVerseNotifications(new Date());
      res.status(200).json({ ok: true, summary });
    } catch (error) {
      logger.error('Erreur triggerDailyNotifications', error);
      res.status(500).json({ error: 'Erreur interne lors du déclenchement.' });
    }
  }
);
