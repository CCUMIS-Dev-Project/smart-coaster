
---

# smart-coaster (智慧杯墊專案)

本專案結合 Raspberry Pi Pico W、重量感測器與 Expo App，達成飲水數據即時追蹤與提醒功能。

## 👥 團隊協作 (Git Workflow)

1. **複製專案(第一次載下專案時)**
* `git clone <repository-url>` 
* `cd smart-coaster`


2. **提交與推送更新**
* 建立(-b)並切換分支： `git checkout -b <branch-name>` 
* 加入檔案： `git add .`
* 提交紀錄： `git commit -m "描述你的更新內容"`
* 推送至雲端(初始推送)： `git push -u origin <branch-name>`

3. **非第一次載專案到本地IDE**
* 查看repo有哪些branch: `git fetch`
* 查看你現在在哪個 branch: `git branch`
* 切換到你要的 branch: `git checkout <branch-name>`
* update更動: `git pull`

4. **非推送到新分支**
* 推送至雲端(同一branch)：`git push`

5. **注意不要推到github的檔案，加到gitignore**
* .env
* __ pycache __ －＞　自動生成的文件不用推


## 📂 專案結構backend only (Project Structure)

```text

 back/
 ├── main.py                    # FastAPI 主入口
 ├── app/
 │   ├── config.py              # 環境變數設定
 │   ├── middleware/auth.py     # JWT 驗證中介層
 │   ├── routes/                # API 路由 (5 個)
 │   │   ├── auth.py            # 登入/註冊/刪除帳號
 │   │   ├── chat.py            # AI 聊天機器人
 │   │   ├── drinking_logs.py   # 喝水記錄 CRUD
 │   │   ├── report.py          # 每週報告生成
 │   │   └── sensor.py          # 硬體感測器接收
 │   ├── schemas/               # Pydantic 資料驗證
 │   │   ├── user.py
 │   │   └── drinking_log.py
 │   └── services/              # 商業邏輯層
 │       ├── auth_service.py    # 密碼加密、JWT 產生
 │       ├── drinking_log_service.py
 │       ├── supabase_service.py
 │       └── groq_service.py    # Groq AI API 呼叫
 ├── terminal_chat.py           # 測試用 CLI 工具
 ├── test_weekly_report.py      # 測試用 CLI 工具
 └── setup_env.py               # 環境設定工具


```


## 📝 開發導覽 (Where to Modify)



## 🛠️ 後端伺服器 (FastAPI) & AI 功能測試

! 後端測試或操作都須在虛擬環境(venv)中執行，避免全域安裝後在其他的專案上遇到python版本相容性問題 !

### venv設定方式 (terminal)
1. 第一次建立（在 back/ 資料夾裡）: `python -m venv venv`
2. 啟動 venv: `source venv/bin/activate  # Mac/Linux` <br>
             `venv\Scripts\activate  # Windows` 

* 做完離開: `deactivate`
* **venv不要push到github**，確認 `.gitignore` 裡有這行： `venv/`
--- 
### uvicorn 與swaggerUI測試
* **環境**：Python 3.x
* **操作**：
1. `cd back`
2. 啟動虛擬環境 (如果還沒)：`source venv/bin/activate` (Mac/Linux) 或 `venv\Scripts\activate` (Windows)
3. 安裝套件 (第一次)：`pip install -r requirements.txt`
4. 啟動伺服器：```uvicorn main:app --host 0.0.0.0 --port 5001 --reload```

* *註：伺服器預設於 `http://127.0.0.1:5001` 運行。*
* *開發者可以直接開啟 `http://localhost:5001/docs` 查看自動生成的 API 文件 (Swagger UI)。*

**login 與 authorization** <br>

目前加上jwt了，所以測試同使用者使用時狀況要先登入
1. login那邊輸入名稱與密碼，把response body下方、"access token": 後面那一長串token複製
2. 回到最上方找到右上角的Authorize，貼上token在value窗口，按authorize
3. 就可以去完其他部份了，否則會跟你說 "401 unauthorized"

**🤖 測試 AI 聊天與週報產生：**
在伺服器運行的同時，開啟**另一個新的終端機視窗**，並依序執行：
1. `cd back`
2. `source venv/bin/activate  # Mac/Linux` <br>
             `venv\Scripts\activate  # Windows` 
3. 測試聊天打字機：`python3 terminal_chat.py`
4. 測試生成上週週報：`python3 test_weekly_report.py` (若想要看其他user的週報可再去調整test_weekly_report.py裡的user_id)





