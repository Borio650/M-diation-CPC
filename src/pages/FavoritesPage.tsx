import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  Heart,
  MessageCircle,
  Search,
  Trash2,
} from 'lucide-react';
import { BIBLE_TRANSLATION_LIST, BIBLE_TRANSLATIONS } from '@/src/data/translations';
import { useApp } from '@/src/context/AppContext';
import { copyVerseToClipboard, getWhatsAppShareUrl } from '@/src/lib/share';
import { formatFrenchDate } from '@/src/lib/timezone';
import { BibleVersionId, FavoriteVerse } from '@/src/types/bible';

export const FavoritesPage: React.FC = () => {
  const {
    favorites,
    removeFavoriteVerse,
    preferredVersion,
    setPreferredVersion,
    navigate,
    showToast,
  } = useApp();

  const [query, setQuery] = useState('');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  const filteredFavorites = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return favorites;
    return favorites.filter((fav) => {
      const text = (fav.translations[preferredVersion] || fav.translations.lsg1910).toLowerCase();
      return (
        fav.reference.toLowerCase().includes(q) ||
        fav.book.toLowerCase().includes(q) ||
        text.includes(q)
      );
    });
  }, [favorites, query, preferredVersion]);

  const handleCopy = async (fav: FavoriteVerse) => {
    try {
      await copyVerseToClipboard(fav, preferredVersion);
      setCopiedRef(fav.reference);
      showToast('Verset favori copié dans le presse-papiers.', 'success');
      window.setTimeout(() => setCopiedRef(null), 2400);
    } catch {
      showToast('Impossible de copier ce verset automatiquement.', 'error');
    }
  };

  const handleWhatsApp = (fav: FavoriteVerse) => {
    const url = getWhatsAppShareUrl(fav, preferredVersion);
    window.open(url, '_blank', 'noopener,noreferrer');
    showToast('Ouverture de WhatsApp avec votre verset favori.', 'success');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#DCE7F3]">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#1769AA]">
            Bibliothèque personnelle
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#0F2942]">
            Mes versets favoris
          </h1>
          <p className="text-sm sm:text-base text-[#4A637D] leading-relaxed">
            Retrouvez ici les passages bibliques que vous avez sauvegardés sur cet appareil. Vos favoris restent disponibles même hors connexion.
          </p>
        </div>

        <div className="text-sm text-[#4A637D] shrink-0">
          <span className="font-semibold text-[#1769AA] tabular-nums">{favorites.length}</span>{' '}
          {favorites.length <= 1 ? 'verset enregistré' : 'versets enregistrés'}
        </div>
      </div>

      {/* Contrôles de recherche et traduction */}
      {favorites.length > 0 && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <label className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#4A637D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par référence, livre ou mot-clé..."
              aria-label="Rechercher dans vos versets favoris"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#C6DDF4] bg-[#F5F7FA] text-sm text-[#0F2942] placeholder:text-[#6B8299] focus:bg-white focus:border-[#1769AA] focus:outline-none min-h-[44px]"
            />
          </label>

          <div
            role="tablist"
            aria-label="Traduction d’affichage des favoris"
            className="inline-flex flex-wrap gap-1 p-1 bg-[#F5F7FA] border border-[#E2EAF3] rounded-lg"
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
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer min-h-[36px] ${
                    active
                      ? 'bg-[#1769AA] text-white'
                      : 'text-[#0F2942] hover:bg-white hover:text-[#1769AA]'
                  }`}
                >
                  {version.shortName}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Liste des favoris ou état vide */}
      {favorites.length === 0 ? (
        <section className="bg-[#F5F7FA] border border-[#DCE7F3] rounded-xl p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#EAF3FC] text-[#1769AA] flex items-center justify-center mx-auto">
            <Heart className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-xl font-semibold text-[#0F2942]">
              Aucun verset favori pour le moment
            </h2>
            <p className="text-sm text-[#4A637D] leading-relaxed">
              Lorsque vous lisez le verset du jour, cliquez sur « Favori » pour le conserver précieusement dans votre espace personnel.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/verset-du-jour')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#1769AA] text-white text-sm font-semibold hover:bg-[#2876C8] transition-colors cursor-pointer whitespace-nowrap min-h-[44px]"
            >
              <BookOpen className="w-4 h-4" />
              Découvrir le verset du jour
            </button>
          </div>
        </section>
      ) : filteredFavorites.length === 0 ? (
        <section className="bg-white border border-[#DCE7F3] rounded-xl p-8 text-center space-y-3">
          <p className="text-base font-semibold text-[#0F2942]">
            Aucun favori ne correspond à « {query} »
          </p>
          <button
            type="button"
            onClick={() => setQuery('')}
            className="text-sm font-semibold text-[#1769AA] hover:underline cursor-pointer"
          >
            Réinitialiser la recherche
          </button>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredFavorites.map((fav) => {
            const text = fav.translations[preferredVersion] || fav.translations.lsg1910;
            const isCopied = copiedRef === fav.reference;
            const versionLabel = BIBLE_TRANSLATIONS[preferredVersion].name;

            return (
              <article
                key={fav.reference}
                className="bg-white border border-[#D4E3F2] rounded-xl p-6 sm:p-8 shadow-[0_4px_18px_rgba(23,105,170,0.04)] space-y-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#4A637D]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[#1769AA] text-sm">
                      {fav.reference}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{versionLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatFrenchDate(fav.date)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFavoriteVerse(fav.reference)}
                    aria-label={`Retirer ${fav.reference} des favoris`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#4A637D] hover:text-[#0F2942] hover:bg-[#F5F7FA] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Retirer</span>
                  </button>
                </div>

                <blockquote className="font-serif text-lg sm:text-xl text-[#0F2942] leading-relaxed">
                  « {text} »
                </blockquote>

                <div className="pt-4 border-t border-[#E6EEF6] flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleWhatsApp(fav)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1769AA] text-white text-xs sm:text-sm font-medium hover:bg-[#2876C8] transition-colors cursor-pointer whitespace-nowrap min-h-[40px]"
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" />
                    Partager sur WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleCopy(fav)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1769AA] bg-white text-[#1769AA] text-xs sm:text-sm font-medium hover:bg-[#EAF3FC] transition-colors cursor-pointer whitespace-nowrap min-h-[40px]"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-4 h-4 shrink-0" />
                        Copié
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 shrink-0" />
                        Copier
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
