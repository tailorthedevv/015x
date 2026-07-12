// sw.js - WebContainer Proxy & Sandbox OS
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (e) => {
    const url = new URL(e.request.url);

    // 1. THE FIX: Dynamic Route for the WebContainer Connection Bridge
    // When the preview iframe redirects to /webcontainer/connect/, we dynamically generate
    // the required handshake page so it successfully links up with our IDE.
    if (url.pathname.includes('/webcontainer/connect/')) {
        const connectHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Connecting WebContainer...</title>
</head>
<body>
    <script type="module">
        import { setupConnect } from 'https://esm.sh/@webcontainer/api/connect';
        setupConnect();
    </script>
</body>
</html>`;

        const headers = new Headers();
        headers.set("Content-Type", "text/html");
        
        // It MUST have COEP to load inside our iframe...
        headers.set("Cross-Origin-Embedder-Policy", "credentialless");
        // ...but it MUST NOT have COOP, otherwise "Open in New Tab" will fail to communicate with the parent IDE!
        headers.set("Cross-Origin-Opener-Policy", "unsafe-none");

        e.respondWith(new Response(connectHtml, { status: 200, headers }));
        return;
    }

    // 2. Main IDE Application Sandbox Policy
    if (e.request.mode === 'navigate') {
        e.respondWith(
            fetch(e.request).then(response => {
                const newHeaders = new Headers(response.headers);
                
                // credentialless: Boots the WASM Engine while magically allowing Tailwind & Monaco!
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
});
