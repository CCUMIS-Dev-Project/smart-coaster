from pydantic import BaseModel, Field, field_validator
from datetime import datetime, timezone


class EnvLogCreate(BaseModel):
    temp: float = Field(..., ge=0.0, le=50.0)         # DHT11 range
    humidity: float = Field(..., ge=20.0, le=80.0)
    record_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @field_validator('record_at', mode='before')
    @classmethod
    def ensure_utc(cls, v):
        if isinstance(v, str):
            v = datetime.fromisoformat(v)
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v.astimezone(timezone.utc)


class EnvLogResponse(BaseModel):
    env_id: int
    user_id: int
    temp: float
    humidity: float
    record_at: datetime
