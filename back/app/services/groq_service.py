from groq import Groq
from app.config import settings
import os

client = Groq(api_key=settings.GROQ_API_KEY)
DEFAULT_MODEL = "llama-3.3-70b-versatile"

def get_base_prompt() -> str:
    """Reads the external prompt.md file for the personality and knowledge base."""
    # Find prompt.md which is located in the root back/ directory, one level up from app/
    prompt_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'prompt.md')
    try:
        with open(prompt_path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        return "你是一個名為「Smart Coaster」的專業健康飲水助理。"

def generate_chat_response(prompt: str, context: str, model: str = DEFAULT_MODEL) -> str:
    """Sends a chat message to Groq with context."""
    messages = [
        {
            "role": "system",
            "content": f"{get_base_prompt()}\n\n{context}"
        },
        {
            "role": "user",
            "content": prompt
        }
    ]

    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0.7,
        max_tokens=500
    )

    return response.choices[0].message.content

def generate_weekly_report(context: str, model: str = DEFAULT_MODEL) -> str:
    """Sends a prompt to Groq specifically formatted to return a markdown weekly report."""
    messages = [
        {
            "role": "system",
            "content": f"""你是一位名為「Smart Coaster」的專業健康飲水顧問。
請根據以下這名使用者的歷史數據與醫學知識，產出一份約 300～500 字的本週健康飲水分析週報。
語氣請保持溫暖、專業，並給予具體可行的建議。

{context}

【分析要求】
1. 判斷使用者是否有達到體重所需的標準飲水量 (一般醫學建議為「體重 x 30~40ml」)。
2. 觀察週末與平日的飲水差異，並點出問題。
3. 給出下週的具體改善建議 (例如：增加早晨起床喝水、設定定時提醒等)。
4. 請使用 Markdown 格式排版 (例如使用粗體、條列式)。"""
        },
        {
            "role": "user",
            "content": "請為我生成本週的飲水分析週報。"
        }
    ]

    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0.7,
        max_tokens=800
    )

    return response.choices[0].message.content
