
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

## 📂 專案結構 (Project Structure)(待更新)

```text
smart-coaster/ 
├── design/                     # 前端figma設計圖
|
├── pico/                       # Raspberry Pi Pico W (MicroPython 硬體端)
│   ├── main.py                 # 主程式邏輯 (BLE、重量偵測、LED 控制)
│   ├── hx711_pio.py            # 重量感測器 (HX711) 驅動程式
│   ├── ssd1306.py              # OLED 螢幕驅動程式
│   ├── ble_advertising.py      # BLE 廣播協定封裝
│   └── ble_uart_v7rc.py        # BLE 序列通訊服務
│
├── front/                      # React Native + Expo (手機 APP 端)
│   ├── App.js                  # 應用程式進入點 (配置 NavigationContainer)
│   ├── app.json                # Expo 專案配置 (App Icon、Splash、權限設定)
│   ├── package.json            # 專案依賴管理 (包含 React Navigation, Charts 等)
│   └── src/                    # 前端主要源碼
│       ├── assets/             # 靜態資源 (設計圖、Icon、背景圖、杯子圖示)
│       ├── components/         # 可重用 UI 元件 (進度條、狀態燈、歷史列表)
│       ├── hooks/              # 自定義 Hook (核心藍牙 BLE 邏輯)
│       ├── navigation/         # 導覽配置 (TabNavigator - 底部選單切換)
│       │   └── TabNavigator.js # 定義主頁、報告、個人資料的跳轉邏輯
│       ├── screens/            # 各功能頁面 (Screens)
│       │   ├── MainScreen.js   # 儀表板首頁 (喝水量百分比、飲品切換)
│       │   ├── ReportScreen.js # 統計報告頁 (連續天數、飲水長條圖)
│       │   ├── ProfileScreen.js# 個人資料頁 (基本資訊管理)
│       │   ├── SettingScreen.js# 系統設定選單 (Modal 形式)
│       │   └── ReminderSettingScreen.js # 提醒時間設定 (Modal 形式)
│       └── services/           # 資料通訊與模擬數據
│           ├── api.js          # 與 Flask 後端對接的 API 模組
│           └── mockSensorData.js # 開發測試用的模擬感測器數據
│
└── back/                       # Flask Backend (伺服器端)
    ├── app.py                  # 資料庫對接與 AI 分析邏輯
    └── requirements.txt        # Python 依賴環境清單

```
---
## 📝 開發導覽 (Where to Modify)

| 任務 | 檔案路徑 |
| --- | --- |
| 修改杯墊重量偵測邏輯 | `pico/main.py` |
| 修改藍牙連線/權限請求 | `front/src/hooks/useBLE.js` |
| 調整 App 介面 UI | `front/src/screens/DashboardScreen.js` |
| 串接新的後端 API | `front/src/services/api.js` |
| 處理 AI 聊天或資料庫邏輯 | `back/app.py` |
---

## 🛠️ 測試流程


### 1. 硬體端 (Pico W)

* **環境**：使用 Thonny IDE，並確保 Pico W 已燒錄 MicroPython 韌體。
* **操作**：
1. 將 `pico/` 資料夾內所有檔案上傳至 Pico W。
2. 確保 `main.py` 中的 `gap_name` 設定為 `"SmartCoaster"`。
3. 執行 `main.py`，OLED 螢幕應顯示「Press to Start」。
---
### 2. 後端伺服器 (FastAPI) & AI 功能測試
#### 請見back\README.md
<!-- ! 後端測試或操作都須在虛擬環境(venv)中執行，避免全域安裝後在其他的專案上遇到python版本相容性問題 !

### venv設定方式 (terminal)
1. 第一次建立（在 back/ 資料夾裡）: `python -m venv venv`
2. 啟動 venv: 
    `source venv/bin/activate  # Mac/Linux` <br>
    `venv\Scripts\activate  # Windows` 

* 做完離開: `deactivate`
* **venv不要push到github**，確認 `.gitignore` 裡有這行： `venv/`

