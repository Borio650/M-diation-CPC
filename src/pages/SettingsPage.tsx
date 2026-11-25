import React, { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  BellOff,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  Globe,
  Info,
  Smartphone,
} from 'lucide-react';
import { BIBLE_TRANSLATION_LIST, BIBLE_TRANSLATIONS } from '@/src/data/translations';
import { useApp } from '@/src/context/AppContext';
import { usePWAInstall } from '@/src/hooks/usePWAInstall';
import { SUPPORTED_TIMEZONES } from '@/src/lib/timezone';
import { BibleVersionId } from '@/src/types/bible';

export const SettingsPage: React.FC = () => {
  const {
    preferredVersion,
    setPreferredVersion,
    notificationEnabled,
    notificationTime,
    timezone,
    updateNotificationSchedule,
    permissionState,
    hasFcmSubscription,
    pushBusy,
    pushFeedback,
    mobileInfo,
    enableNotifications,
    disableNotifications,
    testDeviceNotification,
    anonymousAuthBlocked,
  } = useApp();

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showLicenses, setShowLicenses] = useState(false);

  const isSubscriptionActive =
    notificationEnabled && permissionState === 'granted' && hasFcmSubscription;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#1769AA]">
          Configuration personnelle
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-[#0F2942]">
          Paramètres
        </h1>
        <p className="text-base text-[#4A637D]">
          Toutes vos modifications sont enregistrées automatiquement dans votre navigateur et synchronisées lorsque l’authentification Firebase est active.
        </p>
      </div>

      {/* SECTION 1 : NOTIFICATIONS */}
      <section
        aria-labelledby="settings-notifications-title"
        className="bg-white border border-[#DCE7F3] rounded-xl p-6 sm:p-8 space-y-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-[#E6EEF6]">
          <div className="space-y-1">
            <h2
              id="settings-notifications-title"
              className="font-sans text-lg font-semibold text-[#0F2942] flex items-center gap-2"
            >
              <Bell className="w-5 h-5 text-[#1769AA]" />
              NOTIFICATIONS
            </h2>
            <p className="text-sm text-[#4A637D]">
              Recevez un rappel quotidien sur votre téléphone ou navigateur via Firebase Cloud Messaging, même lorsque le site est fermé.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {!isSubscriptionActive ? (
              <button
                type="button"
                disabled={pushBusy}
                onClick={() => void enableNotifications()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1769AA] text-white text-sm font-semibold hover:bg-[#2876C8] disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap min-h-[44px]"
              >
                <Bell className="w-4 h-4" />
                {pushBusy ? 'Activation...' : 'Activer les notifications'}
              </button>
            ) : (
              <button
                type="button"
                disabled={pushBusy}
                onClick={() => void disableNotifications()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#1769AA] bg-white text-[#1769AA] text-sm font-semibold hover:bg-[#EAF3FC] disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap min-h-[44px]"
              >
                <BellOff className="w-4 h-4" />
                {pushBusy ? 'Désactivation...' : 'Désactiver les notifications'}
              </button>
            )}

            {permissionState === 'granted' && (
              <button
                type="button"
                onClick={() => void testDeviceNotification()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#C6DDF4] bg-[#F5F7FA] text-[#0F2942] text-sm font-medium hover:border-[#1769AA] hover:text-[#1769AA] transition-colors cursor-pointer whitespace-nowrap min-h-[44px]"
              >
                <Smartphone className="w-4 h-4 text-[#1769AA]" />
                Tester sur cet appareil
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Choix de l'heure */}
          <div className="space-y-2">
            <label
              htmlFor="notification-time-input"
              className="text-sm font-semibold text-[#0F2942] flex items-center gap-2"
            >
              <Clock className="w-4 h-4 text-[#1769AA]" />
              Heure du rappel quotidien
            </label>
            <input
              id="notification-time-input"
              type="time"
              value={notificationTime}
              onChange={(e) => {
                if (e.target.value) {
                  void updateNotificationSchedule({ notificationTime: e.target.value });
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#C6DDF4] bg-[#F5F7FA] text-[#0F2942] text-sm font-medium tabular-nums focus:bg-white focus:border-[#1769AA] focus:outline-none min-h-[44px]"
            />
            <p className="text-xs text-[#4A637D]">
              Heure par défaut : 07 h 00.
            </p>
          </div>

          {/* Choix du fuseau horaire */}
          <div className="space-y-2">
            <label
              htmlFor="timezone-select"
              className="text-sm font-semibold text-[#0F2942] flex items-center gap-2"
            >
              <Globe className="w-4 h-4 text-[#1769AA]" />
              Fuseau horaire
            </label>
            <select
              id="timezone-select"
              value={timezone}
              onChange={(e) => void updateNotificationSchedule({ timezone: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#C6DDF4] bg-[#F5F7FA] text-[#0F2942] text-sm font-medium focus:bg-white focus:border-[#1769AA] focus:outline-none min-h-[44px]"
            >
              {SUPPORTED_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#4A637D]">
              Fuseau par défaut : Africa/Abidjan.
            </p>
          </div>
        </div>

        {/* Notifications sur téléphone (Android & iPhone) */}
        <div className="p-4 sm:p-5 rounded-lg bg-[#EAF3FC]/70 border border-[#C6DDF4] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0F2942]">
              <Smartphone className="w-4 h-4 text-[#1769AA]" />
              <span>Notifications sur téléphone (Android & iPhone)</span>
            </div>
            <span className="text-xs font-medium text-[#1769AA]">
              {mobileInfo.deviceLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-[#35516E] leading-relaxed">
            <div className="p-3 rounded-lg bg-white border border-[#DCE7F3] space-y-1">
              <p className="font-semibold text-[#0F2942]">Téléphone Android</p>
              <p>
                Compatible directement avec Chrome, Edge, Samsung Internet ou Firefox. Vous pouvez aussi installer l’application sur votre écran d’accueil pour recevoir vos alertes comme une application dédiée.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-white border border-[#DCE7F3] space-y-1">
              <p className="font-semibold text-[#0F2942]">iPhone / iPad (iOS 16.4+)</p>
              <p>
                Dans Safari, touchez <strong>Partager</strong> puis <strong>Sur l’écran d’accueil</strong>, ouvrez l’icône MÉDITATION CPC et activez les notifications.
              </p>
            </div>
          </div>

          {!isInstalled && isInstallable && (
            <button
              type="button"
              onClick={() => void install()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1769AA] text-white text-xs sm:text-sm font-semibold hover:bg-[#2876C8] transition-colors cursor-pointer whitespace-nowrap min-h-[40px]"
            >
              <Download className="w-4 h-4" />
              Installer l’application sur mon téléphone
            </button>
          )}

          {!isInstalled && isIOS && !isInstallable && (
            <p className="text-xs text-[#1769AA] font-medium">
              Astuce iPhone : utilisez le menu Partager de Safari → « Sur l’écran d’accueil » pour activer les notifications iOS.
            </p>
          )}
        </div>

        {/* Statut des notifications */}
        <div className="p-4 rounded-lg bg-[#F5F7FA] border border-[#DCE7F3] space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#1769AA]">
            Statut des notifications
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#0F2942]">
            <span className="inline-flex items-center gap-1.5">
              {isSubscriptionActive ? (
                <CheckCircle2 className="w-4 h-4 text-[#1769AA]" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-[#2876C8]" />
              )}
              <strong>
                {isSubscriptionActive
                  ? 'Abonnement Web Push actif'
                  : permissionState === 'denied'
                    ? 'Notifications refusées dans le navigateur'
                    : permissionState === 'unsupported'
                      ? 'Installation sur écran d’accueil requise ou navigateur non compatible'
                      : 'Abonnement inactif'}
              </strong>
            </span>
            <span className="text-[#4A637D]">
              Permission : <span className="font-medium text-[#0F2942]">{permissionState}</span>
            </span>
            <span className="text-[#4A637D]">
              Traduction des rappels :{' '}
              <span className="font-medium text-[#0F2942]">
                {BIBLE_TRANSLATIONS[preferredVersion].name}
              </span>
            </span>
          </div>

          {pushFeedback && (
            <p className="text-xs sm:text-sm text-[#35516E] pt-1 leading-relaxed">
              {pushFeedback.message}
            </p>
          )}

          {anonymousAuthBlocked && (
            <p className="text-xs text-[#4A637D] pt-1 leading-relaxed">
              Note technique : l’authentification anonyme Firebase n’est pas encore activée dans votre console Firebase (Authentication → Méthodes de connexion → Anonyme). Vos préférences restent sauvegardées localement sur cet appareil.
            </p>
          )}
        </div>
      </section>

      {/* SECTION 2 : BIBLE */}
      <section
        aria-labelledby="settings-bible-title"
        className="bg-white border border-[#DCE7F3] rounded-xl p-6 sm:p-8 space-y-5"
      >
        <div className="space-y-1 pb-4 border-b border-[#E6EEF6]">
          <h2
            id="settings-bible-title"
            className="font-sans text-lg font-semibold text-[#0F2942] flex items-center gap-2"
          >
            <BookOpen className="w-5 h-5 text-[#1769AA]" />
            BIBLE
          </h2>
          <p className="text-sm text-[#4A637D]">
            Version actuellement sélectionnée :{' '}
            <strong className="text-[#1769AA]">
              {BIBLE_TRANSLATIONS[preferredVersion].name}
            </strong>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BIBLE_TRANSLATION_LIST.map((version) => {
            const active = preferredVersion === version.id;
            return (
              <button
                key={version.id}
                type="button"
                onClick={() => void setPreferredVersion(version.id as BibleVersionId)}
                className={`p-4 rounded-lg border text-left transition-colors cursor-pointer flex items-center justify-between gap-3 min-h-[56px] ${
                  active
                    ? 'bg-[#EAF3FC] border-[#1769AA] text-[#0F2942]'
                    : 'bg-[#F5F7FA] border-[#DCE7F3] text-[#0F2942] hover:bg-white hover:border-[#2876C8]'
                }`}
              >
                <div>
                  <p className="text-sm font-semibold">{version.name}</p>
                  <p className="text-xs text-[#4A637D]">{version.licenseStatus}</p>
                </div>
                {active && <CheckCircle2 className="w-5 h-5 text-[#1769AA] shrink-0" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION 3 : APPLICATION */}
      <section
        aria-labelledby="settings-app-title"
        className="bg-white border border-[#DCE7F3] rounded-xl p-6 sm:p-8 space-y-5"
      >
        <div className="pb-4 border-b border-[#E6EEF6]">
          <h2
            id="settings-app-title"
            className="font-sans text-lg font-semibold text-[#0F2942] flex items-center gap-2"
          >
            <Info className="w-5 h-5 text-[#1769AA]" />
            APPLICATION
          </h2>
        </div>

        <dl className="divide-y divide-[#E6EEF6] text-sm">
          <div className="py-3 flex items-center justify-between gap-4">
            <dt className="text-[#4A637D]">Nom de l’application</dt>
            <dd className="font-semibold text-[#0F2942]">MÉDITATION CPC</dd>
          </div>
          <div className="py-3 flex items-center justify-between gap-4">
            <dt className="text-[#4A637D]">Version de l’application</dt>
            <dd className="font-medium text-[#0F2942] tabular-nums">1.0.0</dd>
          </div>
          <div className="py-3 flex items-center justify-between gap-4">
            <dt className="text-[#4A637D]">Politique de confidentialité</dt>
            <dd>
              <button
                type="button"
                onClick={() => setShowPrivacy((prev) => !prev)}
                className="text-sm font-semibold text-[#1769AA] hover:underline cursor-pointer"
              >
                {showPrivacy ? 'Masquer' : 'Consulter'}
              </button>
            </dd>
          </div>
          <div className="py-3 flex items-center justify-between gap-4">
            <dt className="text-[#4A637D]">Informations sur les traductions</dt>
            <dd>
              <button
                type="button"
                onClick={() => setShowLicenses((prev) => !prev)}
                className="text-sm font-semibold text-[#1769AA] hover:underline cursor-pointer"
              >
                {showLicenses ? 'Masquer' : 'Consulter les licences'}
              </button>
            </dd>
          </div>
        </dl>

        {showPrivacy && (
          <div className="p-4 rounded-lg bg-[#F5F7FA] border border-[#DCE7F3] text-xs sm:text-sm text-[#35516E] space-y-2 leading-relaxed">
            <p className="font-semibold text-[#0F2942]">Politique de confidentialité — MÉDITATION CPC</p>
            <p>
              MÉDITATION CPC fonctionne sans création de compte obligatoire. Aucune adresse e-mail, numéro de téléphone ou donnée personnelle nominative n’est collectée auprès des visiteurs.
            </p>
            <p>
              Seules vos préférences techniques (traduction biblique choisie, heure de rappel, fuseau horaire et jeton technique Firebase Cloud Messaging si vous acceptez explicitement les notifications) sont conservées afin de délivrer le rappel quotidien. Vous pouvez désactiver les notifications à tout moment depuis cette page.
            </p>
          </div>
        )}

        {showLicenses && (
          <div className="p-4 rounded-lg bg-[#F5F7FA] border border-[#DCE7F3] text-xs sm:text-sm text-[#35516E] space-y-3 leading-relaxed">
            <p className="font-semibold text-[#0F2942]">Licences et droits de reproduction</p>
            {BIBLE_TRANSLATION_LIST.map((t) => (
              <p key={t.id}>
                <strong>{t.name} ({t.licenseStatus}) :</strong> {t.licenseNote}
              </p>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
