from pydantic import BaseModel
from typing import Optional


class UserRegister(BaseModel):
    username: str
    password: str
    gender: Optional[str] = "U"
    weight: Optional[float] = 60.0
    levelid: Optional[int] = 1
    daily_target: Optional[int] = 2000
    rmd_interval: Optional[int] = 60
    act_start: Optional[str] = "08:00"
    act_end: Optional[str] = "22:00"


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    user_id: int
    username: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserProfileResponse(BaseModel):
    username: str
    gender: str
    weight: float
    levelid: int
    level_type: str


class UserUpdate(BaseModel):
    gender: Optional[str] = None
    weight: Optional[float] = None
    levelid: Optional[int] = None
