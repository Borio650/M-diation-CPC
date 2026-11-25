import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { CANONICAL_VERSES, getScheduledVerseForDate } from '@/src/data/verses';
import { db } from '@/src/lib/firebase';
import {
  handleFirestoreError,
  isOfflineFirestoreError,
  OperationType,
} from '@/src/lib/firestoreError';
import { loadCachedVerse, saveCachedVerse } from '@/src/lib/storage';
import { addDaysToDateKey } from '@/src/lib/timezone';
import { DailyVerse } from '@/src/types/bible';

export interface VerseFetchResult {
  verse: DailyVerse | null;
  status: 'ok' | 'offline-cache' | 'empty' | 'error';
  message?: string;
}

function mapDocToVerse(dateKey: string, data: Record<string, unknown>): DailyVerse {
  const translations = (data.translations || {}) as Record<string, string>;
  return {
    date: String(data.date || dateKey),
    reference: String(data.reference || ''),
    book: String(data.book || ''),
    chapter: Number(data.chapter || 1),
    verse: String(data.verse || '1'),
    translations: {
      lsg1910: String(translations.lsg1910 || ''),
      pdv: String(translations.pdv || ''),
      fc: String(translations.fc || ''),
      kjf: String(translations.kjf || ''),
    },
    source: 'firestore',
  };
}

/**
 * Récupère le verset quotidien depuis Firestore (`daily_verses/{dateKey}`).
 * Si la connexion est indisponible, sert le dernier verset mis en cache local.
 * Si le document n'est pas encore publié dans Firestore, utilise le calendrier canonique vérifié
 * (sauf si `strictFirestoreOnly` est activé).
 */
export async function fetchDailyVerse(
  dateKey: string,
  options: { isOnline?: boolean; strictFirestoreOnly?: boolean } = {}
): Promise<VerseFetchResult> {
  const { isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true, strictFirestoreOnly = false } =
    options;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return {
      verse: null,
      status: 'empty',
      message: 'Format de date invalide. Sélectionnez une date valide.',
    };
  }

  if (!isOnline) {
    const cached = loadCachedVerse();
    if (cached && cached.date === dateKey) {
      return {
        verse: cached,
        status: 'offline-cache',
        message: 'Mode hors connexion — dernier verset consulté affiché depuis le cache local.',
      };
    }
    const scheduled = !strictFirestoreOnly ? getScheduledVerseForDate(dateKey) : null;
    if (scheduled) {
      return {
        verse: scheduled,
        status: 'offline-cache',
        message: 'Mode hors connexion — lecture disponible grâce au stockage local.',
      };
    }
    if (cached) {
      return {
        verse: cached,
        status: 'offline-cache',
        message: 'Mode hors connexion — dernier verset consulté affiché depuis le cache local.',
      };
    }
    return {
      verse: null,
      status: 'error',
      message: 'Connexion Internet indisponible et aucun verset en cache local.',
    };
  }

  const docPath = `daily_verses/${dateKey}`;
  try {
    const snap = await getDoc(doc(db, 'daily_verses', dateKey));
    if (snap.exists()) {
      const verse = mapDocToVerse(dateKey, snap.data() as Record<string, unknown>);
      saveCachedVerse(verse);
      return { verse, status: 'ok' };
    }

    if (!strictFirestoreOnly) {
      const scheduled = getScheduledVerseForDate(dateKey);
      if (scheduled) {
        saveCachedVerse(scheduled);
        return { verse: scheduled, status: 'ok' };
      }
    }

    return {
      verse: null,
      status: 'empty',
      message: 'Aucun verset n’est encore programmé pour cette date.',
    };
  } catch (error) {
    if (isOfflineFirestoreError(error)) {
      const cached = loadCachedVerse();
      const fallback = cached || getScheduledVerseForDate(dateKey);
      if (fallback) {
        return {
          verse: fallback,
          status: 'offline-cache',
          message: 'Connexion instable — affichage du verset depuis le cache local.',
        };
      }
      return {
        verse: null,
        status: 'error',
        message: 'Impossible de joindre le serveur pour le moment.',
      };
    }

    const msg = error instanceof Error ? error.message.toLowerCase() : '';
    if (msg.includes('permission') || msg.includes('insufficient')) {
      handleFirestoreError(error, OperationType.GET, docPath);
    }

    const scheduled = getScheduledVerseForDate(dateKey);
    if (scheduled) {
      saveCachedVerse(scheduled);
      return {
        verse: scheduled,
        status: 'offline-cache',
        message: 'Serveur temporairement indisponible — lecture locale assurée.',
      };
    }

    return {
      verse: null,
      status: 'error',
      message: 'Une erreur est survenue lors du chargement du verset.',
    };
  }
}

/**
 * Enregistre ou met à jour un verset quotidien dans Firestore (réservé à l'administrateur).
 */
export async function saveDailyVerseToFirestore(verse: Omit<DailyVerse, 'source' | 'createdAt'>): Promise<void> {
  const path = `daily_verses/${verse.date}`;
  try {
    const ref = doc(db, 'daily_verses', verse.date);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      await updateDoc(ref, {
        reference: verse.reference.trim(),
        book: verse.book.trim(),
        chapter: verse.chapter,
        verse: verse.verse.trim(),
        translations: verse.translations,
      });
    } else {
      await setDoc(ref, {
        date: verse.date,
        reference: verse.reference.trim(),
        book: verse.book.trim(),
        chapter: verse.chapter,
        verse: verse.verse.trim(),
        translations: verse.translations,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Programme automatiquement les N prochains jours dans Firestore à partir du corpus canonique vérifié
 * (réservé à l'administrateur authentifié).
 */
export async function seedUpcomingScheduleToFirestore(startDateKey: string, days = 14): Promise<number> {
  let count = 0;
  for (let i = 0; i < days; i += 1) {
    const dateKey = addDaysToDateKey(startDateKey, i);
    const scheduled = getScheduledVerseForDate(dateKey);
    if (!scheduled) continue;
    const ref = doc(db, 'daily_verses', dateKey);
    const path = `daily_verses/${dateKey}`;
    try {
      const existing = await getDoc(ref);
      if (!existing.exists()) {
        await setDoc(ref, {
          date: dateKey,
          reference: scheduled.reference,
          book: scheduled.book,
          chapter: scheduled.chapter,
          verse: scheduled.verse,
          translations: scheduled.translations,
          createdAt: serverTimestamp(),
        });
        count += 1;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
  return count;
}

export async function listScheduledVersesFromFirestore(maxCount = 14): Promise<DailyVerse[]> {
  const path = 'daily_verses';
  try {
    const q = query(collection(db, 'daily_verses'), orderBy('date', 'desc'), limit(maxCount));
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapDocToVerse(d.id, d.data() as Record<string, unknown>));
  } catch (error) {
    if (isOfflineFirestoreError(error)) {
      return [];
    }
    const msg = error instanceof Error ? error.message.toLowerCase() : '';
    if (msg.includes('permission') || msg.includes('insufficient')) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
    return [];
  }
}

export function getCanonicalCorpusCount(): number {
  return CANONICAL_VERSES.length;
}
