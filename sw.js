// sw.js — Aircraft C/W Panel Quick Reference
// Network-first with SW-initiated force update support.
// No version number — cache name is fixed; freshness comes from strategy.
const CACHE_NAME = 'cwp-runtime-cache';

const ASSETS = [
    './', './index.html', './manifest.json', './sw.js', './icon.png' ,  './manual.html'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return Promise.all(ASSETS.map(function(url) {
                return fetch(url, { cache: 'reload' })
                    .then(function(resp) { return cache.put(url, resp); })
                    .catch(function() {});
            }));
        }).then(function() { return self.skipWaiting(); })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.filter(function(k) { return k !== CACHE_NAME; })
                    .map(function(k) { return caches.delete(k); })
            );
        }).then(function() { return self.clients.claim(); })
    );
});

// Network-first. Online → always fresh. Offline → last good cache.
self.addEventListener('fetch', function(event) {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        fetch(event.request, { cache: 'no-store' })
            .then(function(response) {
                if (response && response.status === 200) {
                    var clone = response.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            })
            .catch(function() {
                return caches.match(event.request);
            })
    );
});

// Force Update: wipe all caches, notify clients to reload.
self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'FORCE_UPDATE') {
        event.waitUntil(
            caches.keys()
                .then(function(keys) {
                    return Promise.all(keys.map(function(k) { return caches.delete(k); }));
                })
                .then(function() { return self.skipWaiting(); })
                .then(function() {
                    return self.clients.matchAll().then(function(clients) {
                        clients.forEach(function(c) {
                            c.postMessage({ type: 'FORCE_UPDATE_DONE' });
                        });
                    });
                })
        );
    }
});
