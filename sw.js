// Service Worker for PWA
const CACHE_NAME = 'shophub-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/mobile-fix.css',
  '/js/app-management.js',
  '/icon.png',
  '/favicon.ico'
];

// 安装Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  // 立即激活新的SW
  self.skipWaiting();
});

// 拦截请求,使用缓存策略
self.addEventListener('fetch', event => {
  // API请求不缓存，直接网络请求
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // 网络失败时返回离线提示
        return new Response(
          JSON.stringify({ success: false, message: '网络连接失败，请检查网络' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // 静态资源使用缓存优先策略
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(networkResponse => {
          // 缓存新的资源
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
      .catch(() => {
        // 如果都失败，返回离线页面
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// 激活时清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 立即控制所有页面
  event.waitUntil(self.clients.claim());
});
