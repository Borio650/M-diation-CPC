import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import express from 'express';
import type * as WebPushType from 'web-push';
import { getScheduledVerseForDate } from './src/data/verses.ts';

const require = createRequire(import.meta.url);
const webpush = require('web-push') as typeof WebPushType;

type BibleVersionId = 'lsg1910' | 'pdv' | 'fc' | 'kjf';

interface ClientPushSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface StoredSubscription {
  id: string;
  subscription: ClientPushSubscription;
  timezone: string;
  notificationTime: string;
  preferredVersion: BibleVersionId;
  active: boolean;
  lastSentDate: string | null;
  updatedAt: string;
}

interface FirebaseAppletConfig {
  projectId?: string;
  firestoreDatabaseId?: string;
  apiKey?: string;
}

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ROOT_DIR = import.meta.dirname;

function loadFirebaseAppletConfig(): FirebaseAppletConfig {
  try {
    const raw = fs.readFileSync(path.resolve(ROOT_DIR, 'firebase-applet-config.json'), 'utf8');
    return JSON.parse(raw) as FirebaseAppletConfig;
  } catch {
    return {};
  }
}

const firebaseConfig = loadFirebaseAppletConfig();

function initVapidKeys(): { publicKey: string; privateKey: string } {
  const envPub = (process.env.VAPID_PUBLIC_KEY || '').trim();
  const envPriv = (process.env.VAPID_PRIVATE_KEY || '').trim();
  if (envPub && envPriv) {
    return { publicKey: envPub, privateKey: envPriv };
  }
  return webpush.generateVAPIDKeys();
}

const vapidKeys = initVapidKeys();
const vapidSubject = (process.env.VAPID_SUBJECT || '').trim() || 'mailto:contact@meditation-cpc.org';
webpush.setVapidDetails(vapidSubject, vapidKeys.publicKey, vapidKeys.privateKey);

const subscriptions = new Map<string, StoredSubscription>();

function hashEndpoint(endpoint: string): string {
  return crypto.createHash('sha256').update(endpoint).digest('hex').slice(0, 24);
}

function isPrivateOrLocalHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === 'localhost' ||
    lower === '::1' ||
    lower === '[::1]' ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal')
  ) {
    return true;
  }
  if (/^127\./.test(lower) || /^10\./.test(lower) || /^169\.254\./.test(lower) || /^0\./.test(lower)) {
    return true;
  }
  if (/^192\.168\./.test(lower)) {
    return true;
  }
  const match172 = /^172\.(\d{1,3})\./.exec(lower);
  if (match172) {
    const second = Number(match172[1]);
    if (second >= 16 && second <= 31) return true;
  }
  if (/^(fc|fd|fe80)/i.test(lower)) {
    return true;
  }
  return false;
}

function isSafePushEndpoint(raw: unknown): raw is string {
  if (typeof raw !== 'string' || raw.length < 16 || raw.length > 2048) {
    return false;
  }
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:') return false;
    if (isPrivateOrLocalHostname(parsed.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

function validatePushSubscription(raw: unknown): ClientPushSubscription | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Record<string, unknown>;
  if (!isSafePushEndpoint(candidate.endpoint)) return null;
  if (!candidate.keys || typeof candidate.keys !== 'object') return null;

  const keys = candidate.keys as Record<string, unknown>;
  if (
    typeof keys.p256dh !== 'string' ||
    keys.p256dh.length < 16 ||
    keys.p256dh.length > 512 ||
    !/^[A-Za-z0-9\-_=]+$/.test(keys.p256dh)
  ) {
    return null;
  }
  if (
    typeof keys.auth !== 'string' ||
    keys.auth.length < 8 ||
    keys.auth.length > 512 ||
    !/^[A-Za-z0-9\-_=]+$/.test(keys.auth)
  ) {
    return null;
  }

  return {
    endpoint: candidate.endpoint,
    expirationTime: typeof candidate.expirationTime === 'number' ? candidate.expirationTime : null,
    keys: {
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
  };
}

function sanitizeTimezone(raw: unknown): string {
  if (typeof raw !== 'string' || raw.length < 2 || raw.length > 64) {
    return 'Africa/Abidjan';
  }
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: raw }).format(new Date());
    return raw;
  } catch {
    return 'Africa/Abidjan';
  }
}

function sanitizeTime(raw: unknown): string {
  if (typeof raw === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(raw)) {
    return raw;
  }
  return '07:00';
}

