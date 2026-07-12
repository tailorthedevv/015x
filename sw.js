// sw.js
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (e) => {
    // Ignore non-HTTP requests (like chrome-extension://)
    if (!e.request.url.startsWith('http')) return;

    e.respondWith(
        (async () => {
            try {
                // Try to fetch normally
                let response = await fetch(e.request);

                // If it's an opaque response (no-cors), fetch again in CORS mode.
                // This allows us to read and modify the headers of 3rd party CDNs!
                if (response.type === 'opaque') {
                    try {
                        const corsRequest = new Request(e.request, { mode: 'cors' });
                        const corsResponse = await fetch(corsRequest);
                        response = corsResponse;
                    } catch (err) {
                        // Fallback to original if CORS fails
                    }
                }

                // Clone response to modify headers
                const newHeaders = new Headers(response.headers);
                
                // 1. Mandatory WebContainer Headers
                newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
                newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
                
                // 2. CRITICAL FIX: Allow 3rd-party CDNs (Tailwind, Monaco) to load under COEP!
                newHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");

                // Prevent infinite reload loops by skipping cache on main page
                if (e.request.mode === 'navigate') {
                    newHeaders.set("Cache-Control", "no-store, max-age=0");
                }

                // Safely handle empty responses
                const emptyStatuses = [204, 205, 304];
                if (emptyStatuses.includes(response.status) || e.request.method === 'HEAD') {
                    return new Response(null, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: newHeaders
                    });
                }

                return new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: newHeaders
                });

            } catch (error) {
                console.warn("SW Proxy Error for:", e.request.url, error);
                throw error;
            }
        })()
    );
});
