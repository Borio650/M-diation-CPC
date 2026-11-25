import { BibleTranslationMeta, BibleVersionId } from '@/src/types/bible';

export const DEFAULT_VERSION: BibleVersionId = 'lsg1910';

export const BIBLE_TRANSLATIONS: Record<BibleVersionId, BibleTranslationMeta> = {
  lsg1910: {
    id: 'lsg1910',
    name: 'Louis Segond 1910',
    shortName: 'LSG 1910',
    yearOrEdition: 'Édition 1910',
    publisherOrOrigin: 'Traduction du pasteur Louis Segond (révision 1910)',
    licenseStatus: 'Domaine public',
    licenseNote:
      'Le texte de la Bible Louis Segond 1910 appartient au domaine public et peut être lu, copié et partagé librement.',
    description:
      'Traduction française classique de référence, appréciée pour sa fidélité littéraire et sa solennité lors de la méditation et du culte.',
    isPublicDomain: true,
  },
  pdv: {
    id: 'pdv',
    name: 'Parole de Vie',
    shortName: 'PDV',
    yearOrEdition: 'Traduction 2000',
    publisherOrOrigin: 'Alliance Biblique Universelle / Société Biblique Française',
    licenseStatus: 'Droits réservés — courtes citations dévotionnelles',
    licenseNote:
      '© Alliance Biblique Universelle. Usage non commercial de courts extraits quotidiens avec mention de la source. Une autorisation écrite est requise pour toute reproduction étendue.',
    description:
      'Traduction en français fondamental, claire et directe, conçue pour être comprise immédiatement par tous les lecteurs francophones.',
    isPublicDomain: false,
  },
  fc: {
    id: 'fc',
    name: 'Français courant',
    shortName: 'BFC',
    yearOrEdition: 'Bible en français courant (1997)',
    publisherOrOrigin: 'Alliance Biblique Universelle',
    licenseStatus: 'Droits réservés — courtes citations dévotionnelles',
    licenseNote:
      '© Alliance Biblique Universelle. Usage non commercial limité à la lecture quotidienne et au partage ponctuel avec mention de la version.',
    description:
      'Traduction privilégiant le sens naturel de la phrase en français contemporain afin de rendre le message biblique limpide au quotidien.',
    isPublicDomain: false,
  },
  kjf: {
    id: 'kjf',
    name: 'King James française',
    shortName: 'KJF',
    yearOrEdition: 'Traduction française (révision contemporaine)',
    publisherOrOrigin: 'Traduction basée sur la King James Version (1611) / Textus Receptus',
    licenseStatus: 'Usage dévotionnel avec mention de la traduction',
    licenseNote:
      'Traduction française fidèle à la tradition du Textus Receptus. Usage libre dans un cadre non commercial avec mention de la version.',
    description:
      'Traduction littérale attachée au texte reçu et à la cadence majestueuse de la King James classique en langue française.',
    isPublicDomain: false,
  },
};

export const BIBLE_TRANSLATION_LIST: BibleTranslationMeta[] = [
  BIBLE_TRANSLATIONS.lsg1910,
  BIBLE_TRANSLATIONS.pdv,
  BIBLE_TRANSLATIONS.fc,
  BIBLE_TRANSLATIONS.kjf,
];
