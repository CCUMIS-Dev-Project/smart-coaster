from datetime import datetime, date, timedelta
import pytz
from app.services.supabase_service import supabase
from app.services.goal_service import get_goal

TZ = pytz.timezone("Asia/Taipei")
STREAKS_TABLE = "streaks"
FLOWERS_TABLE = "user_flowers"


def _today_taipei() -> date:
    return datetime.now(TZ).date()


def _get_today_total(user_id: int) -> int:
    now = datetime.now(TZ)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    res = (
        supabase.table("drinking_logs")
        .select("d_volume")
        .eq("user_id", user_id)
        .is_("delete_at", "null")
        .gte("record_at", today_start.isoformat())
        .lte("record_at", now.isoformat())
        .execute()
    )
    return sum(row.get("d_volume", 0) for row in (res.data or []))


def _days_until_next_flower(current_streak: int) -> int:
    return ((current_streak // 5) + 1) * 5 - current_streak


def undo_today_streak_if_needed(user_id: int) -> None:
    today = _today_taipei()
    streak_res = (
        supabase.table(STREAKS_TABLE)
        .select("current_streak, longest_streak, last_achieved")
        .eq("user_id", user_id)
        .execute()
    )
    if not streak_res.data:
        return
    streak_row = streak_res.data[0]
    if streak_row.get("last_achieved") != str(today):
        return  # 今天本來就沒達標過，不需 undo

    goal = get_goal(user_id)
    daily_target = goal.get("daily_target", 2000) or 2000
    if _get_today_total(user_id) >= daily_target:
        return  # 刪完還是達標，不需 undo

    # 撤銷今天的 streak
    current = streak_row["current_streak"]
    longest = streak_row["longest_streak"]
    if current <= 1:
        supabase.table(STREAKS_TABLE).update(
            {"current_streak": 0, "last_achieved": None, "longest_streak": 0 if longest <= 1 else longest}
        ).eq("user_id", user_id).execute()
    else:
        yesterday = str(today - timedelta(days=1))
        new_longest = (current - 1) if longest == current else longest
        supabase.table(STREAKS_TABLE).update(
            {"current_streak": current - 1, "last_achieved": yesterday, "longest_streak": new_longest}
        ).eq("user_id", user_id).execute()


def get_streaks(user_id: int) -> dict:
    res = (
        supabase.table(STREAKS_TABLE)
        .select("current_streak, longest_streak, last_achieved")
        .eq("user_id", user_id)
        .execute()
    )
    if not res.data:
        return {
            "current_streak": 0,
            "longest_streak": 0,
            "last_achieved": None,
            "days_until_next_flower": 5,
        }
    row = res.data[0]
    current = row["current_streak"]
    return {
        "current_streak": current,
        "longest_streak": row["longest_streak"],
        "last_achieved": row["last_achieved"],
        "days_until_next_flower": _days_until_next_flower(current),
    }


def get_garden(user_id: int) -> list:
    res = (
        supabase.table(FLOWERS_TABLE)
        .select("flower_id, unlocked_at")
        .eq("user_id", user_id)
        .order("unlocked_at")
        .execute()
    )
    return res.data or []


def check_and_update_streak(user_id: int) -> None:
    today = _today_taipei()

    streak_res = (
        supabase.table(STREAKS_TABLE)
        .select("current_streak, longest_streak, last_achieved")
        .eq("user_id", user_id)
        .execute()
    )
    streak_row = streak_res.data[0] if streak_res.data else None

    # Idempotency guard: 今天已經達標過了
    if streak_row and streak_row.get("last_achieved") == str(today):
        return

    # 檢查今日是否達標
    goal = get_goal(user_id)
    daily_target = goal.get("daily_target", 2000) or 2000
    if _get_today_total(user_id) < daily_target:
        return

    # 計算新的 streak
    if streak_row is None:
        current_streak, longest_streak = 1, 1
    else:
        current = streak_row["current_streak"]
        longest = streak_row["longest_streak"]
        last = streak_row.get("last_achieved")
        if last is None:
            current_streak = 1
        elif date.fromisoformat(last) == today - timedelta(days=1):
            current_streak = current + 1   # 連續達標
        else:
            current_streak = 1             # 中斷，重置
        longest_streak = max(longest, current_streak)

    supabase.table(STREAKS_TABLE).upsert(
        {
            "user_id": user_id,
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "last_achieved": str(today),
        },
        on_conflict="user_id",
    ).execute()

    # 每5天解鎖一朵花
    if current_streak % 5 == 0:
        flower_id = current_streak // 5
        existing = (
            supabase.table(FLOWERS_TABLE)
            .select("id")
            .eq("user_id", user_id)
            .eq("flower_id", flower_id)
            .execute()
        )
        if not existing.data:
            supabase.table(FLOWERS_TABLE).insert(
                {
                    "user_id": user_id,
                    "flower_id": flower_id,
                    "unlocked_at": datetime.now(TZ).isoformat(),
                }
            ).execute()
