const CACHE_NAME = 'taskomon-v1';
const ASSETS = [
  '/taskomon/',
  '/taskomon/index.html',
  '/taskomon/AppIcon.png',
  '/taskomon/EggSprite.png',
  '/taskomon/PetBase.png',
  '/taskomon/PetSleep.png',
  '/taskomon/PetHappy.png',
  '/taskomon/PetIll.png',
  '/taskomon/Sparkle.gif',
  '/taskomon/SleepAnimation.gif',
  '/taskomon/WashAnimation.gif',
  '/taskomon/BallAnimation.gif',
  '/taskomon/PetEat.gif',
  '/taskomon/IllAnimation.gif',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
