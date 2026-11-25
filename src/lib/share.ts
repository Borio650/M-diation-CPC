import { BIBLE_TRANSLATIONS } from '@/src/data/translations';
import { BibleVersionId, DailyVerse } from '@/src/types/bible';

export function formatVerseForShare(verse: DailyVerse, versionId: BibleVersionId): string {
  const versionName = BIBLE_TRANSLATIONS[versionId].name;
  const text = verse.translations[versionId] || verse.translations.lsg1910;

  return [
    'MÉDITATION CPC',
    '',
    text,
    verse.reference,
    `Version : ${versionName}`,
    '',
    'Un verset chaque jour pour nourrir sa foi.',
  ].join('\n');
}

export function getWhatsAppShareUrl(verse: DailyVerse, versionId: BibleVersionId): string {
  const message = formatVerseForShare(verse, versionId);
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export async function copyVerseToClipboard(verse: DailyVerse, versionId: BibleVersionId): Promise<boolean> {
  const text = formatVerseForShare(verse, versionId);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(textarea);
  return ok;
}

export async function shareVerseViaWebShare(verse: DailyVerse, versionId: BibleVersionId): Promise<'shared' | 'unsupported' | 'aborted'> {
  if (typeof navigator === 'undefined' || !navigator.share) {
    return 'unsupported';
  }

  const text = formatVerseForShare(verse, versionId);
  try {
    await navigator.share({
      title: `MÉDITATION CPC — ${verse.reference}`,
      text,
      url: window.location.origin + '/verset-du-jour',
    });
    return 'shared';
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return 'aborted';
    }
    return 'unsupported';
  }
}
