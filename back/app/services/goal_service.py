from app.services.supabase_service import supabase

GOALS_TABLE = "goals"


def get_goal(user_id: int) -> dict:
    res = supabase.table(GOALS_TABLE).select("daily_target, rmd_interval, act_start, act_end").eq("user_id", user_id).execute()
    return res.data[0] if res.data else {}


def update_goal(user_id: int, data: dict) -> dict:
    res = supabase.table(GOALS_TABLE).update(data).eq("user_id", user_id).execute()
    return res.data[0] if res.data else {}
