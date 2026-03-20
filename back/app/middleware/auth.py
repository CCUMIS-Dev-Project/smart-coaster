from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.config import settings
from app.services.supabase_service import supabase

security = HTTPBearer() #從 Header 把 token 字串取出來


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> int:
    try:
        payload = jwt.decode(credentials.credentials, settings.JWT_SECRET, algorithms=["HS256"])
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError) as e:
        print(f"[auth] JWT error: {type(e).__name__}: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # 確認帳號仍存在（刪帳後舊 token 立即失效）
    result = supabase.table("users").select("user_id").eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Account not found")

    return user_id
