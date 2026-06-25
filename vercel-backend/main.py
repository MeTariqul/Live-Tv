import hmac
import hashlib
import base64
import logging
import sys
from datetime import datetime, timedelta

from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from jose import JWTError, jwt
import bcrypt
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from config import settings
from models import (
    LoginRequest, LoginResponse, ErrorResponse,
    StreamStatusResponse, StreamKeyResponse,
    HeartbeatRequest
)
from mux_client import MuxClient
from kv_client import KVClient


def verify_mux_signature(payload: bytes, signature: str, secret: str) -> bool:
    expected = base64.b64encode(
        hmac.new(secret.encode(), payload, hashlib.sha256).digest()
    ).decode()
    return hmac.compare_digest(expected, signature)


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger('live-stream-vercel')

limiter = Limiter(key_func=get_remote_address)
mux_client = MuxClient(settings.MUX_TOKEN_ID, settings.MUX_TOKEN_SECRET)
kv_client = KVClient()

app = FastAPI(
    title='Live Stream Backend (Vercel Serverless)',
    version='1.0.0',
    debug=(settings.ENVIRONMENT == 'development')
)


@app.middleware('http')
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '0'
    if settings.ENVIRONMENT == 'production':
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    if 'Server' in response.headers:
        del response.headers['Server']
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(settings.FRONTEND_ORIGIN)],
    allow_credentials=True,
    allow_methods=['GET', 'POST', 'OPTIONS'],
    allow_headers=['*'],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRY_MINUTES)
    to_encode.update({'exp': expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))


async def get_current_admin(request: Request) -> dict:
    token = request.cookies.get('access_token')
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


@app.post('/api/login', response_model=LoginResponse, responses={401: {'model': ErrorResponse}})
@limiter.limit('5/minute')
async def login(credentials: LoginRequest, request: Request) -> JSONResponse:
    if credentials.username != settings.ADMIN_USER:
        raise HTTPException(status_code=401, detail='Invalid credentials')

    if not verify_password(credentials.password, settings.ADMIN_PASS_HASH):
        raise HTTPException(status_code=401, detail='Invalid credentials')

    access_token = create_access_token({'sub': settings.ADMIN_USER})
    response = JSONResponse({'success': True})
    response.set_cookie(
        'access_token',
        access_token,
        max_age=settings.JWT_EXPIRY_MINUTES * 60,
        httponly=True,
        secure=(settings.ENVIRONMENT == 'production'),
        samesite='none',
        path='/'
    )
    return response


@app.post('/api/logout')
async def logout(request: Request) -> JSONResponse:
    response = JSONResponse({'success': True})
    response.delete_cookie('access_token', path='/')
    return response


@app.get('/api/stream-status', response_model=StreamStatusResponse)
async def get_stream_status() -> JSONResponse:
    raw = await kv_client.get_active_stream()
    is_live = False
    hls_url = None

    if raw:
        import json
        stream_data = json.loads(raw)
        is_live = stream_data.get('status') == 'active'
        playback_id = stream_data.get('playback_id')
        if playback_id:
            hls_url = f'https://stream.mux.com/{playback_id}.m3u8'

    viewers = await kv_client.count_viewers()
    return JSONResponse({'isLive': is_live, 'viewers': viewers, 'hls_url': hls_url})


@app.get('/api/stream-key', response_model=StreamKeyResponse)
async def get_stream_key(current_user: dict = Depends(get_current_admin)) -> JSONResponse:
    raw = await kv_client.get_active_stream()
    if not raw:
        raise HTTPException(status_code=404, detail='No active stream')

    import json
    data = json.loads(raw)
    return JSONResponse({
        'streamKey': data.get('stream_key', ''),
        'rtmpUrl': data.get('rtmp_url', ''),
        'playbackUrl': data.get('playback_url', ''),
        'status': data.get('status', 'idle'),
        'streamId': data.get('stream_id', '')
    })


@app.post('/api/create-stream')
async def create_stream(current_user: dict = Depends(get_current_admin)) -> JSONResponse:
    try:
        stream = await mux_client.create_live_stream(playback_policy=settings.MUX_PLAYBACK_POLICY)
    except Exception as e:
        logger.error('Mux create stream failed: %s', e)
        raise HTTPException(status_code=502, detail='Failed to create stream with Mux')

    data = stream.get('data', {})
    stream_id = data.get('id', '')
    stream_key = data.get('stream_key', '')
    rtmp_url = data.get('connect_stream_url', '') or data.get('rtmp_url', '')
    playback_id = data.get('playback_ids', [{}])[0].get('id', '') if data.get('playback_ids') else ''
    playback_url = f'https://stream.mux.com/{playback_id}.m3u8' if playback_id else None

    import json
    payload = json.dumps({
        'stream_id': stream_id,
        'stream_key': stream_key,
        'rtmp_url': rtmp_url,
        'playback_id': playback_id,
        'playback_url': playback_url,
        'status': 'idle'
    })
    await kv_client.set_active_stream(payload, ex=3600)

    return JSONResponse({
        'streamKey': stream_key,
        'rtmpUrl': rtmp_url,
        'playbackUrl': playback_url,
        'status': 'idle',
        'streamId': stream_id
    })


@app.post('/api/delete-stream')
async def delete_stream(current_user: dict = Depends(get_current_admin)) -> JSONResponse:
    raw = await kv_client.get_active_stream()
    if not raw:
        raise HTTPException(status_code=404, detail='No active stream')

    import json
    data = json.loads(raw)
    stream_id = data.get('stream_id')

    if stream_id:
        try:
            await mux_client.delete_live_stream(stream_id)
        except Exception as e:
            logger.error('Mux delete stream failed: %s', e)

    await kv_client.delete_active_stream()
    return JSONResponse({'success': True})


@app.post('/api/heartbeat')
@limiter.limit('30/minute')
async def heartbeat(request: Request, req: HeartbeatRequest) -> JSONResponse:
    await kv_client.heartbeat(req.viewer_id, ex=20)
    return JSONResponse({'success': True})


@app.post('/api/mux/webhook')
async def mux_webhook(request: Request) -> JSONResponse:
    body = await request.body()
    signature = request.headers.get('mux-signature', '')

    if not settings.MUX_WEBHOOK_SECRET or not verify_mux_signature(body, signature, settings.MUX_WEBHOOK_SECRET):
        raise HTTPException(status_code=403, detail='Invalid webhook signature')

    try:
        import json
        event = json.loads(body)
    except Exception:
        raise HTTPException(status_code=400, detail='Invalid JSON')

    event_type = event.get('type', '')
    stream_id = event.get('data', {}).get('id', '')

    raw = await kv_client.get_active_stream()
    if raw:
        import json as json2
        data = json2.loads(raw)
        if data.get('stream_id') == stream_id:
            if 'connected' in event_type:
                data['status'] = 'active'
            elif 'disconnected' in event_type or 'idle' in event_type:
                data['status'] = 'idle'
            await kv_client.set_active_stream(json2.dumps(data), ex=3600)

    logger.info('Mux webhook: %s for stream %s', event_type, stream_id)
    return JSONResponse({'status': 'ok'})


@app.get('/api/health')
async def health() -> JSONResponse:
    return JSONResponse({'status': 'ok'})


@app.on_event('startup')
async def startup():
    logger.info('Starting Vercel Serverless Backend')


@app.on_event('shutdown')
async def shutdown():
    await kv_client.close()
    logger.info('Shutting down')
