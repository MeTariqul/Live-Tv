from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, field_validator


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    ENVIRONMENT: str = 'development'
    ADMIN_USER: str = 'admin'
    ADMIN_PASS_HASH: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = 'HS256'
    JWT_EXPIRY_MINUTES: int = 1440  # 24 hours

    MUX_TOKEN_ID: str
    MUX_TOKEN_SECRET: str
    MUX_WEBHOOK_SECRET: str
    MUX_PLAYBACK_POLICY: str = 'public'

    FRONTEND_ORIGIN: AnyHttpUrl = 'http://localhost:3000'
    KV_REST_API_URL: str | None = None
    KV_REST_API_TOKEN: str | None = None
    KV_REST_API_READ_ONLY_TOKEN: str | None = None

    @field_validator('JWT_SECRET')
    @classmethod
    def validate_jwt_secret(cls, v: str) -> str:
        if len(v) < 64:
            raise ValueError('JWT_SECRET must be at least 64 characters long')
        return v

    @field_validator('ENVIRONMENT')
    @classmethod
    def validate_environment(cls, v: str) -> str:
        if v not in ('development', 'production'):
            raise ValueError('ENVIRONMENT must be development or production')
        return v


settings = Settings()
