// sw.js
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", e => {
    // Only intercept same-origin requests (like the HTML document itself).
    // Let the browser handle cross-origin requests natively to prevent CORS errors!
    if (!e.request.url.startsWith(self.location.origin)) {
        return;
    }

    e.respondWith(
        fetch(e.request).then(response => {
            // Bypass opaque/error responses directly
            if (response.status === 0 || response.type === 'opaque') {
                return response;
            }

            const newHeaders = new Headers(response.headers);
            // Mandatory headers to activate SharedArrayBuffer & WebContainers
            newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
            newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
            
            // Prevent caching on the HTML navigation request to avoid reload loops
            if (e.request.mode === 'navigate') {
                newHeaders.set("Cache-Control", "no-cache, no-store, must-revalidate");
            }

            const init = {
                status: response.status,
                statusText: response.statusText,
                headers: newHeaders
            };

            // Fix for "TypeError: Failed to convert value to 'Response'"
            // Responses with 204, 205, 304 cannot be instantiated with a body
            const emptyStatuses = [204, 205, 304];
            if (emptyStatuses.includes(response.status) || e.request.method === 'HEAD') {
                return new Response(null, init);
            }

            return new Response(response.body, init);
        }).catch(err => {
            console.error("SW Fetch Error:", err);
            throw err;
        })
    );
});
