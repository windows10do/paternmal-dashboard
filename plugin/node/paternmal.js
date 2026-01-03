const http = require('http');
const httpProxy = require('http-proxy');

// Parse command line arguments for the port
const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const PORT = (portIndex !== -1 && args[portIndex + 1]) ? args[portIndex + 1] : 8080;

const proxy = httpProxy.createProxyServer({});

const server = http.createServer((req, res) => {
    // Set CORS headers so the GitHub Pages dashboard can communicate with this local script
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Extract the target URL from the request path
    // The engine sends requests like: http://127.0.0.1:8080/https://google.com
    const targetUrl = req.url.startsWith('/') ? req.url.substring(1) : req.url;

    if (!targetUrl || !targetUrl.startsWith('http')) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(`PaternMal Proxy is Active on port ${PORT}`);
        return;
    }

    console.log(`[PaternMal] Routing request to: ${targetUrl}`);

    // Forward the request to the real destination
    proxy.web(req, res, { target: targetUrl, changeOrigin: true }, (e) => {
        console.error(`[Error] Could not reach ${targetUrl}`);
        res.writeHead(502);
        res.end('Proxy Error: Target Unreachable');
    });
});

server.listen(PORT, () => {
    console.log(`
  PaternMal Local Proxy Initialized
  ------------------------------------
  Listening on: http://127.0.0.1:${PORT}
  Dashboard:    windows10do.github.io/paternmal-dashboard
    `);
});
