from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Info aplikasi
    APP_NAME: str = "MagangHub Feedback Monitoring API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True

    # Kredensial MySQL (diisi dari file .env di folder backend/)
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "maganghub_db"

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    # config.py ada di backend/app/core/
    # parents[0] = backend/app/core, parents[1] = backend/app
    APP_DIR: Path = Path(__file__).resolve().parents[1]

    # Folder models ada di backend/app/models/ (sejajar sama main.py)
    MODEL_DIR: Path = APP_DIR / "models"
    SENTIMENT_MODEL_PATH: Path = MODEL_DIR / "best_sentiment_feedback_model_fixed.pkl"
    CATEGORY_MODEL_PATH: Path = MODEL_DIR / "best_category_feedback_model_fixed.pkl"

    # Dataset CSV juga ada di folder models/
    DATASET_PATH: Path = MODEL_DIR / "dataset_maganghub_category_fixed.csv"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()