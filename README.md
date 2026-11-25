# MÉDITATION CPC

> **« Un verset chaque jour pour nourrir sa foi. »**

**MÉDITATION CPC** est une application Web chrétienne francophone (PWA) moderne, responsive et accessible sans inscription obligatoire. Elle permet à chaque visiteur de méditer un verset biblique quotidien, de comparer quatre traductions françaises, de partager sur WhatsApp et de recevoir un rappel quotidien par notification Web Push (Firebase Cloud Messaging).

---

## 1. Fonctionnalités principales

- **Verset quotidien unifié** : Un verset principal par jour (collection Firestore `daily_verses`), renouvelé automatiquement à minuit selon le fuseau horaire configuré (`Africa/Abidjan` par défaut).
- **Quatre traductions bibliques** :
  - **Louis Segond 1910** (sélectionnée par défaut — domaine public)
  - **Parole de Vie**
  - **Français courant**
  - **King James française**
- **Notifications Web Push réelles (FCM)** :
  - Consentement explicite de l’utilisateur
  - Choix de l’heure (07 h 00 par défaut) et du fuseau horaire
  - Service Worker (`/firebase-messaging-sw.js`) ouvrant directement `/verset-du-jour` au clic
  - Envoi côté serveur via **Firebase Cloud Functions v2 + Cloud Scheduler** (`functions/src/index.ts`)
  - Prévention des doublons (1 notification max par jour et par appareil dans `notification_logs`) et désactivation automatique des jetons expirés
- **Partage & Copie** :
  - Partage direct vers **WhatsApp** (`https://wa.me/?text=...`)
  - API Web Share native (mobile / navigateurs compatibles)
  - Copie formatée dans le presse-papiers
- **Mode hors connexion (PWA)** :
  - Cache local du dernier verset consulté + Service Worker Workbox (`vite-plugin-pwa`)
- **Administration sécurisée** :
  - Publication et programmation des versets futurs dans `daily_verses` réservées à l’administrateur vérifié via Google Auth et protégées par `firestore.rules`.

---

## 2. Architecture du projet

```text
├── public/
│   ├── firebase-messaging-sw.js   # Service Worker Web Push FCM
│   ├── icon.svg / pwa-*.png       # Icônes PWA & favicon
│   ├── robots.txt                 # SEO
│   └── sitemap.xml                # SEO
├── src/
│   ├── components/                # BrandLogo, Header, Footer, DailyVerseCard, NotificationBanner, ErrorBoundary
│   ├── context/AppContext.tsx     # État global, routage, auth, préférences, minuit auto
│   ├── data/
│   │   ├── translations.ts        # Métadonnées & licences des 4 versions
│   │   └── verses.ts              # Corpus canonique vérifié de versets bibliques
│   ├── hooks/                     # usePWAInstall, useOnlineStatus
│   ├── lib/                       # firebase.ts, firestoreError.ts, verseService.ts, settingsService.ts, pushService.ts, share.ts, storage.ts, timezone.ts
│   └── pages/                     # HomePage, DailyVersePage, VersionsPage, SettingsPage, AboutPage
├── functions/
│   └── src/index.ts               # Cloud Function planifiée (Cloud Scheduler */5 * * * *) + envoi FCM
├── firebase-blueprint.json        # Modèle de données Firestore
├── firestore.rules                # Règles de sécurité Firestore strictes
├── firebase.json                  # Configuration déploiement Firebase
└── vercel.json                    # Rewrites SPA et en-têtes Service Worker pour Vercel
```

---

## 3. Variables d’environnement

Copiez `.env.example` vers `.env` (et configurez ces variables dans **Vercel → Project Settings → Environment Variables**) :

| Variable | Description |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Clé Web API Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domaine Auth (`<projet>.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | ID du projet Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket Storage Firebase |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID FCM |
| `VITE_FIREBASE_APP_ID` | App ID Web Firebase |
| `VITE_FIREBASE_FIRESTORE_DATABASE_ID` | ID de la base Firestore (`(default)` ou ID nommé) |
| `VITE_FIREBASE_VAPID_KEY` | **Clé publique Web Push (VAPID)** générée dans *Console Firebase → Paramètres du projet → Cloud Messaging → Certificats Web Push* |

> **Sécurité :** Ne placez jamais de clé privée Admin SDK (`serviceAccountKey.json` ou `FIREBASE_PRIVATE_KEY`) dans les variables `VITE_*` du frontend.

---

## 4. Configuration Firebase requise

1. **Authentification** :
   - Activez **Google** (pour l’accès administrateur dans *Paramètres*).
   - Activez **Anonyme** dans *Authentication → Sign-in method* pour permettre aux visiteurs sans compte de synchroniser leurs préférences et abonnements Web Push dans Firestore.
2. **Cloud Messaging (Web Push)** :
   - Dans *Paramètres du projet → Cloud Messaging*, générez une paire de clés **Web Push (VAPID)** et renseignez la clé publique dans `VITE_FIREBASE_VAPID_KEY`.
3. **Règles Firestore** :
   - Déployez `firestore.rules` : `firebase deploy --only firestore:rules`
4. **Cloud Functions (envoi planifié des notifications)** :
   ```bash
   cd functions
   npm install
   npm run build
   firebase deploy --only functions
   ```
   Si vous utilisez une base Firestore nommée autre que `(default)`, définissez la variable d’environnement `FIRESTORE_DATABASE_ID` sur la fonction.

---

## 5. Coûts estimés des services Firebase

- **Firebase Authentication & Firestore (plan Spark gratuit)** :
  - Auth anonyme & Google : gratuit dans les limites standards.
  - Firestore : quota gratuit quotidien (lectures/écritures/stockage inclus sur le plan Spark).
- **Firebase Cloud Messaging (FCM)** : **Gratuit** (envoi illimité de notifications Web Push).
- **Firebase Cloud Functions v2 & Cloud Scheduler** :
  - Nécessite le passage du projet au plan **Blaze (paiement à l’usage)** pour activer Cloud Build, Artifact Registry et Cloud Scheduler.
  - Inclut un niveau gratuit mensuel généreux (2 millions d’invocations Cloud Functions / mois et 3 tâches Cloud Scheduler gratuites par compte de facturation). Pour un trafic modéré de méditation quotidienne, le coût mensuel reste généralement proche de **0 $**, sous réserve de configurer une alerte de budget dans Google Cloud Billing.

---

## 6. Déploiement sur Vercel (via GitHub)

1. Poussez ce dépôt sur **GitHub**.
2. Importez le dépôt dans **Vercel**.
3. Vérifiez les paramètres de build (déjà définis dans `vercel.json`) :
   - Framework Preset : `Vite`
   - Build Command : `npm run build`
   - Output Directory : `dist`
4. Ajoutez toutes les variables `VITE_FIREBASE_*` dans **Environment Variables**.
5. Déployez : `vercel.json` gère automatiquement les routes SPA (`/verset-du-jour`, `/versions-bibliques`, `/parametres`, `/a-propos`) et les en-têtes du Service Worker `/firebase-messaging-sw.js`.

---

## 7. Commandes locales

```bash
# Installation des dépendances frontend
npm install

# Serveur de développement (port 3000)
npm run dev

# Vérification TypeScript
npm run lint

# Vérification des règles Firestore
npx eslint --max-warnings=0 firestore.rules

# Build de production
npm run build
```
