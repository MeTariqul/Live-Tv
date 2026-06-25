import os
from typing import Optional


class KVClient:
    def __init__(self) -> None:
        self.redis_url = os.environ.get('KV_REDIS_URL') or os.environ.get('KV_REST_API_URL', '')
        self.token = os.environ.get('KV_REST_API_TOKEN', '')
        self.client = None
        self._mem: dict = {}

        if self.redis_url.startswith('redis://') or self.redis_url.startswith('rediss://'):
            try:
                import redis.asyncio as aioredis
                self.client = aioredis.from_url(self.redis_url, decode_responses=True)
            except Exception:
                self.client = None

    async def _connect(self) -> None:
        if self.client is None and not self.redis_url:
            raise RuntimeError('Vercel KV not configured. Set KV_REDIS_URL or KV_REST_API_URL.')

    async def set_active_stream(self, data: str, ex: int = 3600) -> None:
        if self.client:
            await self.client.set('active_live_stream', data, ex=ex)
        else:
            self._mem['active_live_stream'] = data

    async def get_active_stream(self) -> Optional[str]:
        if self.client:
            return await self.client.get('active_live_stream')
        return self._mem.get('active_live_stream')

    async def delete_active_stream(self) -> None:
        if self.client:
            await self.client.delete('active_live_stream')
        else:
            self._mem.pop('active_live_stream', None)

    async def heartbeat(self, viewer_id: str, ex: int = 20) -> None:
        key = f'viewer:{viewer_id}'
        if self.client:
            await self.client.set(key, '1', ex=ex)
        else:
            self._mem[key] = '1'

    async def count_viewers(self) -> int:
        if self.client:
            keys = await self.client.keys('viewer:*')
            return len(keys)
        return len([k for k in self._mem if k.startswith('viewer:')])

    async def close(self) -> None:
        if self.client:
            await self.client.aclose()
