(function () {
  const BACKEND_URL = window.BACKEND_URL || 'http://localhost:3000';
  const loginContainer = document.getElementById('loginContainer');
  const dashboardContainer = document.getElementById('dashboardContainer');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('logoutBtn');
  const channelsList = document.getElementById('channelsList');
  const channelNameInput = document.getElementById('channelName');
  const createBtn = document.getElementById('createBtn');

  let pollTimer = null;

  function showLogin() {
    loginContainer.style.display = 'flex';
    dashboardContainer.style.display = 'none';
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }

  function showDashboard() {
    loginContainer.style.display = 'none';
    dashboardContainer.style.display = 'flex';
    startPolling();
    fetchChannels();
  }

  function startPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(fetchChannels, 5000);
  }

  async function apiFetch(path, options = {}) {
    const res = await fetch(BACKEND_URL + path, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    if (res.status === 401) {
      showLogin();
      throw new Error('Unauthorized');
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || 'Request failed');
    }
    return res;
  }

  async function fetchChannels() {
    try {
      const res = await apiFetch('/api/admin/channels');
      const data = await res.json();
      renderChannels(data);
    } catch (e) { /* ignore */ }
  }

  function renderChannels(channels) {
    if (!channels || channels.length === 0) {
      channelsList.innerHTML = '<div class="empty-state">No channels yet. Create one below.</div>';
      return;
    }

    channelsList.innerHTML = '';
    channels.forEach(ch => {
      const isLive = ch.status === 'active';
      const item = document.createElement('div');
      item.className = 'channel-item';
      item.innerHTML = `
        <div class="channel-header">
          <span class="channel-name">${escapeHtml(ch.name)}</span>
          <span class="status-badge ${isLive ? 'live' : ''}">
            <span class="dot ${isLive ? 'live' : ''}"></span>
            ${isLive ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
        <div class="info-row">
          <div class="info-item">
            <span class="info-label">Stream Key:</span>
            <code id="key-${ch.id}">${escapeHtml(ch.stream_key || '')}</code>
            <button class="btn btn-small copy-btn" data-target="key-${ch.id}">Copy</button>
          </div>
          <div class="info-item">
            <span class="info-label">RTMP URL:</span>
            <code id="rtmp-${ch.id}">${escapeHtml(ch.rtmp_url || '')}</code>
            <button class="btn btn-small copy-btn" data-target="rtmp-${ch.id}">Copy</button>
          </div>
        </div>
        <div class="channel-actions">
          <button class="btn btn-small btn-danger delete-btn" data-id="${ch.id}">Delete</button>
        </div>
      `;
      channelsList.appendChild(item);
    });

    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const el = document.getElementById(targetId);
        if (!el) return;
        navigator.clipboard.writeText(el.textContent).then(() => {
          const original = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => btn.textContent = original, 1500);
        }).catch(() => {
          btn.textContent = 'Failed';
          setTimeout(() => btn.textContent = 'Copy', 1500);
        });
      });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!confirm('Delete this channel? This cannot be undone.')) return;
        try {
          await apiFetch(`/api/admin/channels/${id}`, { method: 'DELETE' });
          fetchChannels();
        } catch (e) { alert(e.message); }
      });
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    try {
      const res = await fetch(BACKEND_URL + '/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        showDashboard();
      } else {
        loginError.textContent = data.detail || 'Login failed';
      }
    } catch (err) {
      loginError.textContent = 'Server error';
    }
  });

  logoutBtn.addEventListener('click', async () => {
    try {
      await apiFetch('/api/logout', { method: 'POST' });
    } catch (e) { /* ignore */ }
    showLogin();
  });

  createBtn.addEventListener('click', async () => {
    const name = channelNameInput.value.trim();
    if (!name) return;
    try {
      await apiFetch('/api/admin/channels', {
        method: 'POST',
        body: JSON.stringify({ name })
      });
      channelNameInput.value = '';
      fetchChannels();
    } catch (e) {
      alert(e.message);
    }
  });

  showLogin();
})();
