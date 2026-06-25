(function () {
  const loginContainer = document.getElementById('loginContainer');
  const dashboardContainer = document.getElementById('dashboardContainer');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('logoutBtn');
  const statusIndicator = document.getElementById('statusIndicator');
  const streamKeyEl = document.getElementById('streamKey');
  const rtmpUrlEl = document.getElementById('rtmpUrl');
  const hlsUrlEl = document.getElementById('hlsUrl');
  const copyKeyBtn = document.getElementById('copyKeyBtn');
  const copyUrlBtn = document.getElementById('copyUrlBtn');

  function checkSession() {
    fetch('/api/stream-key')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Not authenticated');
      })
      .then(data => {
        showDashboard(data);
      })
      .catch(() => {
        showLogin();
      });
  }

  function showLogin() {
    loginContainer.style.display = 'flex';
    dashboardContainer.style.display = 'none';
  }

  function showDashboard(data) {
    loginContainer.style.display = 'none';
    dashboardContainer.style.display = 'flex';
    if (data) {
      streamKeyEl.textContent = data.streamKey;
      rtmpUrlEl.textContent = data.rtmpUrl;
      const host = window.location.host;
      hlsUrlEl.textContent = `http://${host}/hls/live/${data.streamKey}/index.m3u8`;
    }
    startPolling();
  }

  function startPolling() {
    setInterval(() => {
      fetch('/api/status')
        .then(res => res.json())
        .then(data => updateStatus(data.isLive))
        .catch(() => {});
    }, 3000);
  }

  function updateStatus(isLive) {
    if (isLive) {
      statusIndicator.innerHTML = '<span class="dot live"></span> LIVE';
    } else {
      statusIndicator.innerHTML = '<span class="dot offline"></span> OFFLINE';
    }
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        checkSession();
      } else {
        loginError.textContent = data.error || 'Login failed';
      }
    } catch (err) {
      loginError.textContent = 'Server error';
    }
  });

  logoutBtn.addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    showLogin();
  });

  copyKeyBtn.addEventListener('click', () => {
    copyToClipboard(streamKeyEl.textContent, copyKeyBtn);
  });

  copyUrlBtn.addEventListener('click', () => {
    copyToClipboard(rtmpUrlEl.textContent, copyUrlBtn);
  });

  function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      const original = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = original, 1500);
    }).catch(() => {
      btn.textContent = 'Failed';
      setTimeout(() => btn.textContent = 'Copy', 1500);
    });
  }

  checkSession();
})();
