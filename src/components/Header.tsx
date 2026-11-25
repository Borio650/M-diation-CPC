import React, { useState } from 'react';
import { Menu, Settings, X } from 'lucide-react';
import { BrandLogo } from '@/src/components/BrandLogo';
import { useApp } from '@/src/context/AppContext';
import { AppRoute } from '@/src/types/bible';

const NAV_ITEMS: { route: AppRoute; label: string }[] = [
  { route: '/', label: 'Accueil' },
  { route: '/verset-du-jour', label: 'Verset du jour' },
  { route: '/versions-bibliques', label: 'Versions bibliques' },
  { route: '/favoris', label: 'Favoris' },
  { route: '/a-propos', label: 'À propos' },
];

export const Header: React.FC = () => {
  const { route, navigate } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (target: AppRoute) => {
    navigate(target);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#DCE7F3]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Brand mark */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            handleNav('/');
          }}
          aria-label="MÉDITATION CPC — Retour à l’accueil"
          className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1769AA] rounded-md"
        >
          <BrandLogo />
        </a>

        {/* Zone 2: Horizontal navigation links (desktop) */}
        <nav aria-label="Navigation principale" className="hidden md:flex items-center gap-7">
          {NAV_ITEMS.map((item) => {
            const isActive = route === item.route;
            return (
              <a
                key={item.route}
                href={item.route}
                onClick={(e) => {
                  e.preventDefault();
                  handleNav(item.route);
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1769AA] ${
                  isActive
                    ? 'text-[#1769AA] border-[#1769AA]'
                    : 'text-[#4A637D] border-transparent hover:text-[#1769AA]'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Settings CTA + mobile toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleNav('/parametres')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer min-h-[40px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA] ${
              route === '/parametres'
                ? 'bg-[#1769AA] text-white'
                : 'bg-[#EAF3FC] text-[#1769AA] hover:bg-[#D9EBFA]'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Paramètres</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg text-[#0F2942] hover:bg-[#F5F7FA] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Navigation mobile"
          className="md:hidden bg-white border-t border-[#DCE7F3] px-4 py-3 space-y-1"
        >
          {[...NAV_ITEMS, { route: '/parametres' as AppRoute, label: 'Paramètres' }].map((item) => {
            const isActive = route === item.route;
            return (
              <a
                key={item.route}
                href={item.route}
                onClick={(e) => {
                  e.preventDefault();
                  handleNav(item.route);
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`block px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#EAF3FC] text-[#1769AA]'
                    : 'text-[#0F2942] hover:bg-[#F5F7FA]'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      )}
    </header>
  );
};
