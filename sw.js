
const staticCacheName = 'currency-converter-v11';

self.addEventListener('install', event=> {
    event.waitUntil(
      caches.open(staticCacheName).then(cache=>{
            return cache.addAll([
                '/CurrencyConverter/',
                '/CurrencyConverter/page404.html',           
                '/CurrencyConverter/src/app.js',
                '/CurrencyConverter/src/a2hs.js',
                '/CurrencyConverter/css/main.css',
                '/CurrencyConverter/css/medium.css',
                'https://fonts.googleapis.com/css?family=Poor+Story|Open+Sans+Condensed:400|Raleway'

            ]).then(()=> self.skipWaiting())
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

    return self.clients.claim();
});

self.addEventListener('fetch', event=>{
    event.respondWith(
        caches.match(event.request).then(response=> {
            if(response) return response
            
            return fetch(event.request).then(response=>{
                if(response.status === 404){
                    return caches.match('/page404.html');
                }
                return response;
            });
        })
    );    
});
