import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { BrandLogo } from '@/src/components/BrandLogo';
import { useApp } from '@/src/context/AppContext';
import { usePWAInstall } from '@/src/hooks/usePWAInstall';

export const Footer: React.FC = () => {
  const { navigate } = useApp();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  return (
    <footer className="bg-[#F5F7FA] border-t border-[#DCE7F3] mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 pb-10 border-b border-[#DCE7F3]">
          <div className="max-w-md space-y-3">
            <BrandLogo />
            <p className="text-sm font-medium text-[#1769AA]">
              « Un verset chaque jour pour nourrir sa foi. »
            </p>
            <p className="text-sm text-[#4A637D] leading-relaxed">
              Plateforme Web gratuite de méditation biblique quotidienne, accessible sur ordinateur, tablette et téléphone sans inscription obligatoire.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
            <div className="space-y-2.5">
              <p className="font-semibold text-[#0F2942]">Navigation</p>
              <ul className="space-y-2 text-[#4A637D]">
                <li>
                  <a
                    href="/"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/');
                    }}
                    className="hover:text-[#1769AA] transition-colors"
                  >
                    Accueil
                  </a>
                </li>
                <li>
                  <a
                    href="/verset-du-jour"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/verset-du-jour');
                    }}
                    className="hover:text-[#1769AA] transition-colors"
                  >
                    Verset du jour
                  </a>
                </li>
                <li>
                  <a
                    href="/versions-bibliques"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/versions-bibliques');
                    }}
                    className="hover:text-[#1769AA] transition-colors"
                  >
                    Versions bibliques
                  </a>
                </li>
                <li>
                  <a
                    href="/favoris"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/favoris');
                    }}
                    className="hover:text-[#1769AA] transition-colors"
                  >
                    Mes favoris
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <p className="font-semibold text-[#0F2942]">Préférences</p>
              <ul className="space-y-2 text-[#4A637D]">
                <li>
                  <a
                    href="/parametres"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/parametres');
                    }}
                    className="hover:text-[#1769AA] transition-colors"
                  >
                    Notifications & Paramètres
                  </a>
                </li>
                <li>
                  <a
                    href="/a-propos"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/a-propos');
                    }}
                    className="hover:text-[#1769AA] transition-colors"
                  >
                    À propos & Droits
                  </a>
                </li>
              </ul>
            </div>

            {!isInstalled && (isInstallable || isIOS) && (
              <div className="space-y-2.5 col-span-2 sm:col-span-1">
                <p className="font-semibold text-[#0F2942]">Accès rapide</p>
                {isInstallable ? (
                  <button
                    type="button"
                    onClick={() => void install()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1769AA] text-white text-xs font-medium hover:bg-[#2876C8] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Installer l’application Web
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowIOSGuide(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1769AA] text-[#1769AA] bg-white text-xs font-medium hover:bg-[#EAF3FC] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Ajouter à l’écran d’accueil
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#4A637D]">
          <p>
            © {new Date().getFullYear()} MÉDITATION CPC · Tous droits réservés sur la plateforme.
          </p>
          <p>
            Textes bibliques : Louis Segond 1910 (domaine public), Parole de Vie, Français courant, King James française.
          </p>
        </div>
      </div>

      {showIOSGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F2942]/40 p-4"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg border border-[#DCE7F3]">
            <h3 id="ios-install-title" className="text-lg font-semibold text-[#0F2942]">
              Installer sur iPhone / iPad
            </h3>
            <p className="mt-2 text-sm text-[#4A637D] leading-relaxed">
              1. Appuyez sur le bouton <strong>Partager</strong> dans la barre Safari.<br />
              2. Faites défiler et sélectionnez <strong>Sur l’écran d’accueil</strong> afin de recevoir les rappels quotidiens.
            </p>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-lg bg-[#1769AA] py-2.5 text-sm font-medium text-white hover:bg-[#2876C8] transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </footer>
  );
};
