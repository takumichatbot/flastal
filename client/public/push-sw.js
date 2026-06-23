// public/push-sw.js

// ─── オフラインキャッシュ設定 ──────────────────────────────────────────────────
// このファイルが sw.js（Workbox）から importScripts で読み込まれる場合は
// install/activate/fetch ハンドラは重複しても Workbox 側が優先されるため無害。
// push-sw.js を単独で register した場合は以下が有効になる。

const FLASTAL_CACHE = 'flastal-push-sw-v1';
const CACHE_ASSETS = [
  '/',
  '/icon-512x512.png',
  '/apple-icon.png',
  '/manifest.json',
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(FLASTAL_CACHE).then(function(cache) {
      return Promise.allSettled(
        CACHE_ASSETS.map(function(url) {
          return cache.add(url).catch(function(err) {
            console.warn('[push-sw] cache.add failed for', url, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(key) { return key !== FLASTAL_CACHE; })
          .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // APIリクエストはネットワーク優先、失敗時は 503 JSON を返す
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(function() {
        return new Response(
          JSON.stringify({ message: 'オフラインのため取得できません。' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // HTMLナビゲーション: ネットワーク優先、失敗時はキャッシュ
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(function() {
        return caches.match(event.request).then(function(cached) {
          return cached || caches.match('/');
        });
      })
    );
    return;
  }

  // 静的アセット: キャッシュ優先、なければネットワーク
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      return cached || fetch(event.request);
    })
  );
});

// ─── プッシュ通知ハンドラ ─────────────────────────────────────────────────────

self.addEventListener('push', function(event) {
  if (!event.data) return;

  const data = event.data.json();
  const title = data.title || 'FLASTAL';
  const options = {
    body: data.body || '新着のお知らせがあります',
    icon: '/icon-512x512.png',
    badge: '/icon-512x512.png',
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
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});