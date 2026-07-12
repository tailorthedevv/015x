// sw.js - Fixed Status 0 and CORS Proxy Bugs
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (e) => {
    // ONLY intercept the main HTML navigation request.
    // We let the browser handle Tailwind, Monaco, and CDNs natively to avoid all CORS bugs!
    if (e.request.mode === 'navigate') {
        e.respondWith(
            fetch(e.request).then(response => {
                const newHeaders = new Headers(response.headers);
                
                // 'credentialless' is the magic bullet. It activates the WebContainer sandbox 
                // while automatically forcing the browser to allow 3rd-party CDNs to bypass strict rules!
                newHeaders.set("Cross-Origin-Embedder-Policy", "credentialless");
                newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
                newHeaders.set("Cache-Control", "no-store, max-age=0");

                return new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: newHeaders
                });
            }).catch(err => {
                console.error("SW Boot Error:", err);
                throw err;
            })
        );
    } 
    // DO NOTHING for all other requests. 
    // This fixes the "Failed to construct Response: status 0" error completely.
});
