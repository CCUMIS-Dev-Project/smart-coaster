from app.services.supabase_service import supabase
from postgrest.exceptions import APIError
from datetime import datetime, timezone, date, timedelta
import pytz

TZ = pytz.timezone("Asia/Taipei")

TABLE = "drinking_logs"

def create_log(data: dict) -> dict:
    try:
        response = supabase.table(TABLE).insert(data).execute()
        result = response.data[0]
    except APIError as e:
        # unique constraint violation (PostgreSQL error code 23505)
        if "23505" in str(e) or "duplicate key" in str(e).lower():
            record_dt = datetime.fromisoformat(data["record_at"].replace("Z", "+00:00"))
            day_start = record_dt.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            existing = (
                supabase.table(TABLE)
                .select("log_id, type_id, d_volume, record_at")
                .eq("user_id", data["user_id"])
                .eq("record_at", data["record_at"])
                .gte("record_at", day_start.isoformat())
                .lt("record_at", day_end.isoformat())
                .is_("delete_at", "null")
                .execute()
            )
            return existing.data[0]
        raise
    try:
        from app.services.reward_service import check_and_update_streak
        check_and_update_streak(data["user_id"])
    except Exception as e:
        print(f"[reward] streak update failed for user {data.get('user_id')}: {e}")
    return result

def soft_delete_log(log_id: int, user_id: int) -> dict | None:
    response = (
        supabase.table(TABLE)
        .update({"delete_at": datetime.now(timezone.utc).isoformat()})
        .eq("log_id", log_id)
        .is_("delete_at", "null")   # 避免對已刪除的再操作
        .execute()
    )
    result = response.data[0] if response.data else None
    if result:
        try:
            from app.services.reward_service import undo_today_streak_if_needed
            undo_today_streak_if_needed(user_id)
        except Exception as e:
            print(f"[reward] streak undo failed for user {user_id}: {e}")
    return result

# 基本查詢：選定特定欄位、指定用戶、排除已刪除、按時間新到舊排序
def get_logs(user_id: int, date_filter: date | None = None) -> list:
    query = (
        supabase.table(TABLE).select("log_id, type_id, d_volume, record_at, drinks(type_name)")
        .eq("user_id", user_id)
        .is_("delete_at", "null")
        .order("record_at", desc=True)
    )
    if date_filter:
        # 用台北時區邊界，避免 UTC 邊界造成凌晨 0~8 點紀錄漏查
        day_start = TZ.localize(datetime(date_filter.year, date_filter.month, date_filter.day, 0, 0, 0))
        day_end = day_start + timedelta(days=1)
        query = query.gte("record_at", day_start.isoformat()).lt("record_at", day_end.isoformat())
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
    if not response.data:
        return None
    # 更新後重新撈含 type_name 的完整資料
    result = (
        supabase.table(TABLE)
        .select("log_id, type_id, d_volume, record_at, drinks(type_name)")
        .eq("log_id", log_id)
        .execute()
    )
    row = result.data[0]
    row["type_name"] = row.pop("drinks", {}).get("type_name", "未知")
    return row