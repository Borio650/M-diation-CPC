import React, { useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CalendarX,
  Check,
  Copy,
  Heart,
  MessageCircle,
  RefreshCw,
  Share2,
  WifiOff,
} from 'lucide-react';
import { BIBLE_TRANSLATION_LIST, BIBLE_TRANSLATIONS } from '@/src/data/translations';
import { useApp } from '@/src/context/AppContext';
import {
  copyVerseToClipboard,
  getWhatsAppShareUrl,
  shareVerseViaWebShare,
} from '@/src/lib/share';
import { formatFrenchDate } from '@/src/lib/timezone';
import { BibleVersionId } from '@/src/types/bible';

interface DailyVerseCardProps {
  compact?: boolean;
  onResetToday?: () => void;
}

export const DailyVerseCard: React.FC<DailyVerseCardProps> = ({
  compact = false,
  onResetToday,
}) => {
  const {
    verse,
    verseLoading,
    verseStatus,
    verseMessage,
    reloadVerse,
    preferredVersion,
    setPreferredVersion,
    showToast,
    isOnline,
    selectedDateKey,
    todayDateKey,
    setSelectedDateKey,
    isVerseFavorite,
    toggleFavoriteVerse,
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const isFavorite = verse ? isVerseFavorite(verse.reference) : false;

  const activeTranslation = BIBLE_TRANSLATIONS[preferredVersion];
  const verseText = verse ? verse.translations[preferredVersion] || verse.translations.lsg1910 : '';

  const handleCopy = async () => {
    if (!verse) return;
    try {
      await copyVerseToClipboard(verse, preferredVersion);
      setCopied(true);
      showToast('Verset copié dans le presse-papiers.', 'success');
      window.setTimeout(() => setCopied(false), 2600);
    } catch {
      showToast('Impossible de copier automatiquement. Sélectionnez le texte manuellement.', 'error');
    }
  };

  const handleWebShare = async () => {
    if (!verse) return;
    const outcome = await shareVerseViaWebShare(verse, preferredVersion);
    if (outcome === 'shared') {
      showToast('Verset partagé avec succès.', 'success');
      setShareOpen(false);
    } else if (outcome === 'unsupported') {
      setShareOpen((prev) => !prev);
    }
  };

  const handleWhatsAppShare = () => {
    if (!verse) return;
    const url = getWhatsAppShareUrl(verse, preferredVersion);
    window.open(url, '_blank', 'noopener,noreferrer');
    showToast('Ouverture de WhatsApp avec le verset prêt à envoyer.', 'success');
    setShareOpen(false);
  };

  return (
    <section
      aria-label="Carte du verset biblique du jour"
      className="bg-white border border-[#D4E3F2] rounded-xl shadow-[0_6px_28px_rgba(23,105,170,0.06)] overflow-hidden"
    >
      {/* En-tête de la carte */}
      <div className="bg-[#EAF3FC]/65 border-b border-[#DCE7F3] px-6 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1769AA] text-white text-xs font-semibold tracking-wider uppercase whitespace-nowrap">
            <BookOpen className="w-3.5 h-3.5" />
            VERSET DU JOUR
          </span>
          <span className="text-sm font-medium text-[#0F2942]">
            {formatFrenchDate(selectedDateKey)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#4A637D]">
          {!isOnline || verseStatus === 'offline-cache' ? (
            <span className="inline-flex items-center gap-1.5 text-[#1769AA] font-medium">
              <WifiOff className="w-3.5 h-3.5" />
              Cache hors connexion
            </span>
          ) : (
            <span>{activeTranslation.name}</span>
          )}
        </div>
      </div>

      {/* Corps principal */}
      <div className={compact ? 'p-6 sm:p-8' : 'p-6 sm:p-10'}>
        {/* Sélecteur de traduction */}
        <div className="mb-7">
          <p className="text-xs font-medium text-[#4A637D] mb-2.5">
            Choisir la traduction biblique :
          </p>
          <div
            role="tablist"
            aria-label="Versions bibliques disponibles"
            className="inline-flex flex-wrap gap-1.5 p-1 bg-[#F5F7FA] border border-[#E2EAF3] rounded-lg"
          >
            {BIBLE_TRANSLATION_LIST.map((version) => {
              const active = preferredVersion === version.id;
              return (
                <button
                  key={version.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => void setPreferredVersion(version.id as BibleVersionId)}
                  className={`px-3 py-2 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer min-h-[40px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA] ${
                    active
                      ? 'bg-[#1769AA] text-white shadow-xs'
                      : 'text-[#0F2942] hover:bg-white hover:text-[#1769AA]'
                  }`}
                >
                  {version.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* États : chargement, erreur, absence de verset, ou contenu du verset */}
        {verseLoading ? (
          <div className="py-10 space-y-4" aria-live="polite" aria-busy="true">
            <div className="h-6 bg-[#EAF3FC] rounded w-3/4 animate-pulse" />
            <div className="h-6 bg-[#EAF3FC] rounded w-full animate-pulse" />
            <div className="h-6 bg-[#EAF3FC] rounded w-5/6 animate-pulse" />
            <p className="text-sm text-[#4A637D] pt-2">
              Chargement du verset biblique du jour...
            </p>
          </div>
        ) : verseStatus === 'error' && !verse ? (
          <div className="py-8 text-center space-y-4">
            <AlertCircle className="w-8 h-8 text-[#1769AA] mx-auto" />
            <div className="space-y-1">
              <p className="text-base font-semibold text-[#0F2942]">
                Impossible d’afficher le verset pour le moment
              </p>
              <p className="text-sm text-[#4A637D] max-w-md mx-auto">
                {verseMessage || 'Vérifiez votre connexion Internet et réessayez.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void reloadVerse()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1769AA] text-white text-sm font-medium hover:bg-[#2876C8] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </button>
          </div>
        ) : !verse ? (
          <div className="py-8 text-center space-y-4">
            <CalendarX className="w-8 h-8 text-[#1769AA] mx-auto" />
            <div className="space-y-1">
              <p className="text-base font-semibold text-[#0F2942]">
                Aucun verset disponible pour cette date
              </p>
              <p className="text-sm text-[#4A637D] max-w-md mx-auto">
                {verseMessage || 'Aucun passage biblique n’est encore enregistré pour le jour sélectionné.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onResetToday) onResetToday();
                else setSelectedDateKey(todayDateKey);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1769AA] text-white text-sm font-medium hover:bg-[#2876C8] transition-colors cursor-pointer"
            >
              Revenir au verset d’aujourd’hui
            </button>
          </div>
        ) : (
          <div>
            {verseMessage && (
              <div className="mb-5 px-4 py-2.5 rounded-lg bg-[#EAF3FC] border border-[#C6DDF4] text-xs sm:text-sm text-[#1769AA] flex items-center gap-2">
                <WifiOff className="w-4 h-4 shrink-0" />
                <span>{verseMessage}</span>
              </div>
            )}

            <blockquote className="space-y-5">
              <p className="font-serif text-xl sm:text-2xl lg:text-[26px] leading-[1.6] text-[#0F2942]">
                « {verseText} »
              </p>
              <footer className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm sm:text-base">
                <cite className="not-italic font-semibold text-[#1769AA]">
                  {verse.reference}
                </cite>
                <span aria-hidden="true" className="text-[#94AFC8]">·</span>
                <span className="text-[#4A637D]">
                  Version : {activeTranslation.name}
                </span>
              </footer>
            </blockquote>

            {/* Boutons d'action */}
            <div className="mt-8 pt-6 border-t border-[#E6EEF6] flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShareOpen((prev) => !prev)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#1769AA] text-white text-sm font-semibold hover:bg-[#2876C8] transition-colors cursor-pointer whitespace-nowrap min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA]"
              >
                <Share2 className="w-4 h-4 shrink-0" />
                PARTAGER LE VERSET
              </button>

              <button
                type="button"
                onClick={() => void handleCopy()}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-[#1769AA] bg-white text-[#1769AA] text-sm font-semibold hover:bg-[#EAF3FC] transition-colors cursor-pointer whitespace-nowrap min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA]"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 shrink-0" />
                    VERSET COPIÉ
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 shrink-0" />
                    COPIER LE VERSET
                  </>
                )}
              </button>

              <button
                type="button"
                aria-pressed={isFavorite}
                onClick={() => toggleFavoriteVerse(verse)}
                className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA] ${
                  isFavorite
                    ? 'border-[#1769AA] bg-[#EAF3FC] text-[#1769AA]'
                    : 'border-[#C6DDF4] bg-white text-[#0F2942] hover:border-[#1769AA] hover:text-[#1769AA]'
                }`}
              >
                <Heart className={`w-4 h-4 shrink-0 ${isFavorite ? 'fill-[#1769AA] text-[#1769AA]' : ''}`} />
                {isFavorite ? 'ENREGISTRÉ EN FAVORI' : 'AJOUTER AUX FAVORIS'}
              </button>
            </div>

            {/* Panneau de partage (WhatsApp + API Web Share) */}
            {shareOpen && (
              <div className="mt-4 p-4 rounded-lg bg-[#F5F7FA] border border-[#DCE7F3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs sm:text-sm text-[#4A637D]">
                  Partagez ce verset avec vos proches au format officiel MÉDITATION CPC :
                </p>
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleWhatsAppShare}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1769AA] text-white text-xs sm:text-sm font-medium hover:bg-[#2876C8] transition-colors cursor-pointer whitespace-nowrap min-h-[40px]"
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" />
                    Partager sur WhatsApp
                  </button>

                  {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                    <button
                      type="button"
                      onClick={() => void handleWebShare()}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#C6DDF4] bg-white text-[#0F2942] text-xs sm:text-sm font-medium hover:bg-[#EAF3FC] transition-colors cursor-pointer whitespace-nowrap min-h-[40px]"
                    >
                      <Share2 className="w-4 h-4 shrink-0 text-[#1769AA]" />
                      Autres applications
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
