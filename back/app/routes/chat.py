from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.services import groq_service, supabase_service
from app.services.ml_service import DailyGoalCalculator, IntervalPredictor
from app.services.knowledge_service import find_relevant_knowledge
from app.middleware.auth import get_current_user
from datetime import datetime
import pytz

router = APIRouter(prefix="/api")
_interval_predictor = IntervalPredictor()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str
    status: str

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, user_id: int = Depends(get_current_user)):
    """
    Chatbot endpoint that receives messages from frontend and communicates with Groq API
    """
    try:
        if not request.message:
            raise HTTPException(status_code=400, detail="No message provided")

        # 取得完整使用者資料
        profile = supabase_service.fetch_full_user_profile(user_id)
        recent_logs = supabase_service.fetch_recent_water_records(user_id, limit=10)
        today_drink_ml = supabase_service.fetch_today_water_sum(user_id)
        drink_breakdown = supabase_service.fetch_today_drink_breakdown(user_id)

        # 以 DB 個人化目標為基礎，依即時環境修正當日建議飲水量
        temp = profile.get("temp")
        humidity = profile.get("humidity")
        base_goal = profile.get("daily_target") if profile.get("daily_target") is not None else 2000
        adjusted_goal = DailyGoalCalculator.adjust_for_env(base_goal, temp, humidity)

        # 計算當前進度
        progress = DailyGoalCalculator.get_progress_summary(
            daily_goal=adjusted_goal,
            today_drink_ml=today_drink_ml,
            act_start_str=profile.get("act_start", "08:00:00"),
            act_end_str=profile.get("act_end", "22:00:00"),
        )
        target_now = progress["target_now"]
        ai_message = progress["message"]

        # 飲水間隔預測（個人化 ML 模型）
        all_logs = supabase_service.fetch_all_drinking_logs(user_id)
        env_logs = supabase_service.fetch_env_logs_range(user_id)

        interval_result = _interval_predictor.predict_next_interval(
            user_id=user_id,
            logs=all_logs,
            daily_goal=adjusted_goal,
            act_start_str=profile.get("act_start", "08:00:00"),
            act_end_str=profile.get("act_end", "22:00:00"),
            rmd_interval=profile.get("rmd_interval", 90),
            env_logs=env_logs,
        )

        if interval_result["confidence"] == "model":
            interval_text = (
                f"根據你過去 7 天的飲水習慣，ML 模型預測你下次最佳喝水時間約在 "
                f"{interval_result['adjusted_gap_minutes']} 分鐘後 "
                f"（約 {datetime.fromisoformat(interval_result['next_reminder_at']).strftime('%H:%M')}），"
                f"模型使用了 {interval_result['data_points']} 筆歷史數據訓練。"
            )
        else:
            interval_text = (
                f"目前數據不足（僅 {interval_result['data_points']} 筆），"
                f"尚未啟用個人化模型，建議每 {interval_result['adjusted_gap_minutes']} 分鐘喝一次水。"
                f"持續使用杯墊約 7 天後，系統將能根據你的習慣預測最佳飲水時間。"
            )

        # 整理最近 10 筆的歷史紀錄
        history_lines = []
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

        # 組裝天氣 / 活動量描述
        temp_str = f"{temp}°C" if temp is not None else "無資料"
        humidity_str = f"{humidity}%" if humidity is not None else "無資料"
        goal_display = (
            f"{adjusted_goal} ml（基礎目標 {base_goal} ml，依當前環境上調）"
            if adjusted_goal != base_goal
            else f"{adjusted_goal} ml"
        )

        # 依年齡計算咖啡因每日建議上限（台灣FDA / Harvard 分層）
        user_age = profile.get("age") if profile.get("age") is not None else 25
        caff_limit = 0 if user_age < 12 else 100 if user_age < 19 else 350 if user_age <= 75 else 300

        now_tw = datetime.now(pytz.timezone('Asia/Taipei'))
        current_time_str = now_tw.strftime("%H:%M")

        context_str = f"""
【使用者基本資料】
性別：{profile.get('gender')}
身高：{profile.get('height')} 公分
體重：{profile.get('weight')} 公斤

【個人化健康飲水目標】
- 目前台灣時間：{current_time_str}
- 今日飲水目標：{goal_display}（使用者依性別、體重、年齡與活動量個人化設定）
- 目前環境感測：溫度 {temp_str}、濕度 {humidity_str}（可作為動態調整建議依據）
- 目前此刻應達到的理想黃金進度：{target_now} ml
- 進度分析：{ai_message}

【硬體感測器即時數據】
- 智慧杯墊回報今日實際已飲用量：{today_drink_ml} ml
- 今日飲品分類明細：{', '.join([f"{d['type_name']} {d['volume_ml']}ml（咖啡因 {d['caffeine_mg']}mg）" for d in drink_breakdown['breakdown']]) or '尚無紀錄'}
- 今日咖啡因總攝取量：{drink_breakdown['total_caffeine_mg']} mg（建議每日上限 {caff_limit}mg）

【最近十筆硬體飲水紀錄 ( Timeline )】
{history_text}

【個人化飲水時間預測（ML 模型）】
{interval_text}

【回覆準則】
- 以上數據是背景參考，**不要在每次回答都主動複述進度數字**。只有當使用者問題明確涉及飲水進度、目標、差距時，才引用進度相關數據。
- 若問題是關於某種飲品（如咖啡、茶、飲料）是否可以喝，請直接回答「可以/建議注意/不建議」並說明理由，不需要附加當天進度數字。
- 提到水量差距時請同時換算為約幾杯水（以 200ml 為一杯）。
- 如果使用者詢問下次什麼時候喝水，請根據【個人化飲水時間預測】的資訊來回答。
- 今日已飲用量是硬體感測器的真實數據，非 AI 猜測。若使用者質疑數字，才需說明這一點。
"""

        # 根據使用者提問，動態載入相關知識
        extra_knowledge = find_relevant_knowledge(request.message)
        context_str += extra_knowledge

        ai_reply = groq_service.generate_chat_response(
            prompt=request.message,
            context=context_str
        )

        return ChatResponse(reply=ai_reply, status="success")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
