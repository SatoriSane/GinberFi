// Service Worker for PWA functionality
const CACHE_NAME = 'ginberfi-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/base.css',
  '/css/header.css',
  '/css/navigation.css',
  '/css/gastos.css',
  '/css/huchas.css',
  '/css/resumen.css',
  '/css/modals.css',
  '/js/base.js',
  '/js/storage.js',
  '/js/header.js',
  '/js/navigation.js',
  '/js/modals.js',
  '/js/gastos.js',
  '/js/huchas.js',
  '/js/resumen.js',
  '/js/app.js'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
