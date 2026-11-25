export type BibleVersionId = 'lsg1910' | 'pdv' | 'fc' | 'kjf';

export interface BibleTranslationMeta {
  id: BibleVersionId;
  name: string;
  shortName: string;
  yearOrEdition: string;
  publisherOrOrigin: string;
  licenseStatus: string;
  licenseNote: string;
  description: string;
  isPublicDomain: boolean;
}

export interface DailyVerse {
  date: string; // YYYY-MM-DD
  reference: string;
  book: string;
  chapter: number;
  verse: string;
  translations: Record<BibleVersionId, string>;
  createdAt?: string;
  source?: 'firestore' | 'schedule' | 'cache';
}

export interface UserSettings {
  userId: string;
  preferredVersion: BibleVersionId;
  notificationEnabled: boolean;
  notificationTime: string; // HH:mm
  timezone: string; // IANA timezone, default Africa/Abidjan
  createdAt?: string;
  updatedAt?: string;
}

export interface PushSubscriptionRecord {
  userId: string;
  fcmToken: string;
  platform: string;
  timezone: string;
  notificationTime: string;
  preferredVersion: BibleVersionId;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FavoriteVerse {
  reference: string;
  date: string;
  book: string;
  chapter: number;
  verse: string;
  translations: Record<BibleVersionId, string>;
  savedVersion: BibleVersionId;
  savedAt: string;
}

export type AppRoute =
  | '/'
  | '/verset-du-jour'
  | '/versions-bibliques'
  | '/favoris'
  | '/parametres'
  | '/a-propos';
