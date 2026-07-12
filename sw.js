// sw.js - Intercepts requests to inject security headers
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", e => {
    if (e.request.cache === "only-if-cached" && e.request.mode !== "same-origin") return;
    
    e.respondWith(fetch(e.request).then(response => {
        if (response.status === 0) return response;
        
        const newHeaders = new Headers(response.headers);
        // These two headers unlock SharedArrayBuffer (required by Node.js WebAssembly)
        newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
        newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
        
        // This ensures other normal assets in your repo don't get blocked by the above policy
        newHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");
        
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
        });
    }).catch(err => console.error("SW Fetch Error:", err)));
});
