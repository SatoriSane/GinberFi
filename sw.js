// Service Worker for PWA functionality
const CACHE_NAME = 'ginbertfi-v4.0';
const urlsToCache = [
  './',
  'index.html',
  'manifest.json',
  'css/base.css',
  'css/base-dark.css',
  'css/base-sunset.css',
  'css/base-ocean.css',
  'css/base-forest.css',
  'css/base-lavender.css',
  'css/base-coral.css',
  'css/base-zen.css',
  'css/base-midnight.css',
  'css/base-coastal.css',
  'css/base-starry.css',
  'css/header.css',
  'css/navigation.css',
  'css/gastos.css',
  'css/pagos.css',
  'css/huchas.css',
  'css/resumen.css',
  'css/modals.css',
  'css/quick-actions.css',
  'css/icon-colors.css',
  'css/modal_opciones.css',
  'css/modal_wallet_transactions.css',
  'js/base.js',
  'js/icons.js',
  'js/storage-indexeddb.js',
  'js/header.js',
  'js/navigation.js',
  'js/modals.js',
  'js/gastos.js',
  'js/pagos.js',
  'js/huchas.js',
  'js/resumen.js',
  'js/opciones.js',
  'js/quick-actions.js',
  'js/app.js',
  'js/helpers.js',
  'js/theme-manager.js',
  'js/db/db-config.js',
  'js/db/base-repository.js',
  'js/db/wallet-repository.js',
  'js/db/category-repository.js',
  'js/db/expense-repository.js',
  'js/db/transaction-repository.js',
  'js/db/scheduled-payment-repository.js',
  'js/db/migration-service.js',
  'js/db/upgrade-db-v2.js',
  'icon-ingresar.png',
  'icon-gastar.png',
  'icon-transferir.png',
  'icon-programar.png',
  'icon-72x72.png',
  'icon-96x96.png',
  'icon-128x128.png',
  'icon-144x144.png',
  'icon-152x152.png',
  'icon-192x192.png',
  'icon-384x384.png',
  'icon-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando y precacheando recursos.');
  // Activar inmediatamente el nuevo Service Worker sin esperar
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cacheando archivos:', urlsToCache);
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - Network First strategy
self.addEventListener('fetch', (event) => {
  // Solo gestionar peticiones GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar peticiones que no son HTTP/HTTPS
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Si la petición a la red es exitosa, la usamos y la guardamos en caché
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      })
      .catch(() => {
        // Si la red falla, intentamos obtener el recurso desde el caché
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Para recursos no encontrados, devolver error
            return new Response('Contenido no disponible sin conexión.', {
              status: 404,
              statusText: 'Not Found'
            });
          });
      })
  );
});

// Message event - listen for skip waiting command
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Recibido comando SKIP_WAITING, activando inmediatamente...');
    self.skipWaiting();
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activando y limpiando cachés antiguos.');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Eliminando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Tomar control inmediato de todas las páginas abiertas
      console.log('Service Worker: Tomando control de las páginas.');
      return self.clients.claim();
    })
  );
});