function sanitizeVersion(raw: unknown): BibleVersionId {
  if (raw === 'lsg1910' || raw === 'pdv' || raw === 'fc' || raw === 'kjf') {
    return raw;
  }
  return 'lsg1910';
}

function getLocalDateAndMinutes(now: Date, timeZone: string): { dateStr: string; totalMinutes: number } {
  const formatParts = (tz: string) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now);

  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = formatParts(timeZone);
  } catch {
    parts = formatParts('Africa/Abidjan');
  }

  const map: Record<string, string> = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }
  const hour = parseInt(map.hour === '24' ? '0' : map.hour, 10) || 0;
  const minute = parseInt(map.minute, 10) || 0;

  return {
    dateStr: `${map.year}-${map.month}-${map.day}`,
    totalMinutes: hour * 60 + minute,
  };
}

function parseMinutes(hhmm: string): number {
  const [hStr, mStr] = hhmm.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return 7 * 60;
  return h * 60 + m;
}

async function fetchVerseForDate(
  dateKey: string
): Promise<{ reference: string; translations: Record<BibleVersionId, string> } | null> {
  if (firebaseConfig.projectId && firebaseConfig.apiKey) {
    const dbId = encodeURIComponent(firebaseConfig.firestoreDatabaseId || '(default)');
    const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      firebaseConfig.projectId
    )}/databases/${dbId}/documents/daily_verses/${encodeURIComponent(dateKey)}?key=${encodeURIComponent(
      firebaseConfig.apiKey
    )}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const doc = (await res.json()) as {
          fields?: {
            reference?: { stringValue?: string };
            translations?: {
              mapValue?: {
                fields?: Record<string, { stringValue?: string }>;
              };
            };
          };
        };
        const ref = doc.fields?.reference?.stringValue;
        const tr = doc.fields?.translations?.mapValue?.fields;
        if (ref && tr?.lsg1910?.stringValue && tr?.pdv?.stringValue && tr?.fc?.stringValue && tr?.kjf?.stringValue) {
          return {
            reference: ref,
            translations: {
              lsg1910: tr.lsg1910.stringValue,
              pdv: tr.pdv.stringValue,
              fc: tr.fc.stringValue,
              kjf: tr.kjf.stringValue,
            },
          };
        }
      }
    } catch {
      // Fall back to deterministic canonical schedule below
    }
  }

  const scheduled = getScheduledVerseForDate(dateKey);
  if (!scheduled) return null;
  return {
    reference: scheduled.reference,
    translations: scheduled.translations,
  };
}

async function runDailyPushCheck(): Promise<void> {
  if (subscriptions.size === 0) return;

  const now = new Date();
  const verseCache = new Map<
    string,
    { reference: string; translations: Record<BibleVersionId, string> } | null
  >();

  for (const [id, entry] of subscriptions.entries()) {
    if (!entry.active) continue;

    const { dateStr, totalMinutes } = getLocalDateAndMinutes(now, entry.timezone);
    const targetMinutes = parseMinutes(entry.notificationTime);
    const diff = totalMinutes - targetMinutes;

    if (diff < 0 || diff >= 5 || entry.lastSentDate === dateStr) {
      continue;
    }

    if (!verseCache.has(dateStr)) {
      verseCache.set(dateStr, await fetchVerseForDate(dateStr));
    }
    const verse = verseCache.get(dateStr);
    const verseText = verse?.translations[entry.preferredVersion] || '';
    const preview =
      verseText.length > 110
        ? `${verseText.slice(0, 107)}…`
        : verseText || 'Votre verset biblique du jour est disponible. Venez découvrir la Parole de Dieu.';

    const payload = JSON.stringify({
      title: verse ? `MÉDITATION CPC · ${verse.reference}` : 'MÉDITATION CPC',
      body: preview,
      url: '/verset-du-jour',
      date: dateStr,
      reference: verse?.reference || '',
      tag: `meditation-cpc-${dateStr}`,
    });

    try {
      await webpush.sendNotification(entry.subscription, payload, {
        TTL: 60 * 60 * 6,
        urgency: 'normal',
      });
      entry.lastSentDate = dateStr;
      entry.updatedAt = new Date().toISOString();
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        subscriptions.delete(id);
      }
    }
  }
}

