from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import JSONResponse
import json
import logging
from datetime import timezone, datetime
from uuid import uuid4
from typing import Optional

from kv_client import kv_get_json, kv_set_json
from models import ChatMessage
import time

logger = logging.getLogger('tv-backend')

router = APIRouter(prefix='/api', tags=['Chat'])

_last_chat_time = 0


def _check_rate_limit() -> bool:
    global _last_chat_time
    now = time.time()
    diff = now - _last_chat_time
    logger.info('Chat rate check: diff=%.3f, last=%.3f, now=%.3f', diff, _last_chat_time, now)
    if diff < 2:
        return False
    _last_chat_time = now
    return True


@router.post('/channels/{channel_id}/chat')
async def send_chat_message(channel_id: str, body: ChatMessage, request: Request):
    if not _check_rate_limit():
        raise HTTPException(status_code=429, detail='Rate limit: 1 message per 2 seconds')

    channels = await kv_get_json('channels') or []
    ch = next((c for c in channels if c.get('id') == channel_id), None)
    if not ch:
        raise HTTPException(status_code=404, detail='Channel not found')

    chat_key = f'chat:{channel_id}'
    messages = await kv_get_json(chat_key) or []

    msg = {
        'id': f'msg_{uuid4().hex[:12]}',
        'username': body.username.strip()[:30],
        'message': body.message.strip()[:500],
        'timestamp': datetime.now(timezone.utc).isoformat(),
    }
    messages.append(msg)
    if len(messages) > 200:
        messages = messages[-200:]
    await kv_set_json(chat_key, messages, ex=86400)

    return JSONResponse(msg, status_code=201)


@router.get('/channels/{channel_id}/chat')
async def get_chat_messages(channel_id: str, since: Optional[str] = None):
    chat_key = f'chat:{channel_id}'
    messages = await kv_get_json(chat_key) or []

    if since:
        messages = [m for m in messages if m.get('timestamp', '') > since]

    return JSONResponse(messages[-100:])
