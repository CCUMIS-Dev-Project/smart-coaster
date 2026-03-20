from app.services.supabase_service import supabase
from datetime import datetime, timezone, date, timedelta

TABLE = "drinking_logs"

def create_log(data: dict) -> dict:
    response = supabase.table(TABLE).insert(data).execute()
    return response.data[0]

def soft_delete_log(log_id: int) -> dict | None:
    response = (
        supabase.table(TABLE)
        .update({"delete_at": datetime.now(timezone.utc).isoformat()})
        .eq("log_id", log_id)
        .is_("delete_at", "null")   # 避免對已刪除的再操作
        .execute()
    )
    return response.data[0] if response.data else None

# 基本查詢：選定特定欄位、指定用戶、排除已刪除、按時間新到舊排序
def get_logs(user_id: int, date_filter: date | None = None) -> list:
    query = (
        supabase.table(TABLE).select("log_id, type_id, d_volume, record_at, drinks(type_name)")
        .eq("user_id", user_id)
        .is_("delete_at", "null")
        .order("record_at", desc=True)
    )
    if date_filter:
        day_start = f"{date_filter}T00:00:00+00:00"
        day_end = f"{date_filter + timedelta(days=1)}T00:00:00+00:00"
        query = query.gte("record_at", day_start).lt("record_at", day_end)
    results= query.execute().data
    # 巢狀攤平，{ "drinks": { "type_name": "水" } }
    for row in results:
        row["type_name"] = row.pop("drinks", {}).get("type_name", "未知")
    return results

def update_log(log_id: int, data: dict) -> dict | None:
    response = (
        supabase.table(TABLE)
        .update(data)
        .eq("log_id", log_id)
        .is_("delete_at", "null")
        .execute()
    )
    return response.data[0] if response.data else None