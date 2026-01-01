const http = require('http');
const httpProxy = require('http-proxy');

// --- Argument Parsing ---
const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const PORT = (portIndex !== -1 && args[portIndex + 1]) ? args[portIndex + 1] : 8080;

const proxy = httpProxy.createProxyServer({});

const server = http.createServer((req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const targetUrl = req.url.startsWith('/') ? req.url.substring(1) : req.url;

    if (!targetUrl || !targetUrl.startsWith('http')) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(`PaternMal Active on port ${PORT}`);
        return;
    }

    console.log(`[PaternMal] Proxying: ${targetUrl}`);

    proxy.web(req, res, { target: targetUrl, changeOrigin: true }, (e) => {
        res.writeHead(502);
        res.end('Proxy Error');
    });
});

server.listen(PORT, () => {
    console.log(`
  PaternMal Local Proxy Initialized
  ------------------------------------
  Command:      node paternmal.js --port ${PORT}
  Dashboard:    windows10do.github.io/paternmal-dashboard
  
  Status: Listening for traffic on port ${PORT}...
    `);
});
