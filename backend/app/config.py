import os
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database Configuration
    database_url: str = "sqlite:///./sportchat.db"
    
    # N8N Webhook Configuration
    n8n_webhook_url: str = "https://n8n.aaagency.at/webhook/ca45977e-cf5b-4b7b-a471-3a55da6bf356"
    
    # API Configuration
    api_host: str = "127.0.0.1"
    api_port: int = 8000
    api_reload: bool = True
    
    # CORS Configuration
    frontend_url: str = "http://localhost:3000"
    
    # Application Settings
    environment: str = "development"
    log_level: str = "INFO"
    
    # Security (if needed in future)
    secret_key: str = "your-secret-key-here"
    jwt_secret: str = "your-jwt-secret-here"

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        case_sensitive = False


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()