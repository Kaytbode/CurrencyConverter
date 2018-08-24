
const staticCacheName = 'currency-converter-v3';

self.addEventListener('install', event=> {
    event.waitUntil(
      caches.open(staticCacheName).then(cache=>{
            return cache.addAll([
                'https://kaytbode.github.io/CurrencyConverter/',            
                'https://kaytbode.github.io/CurrencyConverter/src/app.js',
                'https://kaytbode.github.io/CurrencyConverter/src/a2hs.js',
                'https://kaytbode.github.io/CurrencyConverter/index.css',
                "https://fonts.googleapis.com/css?family=Tangerine",
                "https://fonts.googleapis.com/css?family=PT+Sans+Narrow",
            ]);
      })
    );
});

self.addEventListener('activate', event=>{
    const cacheWhiteList = [staticCacheName];
    event.waitUntil(
        caches.keys().then(cacheNames=>{
            return Promise.all(
                cacheNames.filter(cacheName=>{
                    return cacheName.startsWith('currency-converter-')&&
                          cacheWhiteList.indexOf(cacheName) == -1
                }).map(cacheName=> caches.delete(cacheName))
            );
        })
    );
});

self.addEventListener('fetch', event=>{
    event.respondWith(
        caches.match(event.request).then(response=> {
          return response || fetch(event.request);
        })
    );    
});
