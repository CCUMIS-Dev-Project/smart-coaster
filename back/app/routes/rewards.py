from fastapi import APIRouter, Depends
from typing import List
from app.schemas.reward import StreakResponse, FlowerItem
from app.services.reward_service import get_streaks, get_garden
from app.middleware.auth import get_current_user

router = APIRouter()


@router.get("/streaks", response_model=StreakResponse) #scema: 負責「驗證格式」
def streaks(user_id: int = Depends(get_current_user)):
    return get_streaks(user_id)  #service: 拿資料


@router.get("/garden", response_model=List[FlowerItem]) 
def garden(user_id: int = Depends(get_current_user)):
    return get_garden(user_id)
