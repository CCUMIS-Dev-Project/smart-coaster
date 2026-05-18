
---

# 🥤 Day Day 補給站 (智慧飲水系統)

本專案為**資管系畢業專題**，結合 Raspberry Pi Pico W、重量感測器與 Expo App，達成飲水數據即時追蹤、LED 提醒與 AI 數據分析功能。

---

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


---

## 📂 專案結構 (Project Structure)

```text
smart-coaster/
├── hardware/                       # Raspberry Pi Pico W (MicroPython 硬體端)
│   ├── main.py                     # 主程式邏輯 (重量偵測、BLE、LED 控制)
│   ├── config.py                   # 硬體腳位與系統參數設定
│   ├── ble_manager.py              # BLE 通訊協定封裝
│   ├── display_manager.py          # OLED 螢幕管理
│   ├── led_manager.py              # WS2812B LED 燈圈控制
│   ├── storage_manager.py          # 離線數據儲存 (Flash)
│   ├── offline_data.csv            # 離線飲水紀錄暫存
│   └── lib/                        # 驅動程式庫 (HX711, BLE, OLED, AHT20)
│
├── front/                          # React Native + Expo (手機 App 端)
│   ├── App.js                      # 應用程式進入點 (NavigationContainer + 驗證邏輯)
│   ├── app.json                    # Expo 專案配置 (Icon、Splash、權限設定)
│   ├── package.json                # 前端依賴管理
│   ├── .env.example                # 環境變數範本
│   └── src/
│       ├── assets/                 # 靜態資源 (Icon、背景圖、杯子圖示)
│       ├── components/             # 可重用 UI 元件 (CustomInput, StatusIndicator, VolumeDisplay, VolumeHistory)
│       ├── config/                 # 前端設定檔 (API 端點)
│       ├── constants/              # 主題色彩等全域常數
│       ├── context/                # AppContext 全域狀態管理
│       ├── hooks/                  # 自定義 Hook
│       │   ├── useBLE.android.js   # Android 藍牙 BLE 核心邏輯
│       │   └── useBLE.web.js       # Web 版模擬 BLE
│       ├── navigation/             # 導覽配置
│       │   └── TabNavigator.js     # 底部分頁 (主頁、報告、花園、個人資料)
│       ├── screens/                # 各功能頁面
│       │   ├── LoginScreen.js      # 登入頁
│       │   ├── RegisterScreen.js   # 註冊頁
│       │   ├── InitialSettingScreen.js # 首次使用個人資料設定
│       │   ├── MainScreen.js       # 儀表板首頁 (飲水量百分比、飲品切換)
│       │   ├── ReportScreen.js     # 統計報告頁 (連續天數、週飲水長條圖、AI 聊天)
│       │   ├── GardenScreen.js     # 花園獎勵頁 (飲水連續天數遊戲化)
│       │   ├── ProfileScreen.js    # 個人資料頁 (基本資訊管理)
│       │   ├── SettingScreen.js    # 系統設定選單 (Modal)
│       │   └── ReminderSettingScreen.js # 提醒時間設定 (Modal)
│       ├── services/               # 資料通訊
│       │   ├── api.js              # Axios 封裝，與 FastAPI 後端對接
│       │   └── mockSensorData.js   # 開發測試用模擬感測器數據
│       └── utils/
│           └── notifications.js    # 推播通知工具
│
└── back/                           # FastAPI Backend (伺服器端)
    ├── main.py                     # FastAPI 伺服器進入點 (CORS、路由掛載)
    ├── requirements.txt            # Python 依賴環境清單
    ├── .env.example                # 環境變數範本
    ├── terminal_chat.py            # AI 聊天 CLI 測試工具
    ├── README_back.md              # 後端詳細文件
    ├── knowledge/                  # AI 知識庫文件
    └── app/
        ├── config.py               # 環境變數載入與設定
        ├── middleware/             # JWT 驗證中介層
        ├── routes/                 # API 路由 (auth, chat, drinking_logs, report, sensor, goals, rewards, stats...)
        ├── services/               # 業務邏輯 (Groq AI、Supabase、ML 分析...)
        └── schemas/                # Pydantic 資料驗證模型
```

---

## 🛠️ 技術棧 (Tech Stack)

| 層級 | 技術 |
| --- | --- |
| **硬體** | Raspberry Pi Pico W、MicroPython、HX711、WS2812B、SSD1306 OLED、AHT20 |
| **前端** | React Native 0.81、Expo 54、React Navigation、react-native-ble-plx |
| **後端** | Python FastAPI、Uvicorn、Supabase (PostgreSQL)、JWT 驗證 |
| **AI** | Groq API (LLM)、ML 飲水分析 |
| **推播** | expo-notifications |

