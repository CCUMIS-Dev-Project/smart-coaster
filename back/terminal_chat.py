import requests
import json

url = "http://localhost:5001/api/chat"

print("🤖 歡迎使用 Smart Coaster AI 終端機測試工具！")
print("（請確定你有先開另一個終端機執行 python3 app.py）")
print("輸入 'exit' 或 'quit' 可以離開。\n")

while True:
    user_input = input("你：")
    
    if user_input.lower() in ['exit', 'quit']:
        print("掰掰！")
        break
        
    if not user_input.strip():
        continue
        
    # 打包成 JSON 送給後端
    payload = {
        "user_id": 1,
        "message": user_input
    }
    
    try:
        print("⏳ AI 思考中...")
        response = requests.post(url, json=payload)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "success":
                print(f"🤖 AI：{data.get('reply')}\n")
            else:
                print(f"❌ 後端回傳錯誤格式: {data}\n")
        else:
            print(f"❌ 伺服器錯誤 ({response.status_code}): {response.text}\n")
            
    except requests.exceptions.ConnectionError:
        print("❌ 無法連線！請確定你的 flask 伺服器 (app.py) 有在 localhost:5001 跑起來喔！\n")
