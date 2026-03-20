from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta, timezone
from app.config import settings
from app.services.supabase_service import supabase
from app.schemas.user import UserRegister

USERS_TABLE = "users"
GOALS_TABLE = "goals"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRE_HOURS)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

def register_user(body: UserRegister) -> dict:
    existing = supabase.table(USERS_TABLE).select("user_id").eq("username", body.username).execute()
    print("existing.data:", existing.data)  # 加這行  
    if existing.data:
        raise ValueError("Username already taken")

    user_data = {
        "username": body.username,
        "password": hash_password(body.password),
        "gender": body.gender,
        "weight": body.weight,
        "height": body.height,
        "levelid": body.levelid,
    }
    user_response = supabase.table(USERS_TABLE).insert(user_data).execute()
    if not user_response.data:
        raise RuntimeError("Failed to create user")

    new_user = user_response.data[0]

    goal_data = {
        "user_id": new_user["user_id"],
        "daily_target": body.daily_target,
        "rmd_interval": body.rmd_interval or 60,
        "act_start": body.act_start or "08:00:00",
        "act_end": body.act_end or "22:00:00",
    }
  

    try:
        goal_response = supabase.table(GOALS_TABLE).insert(goal_data).execute()
        if not goal_response.data:
            raise RuntimeError("Failed to create goal")
    except Exception:
        supabase.table(USERS_TABLE).delete().eq("user_id", new_user["user_id"]).execute()
        raise RuntimeError("Failed to create goal")

    return new_user

# 從 DB 找使用者，回傳 user_id 和 hashed password
def delete_user(user_id: int) -> None:
    supabase.table("drinking_logs").delete().eq("user_id", user_id).execute()
    supabase.table(GOALS_TABLE).delete().eq("user_id", user_id).execute()
    supabase.table(USERS_TABLE).delete().eq("user_id", user_id).execute()


def get_user_for_login(username: str) -> dict | None:
    response = supabase.table(USERS_TABLE).select("user_id, password").eq("username", username).execute()
    return response.data[0] if response.data else None

# 職責：完整驗證流程 + 產生 JWT
def login_user(username: str, password: str) -> str:
    # 1. 找使用者
    user = get_user_for_login(username)
    
    # 2. 找不到 → 回傳 401
    if user is None:
        raise ValueError("Invalid credentials")
    
    # 3. 比對密碼
    if not verify_password(password, user["password"]):
        raise ValueError("Invalid credentials")
    
    # 4. create_access_token 產生 JWT 字串，往上回傳給 router
    return create_access_token(user["user_id"])