// sw.js - Corrected Security Header Injector
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", e => {
    // IMPORTANT FIX: Ignore cross-origin requests (like Tailwind CSS and esm.sh).
    // Let the browser handle these natively so they don't trigger CORS errors.
    if (!e.request.url.startsWith(self.location.origin)) {
        return;
    }

    e.respondWith(
        fetch(e.request).then(response => {
            if (response.status === 0) return response;
            
            const newHeaders = new Headers(response.headers);
            newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
            newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
            
            // Safe response reconstruction to prevent the "Failed to convert value" error
            const init = {
                status: response.status,
                statusText: response.statusText,
                headers: newHeaders
            };
            
            if (response.status === 204 || response.status === 205 || response.status === 304) {
                return new Response(null, init);
            }
            return new Response(response.body, init);
        }).catch(err => console.error("SW Fetch Error:", err))
    );
});
