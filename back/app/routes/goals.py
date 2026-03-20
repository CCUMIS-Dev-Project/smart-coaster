from fastapi import APIRouter, HTTPException, Depends
from app.schemas.goal import GoalResponse, GoalUpdate
from app.services.goal_service import get_goal, update_goal
from app.middleware.auth import get_current_user

router = APIRouter()


@router.get("", response_model=GoalResponse)
def read_goal(user_id: int = Depends(get_current_user)): #不需要傳任何參數，user_id 從 JWT 取
    data = get_goal(user_id)
    if not data:
        raise HTTPException(status_code=404, detail="Goal not found")
    return data


@router.patch("", response_model=GoalResponse)
def edit_goal(body: GoalUpdate, user_id: int = Depends(get_current_user)):
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")
    return update_goal(user_id, data)
#只更新有傳的欄位，全部是 None 時擋掉，避免打空的 PATCH