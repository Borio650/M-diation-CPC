import React, { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle2,
  Download,
  Settings,
  Smartphone,
} from 'lucide-react';
import { useApp } from '@/src/context/AppContext';
import { usePWAInstall } from '@/src/hooks/usePWAInstall';

export const NotificationBanner: React.FC = () => {
  const {
    notificationEnabled,
    notificationTime,
    timezone,
    permissionState,
    hasFcmSubscription,
    pushBusy,
    pushFeedback,
    mobileInfo,
    enableNotifications,
    disableNotifications,
    testDeviceNotification,
    navigate,
  } = useApp();

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const isFullyActive = notificationEnabled && permissionState === 'granted' && hasFcmSubscription;

  return (
    <section
      aria-labelledby="daily-notifications-heading"
      className="bg-[#EAF3FC] border border-[#C6DDF4] rounded-xl p-6 sm:p-10"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="max-w-2xl space-y-2.5">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#1769AA]">
            <Bell className="w-4 h-4" />
            <span>Rappel quotidien Web & Téléphone</span>
          </div>
          <h2
            id="daily-notifications-heading"
            className="text-2xl sm:text-3xl font-semibold text-[#0F2942] text-balance"
          >
            Recevez votre verset chaque jour
          </h2>
          <p className="text-sm sm:text-base text-[#35516E] leading-relaxed">
            Activez les notifications pour recevoir votre rappel biblique quotidien sur votre téléphone ou votre ordinateur.
          </p>

          <div className="pt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-[#4A637D]">
            <span>
              Heure configurée : <strong className="text-[#0F2942] tabular-nums">{notificationTime}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Fuseau : <strong className="text-[#0F2942]">{timezone}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Appareil : <strong className="text-[#0F2942]">{mobileInfo.deviceLabel}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Statut :{' '}
              <strong className={isFullyActive ? 'text-[#1769AA]' : 'text-[#0F2942]'}>
                {isFullyActive
                  ? 'Abonnement actif'
                  : permissionState === 'denied'
                    ? 'Bloqué par le navigateur'
                    : 'Non activé'}
              </strong>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {!isFullyActive ? (
            <button
              type="button"
              disabled={pushBusy}
              onClick={() => void enableNotifications()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-[#1769AA] text-white text-sm font-semibold hover:bg-[#2876C8] disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA]"
            >
              <Bell className="w-4 h-4 shrink-0" />
              {pushBusy ? 'Activation en cours...' : 'ACTIVER LES NOTIFICATIONS'}
            </button>
          ) : (
            <button
              type="button"
              disabled={pushBusy}
              onClick={() => void disableNotifications()}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-[#1769AA] bg-white text-[#1769AA] text-sm font-semibold hover:bg-[#F5F7FA] disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap min-h-[44px]"
            >
              <BellOff className="w-4 h-4 shrink-0" />
              Désactiver les rappels
            </button>
          )}

          {permissionState === 'granted' && (
            <button
              type="button"
              onClick={() => void testDeviceNotification()}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white border border-[#1769AA] text-[#1769AA] text-sm font-medium hover:bg-[#F5F7FA] transition-colors cursor-pointer whitespace-nowrap min-h-[44px]"
            >
              <Smartphone className="w-4 h-4 shrink-0" />
              Tester sur l’appareil
            </button>
          )}

          {!isInstalled && (isInstallable || isIOS) && (
            <button
              type="button"
              onClick={() => {
                if (isInstallable) {
                  void install();
                } else {
                  setShowIOSGuide((prev) => !prev);
                }
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white border border-[#C6DDF4] text-[#0F2942] text-sm font-medium hover:border-[#1769AA] hover:text-[#1769AA] transition-colors cursor-pointer whitespace-nowrap min-h-[44px]"
            >
              <Download className="w-4 h-4 shrink-0 text-[#1769AA]" />
              Installer sur téléphone
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/parametres')}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white border border-[#C6DDF4] text-[#0F2942] text-sm font-medium hover:border-[#1769AA] hover:text-[#1769AA] transition-colors cursor-pointer whitespace-nowrap min-h-[44px]"
          >
            <Settings className="w-4 h-4 shrink-0" />
            Personnaliser l’heure
          </button>
        </div>
      </div>

      {showIOSGuide && (
        <div className="mt-5 p-4 rounded-lg bg-white border border-[#B9D7F3] text-sm text-[#0F2942] space-y-1.5">
          <p className="font-semibold text-[#1769AA]">
            Activer les notifications sur iPhone / iPad (iOS)
          </p>
          <p className="text-xs sm:text-sm text-[#35516E] leading-relaxed">
            1. Appuyez sur l’icône <strong>Partager</strong> en bas de Safari.<br />
            2. Sélectionnez <strong>Sur l’écran d’accueil</strong> puis ouvrez <strong>MÉDITATION CPC</strong> depuis l’écran d’accueil.<br />
            3. Appuyez ensuite sur <strong>ACTIVER LES NOTIFICATIONS</strong>.
          </p>
        </div>
      )}

      {pushFeedback && (
        <div
          role="status"
          className={`mt-5 p-4 rounded-lg border text-sm flex items-start gap-3 ${
            pushFeedback.success
              ? 'bg-white border-[#B9D7F3] text-[#0F2942]'
              : 'bg-white border-[#D6DFEA] text-[#0F2942]'
          }`}
        >
          {pushFeedback.success ? (
            <CheckCircle2 className="w-5 h-5 text-[#1769AA] shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-[#2876C8] shrink-0 mt-0.5" />
          )}
          <p className="leading-relaxed">{pushFeedback.message}</p>
        </div>
      )}
    </section>
  );
};
