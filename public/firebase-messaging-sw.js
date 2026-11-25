/* Service Worker Firebase Cloud Messaging — MÉDITATION CPC */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = {
      notification: {
        title: 'MÉDITATION CPC',
        body: 'Votre verset biblique du jour est disponible. Venez découvrir la Parole de Dieu.',
      },
    };
  }

  const notificationData = payload.notification || {};
  const data = payload.data || {};
  const title = notificationData.title || data.title || 'MÉDITATION CPC';
  const body =
    notificationData.body ||
    data.body ||
    'Votre verset biblique du jour est disponible. Venez découvrir la Parole de Dieu.';
  const targetUrl =
    (payload.fcmOptions && payload.fcmOptions.link) ||
    data.url ||
    '/verset-du-jour';

  const options = {
    body,
    icon: notificationData.icon || '/assets/aistudio/IMG-20261024-WA0004_1__dd88a4ca.jpg',
    badge: '/pwa-192x192.png',
    tag: data.date ? `meditation-cpc-${data.date}` : 'meditation-cpc-daily',
    renotify: false,
    data: {
      url: targetUrl,
      date: data.date || null,
      reference: data.reference || null,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetPath = (event.notification.data && event.notification.data.url) || '/verset-du-jour';
  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            return client.navigate(targetUrl);
          }
          return client;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
