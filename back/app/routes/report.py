from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.services import groq_service, supabase_service
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api")

class ReportResponse(BaseModel):
    report_markdown: str
    status: str

@router.post("/report/weekly", response_model=ReportResponse)
async def generate_weekly_report_endpoint(user_id: int = Depends(get_current_user)):
    """
    Generates a markdown weekly report for the user.
    """
    try:
        user_info = supabase_service.fetch_user_profile(user_id)
        weekly_data = supabase_service.fetch_weekly_water_sum(user_id)
        
        context_str = f"""
【使用者基本資料】
性別：{user_info.get('gender')}
體重：{user_info.get('weight')} 公斤
每日目標飲水量：{user_info.get('goal_ml')} ml

【過去 7 天的實際飲水量】
週一：{weekly_data.get('mon_ml')} ml
週二：{weekly_data.get('tue_ml')} ml
週三：{weekly_data.get('wed_ml')} ml
週四：{weekly_data.get('thu_ml')} ml
週五：{weekly_data.get('fri_ml')} ml
週六：{weekly_data.get('sat_ml')} ml
週日：{weekly_data.get('sun_ml')} ml
"""
        
        ai_reply = groq_service.generate_weekly_report(context_str)

        return ReportResponse(report_markdown=ai_reply, status="success")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
