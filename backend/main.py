from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware
from jose import jwt, JWTError
from passlib.context import CryptContext
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator, Field
import httpx
import hmac
import hashlib
import base64
import json
import logging
import sys
import time
from datetime import datetime, timedelta
from typing import Optional, List
from uuid import uuid4

# ─── Config ───────────────────────────────────────────────────────────
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')
    ENVIRONMENT: str = 'development'
    ADMIN_USER: str = 'admin'
    ADMIN_PASS_HASH: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = 'HS256'
    JWT_EXPIRY_MINUTES: int = 1440
    MUX_TOKEN_ID: str
    MUX_TOKEN_SECRET: str
    MUX_WEBHOOK_SECRET: str
    FRONTEND_ORIGIN: str = 'http://localhost:3001'
    KV_REST_API_URL: Optional[str] = None
    KV_REST_API_TOKEN: Optional[str] = None

    @field_validator('JWT_SECRET')
    @classmethod
    def validate_jwt_secret(cls, v: str) -> str:
        if len(v) < 64:
            raise ValueError('JWT_SECRET must be at least 64 characters long')
        return v

    @field_validator('FRONTEND_ORIGIN')
    @classmethod
    def validate_frontend_origin(cls, v: str) -> str:
        v = v.rstrip('/')
        return v

    @field_validator('ENVIRONMENT')
    @classmethod
    def validate_environment(cls, v: str) -> str:
        if v not in ('development', 'production'):
            raise ValueError('ENVIRONMENT must be development or production')
        return v

settings = Settings()

# ─── Logging ─────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s', handlers=[logging.StreamHandler(sys.stdout)])
logger = logging.getLogger('tv-backend')

# ─── App ─────────────────────────────────────────────────────────────
app = FastAPI(title='TV Stream Backend', version='1.0.0', debug=(settings.ENVIRONMENT == 'development'))

@app.middleware('http')
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    if settings.ENVIRONMENT == 'production':
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    if 'Server' in response.headers:
        del response.headers['Server']
    return response

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.JWT_SECRET,
    max_age=settings.JWT_EXPIRY_MINUTES * 60,
    https_only=(settings.ENVIRONMENT == 'production'),
    same_site='none' if settings.ENVIRONMENT == 'production' else 'lax',
    session_cookie='tv_session'
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(settings.FRONTEND_ORIGIN)],
    allow_credentials=True,
    allow_methods=['GET', 'POST', 'DELETE', 'OPTIONS'],
    allow_headers=['*'],
)

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
limiter = Limiter(key_func=get_remote_address, default_limits=['100/minute'])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── Helpers ─────────────────────────────────────────────────────────
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRY_MINUTES)
    to_encode.update({'exp': expire, 'iss': 'tv-backend'})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

async def get_current_admin(request: Request) -> dict:
    token = request.cookies.get('auth_token')
    if not token:
        raise HTTPException(status_code=401, detail='Not authenticated')
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        username = payload.get('sub')
        if username != settings.ADMIN_USER:
            raise HTTPException(status_code=401, detail='Invalid token')
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail='Invalid token')

async def get_redis():
    url = settings.KV_REST_API_URL
    if not url:
        return None
    import redis.asyncio as aioredis
    if url.startswith('redis://') or url.startswith('rediss://'):
        return aioredis.from_url(url.replace('redis://', 'rediss://'), password=settings.KV_REST_API_TOKEN or '', decode_responses=True)
    return None

async def kv_get(key: str) -> Optional[str]:
    client = await get_redis()
    if client is None:
        return None
    return await client.get(key)

async def kv_set(key: str, value: str, ex: int = 3600) -> None:
    client = await get_redis()
    if client is None:
        raise RuntimeError('KV not configured')
    await client.set(key, value, ex=ex)

async def kv_delete(key: str) -> None:
    client = await get_redis()
    if client is None:
        raise RuntimeError('KV not configured')
    await client.delete(key)

def mux_auth_headers() -> dict:
    token = base64.b64encode(f'{settings.MUX_TOKEN_ID}:{settings.MUX_TOKEN_SECRET}'.encode()).decode()
    return {'Authorization': f'Basic {token}', 'Content-Type': 'application/json'}

# ─── Pydantic Models ─────────────────────────────────────────────────
from pydantic import BaseModel

class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=100)

class CreateChannelRequest(BaseModel):
    name: str = Field(min_length=1, max_length=50)

# ─── Auth Routes ────────────────────────────────────────────────────
@app.get('/api/health')
async def health() -> JSONResponse:
    return JSONResponse({'status': 'ok'})

@app.post('/api/login', responses={401: {'model': dict}})
@limiter.limit('5/minute')
async def login(request: Request, credentials: LoginRequest) -> JSONResponse:
    if credentials.username != settings.ADMIN_USER or not verify_password(credentials.password, settings.ADMIN_PASS_HASH):
        raise HTTPException(status_code=401, detail='Invalid credentials')
    access_token = create_access_token({'sub': settings.ADMIN_USER})
    request.session['authenticated'] = True
    response = JSONResponse({'success': True})
    response.set_cookie(
        'auth_token',
        access_token,
        max_age=settings.JWT_EXPIRY_MINUTES * 60,
        httponly=True,
        secure=(settings.ENVIRONMENT == 'production'),
        samesite='none' if settings.ENVIRONMENT == 'production' else 'lax',
        path='/'
    )
    return response

@app.post('/api/logout')
async def logout(request: Request) -> JSONResponse:
    request.session.clear()
    response = JSONResponse({'success': True})
    response.delete_cookie('auth_token', path='/')
    return response

