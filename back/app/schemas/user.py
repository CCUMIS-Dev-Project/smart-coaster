from pydantic import BaseModel
from typing import Optional


class UserRegister(BaseModel):
    username: str
    password: str
    gender: str
    weight: float
    height: float
    levelid: int
    # goals 表
    daily_target: int  # 前端算好傳來
    rmd_interval: Optional[int] = None #可選，沒有的話即用預設值
    act_start: Optional[str] = None
    act_end: Optional[str] = None


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    user_id: int
    username: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