* **環境**：Python 3.x
* **操作**：
    1. `cd back`
    2. 啟動虛擬環境 (如果還沒)：
    ```
    source venv/bin/activate // (Mac/Linux)
    venv\Scripts\activate // (Windows)
    ```
    3. `python setup_env.py` // 設定環境變數(僅須執行一次)
    4. 安裝套件 (僅須執行一次)：`pip install -r requirements.txt`
    5. 啟動伺服器：```uvicorn main:app --host 0.0.0.0 --port 5001 --reload```

* *註：伺服器預設於 `http://127.0.0.1:5001` 運行。*
* *可以開啟 `http://localhost:5001/health` 若顯示 `{"status":"healthy"}`則表示後端正在運行。*
* *可以開啟 `http://localhost:5001/docs` 查看自動生成的 API 文件 (Swagger UI)。*

**🤖 測試 AI 聊天與週報產生：**
在伺服器運行的同時，開啟**另一個新的終端機視窗**，並依序執行：
1. `cd back`
2. `source venv/bin/activate`
3. 測試聊天打字機：`python3 terminal_chat.py`
4. 測試生成上週週報：`python3 test_weekly_report.py` (若想要看其他user的週報可再去調整test_weekly_report.py裡的user_id) -->
---
### 3. 前端 App (Expo)

> **⚠️ 注意**：由於本專案使用藍牙 (BLE) 功能，**不支援 Expo Go**。請務必使用「開發版客戶端 (Development Build)」。

* **環境準備**：安裝必要的原生通訊套件
```bash
cd front
npm install
```

* **設定 API 連線位置（重要）**：
    1. 複製範本：`cp front/.env.example front/.env`
    2. 編輯 `front/.env`，將 IP 改為你電腦的區域網路 IP：
    ```env
    EXPO_PUBLIC_API_URL=http://192.168.x.x:5001
    ```
    > ⚠️ **注意**：`.env` 不支援行內註解，請勿在值的後面加 `//` 註解，否則 URL 會失效導致 Network Error。
    >
    > 查詢電腦 IP：Windows 執行 `ipconfig`，找「Wi-Fi」或「乙太網路」的 IPv4 位址。

* 若只要測試前端介面，執行：
```
npx expo start
```

* 若要測試藍牙功能需要執行以下指令：
```
# 安裝 BLE 與開發客戶端相關套件
npx expo install react-native-ble-plx expo-dev-client base-64

```


* **手機權限 (Android 11 重要)**：
* 務必開啟手機的 **藍牙 (Bluetooth)** 與 **定位 (GPS)**。
* 進入手機設定，手動確認該 App 已獲取「位置」權限。


* **建立開發版 (EAS Build)**：
若修改了 `app.json` 權限，需重新編譯：
```bash
eas build --profile development --platform android

```


* **啟動開發伺服器**：
```bash
npx expo start --dev-client

```


* 使用手機 App 內的 QR 掃描器掃描電腦畫面。

---
### 4. 前後端串接
 ps: 由於我先做**主頁面**串接，所以開發時要繞過jwt，可參考front/.env.example 手動填入EXPO_PUBLIC_API_URL
 -> 點render網址+/docs，到swaggerUI </br>
 -> login (Try It Out)，把access_token複製下來貼這裡

 1. npx expo start --clear
 2. 打開畫面可從資料庫還原，增刪修改資料庫會正確更動
 3. 成功！


---

## 🔍 連線偵錯指引 (Debug)

1. **找不到杯墊？**
* 確保 **nRF Connect** 等其他藍牙 App 已斷開連線，藍牙具備獨佔性。
* 檢查 Pico W 終端機是否報錯。


2. **收到數據但沒顯示？**
* 檢查 `useBLE.js` 中的 `SERVICE_UUID` 是否與 Pico W 端的 UUID (小寫) 完全匹配。


3. **API 無法連線？**
* 前端呼叫後端時，請勿使用 `localhost`，請改用電腦的區域網路 IP (如 `192.168.x.x`)。


