import requests
import json

url = "http://localhost:5001/api/report/weekly"

# 現在我們只需要告訴後端 user_id，後端就會自己去 Supabase 撈這名使用者的歷史紀錄與資料！
# （請確保你的 Supabase 中, users 和 drinking_logs 有包含 user_id = 1 的測試資料）
payload = {
    "user_id": 4
}

print(f"發送請求至 {url} 以生成週報...")
try:
    print("⏳ AI 思考中（後端正在撈取 Supabase 資料並交給 Groq 分析）...")
    response = requests.post(url, json=payload)
    
    if response.status_code == 200:
        data = response.json()
        print("\n=== 🎯 AI 健康飲水週報 (Supabase 真實數據) ===")
        print(data.get("report_markdown"))
        print("==========================================\n")
    else:
        print(f"❌ 伺服器錯誤 ({response.status_code}): {response.text}\n")
        
except requests.exceptions.ConnectionError:
    print("❌ 無法連線！請確定你的 flask 伺服器 (app.py) 有在 localhost:5001 跑起來喔！\n")
