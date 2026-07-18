// sw.js — Bell 214ST CWP Quick Reference
const CACHE_NAME = 'bell214st-cwp-v1';

const ASSETS = [
    './index.html',
    './manifest.json',
    './sw.js',
    './icon.png'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('[SW] Pre-caching assets');
                return cache.addAll(ASSETS);
            })
            .then(function() {
                return self.skipWaiting();
            })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys
                    .filter(function(key) { return key !== CACHE_NAME; })
                    .map(function(key) {
                        console.log('[SW] Removing old cache:', key);
                        return caches.delete(key);
                    })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

// Cache-first for offline use — this is a reference document, always serve cached
self.addEventListener('fetch', function(event) {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request).then(function(cached) {
            if (cached) return cached;
            return fetch(event.request).then(function(response) {
                if (response && response.status === 200) {
                    var clone = response.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            }).catch(function() {
                console.warn('[SW] Offline and not cached:', event.request.url);
            });
        })
    );
});
