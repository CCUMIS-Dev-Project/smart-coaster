from supabase import create_client, Client
from app.config import settings
from datetime import datetime, timedelta
import pytz

# Initialize Supabase client
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def fetch_user_profile(user_id: int) -> dict:
    """
    Fetch the user's gender, weight and daily goal.
    """
    user_res = supabase.table("users").select("gender, weight").eq("user_id", user_id).execute()
    user_data = user_res.data[0] if user_res.data else {}
    
    goal_res = supabase.table("goals").select("daily_target").eq("user_id", user_id).execute()
    goal_data = goal_res.data[0] if goal_res.data else {}

    return {
        "gender": user_data.get("gender", "未知"), 
        "weight": user_data.get("weight", 60),
        "goal_ml": goal_data.get("daily_target", 2000)
    }

def fetch_recent_water_records(user_id: int, limit: int = 10) -> list:
    """
    Fetch the latest 'limit' number of drinking logs for the timeline context.
    """
    logs_res = supabase.table("drinking_logs").select("d_volume, record_at").eq("user_id", user_id).order("record_at", desc=True).limit(limit).execute()
    return logs_res.data if logs_res.data else []

def fetch_today_water_sum(user_id: int) -> int:
    """
    Calculate the total water intake for 'today' (anchored to the latest DB record).
    """
    logs_res = supabase.table("drinking_logs").select("record_at").eq("user_id", user_id).order("record_at", desc=True).limit(1).execute()
    
    if logs_res.data:
        latest_time_str = logs_res.data[0]['record_at']
        now = datetime.fromisoformat(latest_time_str.replace('Z', '+00:00')).astimezone(pytz.timezone('Asia/Taipei'))
    else:
        now = datetime.now(pytz.timezone('Asia/Taipei'))

    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_logs_res = supabase.table("drinking_logs").select("d_volume").eq("user_id", user_id).gte("record_at", today_start.isoformat()).lte("record_at", now.isoformat()).execute()
    return sum([log.get("d_volume", 0) for log in today_logs_res.data]) if today_logs_res.data else 0

def fetch_weekly_water_sum(user_id: int) -> dict:
    """
    Calculate the sum of water intake for the past 7 days, grouped by day.
    """
    latest_log_res = supabase.table("drinking_logs").select("record_at").eq("user_id", user_id).order("record_at", desc=True).limit(1).execute()
    
    if latest_log_res.data:
        latest_time_str = latest_log_res.data[0]['record_at']
        now = datetime.fromisoformat(latest_time_str.replace('Z', '+00:00')).astimezone(pytz.timezone('Asia/Taipei'))
    else:
        now = datetime.now(pytz.timezone('Asia/Taipei'))
        
    seven_days_ago = now - timedelta(days=7)
    
    logs_res = supabase.table("drinking_logs").select("d_volume, record_at").eq("user_id", user_id).gte("record_at", seven_days_ago.isoformat()).lte("record_at", now.isoformat()).execute()
    
    weekly_stats = { (now - timedelta(days=i)).strftime("%Y-%m-%d"): 0 for i in range(7) }
    
    for log in logs_res.data:
        try:
            record_time = datetime.fromisoformat(log['record_at'].replace('Z', '+00:00'))
            local_time = record_time.astimezone(pytz.timezone('Asia/Taipei'))
            date_str = local_time.strftime("%Y-%m-%d")
            if date_str in weekly_stats:
                weekly_stats[date_str] += log.get("d_volume", 0)
        except Exception as e:
            pass
            
    sorted_dates = sorted(weekly_stats.keys())
    # Return mapping for mon, tue, wed... for prompt compatibility
    return {
        "mon_ml": weekly_stats.get(sorted_dates[0], 0),
        "tue_ml": weekly_stats.get(sorted_dates[1], 0),
        "wed_ml": weekly_stats.get(sorted_dates[2], 0),
        "thu_ml": weekly_stats.get(sorted_dates[3], 0),
        "fri_ml": weekly_stats.get(sorted_dates[4], 0),
        "sat_ml": weekly_stats.get(sorted_dates[5], 0),
        "sun_ml": weekly_stats.get(sorted_dates[6], 0),
    }

