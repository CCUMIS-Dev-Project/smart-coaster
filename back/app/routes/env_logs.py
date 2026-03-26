from fastapi import APIRouter, Depends
from datetime import date
from typing import Optional
from app.schemas.env_log import EnvLogCreate, EnvLogResponse
from app.services.env_log_service import create_env_log, get_env_logs
from app.middleware.auth import get_current_user

router = APIRouter()


@router.post("", response_model=EnvLogResponse, status_code=201)
def add_env_log(body: EnvLogCreate, user_id: int = Depends(get_current_user)):
    data = body.model_dump()
    data["record_at"] = data["record_at"].isoformat()
    data["user_id"] = user_id
    return create_env_log(data)


@router.get("", response_model=list[EnvLogResponse])
def list_env_logs(
    start: Optional[date] = None,
    end: Optional[date] = None,
    user_id: int = Depends(get_current_user),
):
    return get_env_logs(user_id, start, end)
