# Multi-Channel Live TV Platform

A production-ready online TV streaming platform deployed on Vercel. Single admin creates and manages multiple live channels via Mux; viewers watch live broadcasts with instant channel switching.

## Features

- Multi-channel TV streaming via Mux (RTMP ingest → HLS playback)
- Admin panel for creating/deleting channels
- Viewer page with live channel selector
- Full-screen video player (hls.js)
- Offline detection with friendly UI
- JWT authentication, rate limiting, CORS protection
- Serverless architecture (Vercel + Vercel KV)

## Prerequisites

- [Vercel](https://vercel.com) account
- [Mux](https://mux.com) account (free tier available)
- Python 3.9+ (for local testing)
- [Vercel CLI](https://vercel.com/cli): `npm i -g vercel`

## Mux Setup

1. Go to [Mux Dashboard](https://dashboard.mux.com) → **Settings** → **API Access Tokens**.
2. Create a new token with **Read** and **Write** permissions for Live Streams.
3. Copy the **Token ID** and **Token Secret**.
4. Generate a webhook signing secret (you'll need this later):

   ```bash
   openssl rand -hex 32
   ```

   Keep this value safe; you'll paste it into both Mux and the backend env.

## Admin Password

The default admin username is `admin`. Generate a bcrypt hash for the password `Admin@123` (or choose your own):

```bash
python -c "import bcrypt; print(bcrypt.hashpw(b'Admin@123', bcrypt.gensalt(12)).decode())"
```

Copy the full `$2b$12$...` output into the `ADMIN_PASS_HASH` env var.

## Backend Deployment

1. **Create a new Vercel project** for the backend (or use the dashboard to import the `/backend` folder).

2. **Link Vercel KV**:
   - In your Vercel project → **Storage** → **Create KV Database**.
   - After creation, Vercel automatically injects environment variables like `KV_URL`, `KV_REST_API_URL`, and `KV_REST_API_TOKEN`. No manual config is needed if you use the Vercel KV integration.

3. **Set environment variables** in the Vercel dashboard (**Settings → Environment Variables**):

   | Variable | Example / How to generate |
   |---|---|
   | `ADMIN_USER` | `admin` |
   | `ADMIN_PASS_HASH` | `$2b$12$...` (see above) |
   | `JWT_SECRET` | 64+ random chars (`openssl rand -hex 32`) |
   | `MUX_TOKEN_ID` | from Mux dashboard |
   | `MUX_TOKEN_SECRET` | from Mux dashboard |
   | `MUX_WEBHOOK_SECRET` | same secret used for the Mux webhook |
   | `FRONTEND_ORIGIN` | `https://your-frontend.vercel.app` |
   | `ENVIRONMENT` | `production` |

4. **Deploy** from the `/backend` directory:

   ```bash
   cd backend
   vercel --prod
   ```

5. Note the backend URL (e.g., `https://my-tv-backend.vercel.app`). You'll need it for the frontend.

## Frontend Deployment

1. Edit the two frontend JS files and replace `http://localhost:3000` with your backend URL:

   - `frontend/js/viewer.js`
   - `frontend/js/admin.js`

   ```javascript
   window.BACKEND_URL = 'https://my-tv-backend.vercel.app';
   ```

2. Deploy the `frontend/` folder as a **separate Vercel project**:

   ```bash
   cd frontend
   vercel --prod
   ```

3. Update the backend's `FRONTEND_ORIGIN` environment variable to match the frontend URL if it changed.

## Configure Mux Webhook

After both frontend and backend are deployed:

1. In Mux Dashboard → **Settings** → **Webhooks**.
2. Add a new webhook:
   - **URL**: `https://my-tv-backend.vercel.app/api/webhook/mux`
   - **Signing Secret**: paste the same `MUX_WEBHOOK_SECRET` value
   - **Events**: `live_stream.connected`, `live_stream.disconnected`, `live_stream.idle`
3. Save.

## Using the Platform

1. Open the **frontend URL** in your browser (viewer page). It will show "Channel Offline" until channels are created.
2. Open the **admin panel** at `https://your-frontend.vercel.app/admin.html`.
3. Log in with `admin` / `Admin@123` (or your chosen password).
4. Click **Create Channel**, enter a name (e.g., "News"), and submit.
5. Copy the **Stream Key** and **RTMP URL** shown in the dashboard.
6. In **OBS Studio**:
   - Settings → Stream → Service: **Custom**
   - Server: paste the RTMP URL
   - Stream Key: paste the Stream Key
   - Click **Start Streaming**
7. Return to the viewer page — the channel should appear as **LIVE** within seconds.
8. Create additional channels to build a multi-channel lineup; viewers switch between them using the top dropdown.

## API Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/login` | No | Admin login, sets JWT cookie |
| `POST` | `/api/logout` | Yes | Clears auth cookie |
| `GET` | `/api/admin/channels` | Yes | List all channels |
| `POST` | `/api/admin/channels` | Yes | Create a new channel |
| `DELETE` | `/api/admin/channels/{id}` | Yes | Delete a channel |
| `GET` | `/api/channels` | No | Public channel list (viewers) |
| `POST` | `/api/webhook/mux` | No | Mux status webhook (HMAC verified) |

## Local Development

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your values (use localhost for FRONTEND_ORIGIN)
python -m uvicorn main:app --reload --port 3000
```

Run the frontend server (in another terminal):

```bash
cd frontend
python -m http.server 3001
# or: npx serve .
```

Open:
- Viewer: `http://localhost:3001`
- Admin: `http://localhost:3001/admin.html`

## Security Notes

- JWT stored in **httpOnly**, **Secure** (production), **SameSite=None** cookie.
- Rate limiting: **5 login attempts per minute per IP**.
- CORS restricted to `FRONTEND_ORIGIN` only.
- Webhook signature verification prevents spoofed status updates.
- All secrets are environment variables; never hardcoded.
