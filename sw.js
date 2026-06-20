const CACHE_NAME = 'app-cientifica-v3'; // Pasamos a v3
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 1. Instalación y actualización forzada
self.addEventListener('install', (event) => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// 2. Eliminación de cachés antiguas (v1 y v2) de la memoria del navegador
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Borrando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => clients.claim())
  );
});

// 3. ESTRATEGIA: Network-First (Intenta internet, si falla usa caché)
self.addEventListener('fetch', (event) => {
  // Solo interceptamos peticiones GET normales de nuestro propio sitio
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Si hay internet, guardamos la copia nueva y la mostramos
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Si estás sin señal (Offline), carga el archivo guardado
        return caches.match(event.request);
      })
  );
});
