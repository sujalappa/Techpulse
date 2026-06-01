from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "TechPulse"
    state_file: Path = Path("data/state.json")
    digest_dir: Path = Path("data/digests")
    topic_query: str = "ai agents, developer tools, infrastructure, open source"
    max_items: int = 12
    slack_webhook_url: str | None = None
    resend_api_key: str | None = None
    from_email: str = "TechPulse <digest@example.com>"
    to_email: str | None = None
    supabase_url: str | None = None
    supabase_service_role_key: str | None = None

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_prefix="TECHPULSE_",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
