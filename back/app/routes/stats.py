from fastapi import APIRouter, Depends
from app.schemas.stat import DailyStatResponse, WeeklyStatResponse
from app.services.stat_service import get_daily_stat, get_weekly_stat
from app.middleware.auth import get_current_user

router = APIRouter()


@router.get("/daily", response_model=DailyStatResponse)
def daily_stat(user_id: int = Depends(get_current_user)):
    return get_daily_stat(user_id)


@router.get("/weekly", response_model=WeeklyStatResponse)
def weekly_stat(user_id: int = Depends(get_current_user)):
    return get_weekly_stat(user_id)
