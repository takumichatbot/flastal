// public/push-sw.js

self.addEventListener('push', function(event) {
  if (!event.data) return;

  const data = event.data.json();
  const title = data.title || 'FLASTAL';
  const options = {
    body: data.body || '新着のお知らせがあります',
    icon: '/icon-192x192.png', // PWAアイコン
    badge: '/icon-192x192.png',
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});