# ─── Admin Routes ───────────────────────────────────────────────────
@app.get('/api/admin/channels')
async def get_channels(current_user: dict = Depends(get_current_admin)) -> JSONResponse:
    raw = await kv_get('channels')
    channels = []
    if raw:
        try:
            channels = json.loads(raw)
        except json.JSONDecodeError:
            channels = []
    return JSONResponse(channels)

@app.post('/api/admin/channels')
async def create_channel(request: Request, body: CreateChannelRequest, current_user: dict = Depends(get_current_admin)) -> JSONResponse:
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                'https://api.mux.com/video/v1/live-streams',
                headers=mux_auth_headers(),
                json={
                    'playback_policy': ['public'],
                    'new_asset_settings': {'playback_policy': ['public']}
                }
            )
            resp.raise_for_status()
            stream_data = resp.json().get('data', {})
    except Exception as e:
        logger.error('Mux create stream failed: %s', e)
        raise HTTPException(status_code=502, detail='Failed to create stream with Mux')

    stream_id = stream_data.get('id', '')
    stream_key = stream_data.get('stream_key', '')
    rtmp_url = stream_data.get('connect_stream_url', '') or stream_data.get('rtmp_url', '')
    playback_id = ''
    playback_url = None
    playback_ids = stream_data.get('playback_ids', [])
    if playback_ids:
        playback_id = playback_ids[0].get('id', '')
        playback_url = f'https://stream.mux.com/{playback_id}.m3u8'

    channel = {
        'id': str(uuid4()),
        'name': body.name,
        'stream_id': stream_id,
        'stream_key': stream_key,
        'rtmp_url': rtmp_url,
        'playback_url': playback_url,
        'status': 'idle'
    }

    raw = await kv_get('channels')
    channels = []
    if raw:
        try:
            channels = json.loads(raw)
        except json.JSONDecodeError:
            channels = []
    channels.append(channel)
    await kv_set('channels', json.dumps(channels), ex=7200)

    return JSONResponse(channel, status_code=201)

@app.delete('/api/admin/channels/{channel_id}')
async def delete_channel(channel_id: str, current_user: dict = Depends(get_current_admin)) -> JSONResponse:
    raw = await kv_get('channels')
    channels = []
    if raw:
        try:
            channels = json.loads(raw)
        except json.JSONDecodeError:
            channels = []

    channel_index = None
    for idx, ch in enumerate(channels):
        if ch.get('id') == channel_id:
            channel_index = idx
            break

    if channel_index is None:
        raise HTTPException(status_code=404, detail='Channel not found')

    channel = channels[channel_index]
    stream_id = channel.get('stream_id')
    if stream_id:
        try:
            async with httpx.AsyncClient() as client:
                await client.delete(f'https://api.mux.com/video/v1/live-streams/{stream_id}', headers=mux_auth_headers())
        except Exception as e:
            logger.error('Mux delete stream failed: %s', e)

    del channels[channel_index]
    await kv_set('channels', json.dumps(channels), ex=7200)
    return JSONResponse({'success': True})

# ─── Public Routes ──────────────────────────────────────────────────
@app.get('/api/channels')
async def get_public_channels() -> JSONResponse:
    raw = await kv_get('channels')
    channels = []
    if raw:
        try:
            all_channels = json.loads(raw)
            for ch in all_channels:
                public = {
                    'id': ch.get('id'),
                    'name': ch.get('name'),
                    'status': ch.get('status', 'idle')
                }
                if ch.get('status') == 'active' and ch.get('playback_url'):
                    public['playback_url'] = ch.get('playback_url')
                channels.append(public)
        except json.JSONDecodeError:
            channels = []
    return JSONResponse(channels)

# ─── Webhook ────────────────────────────────────────────────────────
@app.post('/api/webhook/mux')
async def mux_webhook(request: Request) -> JSONResponse:
    body = await request.body()
    signature = request.headers.get('mux-signature', '')
    expected = settings.MUX_WEBHOOK_SECRET
    if not expected or not signature:
        raise HTTPException(status_code=403, detail='Missing signature')

    parts = {}
    for part in signature.split(','):
        key, _, value = part.partition('=')
        parts[key] = value

    timestamp = parts.get('t', '')
    v1 = parts.get('v1', '')
    if not timestamp or not v1:
        raise HTTPException(status_code=403, detail='Invalid signature format')

    try:
        event_timestamp = int(timestamp)
        if abs(time.time() - event_timestamp) > 300:
            raise HTTPException(status_code=403, detail='Signature too old')
    except (ValueError, HTTPException):
        raise HTTPException(status_code=403, detail='Invalid timestamp')

    signed_payload = f'{timestamp},{body.decode()}'
    computed = hmac.new(expected.encode(), signed_payload.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(computed, v1):
        raise HTTPException(status_code=403, detail='Invalid signature')

    try:
        event = json.loads(body)
    except Exception:
        raise HTTPException(status_code=400, detail='Invalid JSON')

    event_type = event.get('type', '')
    stream_id = event.get('data', {}).get('id', '')

    raw = await kv_get('channels')
    if raw:
        try:
            channels = json.loads(raw)
            for ch in channels:
                if ch.get('stream_id') == stream_id:
                    if event_type in ('live_stream.connected', 'live_stream.active'):
                        ch['status'] = 'active'
                    elif event_type in ('live_stream.disconnected', 'live_stream.idle'):
                        ch['status'] = 'idle'
                    break
            await kv_set('channels', json.dumps(channels), ex=7200)
            logger.info('Stream %s status updated from webhook: %s', stream_id, event_type)
        except json.JSONDecodeError:
            pass

    return JSONResponse({'status': 'ok'})
