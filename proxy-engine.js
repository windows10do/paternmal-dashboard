const LOCAL_PROXY = 'http://127.0.0.1:8080';

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // If the URL starts with our proxy prefix
    if (url.pathname.startsWith('/proxy-gate')) {
        const target = url.searchParams.get('url');
        
        event.respondWith(
            fetch(`${LOCAL_PROXY}/${target}`, {
                method: event.request.method,
                headers: event.request.headers,
                mode: 'no-cors'
            }).catch(() => new Response("Proxy Connection Failed", { status: 502 }))
        );
    }
});
