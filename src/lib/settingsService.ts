import {
  signInAnonymously,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/src/lib/firebase';
import {
  handleFirestoreError,
  isOfflineFirestoreError,
  OperationType,
} from '@/src/lib/firestoreError';
import { loadLocalPreferences, saveLocalPreferences } from '@/src/lib/storage';
import { UserSettings } from '@/src/types/bible';

export interface AuthEnsureResult {
  user: User | null;
  anonymousAuthBlocked: boolean;
}

/**
 * Tente d'assurer une session Firebase (anonyme si nécessaire) sans jamais bloquer la navigation.
 */
export async function ensureAnonymousSession(): Promise<AuthEnsureResult> {
  if (auth.currentUser) {
    return { user: auth.currentUser, anonymousAuthBlocked: false };
  }
  try {
    const cred = await signInAnonymously(auth);
    return { user: cred.user, anonymousAuthBlocked: false };
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code || '';
    const isBlocked =
      code === 'auth/operation-not-allowed' ||
      code === 'auth/admin-restricted-operation' ||
      code === 'auth/configuration-not-found';
    return { user: null, anonymousAuthBlocked: isBlocked };
  }
}

export async function loadUserSettingsFromFirestore(userId: string): Promise<Partial<UserSettings> | null> {
  const path = `users_settings/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users_settings', userId));
    if (!snap.exists()) return null;
    const data = snap.data() as Record<string, unknown>;
    return {
      userId,
      preferredVersion: data.preferredVersion as UserSettings['preferredVersion'],
      notificationEnabled: Boolean(data.notificationEnabled),
      notificationTime: String(data.notificationTime || '07:00'),
      timezone: String(data.timezone || 'Africa/Abidjan'),
    };
  } catch (error) {
    if (isOfflineFirestoreError(error)) return null;
    const msg = error instanceof Error ? error.message.toLowerCase() : '';
    if (msg.includes('permission') || msg.includes('insufficient')) {
      handleFirestoreError(error, OperationType.GET, path);
    }
    return null;
  }
}

export async function persistUserSettings(
  prefs: Pick<UserSettings, 'preferredVersion' | 'notificationEnabled' | 'notificationTime' | 'timezone'>,
  userId?: string | null
): Promise<{ syncedToFirestore: boolean; anonymousAuthBlocked: boolean }> {
  saveLocalPreferences(prefs);

  let uid = userId || auth.currentUser?.uid || null;
  let anonymousAuthBlocked = false;

  if (!uid) {
    const res = await ensureAnonymousSession();
    uid = res.user?.uid || null;
    anonymousAuthBlocked = res.anonymousAuthBlocked;
  }

  if (!uid) {
    return { syncedToFirestore: false, anonymousAuthBlocked };
  }

  const path = `users_settings/${uid}`;
  try {
    const ref = doc(db, 'users_settings', uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        preferredVersion: prefs.preferredVersion,
        notificationEnabled: prefs.notificationEnabled,
        notificationTime: prefs.notificationTime,
        timezone: prefs.timezone,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        userId: uid,
        preferredVersion: prefs.preferredVersion,
        notificationEnabled: prefs.notificationEnabled,
        notificationTime: prefs.notificationTime,
        timezone: prefs.timezone,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return { syncedToFirestore: true, anonymousAuthBlocked: false };
  } catch (error) {
    if (isOfflineFirestoreError(error)) {
      return { syncedToFirestore: false, anonymousAuthBlocked: false };
    }
    const msg = error instanceof Error ? error.message.toLowerCase() : '';
    if (msg.includes('permission') || msg.includes('insufficient')) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
    return { syncedToFirestore: false, anonymousAuthBlocked: false };
  }
}

export function getInitialLocalSettings(): Omit<UserSettings, 'userId'> {
  return loadLocalPreferences();
}
