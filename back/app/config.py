import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "") 
    JWT_EXPIRE_HOURS: int = int(os.getenv("JWT_EXPIRE_HOURS", "24")) 
    # DATABASE_URL: str

settings = Settings()
