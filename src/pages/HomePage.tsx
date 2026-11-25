import React, { useState } from 'react';
import { ArrowRight, Bell, BookOpen, Heart, Share2 } from 'lucide-react';
import { DailyVerseCard } from '@/src/components/DailyVerseCard';
import { NotificationBanner } from '@/src/components/NotificationBanner';
import { BIBLE_TRANSLATIONS } from '@/src/data/translations';
import { useApp } from '@/src/context/AppContext';

export const HomePage: React.FC = () => {
  const { navigate, favorites, preferredVersion } = useApp();
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  return (
    <div className="space-y-16 pb-4">
      {/* Section principale Hero */}
      <section className="bg-gradient-to-b from-[#EAF3FC]/70 via-[#F5F7FA]/60 to-white border-b border-[#DCE7F3]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
              <p className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-[#1769AA]">
                MÉDITATION CPC · Un verset chaque jour pour nourrir sa foi
              </p>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#0F2942] leading-[1.15] text-balance">
                Bienvenue sur MÉDITATION CPC
              </h1>

              <div className="space-y-3 max-w-xl">
                <p className="text-lg sm:text-xl font-medium text-[#1769AA]">
                  La Parole de Dieu pour accompagner votre journée.
                </p>
                <p className="text-base text-[#35516E] leading-relaxed">
                  Découvrez chaque jour un nouveau verset biblique et gardez la Parole de Dieu au cœur de votre quotidien.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/verset-du-jour')}
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-lg bg-[#1769AA] text-white text-sm sm:text-base font-semibold hover:bg-[#2876C8] transition-colors cursor-pointer whitespace-nowrap min-h-[44px] shadow-[0_6px_18px_rgba(23,105,170,0.18)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA]"
                >
                  <span>Découvrir le verset du jour</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/versions-bibliques')}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg border border-[#C6DDF4] bg-white text-[#1769AA] text-sm font-medium hover:bg-[#EAF3FC] transition-colors cursor-pointer whitespace-nowrap min-h-[44px]"
                >
                  Comparer les traductions
                </button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="h-full min-h-[260px] lg:min-h-[340px] rounded-xl overflow-hidden border border-[#D4E3F2] bg-[#EAF3FC] shadow-sm relative">
                {!heroImgFailed ? (
                  <img
                    src="/src/assets/images/hero_bible_morning_1795618320441.jpg"
                    alt="Bible ouverte baignée de lumière matinale sur une table claire"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full h-full object-cover lg:h-full"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[#EAF3FC] to-white">
                    <BookOpen className="w-12 h-12 text-[#1769AA] mb-3" />
                    <p className="font-serif text-lg text-[#0F2942]">MÉDITATION CPC</p>
                    <p className="text-sm text-[#4A637D] mt-1">
                      Un verset chaque jour pour nourrir sa foi.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grande carte Verset du jour */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <DailyVerseCard />
      </div>

      {/* Section visible Notifications quotidiennes */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <NotificationBanner />
      </div>

      {/* Section dédiée Mes versets favoris */}
      <section
        aria-labelledby="home-favorites-heading"
        className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="bg-white border border-[#DCE7F3] rounded-xl p-6 sm:p-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#1769AA]">
                <Heart className="w-4 h-4" />
                <span>Favoris enregistrés</span>
              </div>
              <h2
                id="home-favorites-heading"
                className="text-xl sm:text-2xl font-semibold text-[#0F2942]"
              >
                Mes versets favoris
              </h2>
            </div>

            <button
              type="button"
              onClick={() => navigate('/favoris')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#EAF3FC] text-[#1769AA] text-sm font-semibold hover:bg-[#D9EBFA] transition-colors cursor-pointer whitespace-nowrap min-h-[40px]"
            >
              <span>
                {favorites.length > 0
                  ? `Voir tous mes favoris (${favorites.length})`
                  : 'Ouvrir mes favoris'}
              </span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>

          {favorites.length === 0 ? (
            <p className="text-sm text-[#4A637D] leading-relaxed">
              Vous n’avez pas encore sauvegardé de verset. Appuyez sur « Ajouter aux favoris » sur la carte du verset du jour pour constituer votre recueil personnel, conservé localement sur cet appareil.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {favorites.slice(0, 2).map((fav) => (
                <div
                  key={fav.reference}
                  className="p-4 rounded-lg bg-[#F5F7FA] border border-[#DCE7F3] space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-[#4A637D]">
                    <span className="font-semibold text-[#1769AA]">{fav.reference}</span>
                    <span>{BIBLE_TRANSLATIONS[preferredVersion].shortName}</span>
                  </div>
                  <p className="font-serif text-sm sm:text-base text-[#0F2942] line-clamp-3 leading-relaxed">
                    « {fav.translations[preferredVersion] || fav.translations.lsg1910} »
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Piliers de la plateforme */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-[#DCE7F3]">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#1769AA]">
              <BookOpen className="w-4 h-4 shrink-0" />
              <h3 className="font-sans text-base font-semibold text-[#0F2942]">
                Quatre traductions fidèles
              </h3>
            </div>
            <p className="text-sm text-[#4A637D] leading-relaxed">
              Passez instantanément de la Louis Segond 1910 à Parole de Vie, Français courant ou King James française sans quitter la page.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#1769AA]">
              <Share2 className="w-4 h-4 shrink-0" />
              <h3 className="font-sans text-base font-semibold text-[#0F2942]">
                Partage direct sur WhatsApp
              </h3>
            </div>
            <p className="text-sm text-[#4A637D] leading-relaxed">
              Transmettez le verset du jour à vos proches ou groupes de prière en un clic avec sa référence exacte et sa version.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#1769AA]">
              <Bell className="w-4 h-4 shrink-0" />
              <h3 className="font-sans text-base font-semibold text-[#0F2942]">
                Rappel Web à votre heure
              </h3>
            </div>
            <p className="text-sm text-[#4A637D] leading-relaxed">
              Recevez une notification quotidienne à 07 h 00 (Africa/Abidjan) ou personnalisez l’heure et le fuseau horaire dans vos paramètres.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
