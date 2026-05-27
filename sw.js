const CACHE_NAME = 'taskomon-v1';
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
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
