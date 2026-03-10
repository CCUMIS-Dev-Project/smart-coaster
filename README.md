
---

# 🥤 smart-coaster (智慧杯墊專案)

本專案為**資管系畢業專題**，結合 Raspberry Pi Pico W、重量感測器與 Expo App，達成飲水數據即時追蹤、LED 提醒與 AI 數據分析功能。

---

## 👥 團隊協作 (Git Workflow)

1. **複製專案**：`git clone <repository-url>`
2. **建立分支**：`git checkout -b <branch-name>`
3. **提交更新**：`git add .` -> `git commit -m "描述內容"`
4. **同步雲端**：`git pull` (下載最新) -> `git push` (上傳更新)

---

## 📂 專案結構 (Project Structure)

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

## 🛠️ 測試流程 (重要！)

> **⚠️ 注意**：由於本專案使用藍牙 (BLE) 功能，**不支援 Expo Go**。請務必使用「開發版客戶端 (Development Build)」。

### 1. 硬體端 (Pico W)

* 使用 Thonny 將 `pico/` 內檔案上傳。
* 執行 `main.py`，確認 OLED 顯示「Press to Start」。

### 2. 後端伺服器 (Flask)

1. 進入 `back/` 並啟動虛擬環境：`venv\Scripts\activate` (Windows)。
2. 安裝套件：`pip install -r requirements.txt`。
3. 啟動：`python app.py`。

### 3. 前端 App (Expo)

#### **A. 初始環境設定 (僅需執行一次)**

```bash
cd front
npm install
eas login  # 登入你的 Expo 帳號

```

#### **B. 建立原生殼 (當權限或套件變動時執行)**

**這是解決 `createClient of null` 的關鍵步驟：**

1. 執行雲端打包：
```bash
eas build --profile development --platform android

```


2. 下載並安裝：掃描產出的 QR Code 下載 `.apk` 並安裝至**實體手機**。

#### **C. 日常前端開發 (改 UI 專用)**

**只要原生殼裝好了，平常改介面不需要重新 Build：**

1. 啟動伺服器：
```bash
npx expo start --dev-client

```


2. 手機操作：打開安裝好的專屬 App，掃描電腦上的 QR Code 即可連線。
3. **熱更新**：修改 `src/` 下的任何代碼並存檔，手機畫面會即時更新。

---

## 🔍 連線偵錯指引 (Debug)

| 問題 | 解決方案 |
| --- | --- |
| **createClient of null** | 誤用了 Expo Go。請改用 `eas build` 產出的專屬 App。 |
| **找不到杯墊藍牙** | 1. 確認手機藍牙與 **GPS 定位** 已開啟。 <br>

<br> 2. 檢查 `app.json` 是否有 `BLUETOOTH_SCAN` 權限。 |
| **API 無法連線** | 檢查 `api.js`，將 `localhost` 改為電腦的 **區域網路 IP**。 |
| **藍牙連線不穩定** | 確保沒有其他 App (如 nRF Connect) 正連接著 Pico W。 |

---

## 📝 開發分配 (Where to Modify)

* **修改 UI 介面**：`front/src/screens/DashboardScreen.js`
* **調整藍牙邏輯**：`front/src/hooks/useBLE.js`
* **後端 API/AI 邏輯**：`back/app.py`

---
