// service-worker.js
// ✅ Cambia este número SOLO cuando quieras invalidar todo el caché manualmente.
// El sistema detecta cambios automáticamente gracias a la estrategia Network First.
const CACHE_NAME = 'quimica-cache-v4';

// Archivos esenciales para funcionar SIN internet (offline shell)
const PRECACHE_URLS = [
    './',
    './index.html',
    './css/styles.css',
    './js/script.js',
    './assets/logo.svg'
];

// ─────────────────────────────────────────────
// 1. INSTALL: Pre-cachear el shell de la app
// ─────────────────────────────────────────────
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[SW] Pre-cacheando archivos esenciales...');
            return cache.addAll(PRECACHE_URLS);
        })
    );
    // Actívate inmediatamente sin esperar a que se cierren las pestañas viejas
    self.skipWaiting();
});

// ─────────────────────────────────────────────
// 2. ACTIVATE: Limpiar cachés viejos
// ─────────────────────────────────────────────
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => {
                        console.log(`[SW] Eliminando caché viejo: ${key}`);
                        return caches.delete(key);
                    })
            )
        )
    );
    // Tomar control de TODAS las pestañas abiertas de inmediato
    self.clients.claim();
});

// ─────────────────────────────────────────────
// 3. FETCH: Estrategia NETWORK FIRST
//    → Intenta la red primero (siempre ve los cambios)
//    → Si no hay internet, usa el caché como respaldo
// ─────────────────────────────────────────────
self.addEventListener('fetch', event => {
    // Solo interceptar GET (ignorar POST, etc.)
    if (event.request.method !== 'GET') return;

    // Ignorar peticiones de extensiones del navegador
    if (!event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(networkFirst(event.request));
});

async function networkFirst(request) {
    const cache = await caches.open(CACHE_NAME);

    try {
        // 1. Intentar red primero
        const networkResponse = await fetch(request);

        // 2. Si la respuesta es válida, actualizamos el caché
        if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (err) {
        // 3. Sin red: devolver desde caché
        const cached = await cache.match(request);
        if (cached) {
            console.log(`[SW] Sin red — sirviendo desde caché: ${request.url}`);
            return cached;
        }

        // 4. Sin red ni caché: error controlado
        console.warn(`[SW] No hay red ni caché para: ${request.url}`);
        return new Response('Sin conexión a internet', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}