async function startServer(): Promise<void> {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));

  app.get('/api/push/vapid-public-key', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ publicKey: vapidKeys.publicKey });
  });

  app.post('/api/push/subscribe', (req, res) => {
    const body = (req.body || {}) as Record<string, unknown>;
    const subscription = validatePushSubscription(body.subscription);
    if (!subscription) {
      res.status(400).json({ ok: false, error: 'Abonnement Web Push invalide.' });
      return;
    }

    const id = hashEndpoint(subscription.endpoint);
    const existing = subscriptions.get(id);
    const record: StoredSubscription = {
      id,
      subscription,
      timezone: sanitizeTimezone(body.timezone),
      notificationTime: sanitizeTime(body.notificationTime),
      preferredVersion: sanitizeVersion(body.preferredVersion),
      active: true,
      lastSentDate: existing?.lastSentDate || null,
      updatedAt: new Date().toISOString(),
    };
    subscriptions.set(id, record);

    res.status(200).json({ ok: true, subscriptionId: id });
  });

  app.post('/api/push/preferences', (req, res) => {
    const body = (req.body || {}) as Record<string, unknown>;
    if (!isSafePushEndpoint(body.endpoint)) {
      res.status(400).json({ ok: false, error: 'Point de terminaison Web Push invalide.' });
      return;
    }

    const id = hashEndpoint(body.endpoint);
    const existing = subscriptions.get(id);
    if (!existing) {
      res.status(404).json({ ok: false, error: 'Abonnement introuvable.' });
      return;
    }

    if (body.timezone !== undefined) existing.timezone = sanitizeTimezone(body.timezone);
    if (body.notificationTime !== undefined) existing.notificationTime = sanitizeTime(body.notificationTime);
    if (body.preferredVersion !== undefined) existing.preferredVersion = sanitizeVersion(body.preferredVersion);
    if (typeof body.active === 'boolean') existing.active = body.active;
    existing.updatedAt = new Date().toISOString();

    res.status(200).json({ ok: true });
  });

  app.post('/api/push/unsubscribe', (req, res) => {
    const body = (req.body || {}) as Record<string, unknown>;
    if (!isSafePushEndpoint(body.endpoint)) {
      res.status(400).json({ ok: false, error: 'Point de terminaison invalide.' });
      return;
    }
    const id = hashEndpoint(body.endpoint);
    subscriptions.delete(id);
    res.status(200).json({ ok: true });
  });

  app.post('/api/push/test', async (req, res) => {
    const body = (req.body || {}) as Record<string, unknown>;
    const providedSub = validatePushSubscription(body.subscription);
    const endpoint = providedSub?.endpoint || (isSafePushEndpoint(body.endpoint) ? body.endpoint : null);
    if (!endpoint) {
      res.status(400).json({ ok: false, error: 'Abonnement Web Push requis pour envoyer un test.' });
      return;
    }

    const id = hashEndpoint(endpoint);
    const stored = subscriptions.get(id);
    const targetSubscription = stored?.subscription || providedSub;
    if (!targetSubscription) {
      res.status(404).json({ ok: false, error: 'Abonnement non enregistré sur le serveur.' });
      return;
    }

    const timezone = stored?.timezone || sanitizeTimezone(body.timezone);
    const preferredVersion = stored?.preferredVersion || sanitizeVersion(body.preferredVersion);
    const { dateStr } = getLocalDateAndMinutes(new Date(), timezone);
    const verse = await fetchVerseForDate(dateStr);
    const verseText = verse?.translations[preferredVersion] || '';
    const preview =
      verseText.length > 110
        ? `${verseText.slice(0, 107)}…`
        : verseText || 'Votre verset biblique du jour est disponible. Venez découvrir la Parole de Dieu.';

    const payload = JSON.stringify({
      title: verse ? `MÉDITATION CPC · ${verse.reference}` : 'MÉDITATION CPC',
      body: preview,
      url: '/verset-du-jour',
      date: dateStr,
      reference: verse?.reference || '',
      tag: 'meditation-cpc-device-test',
      renotify: true,
    });

    try {
      await webpush.sendNotification(targetSubscription, payload, {
        TTL: 60 * 5,
        urgency: 'high',
      });
      res.status(200).json({ ok: true });
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        subscriptions.delete(id);
      }
      res.status(502).json({
        ok: false,
        error: 'Échec de l’envoi Web Push via le serveur.',
      });
    }
  });

  if (IS_PRODUCTION) {
    const distDir = path.resolve(ROOT_DIR, 'dist');
    app.use(
      express.static(distDir, {
        setHeaders(res, filePath) {
          if (
            filePath.endsWith('sw.js') ||
            filePath.endsWith('push-sw.js') ||
            filePath.endsWith('firebase-messaging-sw.js')
          ) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          }
        },
      })
    );
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  setInterval(() => {
    void runDailyPushCheck();
  }, 30_000);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MÉDITATION CPC server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
