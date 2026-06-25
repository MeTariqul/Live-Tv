from pydantic import BaseModel, Field, field_validator


class LoginRequest(BaseModel):
    username: str = Field(..., max_length=50, pattern=r'^[a-zA-Z0-9_-]+$')
    password: str = Field(..., max_length=128)


class LoginResponse(BaseModel):
    success: bool = True


class ErrorResponse(BaseModel):
    success: bool = False
    error: str | None = None
    detail: str | None = None


class StreamStatusResponse(BaseModel):
    isLive: bool
    viewers: int
    hls_url: str | None = None


class StreamKeyResponse(BaseModel):
    streamKey: str
    rtmpUrl: str
    playbackUrl: str | None = None
    status: str | None = None
    streamId: str | None = None


class HeartbeatRequest(BaseModel):
    viewer_id: str = Field(..., max_length=100)


class MuxWebhookEvent(BaseModel):
    type: str
    data: dict
