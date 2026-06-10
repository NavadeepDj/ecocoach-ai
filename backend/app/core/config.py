from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    environment: str = "development"
    api_prefix: str = "/api"
    default_factor_set: str = "india-demo-2025.1"
    allowed_origins: str | list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://ecocoach-ai.vercel.app",
        "https://ecocoach-ai.onrender.com",
    ]
    firebase_service_account: str | None = None
    gemini_api_key: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="ECOCOACH_",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
