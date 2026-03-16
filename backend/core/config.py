"""Core configuration module for FinAI Trade backend."""

import os
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App
    APP_NAME: str = "FinAI Trade Backend"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Paths (relative to backend dir)
    DATA_DIR: str = Field(default_factory=lambda: os.path.dirname(os.path.dirname(__file__)))
    MODELS_DIR: str = "models"
    LOSS_HISTORY_DIR: str = "loss_history"
    CONFIGS_FILE: str = "configurations.csv"
    SAVED_MODELS_FILE: str = "saved_models.csv"
    SESSION_STATS_FILE: str = "session_stats.csv"
    OPERACIONES_FILE: str = "operaciones_ganadoras.csv"

    # Training defaults
    DEFAULT_POPULATION_SIZE: int = 10
    DEFAULT_GENERATIONS: int = 5
    DEFAULT_MAX_EPOCH_TIME: float = 60.0

    # Redis (optional – used for job state)
    REDIS_URL: str = "redis://localhost:6379"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
