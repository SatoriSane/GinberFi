// Service Worker for PWA functionality
const CACHE_NAME = 'ginbertfi-v1.2';
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
  // Forzar que el nuevo SW tome control inmediatamente
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - Network First strategy for JS/CSS, Cache First for others
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Network First para archivos JS y CSS (siempre intenta obtener la versión más reciente)
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Actualizar cache con la nueva versión
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Si falla la red, usar cache
          return caches.match(event.request);
        })
    );
  } else {
    // Cache First para otros recursos (imágenes, HTML, etc.)
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          return response || fetch(event.request);
        })
    );
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  // Tomar control de todas las páginas abiertas inmediatamente
  event.waitUntil(
    Promise.all([
      // Limpiar caches antiguos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Tomar control inmediato de todas las páginas
      self.clients.claim()
    ])
  );
});
