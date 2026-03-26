from app.services.supabase_service import supabase
from datetime import date, timedelta

TABLE = "env_logs"


def create_env_log(data: dict) -> dict:
    response = supabase.table(TABLE).insert(data).execute()
    return response.data[0]


def get_env_logs(user_id: int, start: date | None = None, end: date | None = None) -> list:
    query = (
        supabase.table(TABLE)
        .select("env_id, user_id, temp, humidity, record_at")
        .eq("user_id", user_id)
        .order("record_at", desc=True)
    )
    if start:
        query = query.gte("record_at", f"{start}T00:00:00+00:00")
    if end:
        query = query.lt("record_at", f"{end + timedelta(days=1)}T00:00:00+00:00")
    return query.execute().data
