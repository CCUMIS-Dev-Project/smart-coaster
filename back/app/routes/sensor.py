from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services import supabase_service
from app.services.ml_service import DailyGoalCalculator, IntervalPredictor
from datetime import datetime
import pytz

router = APIRouter(prefix="/api")

# 初始化間隔預測器（全域共用，per-user 快取在內部）
interval_predictor = IntervalPredictor()

class SensorLogRequest(BaseModel):
    user_id: Optional[int] = 1
    systemActive: Optional[bool] = None
    lastStableWeight: Optional[float] = None
    isOnCoaster: Optional[bool] = None
    drinkAmount: Optional[int] = 0
    reminderMs: Optional[int] = None
    timestamp: Optional[str] = None

class SensorLogResponse(BaseModel):
    success: bool
    message: str
    record: Optional[dict] = None
    next_reminder_minutes: Optional[int] = None
    next_reminder_at: Optional[str] = None

@router.post("/sensor/log", response_model=SensorLogResponse)
async def log_sensor_data_endpoint(request: SensorLogRequest):
    """
    接收硬體感測器資料並寫入 Supabase，同時觸發 ML 預測下次提醒時間。
    """
    try:
        data_to_insert = {
            "user_id": request.user_id,
            "drinkAmount": request.drinkAmount,
            "timestamp": request.timestamp or datetime.now(pytz.timezone('Asia/Taipei')).isoformat()
        }

        inserted_record = supabase_service.insert_sensor_log(data_to_insert)

        print(f"[Sensor] 收到數據: 喝水量 {request.drinkAmount}ml | 時間: {data_to_insert['timestamp']}")

        # 觸發 ML 預測下次飲水提醒
        next_reminder_minutes = None
        next_reminder_at = None

        try:
            prediction = _predict_next_reminder(request.user_id)
            next_reminder_minutes = prediction["adjusted_gap_minutes"]
            next_reminder_at = prediction["next_reminder_at"]
            print(f"[ML] 預測下次提醒: {next_reminder_minutes} 分鐘後 ({prediction['confidence']})")
        except Exception as e:
            print(f"[ML] 預測失敗，不影響資料儲存: {e}")

        return SensorLogResponse(
            success=True,
            message="Data logged successfully",
            record=inserted_record,
            next_reminder_minutes=next_reminder_minutes,
            next_reminder_at=next_reminder_at,
        )

    except Exception as e:
        print(f"[Sensor] Error logging data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reminder/next")
async def get_next_reminder(user_id: int):
    """
    讓 App 主動查詢下次建議提醒時間。
    """
    try:
        prediction = _predict_next_reminder(user_id)
        return prediction
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _predict_next_reminder(user_id: int) -> dict:
    """
    共用的預測邏輯：取得使用者資料 → 計算每日目標 → 預測間隔。
    """
    profile = supabase_service.fetch_full_user_profile(user_id)
    logs = supabase_service.fetch_all_drinking_logs(user_id)
    env_logs = supabase_service.fetch_env_logs_range(user_id)

    base_goal = profile.get("daily_target") if profile.get("daily_target") is not None else 2000
    daily_goal = DailyGoalCalculator.adjust_for_env(
        base_goal,
        temp=profile.get("temp"),
        humidity=profile.get("humidity"),
    )

    prediction = interval_predictor.predict_next_interval(
        user_id=user_id,
        logs=logs,
        daily_goal=daily_goal,
        act_start_str=profile.get("act_start", "08:00:00"),
        act_end_str=profile.get("act_end", "22:00:00"),
        rmd_interval=profile.get("rmd_interval", 90),
        env_logs=env_logs,
    )

    return prediction
