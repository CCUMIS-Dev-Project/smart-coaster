from fastapi import APIRouter, HTTPException, Depends
from app.schemas.user import UserProfileResponse, UserUpdate
from app.services.user_service import get_user, update_user
from app.middleware.auth import get_current_user

router = APIRouter()


@router.get("/me", response_model=UserProfileResponse)
def read_profile(user_id: int = Depends(get_current_user)):
    data = get_user(user_id)
    if not data:
        raise HTTPException(status_code=404, detail="User not found")
    return data


@router.patch("/me", response_model=UserProfileResponse)
def edit_profile(body: UserUpdate, user_id: int = Depends(get_current_user)):
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")
    return update_user(user_id, data)
