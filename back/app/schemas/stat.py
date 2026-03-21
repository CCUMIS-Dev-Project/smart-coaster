from pydantic import BaseModel
from typing import List, Optional

# 飲品分類分量
class DrinkTypeVolume(BaseModel):
    type_id: int # 前端對照用
    type_name: str # 前端顯示用
    volume_ml: int # 飲水量

# -> ROUTE
class DailyStatResponse(BaseModel):
    total_ml: int # 今日總飲水量
    daily_target: int 
    progress_pct: float # 進度 %
    caffeine_mg: float  # 咖啡因（mg）
    by_type: List[DrinkTypeVolume] # 各飲品分量

# 每天飲用量 (包含飲品比例，前端可以做分類)
class DayStat(BaseModel):
    date: str  # "YYYY-MM-DD"
    total_ml: int
    by_type: List[DrinkTypeVolume]

# -> ROUTE
class WeeklyStatResponse(BaseModel):
    days: List[DayStat] # 抓每日資料做直方圖
    avg_this_week: float # 本周平均
    avg_last_week: float # 上周平均
    change_pct: Optional[float]  # null when last week has no data
    by_type: List[DrinkTypeVolume]  # 全周各飲品加總
