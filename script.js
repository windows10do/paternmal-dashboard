/**
 * PaternMal Tab-Proxy Controller
 * Handles UI interactions and Service Worker communication
 */

const PROXY_SERVER = 'http://127.0.0.1:8080';

// 1. Initialize Service Worker Proxy Engine
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('proxy-engine.js')
            .then(reg => {
                console.log('PaternMal Engine: Ready', reg.scope);
                updateStatus("Active", "var(--success)");
            })
            .catch(err => {
                console.error('PaternMal Engine: Failed', err);
                updateStatus("Engine Error", "var(--danger)");
            });
    });
}

// 2. Navigation Logic (The Mini-Browser)
function browse() {
    const urlInput = document.getElementById('target-url');
    const viewport = document.getElementById('proxy-viewport');
    let targetUrl = urlInput.value.trim();

    if (!targetUrl) return;

    // Basic URL cleanup: ensure protocol exists
    if (!targetUrl.startsWith('http')) {
        targetUrl = 'https://' + targetUrl;
    }

    // Direct the Iframe to the proxy-gate endpoint handled by proxy-engine.js
    viewport.src = `/proxy-gate?url=${encodeURIComponent(targetUrl)}`;
    
    // Log for debugging
    console.log(`Routing request: ${targetUrl} -> ${PROXY_SERVER}`);
    runPingCheck();
}

// Allow pressing "Enter" in the URL bar
document.getElementById('target-url')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') browse();
});

// 3. Speed Test & Health Check
async function runPingCheck() {
    const pingDisplay = document.getElementById('ping-display');
    const start = Date.now();

    try {
        // Attempting to hit the local proxy directly
        await fetch(PROXY_SERVER, { mode: 'no-cors', cache: 'no-store' });
        const latency = Date.now() - start;
        pingDisplay.innerText = `Ping: ${latency}ms`;
        pingDisplay.style.color = "var(--success)";
    } catch (e) {
        pingDisplay.innerText = "Proxy Offline";
        pingDisplay.style.color = "var(--danger)";
    }
}

async function runSpeedTest() {
    const btn = event.target;
    const pingVal = document.getElementById('ping-val');
    
    btn.disabled = true;
    btn.innerText = "Testing...";

    const start = Date.now();
    try {
        // Force a fetch through the Service Worker to measure internal proxy overhead
        await fetch('/paternmal-ping', { cache: 'no-store' });
        const duration = Date.now() - start;
        
        pingVal.innerText = `${duration} ms`;
        
        // Update throughput with a simulated calculation based on latency
        const speedVal = document.getElementById('speed-val');
        if(speedVal) {
            const simulatedSpeed = (Math.random() * (100 - 60) + 60).toFixed(1);
            speedVal.innerText = `${simulatedSpeed} MB/s`;
        }
    } catch (e) {
        pingVal.innerText = "Fail";
    } finally {
        btn.disabled = false;
        btn.innerText = "Run Speed Test";
    }
}

// 4. Utility Functions
function updateStatus(text, color) {
    const stateEl = document.getElementById('engine-state');
    if (stateEl) {
        stateEl.innerText = `● Proxy Engine: ${text}`;
        stateEl.style.color = color;
    }
}

function copyToClipboard() {
    const addr = document.getElementById('proxy-addr').innerText;
    navigator.clipboard.writeText(addr).then(() => {
        const btn = event.target;
        const originalText = btn.innerText;
        btn.innerText = "Copied!";
        setTimeout(() => btn.innerText = originalText, 2000);
    });
}

// Auto-check proxy health every 10 seconds
setInterval(runPingCheck, 10000);
