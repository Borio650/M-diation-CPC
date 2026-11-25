import React from 'react';
import { BookOpen, Check, ShieldCheck } from 'lucide-react';
import { BIBLE_TRANSLATION_LIST } from '@/src/data/translations';
import { useApp } from '@/src/context/AppContext';
import { BibleVersionId } from '@/src/types/bible';

export const VersionsPage: React.FC = () => {
  const { preferredVersion, setPreferredVersion, verse, navigate } = useApp();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      <div className="max-w-2xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#1769AA]">
          Traductions bibliques
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-[#0F2942]">
          Versions bibliques disponibles
        </h1>
        <p className="text-base text-[#4A637D] leading-relaxed">
          Sélectionnez votre traduction préférée. Votre choix est immédiatement appliqué à l’affichage du verset du jour ainsi qu’à vos prochaines notifications.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {BIBLE_TRANSLATION_LIST.map((version) => {
          const isSelected = preferredVersion === version.id;
          const previewText = verse?.translations[version.id];

          return (
            <article
              key={version.id}
              className={`rounded-xl border p-6 sm:p-7 flex flex-col justify-between transition-colors ${
                isSelected
                  ? 'bg-[#EAF3FC]/55 border-[#1769AA] shadow-[0_6px_22px_rgba(23,105,170,0.08)]'
                  : 'bg-white border-[#DCE7F3] hover:border-[#9EC3E6]'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-[#0F2942]">
                      {version.name}
                    </h2>
                    <p className="text-xs text-[#4A637D] mt-0.5">
                      {version.yearOrEdition} · {version.publisherOrOrigin}
                    </p>
                  </div>
                  {isSelected && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1769AA] text-white text-xs font-semibold whitespace-nowrap shrink-0">
                      <Check className="w-3.5 h-3.5" />
                      Active
                    </span>
                  )}
                </div>

                <p className="text-sm text-[#35516E] leading-relaxed">
                  {version.description}
                </p>

                {previewText && (
                  <div className="p-4 rounded-lg bg-[#F5F7FA] border border-[#E2EAF3] space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1769AA]">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Aperçu sur {verse?.reference}</span>
                    </div>
                    <p className="font-serif text-sm sm:text-base text-[#0F2942] leading-relaxed">
                      « {previewText} »
                    </p>
                  </div>
                )}

                <div className="pt-2 flex items-start gap-2 text-xs text-[#4A637D]">
                  <ShieldCheck className="w-4 h-4 text-[#1769AA] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#0F2942]">{version.licenseStatus} : </span>
                    <span>{version.licenseNote}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-[#E6EEF6] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => void setPreferredVersion(version.id as BibleVersionId)}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap min-h-[40px] ${
                    isSelected
                      ? 'bg-[#1769AA] text-white'
                      : 'bg-[#EAF3FC] text-[#1769AA] hover:bg-[#1769AA] hover:text-white'
                  }`}
                >
                  {isSelected ? 'Version sélectionnée' : 'Choisir cette version'}
                </button>

                {isSelected && (
                  <button
                    type="button"
                    onClick={() => navigate('/verset-du-jour')}
                    className="text-xs font-semibold text-[#1769AA] hover:underline cursor-pointer whitespace-nowrap"
                  >
                    Lire le verset du jour →
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
