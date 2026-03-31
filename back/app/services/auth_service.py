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
    # 1. 檢查使用者是否已存在
    existing = supabase.table(USERS_TABLE).select("user_id").eq("username", body.username).execute()
    if existing.data:
        raise ValueError("使用者已存在")

    # 2. 準備使用者基礎資料
    # 因為你在 schema 中設定了預設值，若前端沒傳 gender/weight/levelid，
    # 這裡會自動填入 "未知"、60.0、1 等預設數值
    user_data = {
        "username": body.username,
        "password": hash_password(body.password),
        "gender": body.gender,
        "weight": body.weight,
        "levelid": body.levelid,
    }
    
    user_response = supabase.table(USERS_TABLE).insert(user_data).execute()
    if not user_response.data:
        raise RuntimeError("使用者註冊失敗")

    new_user = user_response.data[0]

    # 3. 準備目標設定資料 (Goals)
    # 同理，daily_target 等欄位也會自動使用 schema 的預設值
    goal_data = {
        "user_id": new_user["user_id"],
        "daily_target": body.daily_target,
        "rmd_interval": body.rmd_interval,
        "act_start": body.act_start,
        "act_end": body.act_end,
    }

    try:
        # 建立初始飲水目標
        goal_response = supabase.table(GOALS_TABLE).insert(goal_data).execute()
        if not goal_response.data:
            raise RuntimeError("目標設定建立失敗")
    except Exception as e:
        # 如果建立目標失敗，為了資料一致性，要把剛剛建好的使用者刪除 (Rollback 概念)
        supabase.table(USERS_TABLE).delete().eq("user_id", new_user["user_id"]).execute()
        print(f"Goal creation failed: {e}")
        raise RuntimeError("註冊流程不完整，請稍後再試")

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
    token = create_access_token(user["user_id"])
    return token, user["user_id"] 