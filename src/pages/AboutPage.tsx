import React, { useState } from 'react';
import { BookOpen, Clock, Lock, ShieldCheck } from 'lucide-react';
import { useApp } from '@/src/context/AppContext';

export const AboutPage: React.FC = () => {
  const { navigate } = useApp();
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-14">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        <div className="lg:col-span-7 space-y-5 flex flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#1769AA]">
            À propos de MÉDITATION CPC
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#0F2942] text-balance">
            Un verset chaque jour pour nourrir sa foi.
          </h1>
          <p className="text-base text-[#35516E] leading-relaxed">
            MÉDITATION CPC est une plateforme chrétienne francophone conçue pour offrir à chaque visiteur un rendez-vous simple, paisible et fidèle avec la Parole de Dieu, directement depuis n’importe quel navigateur Web sur ordinateur, tablette ou téléphone.
          </p>
          <p className="text-base text-[#4A637D] leading-relaxed">
            Accessible immédiatement sans création de compte obligatoire, l’application permet de méditer le verset du jour dans quatre traductions reconnues, de le partager sur WhatsApp avec ses proches et de recevoir un rappel quotidien à l’heure de son choix.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/verset-du-jour')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#1769AA] text-white text-sm font-semibold hover:bg-[#2876C8] transition-colors cursor-pointer"
            >
              Lire le verset du jour
            </button>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="h-full min-h-[260px] rounded-xl overflow-hidden border border-[#DCE7F3] bg-[#EAF3FC]">
            {!imgFailed ? (
              <img
                src="/src/assets/images/about_morning_study_1795618321131.jpg"
                alt="Espace de méditation calme et lumineux avec livre ouvert devant une fenêtre"
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover lg:h-full"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                <BookOpen className="w-10 h-10 text-[#1769AA] mb-2" />
                <p className="font-serif text-lg text-[#0F2942]">MÉDITATION CPC</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-[#DCE7F3]">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-[#1769AA]">
            <ShieldCheck className="w-5 h-5" />
            <h2 className="font-sans text-base font-semibold text-[#0F2942]">
              Fidélité aux Écritures
            </h2>
          </div>
          <p className="text-sm text-[#4A637D] leading-relaxed">
            Aucun verset ni référence n’est inventé ou généré par intelligence artificielle. Chaque passage publié provient exclusivement des textes bibliques authentiques et respecte les mentions légales de chaque traduction.
          </p>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-[#1769AA]">
            <Clock className="w-5 h-5" />
            <h2 className="font-sans text-base font-semibold text-[#0F2942]">
              Rythme quotidien unifié
            </h2>
          </div>
          <p className="text-sm text-[#4A637D] leading-relaxed">
            Un même verset principal accompagne l’ensemble des lecteurs durant toute la journée et se renouvelle automatiquement à minuit (fuseau horaire Africa/Abidjan par défaut).
          </p>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-[#1769AA]">
            <Lock className="w-5 h-5" />
            <h2 className="font-sans text-base font-semibold text-[#0F2942]">
              Respect de la vie privée
            </h2>
          </div>
          <p className="text-sm text-[#4A637D] leading-relaxed">
            La consultation est libre et anonyme. Les notifications Web Push nécessitent votre consentement explicite et peuvent être interrompues à tout moment d’un simple clic.
          </p>
        </div>
      </div>
    </div>
  );
};
