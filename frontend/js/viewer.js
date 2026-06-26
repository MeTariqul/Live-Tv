(function () {
  const BACKEND_URL = window.BACKEND_URL || 'http://localhost:3000';
  const video = document.getElementById('video');
  const offlineScreen = document.getElementById('offlineScreen');
  const playerWrapper = document.getElementById('playerWrapper');
  const channelSelect = document.getElementById('channelSelect');
  const channelBar = document.getElementById('channelBar');
  const liveIndicator = document.getElementById('liveIndicator');

  let hls = null;
  let channels = [];
  let isLive = false;
  let currentChannelId = null;

  function loadStream(playbackUrl) {
    if (hls) { hls.destroy(); hls = null; }
    if (!playbackUrl) {
      showOffline();
      return;
    }
    if (Hls.isSupported()) {
      hls = new Hls({ maxBufferLength: 10, backBufferLength: 0 });
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          showOffline();
          setTimeout(() => {
            if (currentChannelId) loadChannel(currentChannelId);
          }, 3000);
        }
      });
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        hideOffline();
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hideOffline();
        video.play().catch(() => {});
      });
      hls.loadSource(playbackUrl);
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = playbackUrl;
      video.addEventListener('loadedmetadata', () => { hideOffline(); video.play().catch(() => {}); });
      video.addEventListener('error', showOffline);
    } else {
      showOffline();
    }
  }

  function showOffline() {
    isLive = false;
    offlineScreen.classList.remove('hidden');
    video.pause();
    video.removeAttribute('src');
    video.load();
    liveIndicator.classList.add('hidden');
  }

  function hideOffline() {
    isLive = true;
    offlineScreen.classList.add('hidden');
    liveIndicator.classList.remove('hidden');
  }

  function updateChannelBar() {
    if (channels.length <= 1) {
      channelBar.style.display = 'none';
    } else {
      channelBar.style.display = 'flex';
      channelSelect.innerHTML = '';
      channels.forEach((ch, idx) => {
        const opt = document.createElement('option');
        opt.value = ch.id;
        opt.textContent = ch.name + (ch.status === 'active' ? ' (LIVE)' : '');
        if (ch.id === currentChannelId) opt.selected = true;
        channelSelect.appendChild(opt);
      });
    }
  }

  function loadChannel(channelId) {
    const ch = channels.find(c => c.id === channelId);
    if (!ch) return;
    currentChannelId = channelId;
    updateChannelBar();
    if (ch.status === 'active' && ch.playback_url) {
      loadStream(ch.playback_url);
    } else {
      showOffline();
    }
  }

  function selectFirstActiveOrFirst() {
    const active = channels.find(c => c.status === 'active' && c.playback_url);
    if (active) {
      loadChannel(active.id);
    } else if (channels.length > 0) {
      loadChannel(channels[0].id);
    } else {
      currentChannelId = null;
      updateChannelBar();
      showOffline();
    }
  }

  async function fetchChannels() {
    try {
      const res = await fetch(BACKEND_URL + '/api/channels', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      const prevLen = channels.length;
      channels = data;
      if (channels.length !== prevLen || !currentChannelId || !channels.find(c => c.id === currentChannelId)) {
        selectFirstActiveOrFirst();
      } else {
        updateChannelBar();
        const current = channels.find(c => c.id === currentChannelId);
        if (current) {
          if (current.status === 'active' && current.playback_url) {
            if (!isLive) loadStream(current.playback_url);
          } else {
            showOffline();
          }
        }
      }
    } catch (e) { /* keep current state */ }
  }

  channelSelect.addEventListener('change', () => {
    loadChannel(channelSelect.value);
  });

  playerWrapper.addEventListener('dblclick', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else playerWrapper.requestFullscreen();
  });

  video.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else playerWrapper.requestFullscreen();
  });

  setInterval(fetchChannels, 5000);
  fetchChannels();
})();