def fetch_full_user_profile(user_id: int) -> dict:
    """
    擴充版 profile：包含 users 基本資料、exercise.addition、goals 設定、最新 env_logs。
    """
    # 取得使用者基本資料 + exercise addition
    user_res = supabase.table("users").select(
        "gender, weight, height, age, levelid"
    ).eq("user_id", user_id).execute()
    user_data = user_res.data[0] if user_res.data else {}

    # 取得 exercise.addition
    exercise_addition = 0.0
    level_id = user_data.get("levelid")
    if level_id:
        ex_res = supabase.table("exercise").select("addition").eq("id", level_id).execute()
        if ex_res.data:
            exercise_addition = ex_res.data[0].get("addition", 0.0) or 0.0

    # 取得 goals 設定
    goal_res = supabase.table("goals").select(
        "daily_target, rmd_interval, act_start, act_end"
    ).eq("user_id", user_id).execute()
    goal_data = goal_res.data[0] if goal_res.data else {}

    # 取得最新一筆 env_logs
    env_res = supabase.table("env_logs").select(
        "temp, humidity"
    ).eq("user_id", user_id).order("record_at", desc=True).limit(1).execute()
    env_data = env_res.data[0] if env_res.data else {}

    return {
        "gender": user_data.get("gender", "未知"),
        "weight": user_data.get("weight", 60),
        "height": user_data.get("height", 160),
        "age": user_data.get("age", 25),
        "exercise_addition": exercise_addition,
        "daily_target": goal_data.get("daily_target", 2000),
        "rmd_interval": goal_data.get("rmd_interval", 90),
        "act_start": goal_data.get("act_start", "08:00:00"),
        "act_end": goal_data.get("act_end", "22:00:00"),
        "temp": env_data.get("temp"),
        "humidity": env_data.get("humidity"),
    }


def fetch_today_drink_breakdown(user_id: int) -> dict:
    """
    查詢今日各飲品類型的飲用量與咖啡因攝取量。
    回傳：{ "breakdown": [{"type_name": "咖啡", "volume_ml": 300, "caffeine_mg": 285}], "total_caffeine_mg": 285 }
    """
    tz = pytz.timezone('Asia/Taipei')
    now = datetime.now(tz)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # 查今日所有飲水紀錄（含 type_id）
    logs_res = (
        supabase.table("drinking_logs")
        .select("d_volume, type_id")
        .eq("user_id", user_id)
        .is_("delete_at", "null")
        .gte("record_at", today_start.isoformat())
        .execute()
    )
    logs = logs_res.data if logs_res.data else []

    # 查所有飲品類型
    drinks_res = supabase.table("drinks").select("type_id, type_name, caff_per_100ml").execute()
    drinks_map = {d["type_id"]: d for d in (drinks_res.data or [])}

    # 按類型彙總
    type_volumes = {}
    for log in logs:
        tid = log["type_id"]
        type_volumes[tid] = type_volumes.get(tid, 0) + log["d_volume"]

    breakdown = []
    total_caffeine = 0
    for tid, volume in type_volumes.items():
        drink_info = drinks_map.get(tid, {})
        caff_per_100 = drink_info.get("caff_per_100ml", 0)
        caffeine_mg = round(volume * caff_per_100 / 100)
        total_caffeine += caffeine_mg
        breakdown.append({
            "type_name": drink_info.get("type_name", f"類型{tid}"),
            "volume_ml": volume,
            "caffeine_mg": caffeine_mg,
        })

    return {"breakdown": breakdown, "total_caffeine_mg": total_caffeine}


def fetch_all_drinking_logs(user_id: int, days: int = 7) -> list:
    """
    取得過去 N 天所有未刪除的 drinking_logs（按 record_at ASC），供模型訓練用。
    """
    tz = pytz.timezone('Asia/Taipei')
    now = datetime.now(tz)
    start = now - timedelta(days=days)

    logs_res = (
        supabase.table("drinking_logs")
        .select("log_id, d_volume, record_at, type_id")
        .eq("user_id", user_id)
        .is_("delete_at", "null")
        .gte("record_at", start.isoformat())
        .order("record_at", desc=False)
        .execute()
    )
    return logs_res.data if logs_res.data else []


def fetch_env_logs_range(user_id: int, days: int = 7) -> list:
    """
    取得過去 N 天 env_logs（按 record_at ASC），用來匹配訓練樣本的溫濕度。
    """
    tz = pytz.timezone('Asia/Taipei')
    now = datetime.now(tz)
    start = now - timedelta(days=days)

    env_res = (
        supabase.table("env_logs")
        .select("temp, humidity, record_at")
        .eq("user_id", user_id)
        .gte("record_at", start.isoformat())
        .order("record_at", desc=False)
        .execute()
    )
    return env_res.data if env_res.data else []


def insert_sensor_log(data: dict) -> dict:
    """
    Insert a localized sensor log into the DB, replacing the memory array.
    """
    # Assuming drinkAmount was passed, we might need a type_id (using 1 as default for water)
    # This aligns the hardware mock data to the database schema
    new_record = {
        "user_id": data.get('user_id', 1), # Defaulting if missing
        "type_id": 1, 
        "d_volume": data.get('drinkAmount', 0),
        "is_auto": True
        # record_at is auto-generated by supabase usually, otherwise we pass it
    }
    
    if data.get('timestamp'):
        new_record['record_at'] = data.get('timestamp')
        
    if new_record["d_volume"] >= 20:  # 過濾 < 20ml 的噪音（放東西、輕觸等）
        res = supabase.table("drinking_logs").insert(new_record).execute()
        return res.data[0] if res.data else None
    
    return None

