from fastapi import APIRouter, HTTPException, Depends
from datetime import date
from typing import Optional
from app.schemas.drinking_log import DrinkingLogCreate, DrinkingLogResponse, DrinkingLogUpdate, DrinkingLogCreateResponse
from app.services.drinking_log_service import create_log, soft_delete_log, get_logs, update_log
from app.middleware.auth import get_current_user

# 「接收參數」、「檢查 HTTP 狀態」以及「處理錯誤訊息」

router = APIRouter()
# 定義api呼叫的http status code回應與 回傳格式，前端http請求-> routes -> schemas -> routes -> services
@router.post("", response_model=DrinkingLogCreateResponse, status_code=201)
def add_log(body: DrinkingLogCreate, user_id: int = Depends(get_current_user)):
    data = body.model_dump() # 前端傳來並通過驗證的 Pydantic 模型轉換成 Python 的字典
    data["record_at"] = data["record_at"].isoformat()
    data["user_id"] = user_id
    return create_log(data)

@router.delete("/{log_id}", response_model=DrinkingLogCreateResponse)
def delete_log(log_id: int, user_id: int = Depends(get_current_user)):
    result = soft_delete_log(log_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Log not found or already deleted")
    return result

@router.patch("/{log_id}", response_model=DrinkingLogResponse)
def edit_log(log_id: int, body: DrinkingLogUpdate, user_id: int = Depends(get_current_user)):
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")
    #if "record_at" in data:
       # data["record_at"] = data["record_at"].isoformat() #要實作修改時間再加
    result = update_log(log_id, data)
    if result is None:
        raise HTTPException(status_code=404, detail="Log not found or already deleted")
    return result


@router.get("", response_model=list[DrinkingLogResponse])
def list_logs(date: Optional[date] = None, user_id: int = Depends(get_current_user)):
    return get_logs(user_id, date)
