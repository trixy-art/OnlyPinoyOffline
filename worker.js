// Define a name for your cache
const CACHE_NAME = 'pinoy-recipe-app-v1';

// List the essential files that make up your app's "shell"
// This includes the main HTML file and the manifest
const APP_SHELL_URLS = [
  'index.html',
  'manifest.json'
  // Note: Your CSS and main JavaScript are already inside index.html,
  // so they are cached automatically when index.html is cached.
];

/**
 * Event: install
 * When the service worker is installed, open the cache and add the app shell files to it.
 */
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching App Shell');
        return cache.addAll(APP_SHELL_URLS);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker.
        console.log('Service Worker: Install complete');
        return self.skipWaiting();
      })
  );
});

/**
 * Event: activate
 * When the service worker is activated, it cleans up any old, unused caches.
 */
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          // If a cache is found that doesn't match the current cache name, delete it.
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
        // Tell the active service worker to take control of the page immediately.
        console.log('Service Worker: Activation complete');
        return self.clients.claim();
    })
  );
});

/**
 * Event: fetch
 * This event fires every time the app requests a resource (like a page, script, or image).
 * It follows a "Cache, falling back to network" strategy.
 */
self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
      return;
  }
    
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // If the resource is found in the cache, return it immediately.
        if (cachedResponse) {
          return cachedResponse;
        }

        // If the resource is not in the cache, fetch it from the network.
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response.
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            
            // Clone the response because a response is a stream and can only be consumed once.
            // We need one for the browser to render and one to put in the cache.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // Cache the new response for future offline use.
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(error => {
            console.error('Fetching from network failed:', error);
            // In a real-world app, you might want to return a fallback placeholder image
            // or an offline page here, but for now, we just log the error.
        });
      })
  );
});