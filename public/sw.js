const CACHE_NAME = 'taskomon-v2';
const ASSETS = [
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
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
