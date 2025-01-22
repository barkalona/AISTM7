from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import validator, Field
import os
from pathlib import Path

class Settings(BaseSettings):
    # Application Settings
    APP_NAME: str = "AISTM7"
    APP_ENV: str = Field(default="development", pattern="^(development|staging|production)$")
    DEBUG: bool = True
    LOG_LEVEL: str = Field(default="debug", pattern="^(debug|info|warning|error|critical)$")
    SECRET_KEY: str
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1"]

    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 4

    # Database Configuration
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10

    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_PASSWORD: Optional[str] = None
    CACHE_TTL: int = 3600

    # Interactive Brokers Configuration
    IBKR_HOST: str = "127.0.0.1"
    IBKR_PORT: int = 7496
    IBKR_CLIENT_ID: int = 1
    IBKR_ACCOUNT: Optional[str] = None
    IBKR_PAPER_TRADING: bool = True

    # AI/ML Configuration
    MODEL_PATH: Path = Path("models")
    DATA_PATH: Path = Path("data")
    TENSORFLOW_DEVICE: str = Field(default="CPU", pattern="^(CPU|GPU)$")
    BATCH_SIZE: int = 32
    LEARNING_RATE: float = 0.001
    SEQUENCE_LENGTH: int = 60
    PREDICTION_HORIZON: int = 5
    CONFIDENCE_THRESHOLD: float = Field(default=0.7, ge=0.0, le=1.0)

    # Risk Analysis Configuration
    VAR_CONFIDENCE_LEVEL: float = Field(default=0.95, ge=0.0, le=1.0)
    STRESS_TEST_SCENARIOS: List[str] = ["market_crash", "tech_selloff", "interest_rate_hike"]
    MONTE_CARLO_SIMULATIONS: int = Field(default=10000, ge=1000)
    CORRELATION_WINDOW: int = 252
    RSI_PERIOD: int = 14
    MACD_FAST: int = 12
    MACD_SLOW: int = 26
    MACD_SIGNAL: int = 9

    # Model Training
    TRAINING_EPOCHS: int = Field(default=50, ge=1)
    VALIDATION_SPLIT: float = Field(default=0.2, ge=0.0, le=1.0)
    EARLY_STOPPING_PATIENCE: int = 10
    MODEL_CHECKPOINT_FREQ: int = 5
    MAX_TRAINING_SAMPLES: int = 100000

    # Anomaly Detection
    ANOMALY_DETECTION_CONTAMINATION: float = Field(default=0.1, ge=0.0, le=0.5)
    ANOMALY_WINDOW_SIZE: int = 30
    ANOMALY_FEATURES: List[str] = ["returns", "volume", "volatility"]

    # Market Data
    MARKET_DATA_SOURCE: str = Field(default="ibkr", pattern="^(ibkr|alpha_vantage|yahoo)$")
    MARKET_DATA_INTERVAL: str = Field(default="1d", pattern="^(1m|5m|1h|1d)$")
    HISTORICAL_DATA_DAYS: int = 252
    UPDATE_INTERVAL_SECONDS: int = 60

    # Feature Flags
    ENABLE_REAL_TIME_PREDICTIONS: bool = True
    ENABLE_AUTOMATED_TRADING: bool = False
    ENABLE_MODEL_RETRAINING: bool = True
    ENABLE_ANOMALY_DETECTION: bool = True
    ENABLE_PORTFOLIO_OPTIMIZATION: bool = True
    ENABLE_STRESS_TESTING: bool = True

    # Performance Optimization
    ENABLE_CACHING: bool = True
    CACHE_PREDICTIONS: bool = True
    BATCH_PROCESSING_SIZE: int = 1000
    MAX_CONCURRENT_TRAINING: int = 2
    WORKER_TIMEOUT: int = 300

    # Model Versioning
    MODEL_VERSION_CONTROL: bool = True
    MIN_MODEL_ACCURACY: float = Field(default=0.7, ge=0.0, le=1.0)
    MODEL_REVIEW_REQUIRED: bool = True
    MODEL_BACKUP_ENABLED: bool = True

    # Experiment Tracking
    WANDB_ENABLED: bool = True
    WANDB_PROJECT: Optional[str] = None
    WANDB_ENTITY: Optional[str] = None
    MLFLOW_TRACKING_URI: Optional[str] = None

    @validator("MODEL_PATH", "DATA_PATH", pre=True)
    def create_directories(cls, v):
        path = Path(v)
        path.mkdir(parents=True, exist_ok=True)
        return path

    @validator("DATABASE_URL")
    def validate_database_url(cls, v):
        if not v.startswith(("postgresql://", "postgres://")):
            raise ValueError("Only PostgreSQL databases are supported")
        return v

    @validator("STRESS_TEST_SCENARIOS")
    def validate_scenarios(cls, v):
        valid_scenarios = {"market_crash", "tech_selloff", "interest_rate_hike", 
                         "pandemic", "geopolitical_crisis", "inflation_surge"}
        invalid_scenarios = set(v) - valid_scenarios
        if invalid_scenarios:
            raise ValueError(f"Invalid scenarios: {invalid_scenarios}")
        return v

    @validator("ANOMALY_FEATURES")
    def validate_features(cls, v):
        valid_features = {"returns", "volume", "volatility", "price", "momentum", 
                         "rsi", "macd", "bollinger"}
        invalid_features = set(v) - valid_features
        if invalid_features:
            raise ValueError(f"Invalid features: {invalid_features}")
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

# Create global settings instance
settings = Settings()

# Computed settings based on environment
if settings.APP_ENV == "production":
    settings.DEBUG = False
    settings.LOG_LEVEL = "info"
    settings.ENABLE_DEBUG_TOOLBAR = False
    settings.WORKERS = max(4, os.cpu_count() or 1)
elif settings.APP_ENV == "staging":
    settings.DEBUG = True
    settings.LOG_LEVEL = "debug"
    settings.ENABLE_DEBUG_TOOLBAR = True
    settings.WORKERS = 2

# Export settings
__all__ = ["settings"]