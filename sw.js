
const staticCacheName = 'currency-converter-v9';

self.addEventListener('install', event=> {
    event.waitUntil(
      caches.open(staticCacheName).then(cache=>{
            return cache.addAll([
                '/',
                '/page404.html',           
                '/src/app.js',
                '/src/a2hs.js',
                '/index.css',
                "https://fonts.googleapis.com/css?family=Tangerine",
                "https://fonts.googleapis.com/css?family=PT+Sans+Narrow",
                "https://fonts.googleapis.com/css?family=Hind"
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
