(function () {
  const API_BASE = window.location.origin;
  const HLS_URL = `${API_BASE}/hls/live/tvstream/index.m3u8`;

  const video = document.getElementById('video');
  const offlineScreen = document.getElementById('offlineScreen');
  const tvContainer = document.getElementById('tvContainer');

  let hls = null;
  let isLive = false;
  let pollTimer = null;

  function loadStream() {
    if (hls) {
      hls.destroy();
      hls = null;
    }

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        maxBufferLength: 10,
        backBufferLength: 0
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          showOffline();
        }
      });
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        hideOffline();
        video.play().catch(() => {});
      });
      hls.loadSource(HLS_URL);
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = HLS_URL;
      video.addEventListener('loadedmetadata', () => {
        hideOffline();
        video.play().catch(() => {});
      });
      video.addEventListener('error', showOffline);
    }
  }

  function showOffline() {
    isLive = false;
    offlineScreen.classList.remove('hidden');
    video.pause();
    video.removeAttribute('src');
    video.load();
  }

  function hideOffline() {
    isLive = true;
    offlineScreen.classList.add('hidden');
  }

  async function checkStatus() {
    try {
      const res = await fetch('/api/status');
      if (!res.ok) return;
      const data = await res.json();
      if (data.isLive && !isLive) {
        loadStream();
      } else if (!data.isLive && isLive) {
        showOffline();
      }
    } catch (e) {
      // Network error, keep current state
    }
  }

  tvContainer.addEventListener('dblclick', () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      tvContainer.requestFullscreen();
    }
  });

  video.addEventListener('click', () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      tvContainer.requestFullscreen();
    }
  });

  pollTimer = setInterval(checkStatus, 3000);
  checkStatus();
})();
