require('dotenv').config();

const express = require('express');
const session = require('express-session');
const NodeMediaServer = require('node-media-server');
const http = require('http');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS_HASH = process.env.ADMIN_PASS_HASH || '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789'; // Default hash for Admin@123
const STREAM_KEY = process.env.STREAM_KEY || 'tvstream';
const HLS_DIR = process.env.HLS_DIR || path.join(__dirname, 'media', 'hls');
const HTTP_PORT = parseInt(process.env.HTTP_PORT || '3000', 10);
const RTMP_PORT = parseInt(process.env.RTMP_PORT || '1935', 10);
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-secret-in-production-min-64-chars';
const HOST = process.env.HOST || '0.0.0.0';

if (!fs.existsSync(HLS_DIR)) {
  fs.mkdirSync(HLS_DIR, { recursive: true });
}

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/hls', express.static(HLS_DIR, {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=10');
  }
}));

const nms = new NodeMediaServer({
  rtmp: {
    port: RTMP_PORT,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8000,
    mediaroot: HLS_DIR,
    allow_origin: '*'
  },
  trans: {
    ffmpeg: process.env.FFMPEG_PATH || (process.platform === 'win32' ? 'ffmpeg' : '/usr/bin/ffmpeg'),
    tasks: [
      {
        app: 'live',
        hls: true,
        hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
        vc: 'copy',
        vcParam: [],
        ac: 'copy',
        acParam: [],
        dash: false
      }
    ]
  }
});

let isLive = false;

nms.on('postPublish', (id, streamPath, args) => {
  if (args.type === 'live' || streamPath.includes(STREAM_KEY)) {
    isLive = true;
    console.log(`[RTMP] Stream started: ${streamPath}`);
  }
});

nms.on('donePublish', (id, streamPath, args) => {
  if (args.type === 'live' || streamPath.includes(STREAM_KEY)) {
    isLive = false;
    console.log(`[RTMP] Stream ended: ${streamPath}`);
  }
});

function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (username !== ADMIN_USER) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const valid = await bcrypt.compare(password, ADMIN_PASS_HASH);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  req.session.isAdmin = true;
  res.json({ success: true });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.get('/api/status', (req, res) => {
  res.json({ isLive });
});

app.get('/api/stream-key', requireAuth, (req, res) => {
  const host = req.headers.host || `${req.hostname}:${HTTP_PORT}`;
  const rtmpUrl = `rtmp://${host}/live`;
  res.json({ streamKey: STREAM_KEY, rtmpUrl });
});

nms.run();
server.listen(HTTP_PORT, HOST, () => {
  console.log(`HTTP server running on http://${HOST}:${HTTP_PORT}`);
  console.log(`RTMP server running on rtmp://${HOST}:${RTMP_PORT}`);
  console.log(`Stream key: ${STREAM_KEY}`);
  console.log(`HLS URL: http://${HOST}:${HTTP_PORT}/hls/live/${STREAM_KEY}/index.m3u8`);
});
