const http = require('http');
const httpProxy = require('http-proxy');

// Create a proxy server with custom logic
const proxy = httpProxy.createProxyServer({});

const PORT = 8080;

const server = http.createServer((req, res) => {
    // 1. Set CORS headers so your GitHub Pages site can talk to this local script
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // 2. Parse the target URL from the request
    // The dashboard sends requests like: http://127.0.0.1:8080/https://google.com
    const targetUrl = req.url.startsWith('/') ? req.url.substring(1) : req.url;

    if (!targetUrl || !targetUrl.startsWith('http')) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('PaternMal Proxy is Active and Waiting for Dashboard Traffic.');
        return;
    }

    console.log(`[PaternMal] Proxying request to: ${targetUrl}`);

    // 3. Forward the request to the real destination
    proxy.web(req, res, { target: targetUrl, changeOrigin: true }, (e) => {
        console.error(`[Error] Could not reach ${targetUrl}`);
        res.writeHead(502);
        res.end('Proxy Error: Target Unreachable');
    });
});

console.log(`
   PaternMal Local Proxy Initialized
  ------------------------------------
  Listening on: http://127.0.0.1:${PORT}
  Dashboard:    windows10do.github.io/paternmal-dashboard
  
  Status: Waiting for incoming tab traffic...
`);

server.listen(PORT);
