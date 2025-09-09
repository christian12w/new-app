// Enhanced Service Worker for AFZ Advocacy
// Provides comprehensive caching, offline functionality, and performance optimization

const SW_VERSION = 'afz-sw-v3.0';
const CACHE_NAME = `afz-cache-${SW_VERSION}`;
const RUNTIME_CACHE = `afz-runtime-${SW_VERSION}`;

// Resources to cache immediately
const STATIC_CACHE_URLS = [
    './',
    './index.html',
    './manifest.json',
    './css/afz-unified-design.css',
    './js/main.js',
    './js/language.js',
    './js/navigation.js',
    './js/pwa.js',
    './js/contact-handler.js',
    './favicon.jpg',
    './images/placeholder.svg',
    './pages/contact.html',
    './pages/about.html',
    './pages/offline.html'
];

// Cache strategies for different resource types
const CACHE_STRATEGIES = {
    // Static assets - Cache First
    static: /\.(css|js|woff2?|png|jpg|jpeg|svg|ico)$/,
    // HTML pages - Network First with cache fallback
    pages: /\.(html)$/,
    // API calls - Network First
    api: /\/api\//,
    // External resources - Stale While Revalidate
    external: /^https?:\/\/(?!.*\.(css|js|png|jpg|jpeg|svg|ico|woff2?)$)/
};

// Install event - cache static resources
self.addEventListener('install', (event) => {
    console.log(`[SW] Installing version ${SW_VERSION}`);
    
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            
            try {
                await cache.addAll(STATIC_CACHE_URLS);
                console.log('[SW] Static resources cached successfully');
            } catch (error) {
                console.warn('[SW] Failed to cache some static resources:', error);
                // Cache resources individually to avoid failures
                for (const url of STATIC_CACHE_URLS) {
                    try {
                        await cache.add(url);
                    } catch (e) {
                        console.warn(`[SW] Failed to cache ${url}:`, e);
                    }
                }
            }
            
            // Skip waiting and activate immediately
            await self.skipWaiting();
        })()
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log(`[SW] Activating version ${SW_VERSION}`);
    
    event.waitUntil(
        (async () => {
            // Clean up old caches
            const cacheNames = await caches.keys();
            const oldCaches = cacheNames.filter(name => 
                name.startsWith('afz-') && name !== CACHE_NAME && name !== RUNTIME_CACHE
            );
            
            await Promise.all(oldCaches.map(name => {
                console.log(`[SW] Deleting old cache: ${name}`);
                return caches.delete(name);
            }));
            
            // Take control of all clients
            await self.clients.claim();
            
            // Notify clients of activation
            const clients = await self.clients.matchAll({ type: 'window' });
            clients.forEach(client => {
                client.postMessage({ 
                    type: 'SW_ACTIVATED', 
                    version: SW_VERSION 
                });
            });
        })()
    );
});

// Fetch event - handle requests with appropriate caching strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other non-http(s) requests
    if (!request.url.startsWith('http')) {
        return;
    }
    
    event.respondWith(handleRequest(request));
});

// Main request handler with caching strategies
async function handleRequest(request) {
    const url = new URL(request.url);
    
    try {
        // API requests - Network First
        if (CACHE_STRATEGIES.api.test(url.pathname)) {
            return await networkFirst(request, RUNTIME_CACHE);
        }
        
        // HTML pages - Network First with offline fallback
        if (CACHE_STRATEGIES.pages.test(url.pathname)) {
            return await networkFirstWithOffline(request, CACHE_NAME);
        }
        
        // Static assets - Cache First
        if (CACHE_STRATEGIES.static.test(url.pathname)) {
            return await cacheFirst(request, CACHE_NAME);
        }
        
        // External resources - Stale While Revalidate
        if (url.origin !== self.location.origin) {
            return await staleWhileRevalidate(request, RUNTIME_CACHE);
        }
        
        // Default - Network First
        return await networkFirst(request, RUNTIME_CACHE);
        
    } catch (error) {
        console.warn('[SW] Request failed:', error);
        return await getOfflineFallback(request);
    }
}

// Cache First strategy
async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    if (cached) {
        return cached;
    }
    
    const response = await fetch(request);
    if (response.status === 200) {
        cache.put(request, response.clone());
    }
    return response;
}

// Network First strategy
async function networkFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    
    try {
        const response = await fetch(request);
        if (response.status === 200) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await cache.match(request);
        if (cached) {
            return cached;
        }
        throw error;
    }
}

// Network First with offline page fallback
async function networkFirstWithOffline(request, cacheName) {
    try {
        return await networkFirst(request, cacheName);
    } catch (error) {
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            const cache = await caches.open(cacheName);
            const offlinePage = await cache.match('./pages/offline.html');
            if (offlinePage) {
                return offlinePage;
            }
        }
        throw error;
    }
}

// Stale While Revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    // Fetch in background to update cache
    const fetchPromise = fetch(request).then(response => {
        if (response.status === 200) {
            cache.put(request, response.clone());
        }
        return response;
    }).catch(() => {});
    
    // Return cached version immediately if available
    if (cached) {
        return cached;
    }
    
    // Otherwise wait for network
    return fetchPromise;
}

// Get offline fallback response
async function getOfflineFallback(request) {
    const cache = await caches.open(CACHE_NAME);
    
    // For navigation requests, return offline page
    if (request.mode === 'navigate') {
        const offlinePage = await cache.match('./pages/offline.html');
        if (offlinePage) {
            return offlinePage;
        }
    }
    
    // For images, return placeholder
    if (request.destination === 'image') {
        const placeholder = await cache.match('./images/placeholder.svg');
        if (placeholder) {
            return placeholder;
        }
    }
    
    // Generic offline response
    return new Response('Offline - Content not available', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain' }
    });
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
    const { data } = event;
    
    if (data && data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (data && data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: SW_VERSION });
    }
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
    if (event.tag === 'contact-form-sync') {
        event.waitUntil(syncContactForms());
    }
});

// Sync contact forms when back online
async function syncContactForms() {
    try {
        const db = await openDB();
        const forms = await getAllPendingForms(db);
        
        for (const form of forms) {
            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form.data)
                });
                
                if (response.ok) {
                    await deletePendingForm(db, form.id);
                    console.log('[SW] Synced contact form:', form.id);
                }
            } catch (error) {
                console.warn('[SW] Failed to sync form:', error);
            }
        }
    } catch (error) {
        console.warn('[SW] Background sync failed:', error);
    }
}

// Simple IndexedDB operations for offline form storage
async function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('AFZ-OfflineDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('pendingForms')) {
                db.createObjectStore('pendingForms', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

async function getAllPendingForms(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['pendingForms'], 'readonly');
        const store = transaction.objectStore('pendingForms');
        const request = store.getAll();
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

async function deletePendingForm(db, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['pendingForms'], 'readwrite');
        const store = transaction.objectStore('pendingForms');
        const request = store.delete(id);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

console.log(`[SW] Service Worker ${SW_VERSION} loaded`);


