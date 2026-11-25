import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, RotateCcw } from 'lucide-react';
import { DailyVerseCard } from '@/src/components/DailyVerseCard';
import { useApp } from '@/src/context/AppContext';
import { formatVerseForShare } from '@/src/lib/share';
import { addDaysToDateKey, formatFrenchDate } from '@/src/lib/timezone';

export const DailyVersePage: React.FC = () => {
  const {
    verse,
    preferredVersion,
    selectedDateKey,
    todayDateKey,
    setSelectedDateKey,
    timezone,
  } = useApp();

  const isToday = selectedDateKey === todayDateKey;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      {/* En-tête éditorial */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1769AA]">
              Méditation quotidienne
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold text-[#0F2942] mt-1">
              Verset du jour
            </h1>
          </div>

          {/* Navigation par date */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedDateKey(addDaysToDateKey(selectedDateKey, -1))}
              aria-label="Verset du jour précédent"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#D4E3F2] bg-white text-[#0F2942] hover:bg-[#EAF3FC] hover:text-[#1769AA] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <label className="relative inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#D4E3F2] bg-white text-sm text-[#0F2942]">
              <Calendar className="w-4 h-4 text-[#1769AA] shrink-0" />
              <input
                type="date"
                value={selectedDateKey}
                onChange={(e) => {
                  if (e.target.value) setSelectedDateKey(e.target.value);
                }}
                aria-label="Sélectionner une date"
                className="bg-transparent text-sm font-medium text-[#0F2942] focus:outline-none cursor-pointer tabular-nums"
              />
            </label>

            <button
              type="button"
              onClick={() => setSelectedDateKey(addDaysToDateKey(selectedDateKey, 1))}
              aria-label="Verset du jour suivant"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#D4E3F2] bg-white text-[#0F2942] hover:bg-[#EAF3FC] hover:text-[#1769AA] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isToday && (
              <button
                type="button"
                onClick={() => setSelectedDateKey(todayDateKey)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#EAF3FC] text-[#1769AA] text-xs font-semibold hover:bg-[#D9EBFA] transition-colors cursor-pointer whitespace-nowrap min-h-[40px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Aujourd’hui
              </button>
            )}
          </div>
        </div>

        <p className="text-sm text-[#4A637D] flex flex-wrap items-center gap-x-2 gap-y-1">
          <Clock className="w-4 h-4 text-[#1769AA]" />
          <span>
            Renouvellement automatique à minuit selon le fuseau <strong>{timezone}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>{formatFrenchDate(selectedDateKey)}</span>
        </p>
      </div>

      {/* Carte principale */}
      <DailyVerseCard onResetToday={() => setSelectedDateKey(todayDateKey)} />

      {/* Aperçu du format de partage officiel */}
      {verse && (
        <section className="bg-[#F5F7FA] border border-[#DCE7F3] rounded-xl p-6 sm:p-8 space-y-3">
          <h2 className="font-sans text-sm font-semibold uppercase tracking-wider text-[#1769AA]">
            Aperçu du message partagé
          </h2>
          <p className="text-xs sm:text-sm text-[#4A637D]">
            Voici le texte exact utilisé lors de la copie et du partage sur WhatsApp :
          </p>
          <pre className="mt-2 p-4 rounded-lg bg-white border border-[#DCE7F3] text-xs sm:text-sm text-[#0F2942] whitespace-pre-wrap font-sans leading-relaxed">
            {formatVerseForShare(verse, preferredVersion)}
          </pre>
        </section>
      )}
    </div>
  );
};
