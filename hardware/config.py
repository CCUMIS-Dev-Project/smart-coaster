# ==========================================
# 智慧杯墊系統設定檔 (config.py)
# ==========================================

# --- 1. 硬體腳位定義 (Pins) ---
# OLED 顯示器 (I2C0)
OLED_SDA_PIN = 4
OLED_SCL_PIN = 5
OLED_WIDTH = 128
OLED_HEIGHT = 64

# HX711 重量感測器
HX711_DT_PIN = 14
HX711_SCK_PIN = 15
HX711_SCALE = 420  # 比例參數

# SK9822 環形 LED (SPI0)
LED_SCK_PIN = 2
LED_MOSI_PIN = 3
NUM_LEDS = 23      # LED 總顆數

# 其他輸入/感測器
BUTTON_PIN = 16    # 開關按鈕
DHT11_PIN = 6      # 溫溼度感測器

# --- 2. 系統邏輯與目標設定 ---
DAILY_TARGET = 2000         # 每日喝水目標 (ml)
WEIGHT_THRESHOLD = 30       # 判斷水杯是否在杯墊上的重量閥值 (g)
DRINK_DENSITY = 1           # 飲品密度 (預設為水=1)

# --- 3. 時間與計時器設定 (單位: 毫秒 ms) ---
REMINDER_MS = 30 * 60 * 1000  # 喝水提醒時間 (正式版：30分鐘)
# REMINDER_MS = 20 * 1000     # (測試版：20秒，展示時可解開此註解)

STABLE_DELAY_MS = 3000        # 放下水杯後等待穩定的時間 (3秒)
SENSOR_INTERVAL_MS = 600000    # 溫溼度感測器讀取頻率 (10分鐘)
DISPLAY_INTERVAL_MS = 500     # 螢幕刷新頻率 (0.5秒)

# --- 4. 藍牙 (BLE) 設定 ---
BLE_DEVICE_NAME = "SmartCoaster"
BLE_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e'
BLE_CHAR_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'

# --- 5. 重壓開關設定 (Double Press) ---
PRESS_WEIGHT_THRESHOLD = 150   # 判定為「重壓」的重量門檻 (g)，需遠大於正常水杯重量
PRESS_RELEASE_THRESHOLD = 100  # 低於此值代表已「鬆開」(g)，介於杯子重量和重壓之間
DOUBLE_PRESS_WINDOW_MS = 1000  # 兩次重壓之間的最大間隔 (ms)
PRESS_DEBOUNCE_MS = 100        # 單次重壓的最短持續時間，防止誤觸 (ms)

