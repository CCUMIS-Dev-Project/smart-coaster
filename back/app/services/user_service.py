from app.services.supabase_service import supabase

USERS_TABLE = "users"

# join exercise 表取 level_type
def get_user(user_id: int) -> dict:
    res = supabase.table(USERS_TABLE).select("username, gender, weight, levelid, exercise(level_type)").eq("user_id", user_id).execute()
    # 跟 drinking_logs join drinks 一樣，需要攤平
    # 沒資料回傳空 dict
    if not res.data:
        return {}
    row = res.data[0]
    row["level_type"] = row.pop("exercise", {}).get("level_type", "未知")
    return row




def update_user(user_id: int, data: dict) -> dict:
    supabase.table(USERS_TABLE).update(data).eq("user_id", user_id).execute()
    return get_user(user_id)
