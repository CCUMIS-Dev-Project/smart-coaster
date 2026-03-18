from pydantic import BaseModel, Field, field_validator
from datetime import datetime, timezone
from typing import Optional

# 用 Pydantic 定義欄位型別與驗證規則，FastAPI 自動產生文件 

class DrinkingLogCreate(BaseModel): #增加的格式規則
    type_id: int # 只接受整數，防止奇怪的輸入
    d_volume: int = Field(..., ge=1, le=2000)   # 1~2000 ml，# 範圍限制 #... 在 Pydantic 中代表這個欄位是必填（Required）的。
    record_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc)) # 型別強制，非法字串會被擋掉
    is_auto: bool = False 

    @field_validator('record_at', mode='before') #針對 record_at 欄位的專屬攔截器，時間資料統一轉換為 UTC 格式，避免跨時區出現的 Bug
    @classmethod
    def ensure_utc(cls, v):
        if isinstance(v, str):
            v = datetime.fromisoformat(v)
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v.astimezone(timezone.utc)

class DrinkingLogResponse(BaseModel): #顯示的格式規則
    log_id: int
    type_id: int
    type_name: str
    d_volume: int
    record_at: datetime

class DrinkingLogCreateResponse(BaseModel):
    log_id: int
    type_id: int
    d_volume: int
    record_at: datetime

class DrinkingLogUpdate(BaseModel): #修改的格式規則
    type_id: Optional[int] = None
    d_volume: Optional[int] = Field(None, ge=1, le=2000)
    # record_at: Optional[datetime] = None #要實作修改時間再加