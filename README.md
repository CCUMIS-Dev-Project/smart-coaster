
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
* 推送至雲端： `git push -u origin <branch-name>`

3. **非第一次載專案到本地IDE**
* 查看你現在在哪個 branch: `git branch`
* 切換到你要的 branch: `git checkout <branch-name>`
* update更動: `git pull`



## 📂 專案結構 (Project Structure)

```text
smart-coaster/ 
├── pico/                   # Raspberry Pi Pico W (MicroPython)
│   ├── main.py             # 主程式邏輯 (BLE 廣播、重量偵測、燈效)
│   ├── ble_advertising.py  # 藍牙廣播輔助庫
│   ├── hx711_pio.py        # 重量感測器驅動 (PIO 版本)
│   └── ssd1306.py          # OLED 螢幕驅動
├── front/                  # React Native + Expo 手機 App
│   ├── App.js              # 入口程式
│   ├── app.json            # Expo 設定 (包含 Android 藍牙權限)
│   └── src/
│       ├── hooks/
│       │   └── useBLE.js   # 藍牙連線與數據監聽邏輯
│       ├── screens/
│       │   └── DashboardScreen.js # 主監控畫面
│       └── services/
│           └── api.js      # 與 Flask 後端通訊介面
└── back/                   # Flask Backend 伺服器
    ├── app.py              # 伺服器主程式 (Port 5000)
    ├── requirements.txt    # 後端依賴套件
    └── .env                # 機密金鑰 (如 GROQ_API_KEY)

```


## 📝 開發導覽 (Where to Modify)

| 任務 | 檔案路徑 |
| --- | --- |
| 修改杯墊重量偵測邏輯 | `pico/main.py` |
| 修改藍牙連線/權限請求 | `front/src/hooks/useBLE.js` |
| 調整 App 介面 UI | `front/src/screens/DashboardScreen.js` |
| 串接新的後端 API | `front/src/services/api.js` |
| 處理 AI 聊天或資料庫邏輯 | `back/app.py` |


## 🛠️ 測試流程

! 後端測試或操作都須在虛擬環境(venv)中執行，避免全域安裝後在其他的專案上遇到python版本相容性問題 !

### venv設定方式 (terminal)
1. 第一次建立（在 back/ 資料夾裡）: `python -m venv venv`
2. 啟動 venv: `source venv/bin/activate  # Mac/Linux` <br>
             `venv\Scripts\activate  # Windows` 

* 做完離開: `deactivate`
* **venv不要push到github**，確認 `.gitignore` 裡有這行： `venv/`


### 1. 硬體端設定 (Pico W)

* **環境**：使用 Thonny IDE，並確保 Pico W 已燒錄 MicroPython 韌體。
* **操作**：
1. 將 `pico/` 資料夾內所有檔案上傳至 Pico W。
2. 確保 `main.py` 中的 `gap_name` 設定為 `"SmartCoaster"`。
3. 執行 `main.py`，OLED 螢幕應顯示「Press to Start」。



### 2. 後端伺服器 (Flask)

* **環境**：Python 3.x
* **操作**：
1. `cd back`
2. 安裝套件：`pip install -r requirements.txt`
3. 啟動伺服器：`python app.py`


* *註：伺服器預設於 `http://0.0.0.0:5000` 運行。*



### 3. 前端 App (Expo)

* **環境準備**：安裝必要的原生通訊套件
```bash
cd front
npm install
```
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

## 🔍 連線偵錯指引 (Debug)

1. **找不到杯墊？**
* 確保 **nRF Connect** 等其他藍牙 App 已斷開連線，藍牙具備獨佔性。
* 檢查 Pico W 終端機是否報錯。


2. **收到數據但沒顯示？**
* 檢查 `useBLE.js` 中的 `SERVICE_UUID` 是否與 Pico W 端的 UUID (小寫) 完全匹配。


3. **API 無法連線？**
* 前端呼叫後端時，請勿使用 `localhost`，請改用電腦的區域網路 IP (如 `192.168.x.x`)。



