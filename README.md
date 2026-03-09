
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
├── pico/                   # Raspberry Pi Pico W (MicroPython)
│   ├── main.py             # 主程式邏輯 (BLE、重量偵測、燈效)
│   └── ...                 # 各種感測器驅動程式
├── front/                  # React Native + Expo 手機 App
│   ├── App.js              # 入口程式
│   ├── app.json            # 權限配置 (BLE 關鍵設定)
│   └── src/                # 前端源碼 (hooks, screens, services)
└── back/                   # Flask Backend 伺服器
    └── app.py              # 資料處理與 AI 邏輯

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
