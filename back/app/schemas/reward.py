from pydantic import BaseModel
from typing import Optional, List
from datetime import date as DateType, datetime


class StreakResponse(BaseModel):
    current_streak: int
    longest_streak: int
    last_achieved: Optional[DateType]
    days_until_next_flower: int


class FlowerItem(BaseModel):
    flower_id: int
    unlocked_at: datetime
