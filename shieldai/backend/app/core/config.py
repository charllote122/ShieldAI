import os

class Settings:
    # Database URL for Docker
    @property
    def DATABASE_URL(self):
        return f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@db:5432/{os.getenv('POSTGRES_DB')}"
    
    # Redis URL for Docker
    @property
    def REDIS_URL(self):
        return f"redis://:{os.getenv('REDIS_PASSWORD')}@redis:6379"
    
    # Parse CORS origins
    @property
    def BACKEND_CORS_ORIGINS(self):
        origins = os.getenv("BACKEND_CORS_ORIGINS", "http://localhost:3000")
        return [origin.strip() for origin in origins.split(",")]