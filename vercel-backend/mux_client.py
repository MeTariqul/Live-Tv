import httpx
import base64
from typing import Optional


class MuxClient:
    def __init__(self, token_id: str, token_secret: str) -> None:
        self.token_id = token_id
        self.token_secret = token_secret
        self.base_url = 'https://api.mux.com/video/v1'
        auth = base64.b64encode(f'{token_id}:{token_secret}'.encode()).decode()
        self.headers = {
            'Authorization': f'Basic {auth}',
            'Content-Type': 'application/json'
        }

    async def create_live_stream(self, playback_policy: str = 'public') -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f'{self.base_url}/live-streams',
                headers=self.headers,
                json={
                    'playback_policy': [playback_policy],
                    'new_asset_settings': {
                        'playback_policy': [playback_policy]
                    }
                }
            )
            resp.raise_for_status()
            return resp.json()

    async def get_live_stream(self, stream_id: str) -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f'{self.base_url}/live-streams/{stream_id}',
                headers=self.headers
            )
            resp.raise_for_status()
            return resp.json()

    async def delete_live_stream(self, stream_id: str) -> None:
        async with httpx.AsyncClient() as client:
            resp = await client.delete(
                f'{self.base_url}/live-streams/{stream_id}',
                headers=self.headers
            )
            resp.raise_for_status()