---

## 📝 開發導覽 (Where to Modify)

| 任務 | 檔案路徑 |
| --- | --- |
| 修改杯墊重量偵測邏輯 | `hardware/main.py` |
| 修改 LED 燈號行為 | `hardware/led_manager.py` |
| 修改藍牙連線/權限請求 | `front/src/hooks/useBLE.android.js` |
| 調整 App 首頁 UI | `front/src/screens/MainScreen.js` |
| 調整報告頁 / AI 聊天 | `front/src/screens/ReportScreen.js` |
| 串接新的後端 API | `front/src/services/api.js` |
| 處理 AI 聊天邏輯 | `back/app/routes/chat.py` + `back/app/services/groq_service.py` |
| 處理飲水紀錄資料庫 | `back/app/routes/drinking_logs.py` |
| 修改使用者驗證 | `back/app/routes/auth.py` + `back/app/middleware/` |

---

## 🧪 測試流程

### 1. 硬體端 (Pico W)

* **環境**：使用 Thonny IDE，並確保 Pico W 已燒錄 MicroPython 韌體。
* **操作**：
  1. 將 `hardware/` 資料夾內所有檔案上傳至 Pico W。
  2. 確認 `hardware/ble_manager.py` 的裝置名稱設定為 `"SmartCoaster"`。
  3. 執行 `main.py`，OLED 螢幕應顯示「Press to Start」。

---

### 2. 後端伺服器 (FastAPI) & AI 功能測試

#### 請見 `back/README_back.md`

```bash
cd back
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt

# 複製並填寫環境變數（GROQ_API_KEY、SUPABASE_URL、SUPABASE_KEY、JWT_SECRET 等）
cp .env.example .env

uvicorn main:app --host 0.0.0.0 --port 5001 --reload
```

* 伺服器運行於 `http://127.0.0.1:5001`
* 健康檢查：`http://localhost:5001/health` → 回傳 `{"status":"healthy"}`
* Swagger API 文件：`http://localhost:5001/docs`

**🤖 測試 AI 聊天（另開終端機）：**
```bash
cd back
venv\Scripts\activate
python terminal_chat.py
```

---

### 3. 前端 App (Expo)

> **⚠️ 注意**：由於本專案使用藍牙 (BLE) 功能，**不支援 Expo Go**。請務必使用「開發版客戶端 (Development Build)」。

```bash
cd front
npm install
```

**設定 API 連線位置（重要）**：
1. 複製範本：`cp .env.example .env`
2. 編輯 `front/.env`，將 IP 改為你電腦的區域網路 IP：
```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:5001
```
> ⚠️ `.env` 不支援行內註解，請勿在值後面加 `//`，否則 URL 會失效。
>
> 查詢電腦 IP：Windows 執行 `ipconfig`，找「Wi-Fi」的 IPv4 位址。

```bash
npx expo start
# 按 S 切換為 development build（Expo Go 模式下無法測試藍牙）
```

**Prebuild（產生原生專案）**：
```bash
npx expo prebuild          # 首次或新增原生套件後執行
npx expo prebuild --clean  # 原生設定錯亂時重產（⚠️ 會清除 android/ios 手動修改）
```

**本地原生 Build（需 Android Studio / Xcode）：**
```bash
npx expo run:android
npx expo run:ios           # 僅 Mac
```

**EAS 雲端 Build（修改了 app.json 權限後需重編）：**
```bash
eas build --profile development --platform android   # 開發版
eas build --platform android                         # 正式版
```

---

### 4. 前後端串接

1. `npx expo start --clear`
2. 登入後畫面資料從 Supabase 資料庫即時同步
3. 成功！

---

## 🔍 連線偵錯指引 (Debug)

1. **找不到杯墊？**
   * 確保 **nRF Connect** 等其他藍牙 App 已斷開連線（藍牙具獨佔性）。
   * 檢查 Pico W 終端機是否報錯。

2. **收到數據但沒顯示？**
   * 檢查 `useBLE.android.js` 中的 `SERVICE_UUID` 是否與 Pico W 端的 UUID（小寫）完全匹配。

3. **API 無法連線？**
   * 前端呼叫後端時請使用電腦的區域網路 IP（如 `192.168.x.x`），不可用 `localhost`。
   * 確認 `.env` 中 `EXPO_PUBLIC_API_URL` 後面無多餘空格或註解。