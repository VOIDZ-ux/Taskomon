const CACHE_NAME = 'taskomon-v3';
const PRECACHE_ASSETS = [
  '/Taskomon/',
  '/Taskomon/index.html',
  '/Taskomon/AppIcon.png',
  '/Taskomon/EggSprite.png',
  '/Taskomon/PetBase.png',
  '/Taskomon/PetSleep.png',
  '/Taskomon/PetHappy.png',
  '/Taskomon/PetIll.png',
  '/Taskomon/Sparkle.gif',
  '/Taskomon/SleepAnimation.gif',
  '/Taskomon/WashAnimation.gif',
  '/Taskomon/BallAnimation.gif',
  '/Taskomon/PetEat.gif',
  '/Taskomon/IllAnimation.gif',
  '/Taskomon/support_me_on_kofi_red.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
      .then(clients => clients.forEach(client => client.navigate(client.url)))
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);
  const isNav = request.mode === 'navigate'
    || url.pathname === '/Taskomon/'
    || url.pathname === '/Taskomon'
    || url.pathname.endsWith('.html');

  if (isNav) {
    // Network-first for HTML: always get fresh markup with correct hashed asset refs
    e.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for everything else; cache new hashed assets on first fetch
  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(request, clone));
        return res;
      });
    })
  );
});
