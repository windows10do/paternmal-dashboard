const PROXY_SERVER = 'http://127.0.0.1:8080';
const REPO_PATH = '/paternmal-dashboard';

// Initialize GunDB
const gun = Gun(['https://gun-manhattan.herokuapp.com/gun']);
const community = gun.get('paternmal-community-v1');

// 1. Router & Navigation
function initRouter() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('page') === 'community' || window.location.pathname.endsWith('/community')) {
        navigateTo('community');
    } else {
        navigateTo('dashboard');
    }
}

function navigateTo(pageId) {
    const isCommunity = pageId === 'community';
    const cleanUrl = isCommunity ? `${REPO_PATH}/community` : `${REPO_PATH}/`;
    window.history.pushState({}, '', cleanUrl);
    
    document.getElementById('dashboard-page').style.display = isCommunity ? 'none' : 'block';
    document.getElementById('community-page').style.display = isCommunity ? 'block' : 'none';
    document.getElementById('top-url-bar').style.visibility = isCommunity ? 'hidden' : 'visible';
    
    if (isCommunity) loadCommunity();
}

window.onpopstate = initRouter;

// 2. Community Logic
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
                <small>${new Date(data.time).toLocaleString()}</small>
            </div>
            <div class="post-content">${marked.parse(data.body)}</div>
            <div class="reply-section" id="replies-${id}"></div>
            <div class="reply-input-area">
                <input type="text" id="nick-${id}" placeholder="Nickname">
                <textarea id="msg-${id}" placeholder="Your reply (Markdown)..."></textarea>
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
    if (!title || !body) return;
    community.set({ title, body, time: Date.now() });
    closeModal();
    document.getElementById('post-title').value = '';
    document.getElementById('post-body').value = '';
}

function sendReply(postId) {
    const nick = document.getElementById(`nick-${postId}`).value || 'Anonymous';
    const body = document.getElementById(`msg-${postId}`).value;
    if (!body) return;
    community.get(postId).get('replies').set({ nick, body, time: Date.now() });
    document.getElementById(`msg-${postId}`).value = '';
}

function loadReplies(postId) {
    community.get(postId).get('replies').map().once(data => {
        if (!data || !data.body) return;
        const r = document.createElement('div');
        r.className = 'comment';
        r.innerHTML = `<strong>${escapeHTML(data.nick)}:</strong> ${marked.parse(data.body)}`;
        document.getElementById(`replies-${postId}`).appendChild(r);
    });
}

// 3. Proxy Logic
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('proxy-engine.js').then(() => updateStatus("Active", "var(--success)"));
    });
}

function browse() {
    const urlInput = document.getElementById('target-url');
    const viewport = document.getElementById('proxy-viewport');
    let targetUrl = urlInput.value.trim();
    if (!targetUrl) return;
    if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;
    viewport.src = `/proxy-gate?url=${encodeURIComponent(targetUrl)}`;
    runPingCheck();
}

async function runPingCheck() {
    const pingDisplay = document.getElementById('ping-display');
    const start = Date.now();
    try {
        await fetch(PROXY_SERVER, { mode: 'no-cors', cache: 'no-store' });
        pingDisplay.innerText = `Ping: ${Date.now() - start}ms`;
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
        await fetch('/paternmal-ping', { cache: 'no-store' });
        pingVal.innerText = `${Date.now() - start} ms`;
    } catch (e) {
        pingVal.innerText = "Fail";
    } finally {
        btn.disabled = false;
        btn.innerText = "Run Proxy Performance Test";
    }
}

// 4. Utilities
function openModal() { document.getElementById('post-modal').style.display = 'block'; }
function closeModal() { document.getElementById('post-modal').style.display = 'none'; }
function escapeHTML(s) { return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function updateStatus(text, color) { 
    const el = document.getElementById('engine-state');
    if(el) { el.innerText = `● Proxy Engine: ${text}`; el.style.color = color; }
}

function filterPosts() {
    const q = document.getElementById('com-search').value.toLowerCase();
    document.querySelectorAll('.post-card').forEach(p => p.style.display = p.innerText.toLowerCase().includes(q) ? 'block' : 'none');
}

window.onload = initRouter;
setInterval(runPingCheck, 10000);
