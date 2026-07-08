(function () {
  const BACKEND_URL = window.BACKEND_URL || 'http://localhost:3000';
  let APP = {};

  APP.state = {
    channels: [],
    favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
    currentChannelId: null,
    isLive: false,
    hls: null,
    nowPlaying: [],
    upNext: [],
    notifications: [],
    recordings: [],
    epgGrid: {},
    epgDate: new Date().toISOString().slice(0, 10),
    activeTab: 'player',
    sidebarOpen: false,
    qualityLevels: [],
    currentLevel: -1,
    volume: 1,
    muted: false,
    playerReady: false,
    language: localStorage.getItem('lang') || 'en',
    settings: {},
    lastChannelId: localStorage.getItem('lastChannelId') || null,
    viewerCount: 0,
    latency: 0,
    theaterMode: false,
    chatMessages: [],
    chatUsername: localStorage.getItem('chatUsername') || '',
    chatPollTimer: null,
    watchHistory: JSON.parse(localStorage.getItem('watchHistory') || '[]'),
    streamStartedAt: null,
    lastSeen: {},
    chatOpen: true,
    infoOpen: false,
  };

  const $ = (id) => document.getElementById(id);
  const qs = (sel) => document.querySelector(sel);
  const qsa = (sel) => document.querySelectorAll(sel);

  I18N.setLanguage(APP.state.language);

  function html(str) { const d = document.createElement('div'); d.innerHTML = str; return d.firstElementChild; }

  function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }

  function t(key, params) { return I18N.t(key, params); }

  async function api(path, options = {}) {
    const res = await fetch(BACKEND_URL + path, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    return res;
  }

  async function apiJSON(path, options = {}) {
    const res = await api(path, options);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || 'Request failed');
    }
    return res.json();
  }

  function showToast(msg, type = 'info') {
    let toast = qs('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = 'toast ' + type + ' show';
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('show'), 4000);
  }

  function showModal(id) {
    const el = $(id);
    if (el) el.classList.add('show');
  }

  function hideModal(id) {
    const el = $(id);
    if (el) el.classList.remove('show');
  }

  /* ─── Favorites (localStorage) ─── */
  function saveFavorites() {
    localStorage.setItem('favorites', JSON.stringify(APP.state.favorites));
  }

  function toggleFavorite(channelId) {
    const isFav = APP.state.favorites.includes(channelId);
    if (isFav) {
      APP.state.favorites = APP.state.favorites.filter(f => f !== channelId);
    } else {
      APP.state.favorites.push(channelId);
    }
    saveFavorites();
    renderChannelList();
  }

  /* ─── Channels ─── */
  async function fetchChannels() {
    try {
      const data = await apiJSON('/api/channels');
      const prevId = APP.state.currentChannelId;
      APP.state.channels = data;
      if (data.length > 0) {
        const stillExists = data.find(c => c.id === prevId);
        if (!stillExists) {
          const active = data.find(c => c.status === 'active');
          APP.state.currentChannelId = active ? active.id : data[0].id;
        }
      } else {
        APP.state.currentChannelId = null;
      }
      renderChannelList();
      loadCurrentChannel();
      updateNowPlayingOverlay();
      updateUpNextOverlay();
      updateInfoPanel();
    } catch {}
  }

  function renderChannelList() {
    const list = $('channelList');
    if (!list) return;
    const searchQ = ($('sidebarSearch')) ? $('sidebarSearch').value.toLowerCase() : '';
    const filter = window.appFilter || 'all';
    const catFilter = '';

    let channels = APP.state.channels;
    if (searchQ) {
      channels = channels.filter(c =>
        c.name.toLowerCase().includes(searchQ) ||
        (c.category || '').toLowerCase().includes(searchQ)
      );
    }
    if (filter === 'live') channels = channels.filter(c => c.status === 'active');
    if (filter === 'favorites') channels = channels.filter(c => APP.state.favorites.includes(c.id));
    if (catFilter) channels = channels.filter(c => c.category === catFilter);

    list.innerHTML = '';
    if (channels.length === 0) {
      list.innerHTML = '<div style="padding:20px;text-align:center;color:#666;font-size:13px;">' + t('no_channels') + '</div>';
      return;
    }

    channels.forEach(ch => {
      const isActive = ch.status === 'active';
      const isFav = APP.state.favorites.includes(ch.id);
      const isCurrent = ch.id === APP.state.currentChannelId;

      const item = document.createElement('div');
      item.className = 'channel-item' + (isCurrent ? ' active' : '');
      item.innerHTML = `
        <div class="channel-icon">${ch.icon_url ? '<img src="' + escapeHtml(ch.icon_url) + '" alt="">' : ch.name[0].toUpperCase()}</div>
        <div class="channel-info">
          <div class="channel-name">${escapeHtml(ch.name)}${ch.is_mature ? '<span class="mature-badge">18+</span>' : ''}</div>
          <div class="channel-category">${escapeHtml(ch.category || 'General')}</div>
        </div>
        <button class="fav-btn${isFav ? ' active' : ''}" data-id="${ch.id}" title="Favorite">${isFav ? '\u2605' : '\u2606'}</button>
        <div class="channel-status">
          <span class="status-dot ${isActive ? 'live' : 'idle'}"></span>
          <span class="status-text ${isActive ? 'live' : 'idle'}">${isActive ? t('live') : t('offline')}</span>
        </div>
      `;

      const favBtn = item.querySelector('.fav-btn');
      favBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleFavorite(ch.id); });

      item.addEventListener('click', () => { selectChannel(ch.id); });

      list.appendChild(item);
    });
  }

  function selectChannel(channelId) {
    APP.state.currentChannelId = channelId;
    localStorage.setItem('lastChannelId', channelId);
    loadCurrentChannel();
    renderChannelList();
    updateInfoPanel();
    updateChannelTitle();
    if (window.innerWidth <= 768) {
      $('sidebar').classList.remove('open');
      APP.state.sidebarOpen = false;
    }
  }

  /* ─── Player ─── */
  function loadCurrentChannel() {
    const ch = APP.state.channels.find(c => c.id === APP.state.currentChannelId);
    const video = $('video');
    const offlineScreen = $('offlineScreen');

    if (!ch || ch.status !== 'active' || !ch.playback_url) {
      APP.state.isLive = false;
      if (offlineScreen) offlineScreen.classList.remove('hidden');
      destroyHls();
      if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
      updatePlayerUI();
      return;
    }

    if (APP.state.isLive && video && video.src && video.src.includes(ch.playback_url)) return;

    if (offlineScreen) offlineScreen.classList.add('hidden');
    loadHlsStream(ch.playback_url, ch.id);
    document.title = ch.name + ' - ' + (APP.state.settings.platform_name || 'My Live TV');
    updateChannelTitle();
  }

  function destroyHls() {
    if (APP.state.hls) {
      try { APP.state.hls.destroy(); } catch {}
      APP.state.hls = null;
    }
    APP.state.playerReady = false;
    APP.state.qualityLevels = [];
  }

  function loadHlsStream(url, channelId) {
    const video = $('video');
    if (!video) return;
    destroyHls();

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 10,
        backBufferLength: 0,
        liveSyncDurationCount: 1,
        liveMaxLatencyDurationCount: 3,
        lowLatencyMode: true,
        enableWorker: true,
        maxLoadingDelay: 0,
      });

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        APP.state.playerReady = true;
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        APP.state.isLive = true;
        updatePlayerUI();
        video.play().catch(() => {});
        APP.state.qualityLevels = hls.levels.map((l, i) => ({
          index: i,
          height: l.height,
          bitrate: l.bitrate,
          name: l.height ? l.height + 'p' : (l.bitrate ? Math.round(l.bitrate / 1000) + 'k' : 'Auto'),
        }));
        updateQualitySelector();
        fetchViewerCount();
        fetchChannelInfo();
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (e, data) => {
        APP.state.currentLevel = data.level;
      });

      hls.on(Hls.Events.ERROR, (e, data) => {
        if (data.fatal) {
          APP.state.isLive = false;
          const offline = $('offlineScreen');
          if (offline) offline.classList.remove('hidden');
          updatePlayerUI();
          setTimeout(() => {
            if (APP.state.currentChannelId === channelId) loadCurrentChannel();
          }, 5000);
        }
      });

      hls.on(Hls.Events.BUFFER_APPENDING, () => {
        const progress = $('progressBuffered');
        if (progress && hls) {
          const buffLen = hls.media?.buffered?.length || 0;
          if (buffLen > 0) {
            const buffEnd = hls.media.buffered.end(buffLen - 1);
            const dur = hls.media.duration || 1;
            progress.style.width = Math.min((buffEnd / dur) * 100, 100) + '%';
          }
        }
      });

      hls.loadSource(url);
      hls.attachMedia(video);
      APP.state.hls = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        APP.state.isLive = true;
        updatePlayerUI();
        video.play().catch(() => {});
        fetchViewerCount();
        fetchChannelInfo();
      });
      video.addEventListener('error', () => {
        APP.state.isLive = false;
        const offline = $('offlineScreen');
        if (offline) offline.classList.remove('hidden');
      });
    } else {
      const offline = $('offlineScreen');
      if (offline) offline.classList.remove('hidden');
    }
  }

  function updatePlayerUI() {
    const video = $('video');
    const liveIndicator = $('liveIndicator');
    const offlineScreen = $('offlineScreen');

    if (APP.state.isLive) {
      if (liveIndicator) { liveIndicator.textContent = t('live'); liveIndicator.classList.remove('hidden'); }
      if (offlineScreen) offlineScreen.classList.add('hidden');
    } else {
      if (liveIndicator) liveIndicator.classList.add('hidden');
    }

    if ($('progressPlayed')) $('progressPlayed').style.width = '0%';
    if ($('progressBuffered')) $('progressBuffered').style.width = '0%';
    if ($('currentTime')) $('currentTime').textContent = '0:00';
    if ($('duration')) $('duration').textContent = '0:00';
  }

  /* ─── Viewer Count ─── */
  async function fetchViewerCount() {
    if (!APP.state.currentChannelId || !APP.state.isLive) {
      APP.state.viewerCount = 0;
      updateViewerDisplay();
      return;
    }
    try {
      const data = await apiJSON('/api/analytics/channels/' + APP.state.currentChannelId + '/viewers');
      APP.state.viewerCount = data.viewers || 0;
      updateViewerDisplay();
    } catch {
      APP.state.viewerCount = 0;
      updateViewerDisplay();
    }
  }

  function updateViewerDisplay() {
    const el = $('viewerCount');
    if (el) {
      el.textContent = APP.state.viewerCount.toLocaleString() + ' viewers';
      el.style.display = APP.state.isLive ? '' : 'none';
    }
  }

  /* ─── Latency ─── */
  function updateLatency() {
    const video = $('video');
    const el = $('latencyIndicator');
    if (!video || !el) return;
    if (!APP.state.isLive || !video.duration || !isFinite(video.duration)) {
      el.style.display = 'none';
      return;
    }
    const liveEdge = video.buffered.length > 0 ? video.buffered.end(video.buffered.length - 1) : video.duration;
    const latency = liveEdge - video.currentTime;
    APP.state.latency = Math.round(latency * 10) / 10;
    el.textContent = APP.state.latency + 's';
    el.style.display = '';
    el.className = 'latency-badge ' + (APP.state.latency < 3 ? 'good' : APP.state.latency < 6 ? 'ok' : 'high');
  }

  /* ─── Channel Info Panel ─── */
  async function fetchChannelInfo() {
    updateInfoPanel();
    APP.state.streamStartedAt = APP.state.channels.find(c => c.id === APP.state.currentChannelId)?.stream_started_at;
    updateStreamUptime();
  }

  function updateInfoPanel() {
    const ch = APP.state.channels.find(c => c.id === APP.state.currentChannelId);
    const el = $('channelInfoPanel');
    if (!el || !ch) return;
    el.innerHTML = `
      <div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="status-dot ${ch.status === 'active' ? 'live' : 'idle'}" style="display:inline-block;"></span> ${ch.status === 'active' ? 'Live' : 'Offline'}</span></div>
      <div class="info-row"><span class="info-label">Category</span><span class="info-value">${escapeHtml(ch.category || 'General')}</span></div>
      ${ch.stream_title ? '<div class="info-row"><span class="info-label">Title</span><span class="info-value">' + escapeHtml(ch.stream_title) + '</span></div>' : ''}
      ${ch.description ? '<div class="info-row"><span class="info-label">Description</span><span class="info-value">' + escapeHtml(ch.description) + '</span></div>' : ''}
      <div class="info-row"><span class="info-label">Viewers</span><span class="info-value">${APP.state.viewerCount.toLocaleString()}</span></div>
      <div id="streamUptime"></div>
    `;
    updateStreamUptime();
  }

  function updateStreamUptime() {
    const el = $('streamUptime');
    if (!el) return;
    if (!APP.state.streamStartedAt || !APP.state.isLive) { el.innerHTML = ''; return; }
    try {
      const started = new Date(APP.state.streamStartedAt);
      const diff = Math.floor((Date.now() - started.getTime()) / 1000);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      el.innerHTML = `<div class="info-row"><span class="info-label">Uptime</span><span class="info-value">${h}h ${m}m ${s}s</span></div>`;
    } catch { el.innerHTML = ''; }
  }

  function updateChannelTitle() {
    const ch = APP.state.channels.find(c => c.id === APP.state.currentChannelId);
    const el = $('channelTitleOverlay');
    if (!el || !ch) return;
    el.innerHTML = (ch.stream_title ? '<div class="stream-title">' + escapeHtml(ch.stream_title) + '</div>' : '') + '<div class="stream-channel">' + escapeHtml(ch.name) + '</div>';
  }

  /* ─── Video Controls ─── */
  function setupVideoControls() {
    const video = $('video');
    const progressWrapper = $('progressWrapper');
    const progressPlayed = $('progressPlayed');
    const progressBuffered = $('progressBuffered');
    const currentTime = $('currentTime');
    const duration = $('duration');
    const volSlider = $('volumeSlider');
    const volBtn = $('volumeBtn');
    const fsBtn = $('fullscreenBtn');
    const qualitySelect = $('qualitySelect');
    const refreshBtn = $('refreshBtn');

    if (!video) return;

    video.addEventListener('timeupdate', () => {
      if (!video.duration) return;
      const pct = (video.currentTime / video.duration) * 100;
      if (progressPlayed) progressPlayed.style.width = pct + '%';
      if (currentTime) currentTime.textContent = formatTime(video.currentTime);
    });

    video.addEventListener('loadedmetadata', () => {
      if (duration) duration.textContent = formatTime(video.duration || 0);
    });

    video.addEventListener('volumechange', () => {
      if (volSlider) volSlider.value = video.volume;
      APP.state.volume = video.volume;
      APP.state.muted = video.muted;
      if (volBtn) volBtn.textContent = video.muted || video.volume === 0 ? '\u{1F507}' : video.volume < 0.5 ? '\u{1F509}' : '\u{1F50A}';
      localStorage.setItem('volume', video.volume);
    });

    const savedVolume = localStorage.getItem('volume');
    if (savedVolume !== null) {
      video.volume = parseFloat(savedVolume);
      if (volSlider) volSlider.value = savedVolume;
    }

    if (progressWrapper) {
      progressWrapper.addEventListener('click', (e) => {
        if (!video.duration) return;
        const rect = progressWrapper.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        video.currentTime = pct * video.duration;
      });
    }

    if (volSlider) {
      volSlider.addEventListener('input', () => {
        video.volume = parseFloat(volSlider.value);
        video.muted = video.volume === 0;
      });
    }

    if (volBtn) {
      volBtn.addEventListener('click', () => {
        video.muted = !video.muted;
      });
    }

    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        const wrapper = $('playerWrapper');
        if (!document.fullscreenElement) {
          if (wrapper.requestFullscreen) wrapper.requestFullscreen();
          else if (wrapper.webkitRequestFullscreen) wrapper.webkitRequestFullscreen();
        } else {
          if (document.exitFullscreen) document.exitFullscreen();
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        }
      });
    }

    if (qualitySelect) {
      qualitySelect.addEventListener('change', () => {
        const val = parseInt(qualitySelect.value);
        if (APP.state.hls) {
          APP.state.currentLevel = val;
          APP.state.hls.currentLevel = val;
        }
      });
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        loadCurrentChannel();
        showToast('Stream refreshed', 'success');
      });
    }

    const playerWrapper = $('playerWrapper');
    if (playerWrapper) {
      playerWrapper.addEventListener('dblclick', () => {
        if (fsBtn) fsBtn.click();
      });
    }
  }

  function updateQualitySelector() {
    const sel = $('qualitySelect');
    if (!sel) return;
    sel.innerHTML = '<option value="-1">' + t('auto') + '</option>';
    APP.state.qualityLevels.forEach(l => {
      const opt = document.createElement('option');
      opt.value = l.index;
      opt.textContent = l.name;
      if (l.index === APP.state.currentLevel) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  function formatTime(seconds) {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    return m + ':' + String(s).padStart(2, '0');
  }

  /* ─── Theater Mode ─── */
  function toggleTheaterMode() {
    APP.state.theaterMode = !APP.state.theaterMode;
    const wrapper = $('playerWrapper');
    const sidebar = $('sidebar');
    const infoBar = qs('.info-bar');
    const chatPanel = $('chatPanel');
    const container = qs('.content-area');
    if (APP.state.theaterMode) {
      if (sidebar) sidebar.style.display = 'none';
      if (wrapper) wrapper.style.height = 'calc(100vh - 48px)';
      if (container) container.style.background = '#000';
      if (chatPanel) chatPanel.style.display = 'flex';
    } else {
      if (sidebar) sidebar.style.display = '';
      if (wrapper) wrapper.style.height = '';
      if (container) container.style.background = '';
      if (chatPanel) chatPanel.style.display = APP.state.chatOpen ? 'flex' : 'none';
    }
  }

  /* ─── Picture-in-Picture ─── */
  async function togglePiP() {
    const video = $('video');
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch (e) {
      showToast('PiP not supported', 'error');
    }
  }

  /* ─── Watch History ─── */
  function addToWatchHistory(channelId) {
    const history = APP.state.watchHistory;
    const existing = history.findIndex(h => h.channel_id === channelId);
    if (existing >= 0) {
      history[existing].last_watched = new Date().toISOString();
      history[existing].count = (history[existing].count || 0) + 1;
    } else {
      history.push({ channel_id: channelId, last_watched: new Date().toISOString(), count: 1 });
    }
    if (history.length > 50) history.splice(0, history.length - 50);
    localStorage.setItem('watchHistory', JSON.stringify(history));
  }

  /* ─── Chat ─── */
  function setupChat() {
    const input = $('chatInput');
    const sendBtn = $('chatSendBtn');
    if (!input || !sendBtn) return;

    const doSend = async () => {
      const msg = input.value.trim();
      if (!msg) return;
      if (!APP.state.chatUsername) {
        const name = prompt('Choose a chat display name (max 30 chars):');
        if (!name || !name.trim()) return;
        APP.state.chatUsername = name.trim().slice(0, 30);
        localStorage.setItem('chatUsername', APP.state.chatUsername);
      }
      if (!APP.state.currentChannelId) return;
      try {
        await api('/api/channels/' + APP.state.currentChannelId + '/chat', {
          method: 'POST',
          body: JSON.stringify({ username: APP.state.chatUsername, message: msg }),
        });
        input.value = '';
        fetchChatMessages();
      } catch (e) {
        showToast(e.message || 'Failed to send', 'error');
      }
    };

    sendBtn.addEventListener('click', doSend);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSend(); });
  }

  async function fetchChatMessages() {
    if (!APP.state.currentChannelId) return;
    const lastTs = APP.state.chatMessages.length > 0 ? APP.state.chatMessages[APP.state.chatMessages.length - 1].timestamp : '';
    try {
      const url = '/api/channels/' + APP.state.currentChannelId + '/chat' + (lastTs ? '?since=' + encodeURIComponent(lastTs) : '');
      const msgs = await apiJSON(url);
      if (msgs.length > 0) {
        APP.state.chatMessages = APP.state.chatMessages.concat(msgs);
        if (APP.state.chatMessages.length > 200) {
          APP.state.chatMessages = APP.state.chatMessages.slice(-200);
        }
        renderChat();
      }
    } catch {}
  }

  function renderChat() {
    const container = $('chatMessages');
    if (!container) return;
    const wasScrolled = container.scrollTop + container.clientHeight >= container.scrollHeight - 20;
    container.innerHTML = '';
    APP.state.chatMessages.forEach(msg => {
      const div = document.createElement('div');
      div.className = 'chat-msg';
      div.innerHTML = '<span class="chat-user">' + escapeHtml(msg.username) + ':</span> ' + escapeHtml(msg.message);
      container.appendChild(div);
    });
    if (wasScrolled) container.scrollTop = container.scrollHeight;
  }

  /* ─── Keyboard Shortcuts ─── */
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const v = $('video');
      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (v) { if (v.paused) v.play(); else v.pause(); }
          break;
        case 'f': case 'F':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            $('fullscreenBtn')?.click();
          }
          break;
        case 'm': case 'M':
          if (v) v.muted = !v.muted;
          break;
        case 't': case 'T':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            toggleTheaterMode();
          }
          break;
        case 'p': case 'P':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            togglePiP();
          }
          break;
        case 'c': case 'C':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            toggleChatPanel();
          }
          break;
        case 'i': case 'I':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            toggleInfoPanel();
          }
          break;
        case '?':
          e.preventDefault();
          showModal('shortcutsModal');
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (v) v.volume = Math.min(1, v.volume + 0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (v) v.volume = Math.max(0, v.volume - 0.1);
          break;
        case 'ArrowRight':
          if (!v || !v.duration) { e.preventDefault(); selectNextChannel(1); }
          break;
        case 'ArrowLeft':
          if (!v || !v.duration) { e.preventDefault(); selectNextChannel(-1); }
          break;
        case 'Escape':
          hideModal('shortcutsModal');
          break;
      }
    });
  }

  function selectNextChannel(dir) {
    const chs = APP.state.channels;
    if (chs.length === 0) return;
    const idx = chs.findIndex(c => c.id === APP.state.currentChannelId);
    const next = (idx + dir + chs.length) % chs.length;
    selectChannel(chs[next].id);
  }

  /* ─── Chat & Info Panel Toggles ─── */
  function toggleChatPanel() {
    APP.state.chatOpen = !APP.state.chatOpen;
    const panel = $('chatPanel');
    if (panel) panel.style.display = APP.state.chatOpen ? 'flex' : 'none';
  }

  function toggleInfoPanel() {
    APP.state.infoOpen = !APP.state.infoOpen;
    const panel = $('infoPanel');
    if (panel) panel.classList.toggle('open');
  }

  /* ─── Now Playing / Up Next ─── */
  async function fetchNowPlaying() {
    try {
      APP.state.nowPlaying = await apiJSON('/api/epg/now');
      updateNowPlayingOverlay();
    } catch {}
  }

  async function fetchUpNext() {
    try {
      APP.state.upNext = await apiJSON('/api/epg/upnext');
      updateUpNextOverlay();
    } catch {}
  }

  function updateNowPlayingOverlay() {
    const overlay = $('nowPlayingOverlay');
    if (!overlay) return;
    const current = APP.state.nowPlaying.find(p => p.channel_id === APP.state.currentChannelId);
    if (current) {
      overlay.innerHTML = `
        <div class="now-playing-title">${escapeHtml(current.title)}</div>
        ${current.description ? '<div class="now-playing-desc">' + escapeHtml(current.description) + '</div>' : ''}
        <div class="now-playing-time">${Math.floor((current.remaining_seconds || 0) / 60)}m remaining</div>
      `;
      overlay.style.display = 'block';
    } else {
      overlay.style.display = 'none';
    }
  }

  function updateUpNextOverlay() {
    const el = $('upNextInfo');
    if (!el) return;
    const next = APP.state.upNext.find(p => p.channel_id === APP.state.currentChannelId);
    if (next) {
      el.innerHTML = '<strong>' + t('up_next') + ':</strong> ' + escapeHtml(next.title) + ' (' + Math.floor((next.starts_in_seconds || 0) / 60) + 'm)';
      el.style.display = 'block';
    } else {
      el.style.display = 'none';
    }
  }

  /* ─── EPG ─── */
  async function fetchEPGGrid() {
    try {
      APP.state.epgGrid = await apiJSON('/api/epg/grid?date=' + APP.state.epgDate);
      renderEPGGrid();
    } catch {}
  }

  function renderEPGGrid() {
    const container = $('epgGridContent');
    if (!container) return;
    const channels = APP.state.channels;
    const now = new Date();
    let html = '<table class="epg-table"><thead><tr><th>Channel</th>';
    for (let h = 6; h < 26; h++) {
      html += '<th>' + String(h % 24).padStart(2, '0') + ':00</th>';
    }
    html += '</tr></thead><tbody>';

    channels.forEach(ch => {
      const progs = APP.state.epgGrid[ch.id] || [];
      html += '<tr><td><strong>' + escapeHtml(ch.name) + '</strong></td>';
      for (let h = 6; h < 26; h++) {
        const hourStart = new Date(APP.state.epgDate + 'T' + String(h % 24).padStart(2, '0') + ':00:00');
        const hourEnd = new Date(hourStart.getTime() + 3600000);
        const match = progs.find(p => {
          try {
            const ps = new Date(p.start_datetime);
            const pe = new Date(p.end_datetime);
            return ps < hourEnd && pe > hourStart;
          } catch { return false; }
        });
        const isNow = match && (() => { try { return new Date(match.start_datetime) <= now && new Date(match.end_datetime) > now; } catch { return false; } })();
        html += '<td>' + (match ? '<div class="epg-program' + (isNow ? ' now' : '') + '"><div class="epg-title">' + escapeHtml(match.title) + '</div><div class="epg-time">' + match.start_datetime.slice(11, 16) + '-' + match.end_datetime.slice(11, 16) + '</div></div>' : '') + '</td>';
      }
      html += '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  }

  /* ─── Notifications ─── */
  async function fetchNotifications() {
    try {
      APP.state.notifications = await apiJSON('/api/notifications');
      renderNotifications();
    } catch {}
  }

  function renderNotifications() {
    const banner = $('notificationBanner');
    if (!banner) return;
    const active = APP.state.notifications.filter(n => n.active);
    if (active.length > 0) {
      banner.textContent = active[0].message;
      banner.classList.add('show');
    } else {
      banner.classList.remove('show');
    }
  }

  /* ─── Modal listeners ─── */
  function setupModalListeners() {
    const epgModal = $('epgModal');
    const recModal = $('recordingsModal');

    if (epgModal) {
      const observer = new MutationObserver(() => {
        if (epgModal.classList.contains('show')) {
          APP.state.epgDate = document.getElementById('epgDate')?.value || new Date().toISOString().slice(0, 10);
          fetchEPGGrid();
        }
      });
      observer.observe(epgModal, { attributes: true, attributeFilter: ['class'] });

      const dateInput = document.getElementById('epgDate');
      if (dateInput) {
        dateInput.addEventListener('change', () => {
          if (epgModal.classList.contains('show')) {
            APP.state.epgDate = dateInput.value;
            fetchEPGGrid();
          }
        });
      }
      const todayBtn = document.getElementById('epgTodayBtn');
      if (todayBtn) {
        todayBtn.addEventListener('click', () => {
          if (dateInput) {
            const today = new Date();
            dateInput.value = today.toISOString().slice(0, 10);
            APP.state.epgDate = dateInput.value;
            if (epgModal.classList.contains('show')) fetchEPGGrid();
          }
        });
      }
    }

    if (recModal) {
      const observer = new MutationObserver(() => {
        if (recModal.classList.contains('show')) {
          fetchRecordings();
        }
      });
      observer.observe(recModal, { attributes: true, attributeFilter: ['class'] });
    }
  }

  /* ─── Recordings ─── */
  async function fetchRecordings() {
    try {
      APP.state.recordings = await apiJSON('/api/recordings');
      renderRecordings();
    } catch {}
  }

  function renderRecordings() {
    const container = $('recordingsList');
    if (!container) return;
    if (APP.state.recordings.length === 0) {
      container.innerHTML = '<div style="padding:20px;text-align:center;color:#666;">No VOD recordings available</div>';
      return;
    }
    container.innerHTML = '';
    APP.state.recordings.forEach(rec => {
      const card = document.createElement('div');
      card.className = 'recording-card';
      card.innerHTML = `
        <div class="recording-title">${escapeHtml(rec.title)}</div>
        <div class="recording-meta">${rec.duration ? Math.round(rec.duration) + 's' : ''} ${rec.channel_name ? '\u00B7 ' + escapeHtml(rec.channel_name) : ''}</div>
      `;
      card.addEventListener('click', () => {
        if (rec.playback_url) {
          const video = $('video');
          if (video) {
            destroyHls();
            video.src = rec.playback_url;
            video.play().catch(() => {});
            APP.state.isLive = false;
            const offline = $('offlineScreen');
            if (offline) offline.classList.add('hidden');
            updatePlayerUI();
          }
        }
      });
      container.appendChild(card);
    });
  }

  /* ─── Search ─── */
  let searchTimeout = null;
  function setupSearch() {
    const input = $('sidebarSearch');
    if (!input) return;
    input.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        renderChannelList();
      }, 300);
    });
  }

  /* ─── Tabs ─── */
  function setupTabs() {
    qsa('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');
        qsa('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        qsa('.tab-content').forEach(tc => tc.classList.remove('active'));
        const content = $(target + 'Tab');
        if (content) content.classList.add('active');
        APP.state.activeTab = target;
        if (target === 'recordings') fetchRecordings();
        if (target === 'epg') { APP.state.epgDate = new Date().toISOString().slice(0, 10); fetchEPGGrid(); }
      });
    });
  }

  /* ─── Settings / Branding ─── */
  async function fetchPublicSettings() {
    try {
      APP.state.settings = await apiJSON('/api/admin/public/settings');
      applySettings();
    } catch {}
  }

  function applySettings() {
    const s = APP.state.settings;
    if (s.platform_name) {
      document.title = s.platform_name;
      qsa('.logo-text').forEach(el => el.textContent = s.platform_name);
    }
    if (s.logo_url) {
      qsa('.logo-img').forEach(el => { el.src = s.logo_url; el.style.display = 'inline'; });
    }
    if (s.primary_color) {
      document.documentElement.style.setProperty('--accent', s.primary_color);
    }
    if (s.custom_css) {
      const style = document.createElement('style');
      style.textContent = s.custom_css;
      document.head.appendChild(style);
    }
    if (s.default_language) {
      APP.state.language = s.default_language;
      I18N.setLanguage(s.default_language);
    }
  }

  /* ─── Hamburger ─── */
  function setupHamburger() {
    const btn = $('hamburger');
    const sidebar = $('sidebar');
    if (!btn || !sidebar) return;
    btn.addEventListener('click', () => {
      APP.state.sidebarOpen = !APP.state.sidebarOpen;
      sidebar.classList.toggle('open');
    });
  }

  /* ─── Mobile sidebar close on click outside ─── */
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && APP.state.sidebarOpen) {
      const sidebar = $('sidebar');
      const hamburger = $('hamburger');
      if (sidebar && !sidebar.contains(e.target) && !hamburger.contains(e.target)) {
        sidebar.classList.remove('open');
        APP.state.sidebarOpen = false;
      }
    }
  });

  /* ─── Init ─── */
  async function init() {
    await fetchPublicSettings();

    setupHamburger();
    setupSearch();
    setupVideoControls();
    setupTabs();
    setupModalListeners();
    setupChat();
    setupKeyboardShortcuts();

    await fetchChannels();

    if (APP.state.lastChannelId && APP.state.channels.find(c => c.id === APP.state.lastChannelId)) {
      APP.state.currentChannelId = APP.state.lastChannelId;
      loadCurrentChannel();
    } else {
      const active = APP.state.channels.find(c => c.status === 'active');
      if (active) {
        APP.state.currentChannelId = active.id;
        loadCurrentChannel();
      } else if (APP.state.channels.length > 0) {
        APP.state.currentChannelId = APP.state.channels[0].id;
        loadCurrentChannel();
      }
    }

    renderChannelList();
    updateChannelTitle();

    setInterval(fetchChannels, 10000);
    setInterval(fetchNowPlaying, 30000);
    setInterval(fetchUpNext, 30000);
    setInterval(fetchNotifications, 30000);
    setInterval(fetchViewerCount, 5000);
    setInterval(updateLatency, 1000);
    setInterval(fetchChatMessages, 3000);
    setInterval(updateStreamUptime, 1000);

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
