# Live Streaming Platform with OBS and Vercel Frontend

A split-architecture live streaming platform:
- **Frontend**: Static site deployed on Vercel
- **Backend**: Choose one of two options:
  1. **Node.js + Nginx RTMP** (self-hosted on Railway, Render, VPS, or Docker) — traditional RTMP ingest with HLS output
  2. **Python + Mux** (serverless on Vercel) — cloud-managed streaming with Mux.com

## Architecture Options

### Option 1: Node.js + Nginx RTMP (Self-Hosted)

```
OBS → RTMP → Nginx (RTMP module) → HLS → Node.js Backend → Frontend (Vercel) → Viewers
                                                              ↑
                                                         Socket.IO (viewer count, chat)
```

### Option 2: Python + Mux (Serverless on Vercel)

```
OBS → RTMP → Mux Cloud → HLS → Python Backend (Vercel) → Frontend (Vercel) → Viewers
                                                              ↑
                                                   Polling (viewer count via Vercel KV)
```

## Frontend (Shared)

The static frontend works with **either** backend. Deploy to Vercel:

```
live-stream-platform/
├── frontend/                 # Deploy to Vercel
│   ├── index.html
│   ├── admin/
│   │   ├── index.html
│   │   └── dashboard.html
│   ├── css/style.css
│   ├── js/
│   │   ├── config.js
│   │   ├── viewer.js
│   │   └── admin.js
│   ├── inject-env.js        # Vercel build script
│   └── vercel.json          # Vercel config
```

### Frontend Deployment

1. In Vercel Dashboard, set environment variables:
   - `API_BASE_URL` = your backend URL
   - `NODE_ENV` = `production`

2. Set Root Directory to `frontend` and deploy.

## Option 1: Node.js + Nginx RTMP Backend

### Project Structure

```
backend/
├── server.js
├── package.json
├── docker-compose.yml
├── Dockerfile
├── generate-hash.js
├── start.sh
├── .env.example
└── media/hls/
```

### Local Development

1. Generate a bcrypt hash for your admin password:
   ```bash
   cd backend
   node generate-hash.js YourSecurePassword
   ```

2. Generate a secure session secret (64+ characters):
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. Copy `.env.example` to `.env` and fill in the values.

4. Install dependencies and start:
   ```bash
   npm install
   node server.js
   ```

5. (Optional) Start with Docker:
   ```bash
   docker-compose up -d --build
   ```

### OBS Configuration

1. Open OBS → **Settings** → **Stream**
2. Set **Service** to **Custom**
3. Set **Server** to `rtmp://<your-backend-host>:1935/live`
4. Set **Stream Key** to `mystream` (or your custom key)

**Limit to 720p @ 30fps:**
- **Settings → Output → Simple mode:**
  - **Scaled Output Resolution**: `1280x720`
  - **FPS**: `30`
  - **Keyframe Interval**: `1 second`

- **Settings → Output → Advanced mode:**
  - **Video → Output Resolution**: `1280x720`
  - **Video → FPS**: `30`
  - **Video → Keyframe Interval**: `1s`

### API Endpoints (Node.js)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/login` | No | Validate credentials, create session |
| POST | `/api/logout` | No | Destroy session |
| GET | `/api/stream-status` | No | Returns `{ isLive, viewers }` |
| GET | `/api/stream-key` | Admin | Returns `{ streamKey, rtmpUrl }` |

---

## Option 2: Python + Mux Backend (Vercel Serverless)

### Project Structure

```
vercel-backend/
├── api/
│   └── index.py            # Mangum Lambda handler
├── main.py                 # FastAPI app
├── config.py               # Pydantic settings
├── models.py               # Request/response models
├── mux_client.py           # Mux API client
├── kv_client.py            # Vercel KV (Redis) client
├── requirements.txt
├── vercel.json             # Vercel deployment config
└── .env.example
```

### Prerequisites

- **Vercel** account (for backend + frontend)
- **Mux** account (free tier available at https://mux.com)
- **Vercel KV** (Redis) integration added to the backend project
- **OBS Studio** for broadcasting

### Local Development

1. Generate a bcrypt hash for your admin password:
   ```bash
   python -c "import bcrypt; print(bcrypt.hashpw('YourPassword'.encode(), bcrypt.gensalt()).decode())"
   ```

2. Generate a secure JWT secret (64+ characters):
   ```bash
   python -c "import secrets; print(secrets.token_hex(64))"
   ```

3. Copy `.env.example` to `.env` and fill in:
   - `ADMIN_USER` – your admin username
   - `ADMIN_PASS_HASH` – the bcrypt hash from step 1
   - `JWT_SECRET` – the random string from step 2
   - `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` – from Mux dashboard
   - `MUX_WEBHOOK_SECRET` – a random string for webhook validation
   - `FRONTEND_ORIGIN` – your Vercel app URL
   - `KV_REST_API_URL` / `KV_REST_API_TOKEN` – from Vercel KV integration

4. Install dependencies and start:
   ```bash
   pip install -r requirements.txt
   python -m uvicorn main:app --host 0.0.0.0 --port 3000
   ```

### Deploy to Vercel

1. In Vercel Dashboard, import the `vercel-backend/` folder as a new project.
2. Set Root Directory to `vercel-backend`.
3. Add all environment variables from `.env.example`.
4. Add the **Vercel KV** integration to the project.
5. Deploy.

### Mux Webhook Configuration

In your Mux dashboard, set the webhook URL to:
```
https://your-backend.vercel.app/api/mux/webhook
```

Set the webhook secret to match `MUX_WEBHOOK_SECRET`.

### OBS Configuration

1. Open OBS → **Settings** → **Stream**
2. Set **Service** to **Custom**
3. Set **Server** to the RTMP URL from Mux (provided by `/api/create-stream`)
4. Set **Stream Key** to the key from Mux
5. Set **Output Resolution**: `1280x720`, **FPS**: `30`, **Keyframe Interval**: `1s`

### API Endpoints (Python/Mux)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/login` | No | JWT login (bcrypt) |
| POST | `/api/logout` | No | Clear JWT cookie |
| GET | `/api/stream-status` | No | Returns `{ isLive, viewers, hls_url }` |
| GET | `/api/stream-key` | Admin | Returns `{ streamKey, rtmpUrl, playbackUrl, status }` |
| POST | `/api/create-stream` | Admin | Create new Mux live stream |
| POST | `/api/delete-stream` | Admin | Delete current Mux live stream |
| POST | `/api/heartbeat` | No | Viewer heartbeat for count tracking |
| POST | `/api/mux/webhook` | No | Mux status webhook (signature verified) |

## Security Features (Both Backends)

- **Bcrypt password hashing** — plaintext passwords never stored
- **Rate limiting** — brute-force protection on login
- **Security headers** — CSP, HSTS, XSS protection
- **Strict CORS** — only frontend origin allowed, credentials required
- **Session/JWT hardening** — httpOnly, secure (production), sameSite='none'
- **Input validation** — Pydantic models (Python) or manual checks (Node.js)
- **Global error handler** — no stack traces in production

## Troubleshooting

- **CORS / cookies not working**: Ensure `FRONTEND_ORIGIN` matches your Vercel domain exactly.
- **Mux webhook not firing**: Check that the webhook URL is publicly accessible and the secret matches.
- **KV connection errors**: Verify Vercel KV integration credentials in environment variables.
- **RTMP connection refused** (Node.js): Ensure Nginx is running on port 1935.

## License

MIT
