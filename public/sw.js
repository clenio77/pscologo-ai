// Agenda Clinical - Service Worker v1.0
// Estratégia: Network First com fallback para cache (dados sempre frescos para SPA)

const CACHE_NAME = 'agenda-clinical-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/app-icon.svg',
  '/favicon.svg',
];

// Instalação: pré-cache de assets estáticos essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Ativação: limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Estratégia Network First para garantir dados atualizados
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições de APIs externas (Supabase) - sempre vai para rede
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('supabase.io') ||
    request.method !== 'GET'
  ) {
    return;
  }

  // Para navegação (páginas HTML): Network First, fallback para index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Para assets estáticos (JS, CSS, imagens): Cache First com atualização em background
  if (
    url.pathname.match(/\.(js|css|svg|png|ico|woff2?|ttf)$/) ||
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request).then((response) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          return response;
        });
        return cached || networkFetch;
      })
    );
    return;
  }

  // Para tudo mais: Network First
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Escuta de mensagens para controle manual do cache
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
