from pydantic import BaseModel
from typing import Optional


class GoalResponse(BaseModel):
    daily_target: int
    rmd_interval: int
    act_start: str
    act_end: str


class GoalUpdate(BaseModel):
    daily_target: Optional[int] = None
    rmd_interval: Optional[int] = None
    act_start: Optional[str] = None
    act_end: Optional[str] = None
