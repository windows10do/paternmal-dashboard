const LOCAL_PROXY = 'http://127.0.0.1:8080';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (url.pathname.startsWith('/proxy-gate')) {
        const target = url.searchParams.get('url');
        if (!target) return;

        event.respondWith(
            fetch(`${LOCAL_PROXY}/${target}`, {
                method: event.request.method,
                headers: event.request.headers,
                mode: 'no-cors'
            }).catch(() => {
                return new Response(
                    "<h1>Proxy Connection Failed</h1><p>Ensure PaternMal is running locally on port 8080.</p>", 
                    { status: 502, headers: { 'Content-Type': 'text/html' } }
                );
            })
        );
    }
    
    if (url.pathname === '/paternmal-ping') {
        event.respondWith(
            fetch(LOCAL_PROXY, { mode: 'no-cors' })
        );
    }
});
