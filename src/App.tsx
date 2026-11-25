/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WifiOff } from 'lucide-react';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';
import { Footer } from '@/src/components/Footer';
import { Header } from '@/src/components/Header';
import { ToastBanner } from '@/src/components/ToastBanner';
import { AppProvider, useApp } from '@/src/context/AppContext';
import { AboutPage } from '@/src/pages/AboutPage';
import { DailyVersePage } from '@/src/pages/DailyVersePage';
import { FavoritesPage } from '@/src/pages/FavoritesPage';
import { HomePage } from '@/src/pages/HomePage';
import { SettingsPage } from '@/src/pages/SettingsPage';
import { VersionsPage } from '@/src/pages/VersionsPage';

const AppShell: React.FC = () => {
  const { route, isOnline } = useApp();

  const renderPage = () => {
    switch (route) {
      case '/verset-du-jour':
        return <DailyVersePage />;
      case '/versions-bibliques':
        return <VersionsPage />;
      case '/favoris':
        return <FavoritesPage />;
      case '/parametres':
        return <SettingsPage />;
      case '/a-propos':
        return <AboutPage />;
      case '/':
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#0F2942]">
      <Header />

      {!isOnline && (
        <div
          role="status"
          className="bg-[#EAF3FC] border-b border-[#C6DDF4] px-4 py-2 text-xs sm:text-sm text-[#1769AA] flex items-center justify-center gap-2"
        >
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>
            Vous êtes actuellement hors connexion. Le dernier verset consulté reste disponible localement.
          </span>
        </div>
      )}

      <main className="flex-1">{renderPage()}</main>

      <Footer />
      <ToastBanner />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </ErrorBoundary>
  );
}
