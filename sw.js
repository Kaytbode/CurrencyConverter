
const staticCacheName = 'currency-converter-v2';

self.addEventListener('install', event=> {
    event.waitUntil(
      caches.open(staticCacheName).then(cache=>{
            return cache.addAll([
            './src/app.js',
            './index.html',
            './index.css',
            "https://stackpath.bootstrapcdn.com/bootstrap/4.1.1/css/bootstrap.min.css"
            ]);
      })
    );
});

self.addEventListener('activate', event=>{
    const cacheWhiteList = [staticCacheName];
    event.waitUntil(
        caches.keys().then(cacheNames=>{
            return Promise.all(
                cacheNames.map(cacheName=>{
                    if(cacheWhiteList.indexOf(cacheName) == -1){
                        return caches.delete(cacheName);
                    }
                })
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
