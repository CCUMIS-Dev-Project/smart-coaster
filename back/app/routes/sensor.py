from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services import supabase_service
from datetime import datetime

router = APIRouter(prefix="/api")

class SensorLogRequest(BaseModel):
    user_id: Optional[int] = 1 # Hardware default user 1 for now if missing
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

@router.post("/sensor/log", response_model=SensorLogResponse)
async def log_sensor_data_endpoint(request: SensorLogRequest):
    """
    Receives sensor data from the hardware and logs it to Supabase.
    """
    try:
        # We only really care about saving volume to the DB for the AI features right now
        data_to_insert = {
            "user_id": request.user_id,
            "drinkAmount": request.drinkAmount,
            "timestamp": request.timestamp or datetime.now().isoformat()
        }
        
        inserted_record = supabase_service.insert_sensor_log(data_to_insert)
        
        print(f"✅ 收到數據: 喝水量 {request.drinkAmount}ml | 時間: {data_to_insert['timestamp']}")

        return SensorLogResponse(
            success=True, 
            message="Data logged successfully",
            record=inserted_record
        )

    except Exception as e:
        print(f"❌ Error logging data: {e}")
        raise HTTPException(status_code=500, detail=str(e))
