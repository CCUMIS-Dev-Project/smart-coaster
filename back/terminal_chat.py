import requests

BASE_URL = "http://localhost:5001"

print("=== Smart Coaster AI 終端機測試 ===")
print("（請先開另一個終端機執行: uvicorn main:app --reload --port 5001）\n")

# Step 1: 登入取得 JWT token
username = input("帳號：").strip()
password = input("密碼：").strip()

try:
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "username": username,
        "password": password,
    })
    if login_res.status_code != 200:
        print(f"登入失敗：{login_res.text}")
        exit(1)

    login_data = login_res.json()
    token = login_data["access_token"]
    user_id = login_data["user_id"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"\n已登入 [使用者 {user_id}]")
except requests.exceptions.ConnectionError:
    print("無法連線！請確定後端有在 localhost:5001 跑起來。")
    exit(1)

# Step 2: 開始聊天
print("輸入 'exit' 離開\n")

while True:
    user_input = input("你：")

    if user_input.lower() in ['exit', 'quit']:
        print("掰掰！")
        break

    if not user_input.strip():
        continue

    try:
        print("AI 思考中...")
        response = requests.post(
            f"{BASE_URL}/api/chat",
            json={"message": user_input},
            headers=headers,
        )

        if response.status_code == 200:
            data = response.json()
            print(f"DiDi：{data.get('reply')}\n")
        else:
            print(f"錯誤 ({response.status_code}): {response.text}\n")

    except requests.exceptions.ConnectionError:
        print("連線中斷！\n")
