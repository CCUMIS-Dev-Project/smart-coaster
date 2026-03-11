from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services import groq_service, supabase_service

router = APIRouter(prefix="/api")

class ChatRequest(BaseModel):
    message: str
    user_id: int

class ChatResponse(BaseModel):
    reply: str
    status: str

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Chatbot endpoint that receives messages from frontend and communicates with Groq API
    """
    try:
        if not request.message:
            raise HTTPException(status_code=400, detail="No message provided")
            
        user_info = supabase_service.fetch_user_profile(request.user_id)
        recent_logs = supabase_service.fetch_recent_water_records(request.user_id, limit=10)
        today_drink_ml = supabase_service.fetch_today_water_sum(request.user_id)
        
        # 整理最近 10 筆的歷史紀錄
        from datetime import datetime
        import pytz
        
        history_lines = []
        # logs are returned newest first, reverse for chronological timeline
        for log in reversed(recent_logs):
            try:
                record_time = datetime.fromisoformat(log['record_at'].replace('Z', '+00:00'))
                local_time = record_time.astimezone(pytz.timezone('Asia/Taipei'))
                time_str = local_time.strftime("%Y-%m-%d %H:%M")
                amt = log.get('d_volume', 0)
                history_lines.append(f"[{time_str}] 紀錄水量: {amt}ml")
            except Exception:
                pass
                
        history_text = "\n".join(history_lines) if history_lines else "目前無歷史紀錄"
        
        context_str = f"""
【使用者基本資料】
性別：{user_info.get('gender')}
身高：{user_info.get('height')} 公分
體重：{user_info.get('weight')} 公斤
每日目標飲水量：{user_info.get('goal_ml')} ml

【目前即時狀態 (Real-time Context)】
由於硬體即時感測器尚未連線，目前僅能提供以下來自資料庫最新一天的狀態：
- 今日總累積飲水量：{today_drink_ml} ml

【最近十筆飲水歷史紀錄 (Timeline)】
{history_text}
"""
        
        ai_reply = groq_service.generate_chat_response(
            prompt=request.message,
            context=context_str
        )

        return ChatResponse(reply=ai_reply, status="success")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
