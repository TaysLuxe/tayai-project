from dotenv import load_dotenv
load_dotenv()

"""
Application Configuration

Loads environment variables from .env file and provides
typed configuration settings for the application.
"""
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Union
import os
import json
import logging

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Application settings"""
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }
    
    # Application
    PROJECT_NAME: str = "TayAI"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    API_V1_PREFIX: str = os.getenv("API_V1_PREFIX", "/api/v1")
    
    # CORS - Parse from environment variable
    # Supports JSON array string: ["https://example.com"]
    # Or comma-separated string: https://example.com,https://other.com
    # Default includes production frontend URL
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://ai.taysluxeacademy.com",
        "http://localhost:8000",  # For API docs in development
    ]
    
    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """Parse CORS origins from environment variable."""
        if isinstance(v, list):
            logger.info(f"Using CORS origins from list: {v}")
            return v
        
        if isinstance(v, str):
            # Try to parse as JSON first
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    logger.info(f"Parsed CORS origins from JSON: {parsed}")
                    return parsed
            except (json.JSONDecodeError, ValueError):
                pass
            
            # If not JSON, try comma-separated
            if "," in v:
                origins = [origin.strip() for origin in v.split(",") if origin.strip()]
                logger.info(f"Parsed CORS origins from comma-separated: {origins}")
                return origins
            
            # Single value
            if v.strip():
                logger.info(f"Parsed single CORS origin: {v}")
                return [v.strip()]
        
        # Default fallback - always include production frontend
        default = [
            "http://localhost:3000",
            "http://localhost:3001",
            "https://ai.taysluxeacademy.com",
            "http://localhost:8000",
        ]
        logger.warning(f"Could not parse CORS origins from env var, using default: {default}")
        return default
    
    ALLOWED_HOSTS: List[str] = ["*"]
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://tayai_user:tayai_password@localhost:5432/tayai_db"
    )
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    
    # JWT
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "change-me-in-production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    )
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = int(
        os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7")
    )
    
    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4")
    OPENAI_EMBEDDING_MODEL: str = os.getenv(
        "OPENAI_EMBEDDING_MODEL", "text-embedding-3-small"
    )
    
    # Usage Limits
    BASIC_MEMBER_MESSAGES_PER_MONTH: int = int(
        os.getenv("BASIC_MEMBER_MESSAGES_PER_MONTH", "50")
    )  # Trial tier - 7 days access
    VIP_MEMBER_MESSAGES_PER_MONTH: int = int(
        os.getenv("VIP_MEMBER_MESSAGES_PER_MONTH", "1000")
    )  # Elite tier - Full access
    
    # Trial Period
    TRIAL_PERIOD_DAYS: int = int(os.getenv("TRIAL_PERIOD_DAYS", "7"))
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
    RATE_LIMIT_PER_HOUR: int = int(os.getenv("RATE_LIMIT_PER_HOUR", "1000"))
    
    
    # Membership Platform
    MEMBERSHIP_PLATFORM_API_URL: str = os.getenv("MEMBERSHIP_PLATFORM_API_URL", "")
    MEMBERSHIP_PLATFORM_API_KEY: str = os.getenv("MEMBERSHIP_PLATFORM_API_KEY", "")
    
    # Upgrade URLs (for usage limit exceeded prompts)
    UPGRADE_URL_BASIC: str = os.getenv(
        "UPGRADE_URL_BASIC",
        "https://www.skool.com/tla-hair-hutlers-co/about"
    )  # Hair Hu$tlers Co - $37/month
    UPGRADE_URL_VIP: str = os.getenv(
        "UPGRADE_URL_VIP",
        "https://www.skool.com/tla-hair-hutlers-co/about"
    )  # Hair Hu$tlers ELITE (update with actual URL)
    UPGRADE_URL_GENERIC: str = os.getenv(
        "UPGRADE_URL_GENERIC",
        "https://www.skool.com/tla-hair-hutlers-co/about"
    )
    
    # Membership Pricing
    BASIC_MEMBERSHIP_PRICE: str = os.getenv("BASIC_MEMBERSHIP_PRICE", "$37")  # Hair Hu$tlers Co
    VIP_MEMBERSHIP_PRICE: str = os.getenv("VIP_MEMBERSHIP_PRICE", "")  # Hair Hu$tlers ELITE pricing
    
    # Skool Integration
    SKOOL_WEBHOOK_SECRET: str = os.getenv("SKOOL_WEBHOOK_SECRET", "")
    SKOOL_COMMUNITY_URL: str = os.getenv(
        "SKOOL_COMMUNITY_URL",
        "https://www.skool.com/tla-hair-hutlers-co"
    )
    
    # Subscription Access Control
    # Access begins Feb 6th, 2026
    SKOOL_ACCESS_START_DATE: str = os.getenv(
        "SKOOL_ACCESS_START_DATE",
        "2026-02-06T00:00:00Z"
    )
    # BASIC tier ($37) gets 3 weeks access
    BASIC_TIER_ACCESS_DAYS: int = int(os.getenv("BASIC_TIER_ACCESS_DAYS", "21"))  # 3 weeks


settings = Settings()
