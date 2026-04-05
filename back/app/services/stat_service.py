from datetime import datetime, timedelta
import pytz
from app.services.supabase_service import supabase
from app.services.goal_service import get_goal
from app.schemas.stat import DailyStatResponse, DrinkTypeVolume, DayStat, WeeklyStatResponse

TZ = pytz.timezone("Asia/Taipei")

# 通用的飲品分組邏輯
def _group_by_type(logs: list) -> tuple[list[DrinkTypeVolume], float]:
    """
    Group logs by drink type.
    Returns (by_type list, caffeine_mg total).
    Each log must have: type_id, type_name, d_volume, caff_per_100ml.
    """
    groups: dict[int, dict] = {}
    caffeine_total = 0.0
    for log in logs:
        tid = log["type_id"]
        vol = log.get("d_volume", 0) or 0
        caf = (log.get("caff_per_100ml") or 0) * vol/100
        caffeine_total += caf
        if tid not in groups:
            groups[tid] = {"type_id": tid, "type_name": log.get("type_name", ""), "volume_ml": 0}
        groups[tid]["volume_ml"] += vol
    by_type = [DrinkTypeVolume(**v) for v in groups.values()]
    return by_type, caffeine_total

# 今日統計
def get_daily_stat(user_id: int) -> DailyStatResponse:
    now = datetime.now(TZ)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    goal = get_goal(user_id)
    daily_target = goal.get("daily_target", 2000) or 2000

    logs_res = (
        supabase.table("drinking_logs")
        .select("type_id, d_volume, drinks(type_name, caff_per_100ml)")
        .eq("user_id", user_id)
        .is_("delete_at", "null")
        .gte("record_at", today_start.isoformat())
        .lte("record_at", now.isoformat())
        .execute()
    )

    flat_logs = []
    for row in logs_res.data or []:
        drink = row.get("drinks") or {}
        flat_logs.append({
            "type_id": row["type_id"],
            "type_name": drink.get("type_name", ""),
            "d_volume": row.get("d_volume", 0),
            "caff_per_100ml": drink.get("caff_per_100ml", 0),
        })

    by_type, caffeine_mg = _group_by_type(flat_logs)
    total_ml = sum(t.volume_ml for t in by_type)
    progress_pct = round(total_ml / daily_target * 100, 2) if daily_target else 0.0

    return DailyStatResponse(
        total_ml=total_ml,
        daily_target=daily_target,
        progress_pct=progress_pct,
        caffeine_mg=round(caffeine_mg, 2),
        by_type=by_type,
    )

# 本周統計
def get_weekly_stat(user_id: int) -> WeeklyStatResponse:
    now = datetime.now(TZ)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # 找本周日（Python weekday: 週一=0, 週日=6）
    days_since_sunday = (today_start.weekday() + 1) % 7
    week_start = today_start - timedelta(days=days_since_sunday)  # 本周日
    week_end = week_start + timedelta(days=6)                     # 本周六

    last_week_start = week_start - timedelta(days=7)

    logs_res = (
        supabase.table("drinking_logs")
        .select("type_id, d_volume, record_at, drinks(type_name)")
        .eq("user_id", user_id)
        .is_("delete_at", "null")
        .gte("record_at", last_week_start.isoformat())
        .lte("record_at", now.isoformat())
        .execute()
    )

    # 本周：周日~周六 7 天；上周：上周日~上周六
    this_week_dates = [(week_start + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7)]
    last_week_dates = set((last_week_start + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7))

    # {date: {type_id: {type_name, volume_ml}}}
    this_week_buckets: dict[str, dict[int, dict]] = {d: {} for d in this_week_dates}
    last_week_totals: dict[str, int] = {d: 0 for d in last_week_dates}

    for row in logs_res.data or []:
        try:
            record_time = datetime.fromisoformat(row["record_at"].replace("Z", "+00:00")).astimezone(TZ)
            date_str = record_time.strftime("%Y-%m-%d")
            vol = row.get("d_volume", 0) or 0
            tid = row["type_id"]
            drink = row.get("drinks") or {}
            tname = drink.get("type_name", "")

            if date_str in this_week_buckets:
                bucket = this_week_buckets[date_str]
                if tid not in bucket:
                    bucket[tid] = {"type_id": tid, "type_name": tname, "volume_ml": 0}
                bucket[tid]["volume_ml"] += vol
            elif date_str in last_week_totals:
                last_week_totals[date_str] += vol
        except Exception:
            pass

    days = []
    for date_str in this_week_dates:
        bucket = this_week_buckets[date_str]
        by_type = [DrinkTypeVolume(**v) for v in bucket.values()]
        total_ml = sum(t.volume_ml for t in by_type)
        days.append(DayStat(date=date_str, total_ml=total_ml, by_type=by_type))

    # 平均只計算已過的天（今天含），未來的日期不列入分母
    today_str = today_start.strftime("%Y-%m-%d")
    past_days = [d for d in days if d.date <= today_str]
    avg_this_week = sum(d.total_ml for d in past_days) / len(past_days) if past_days else 0.0
    avg_last_week = sum(last_week_totals.values()) / 7

    if avg_last_week == 0:
        change_pct = None
    else:
        change_pct = round((avg_this_week - avg_last_week) / avg_last_week * 100, 2)

    # 聚合全周 by_type
    weekly_type_agg: dict[int, dict] = {}
    for day in days:
        for dt in day.by_type:
            if dt.type_id not in weekly_type_agg:
                weekly_type_agg[dt.type_id] = {
                    "type_id": dt.type_id,
                    "type_name": dt.type_name,
                    "volume_ml": 0,
                }
            weekly_type_agg[dt.type_id]["volume_ml"] += dt.volume_ml
    weekly_by_type = [DrinkTypeVolume(**v) for v in weekly_type_agg.values()]

    return WeeklyStatResponse(
        days=days,
        avg_this_week=round(avg_this_week, 2),
        avg_last_week=round(avg_last_week, 2),
        change_pct=change_pct,
        by_type=weekly_by_type,
    )
