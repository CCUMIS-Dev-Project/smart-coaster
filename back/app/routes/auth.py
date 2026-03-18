from fastapi import APIRouter, HTTPException, Depends
from app.schemas.user import UserRegister, UserLogin, UserResponse, TokenResponse
from app.services.auth_service import register_user, get_user_for_login, verify_password, create_access_token, login_user, delete_user
from app.middleware.auth import get_current_user

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=201)
def register(body: UserRegister):
    try:
        return register_user(body)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login", response_model=TokenResponse)
def login(body: UserLogin):
    try:
        token = login_user(body.username, body.password)
        return {"access_token": token} # # 把 token 包成 JSON 回給前端
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.delete("/me", status_code=204)
def delete_me(user_id: int = Depends(get_current_user)):
    delete_user(user_id)