// public/sw.js
const APP_VERSION = "2025-09-15-02";
const CACHE_NAME = `rectime-app-shell-${APP_VERSION}`;
const RUNTIME_CACHE = `rectime-runtime-${APP_VERSION}`;

// App Shell - Core resources for offline functionality
const APP_SHELL_RESOURCES = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icons/pwa-192.png',
    '/icons/pwa-512.png'
];

// Route patterns for SPA navigation
const NAVIGATION_ROUTES = [
    '/',
    '/timetable',
    '/profile',
    '/settings',
    '/notifications'
];

// Install Event - Cache App Shell
self.addEventListener("install", (event) => {
    console.log("[SW] Installing App Shell", APP_VERSION);

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log("[SW] Caching App Shell resources");
                return cache.addAll(APP_SHELL_RESOURCES);
            })
            .then(() => {
                console.log("[SW] App Shell cached successfully");
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error("[SW] Failed to cache App Shell:", error);
            })
    );
});

// Activate Event - Clean old caches
self.addEventListener("activate", (event) => {
    console.log("[SW] Activating", APP_VERSION);

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
                            console.log("[SW] Deleting old cache:", cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log("[SW] Cache cleanup completed");
                return self.clients.claim();
            })
    );
});

// Fetch Event - App Shell Pattern with Runtime Caching
self.addEventListener("fetch", (event) => {
    const {request} = event;
    const url = new URL(request.url);

    // Handle navigation requests (SPA routing)
    if (request.mode === 'navigate') {
        event.respondWith(handleNavigationRequest(request));
        return;
    }

    // Handle static assets
    if (url.origin === self.location.origin) {
        event.respondWith(handleStaticAssets(request));
        return;
    }

    // Handle external requests
    event.respondWith(handleExternalRequests(request));
});

// Navigation Request Handler - Always return index.html for SPA
async function handleNavigationRequest(request) {
    try {
        // Try network first for fresh content
        const networkResponse = await fetch(request);

        // Cache successful navigation responses
        if (networkResponse.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log("[SW] Navigation network failed, serving cached App Shell");

        // Fallback to cached index.html for offline navigation
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match('/index.html');

        if (cachedResponse) {
            return cachedResponse;
        }

        // Ultimate fallback
        return new Response(
            '<!DOCTYPE html><lang="js" html><head><title>Offline</title></head><body><h1>アプリがオフラインです</h1><p>インターネット接続を確認してください</p></body></html>',
            {headers: {'Content-Type': 'text/html'}}
        );
    }
}

// Static Assets Handler - Cache First Strategy
async function handleStaticAssets(request) {
    try {
        // Check cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Fetch from network
        const networkResponse = await fetch(request);

        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log("[SW] Static asset failed:", request.url);
        return new Response('', {status: 404});
    }
}

// External Requests Handler - Network First
async function handleExternalRequests(request) {
    try {
        const networkResponse = await fetch(request);
        return networkResponse;
    } catch (error) {
        console.log("[SW] External request failed:", request.url);
        return new Response('Network Error', {status: 503});
    }
}

// Message Handler for communication with app
self.addEventListener("message", (event) => {
    const data = event.data;
    if (!data) return;

    switch (data.type) {
        case "SKIP_WAITING":
            self.skipWaiting();
            break;
        case "GET_VERSION":
            event.ports[0].postMessage({version: APP_VERSION});
            break;
        case "LOG_JSON":
            console.log("[SW] Received JSON:", data.payload);
            break;
        default:
            console.log("[SW] Unknown message type:", data.type);
    }
});