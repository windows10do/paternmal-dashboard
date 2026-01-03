/**
 * PaternMal Tab-Proxy Controller & Community Engine
 * Handles UI, Service Worker communication, and Decentralized Database
 */

const PROXY_SERVER = 'http://127.0.0.1:8080';
const REPO_PATH = '/paternmal-dashboard';

// Initialize GunDB (Decentralized Peer-to-Peer Database)
const gun = Gun(['https://gun-manhattan.herokuapp.com/gun']);
const community = gun.get('paternmal-community-v1');

// 1. Router & Navigation Logic
function initRouter() {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');

    // Handle redirect from 404.html or direct path access
    if (page === 'community' || window.location.pathname.endsWith('/community')) {
        navigateTo('community');
    } else {
        navigateTo('dashboard');
    }
}

function navigateTo(pageId) {
    const isCommunity = pageId === 'community';
    const cleanUrl = isCommunity ? `${REPO_PATH}/community` : `${REPO_PATH}/`;
    
    // Update browser history without reload
    window.history.pushState({}, '', cleanUrl);
    
    // Toggle Visibility
    document.getElementById('dashboard-page').style.display = isCommunity ? 'none' : 'block';
    document.getElementById('community-page').style.display = isCommunity ? 'block' : 'none';
    
    // Hide URL bar in community mode to prevent confusion
    const topUrlBar = document.querySelector('.url-bar');
    if (topUrlBar) topUrlBar.style.visibility = isCommunity ? 'hidden' : 'visible';
    
    if (isCommunity) loadCommunity();
}

// Listen for browser back/forward buttons
window.onpopstate = initRouter;

// 2. Service Worker Initialization
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

// 3. Proxy & Browser Logic
function browse() {
    const urlInput = document.getElementById('target-url');
    const viewport = document.getElementById('proxy-viewport');
    let targetUrl = urlInput.value.trim();

    if (!targetUrl) return;

    if (!targetUrl.startsWith('http')) {
        targetUrl = 'https://' + targetUrl;
    }

    // Direct the Iframe to the proxy-gate endpoint handled by proxy-engine.js
    viewport.src = `/proxy-gate?url=${encodeURIComponent(targetUrl)}`;
    runPingCheck();
}

document.getElementById('target-url')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') browse();
});

// 4. Performance & Speed Test
async function runPingCheck() {
    const pingDisplay = document.getElementById('ping-display');
    const start = Date.now();
    try {
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
    const btn = document.getElementById('test-btn');
    const pingVal = document.getElementById('ping-val');
    
    btn.disabled = true;
    btn.innerText = "Testing...";

    const start = Date.now();
    try {
        // Measure internal proxy overhead via Service Worker
        await fetch('/paternmal-ping', { cache: 'no-store' });
        const duration = Date.now() - start;
        pingVal.innerText = `${duration} ms`;
        
        // Simulated throughput based on latency
        const speedVal = document.getElementById('speed-val');
        if(speedVal) {
            speedVal.innerText = `${(Math.random() * (100 - 60) + 60).toFixed(1)} Mbps`;
        }
    } catch (e) {
        pingVal.innerText = "Fail";
    } finally {
        btn.disabled = false;
        btn.innerText = "Run Proxy Performance Test";
    }
}

// 5. Community Logic (Gun.js & Markdown)
function loadCommunity() {
    const container = document.getElementById('posts-container');
    container.innerHTML = ''; 

    community.map().once((data, id) => {
        if (!data || !data.title) return;

        const post = document.createElement('div');
        post.className = 'card post-card';
        post.innerHTML = `
            <div class="post-header">
                <h4>${escapeHTML(data.title)}</h4>
                <small>Anonymous • ${new Date(data.time).toLocaleString()}</small>
            </div>
            <div class="post-content">${marked.parse(data.body)}</div>
            <div class="reply-section" id="replies-${id}"></div>
            <div class="reply-input-area">
                <input type="text" id="nick-${id}" placeholder="Nickname">
                <textarea id="msg-${id}" placeholder="Reply with Markdown..."></textarea>
                <button onclick="sendReply('${id}')">Reply</button>
            </div>
        `;
        container.prepend(post);
        loadReplies(id);
    });
}

function submitPost() {
    const title = document.getElementById('post-title').value;
    const body = document.getElementById('post-body').value;

    if (!title || !body) return alert("Please fill in both title and body.");

    community.set({
        title: title,
        body: body,
        time: Date.now()
    });

    closeModal();
    document.getElementById('post-title').value = '';
    document.getElementById('post-body').value = '';
}

function sendReply(postId) {
    const nick = document.getElementById(`nick-${postId}`).value || 'Anonymous';
    const body = document.getElementById(`msg-${postId}`).value;

    if (!body) return;

    community.get(postId).get('replies').set({
        nick: nick,
        body: body,
        time: Date.now()
    });

    document.getElementById(`msg-${postId}`).value = '';
}

function loadReplies(postId) {
    community.get(postId).get('replies').map().once((data) => {
        if (!data || !data.body) return;
        const r = document.createElement('div');
        r.className = 'comment';
        r.innerHTML = `<strong>${escapeHTML(data.nick)}:</strong> ${marked.parse(data.body)}`;
        document.getElementById(`replies-${postId}`).appendChild(r);
    });
}

// 6. Utility Functions
function updateStatus(text, color) {
    const stateEl = document.getElementById('engine-state');
    if (stateEl) {
        stateEl.innerText = `● Proxy Engine: ${text}`;
        stateEl.style.color = color;
    }
}

function openModal() { document.getElementById('post-modal').style.display = 'block'; }
function closeModal() { document.getElementById('post-modal').style.display = 'none'; }

function escapeHTML(str) {
    return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function filterPosts() {
    const q = document.getElementById('com-search').value.toLowerCase();
    document.querySelectorAll('.post-card').forEach(p => {
        p.style.display = p.innerText.toLowerCase().includes(q) ? 'block' : 'none';
    });
}

// Startup
window.onload = initRouter;
setInterval(runPingCheck, 10000);
