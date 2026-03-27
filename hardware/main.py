# =================================================================
# 【BLE 傳輸格式說明】
# 服務 UUID: 6e400001-b5a3-f393-e0a9-e50e24dcca9e
# 特徵 UUID: 6e400003-b5a3-f393-e0a9-e50e24dcca9e (NOTIFY / READ)
# 
# 數據類型標記 (第一個字元): 
# 'W' = Water Status (核心水量與狀態)
# 'E' = Env Status (環境溫溼度與設定)
# =================================================================

# 1. 核心狀態數據 (發送時機：放回杯墊、拿起水杯、系統切換時)
# 格式: "W|{系統開關}|{是否在位}|{當日累積喝水量}"
# 範例: "W|1|0|150.5"
# 欄位說明:
#   - 系統開關: 1 (啟動), 0 (關機/休眠)
#   - 是否在位: 1 (水杯在上面), 0 (水杯拿起)
#   - 累計喝水量: float (單位: ml)

# 2. 環境感測數據 (發送時機：每 10 秒固定更新)
# 格式: "E|{溫度}|{濕度}|{提醒間隔}"
# 範例: "E|26.5|60.0|30"
# 欄位說明:
#   - 溫度: float (單位: °C)
#   - 濕度: float (單位: %)
#   - 提醒間隔: int (單位: 分鐘)
# =================================================================
import utime
import math
from machine import Pin
import dht
from hx711_pio import HX711

# 匯入我們寫好的專屬模組與設定檔
from config import *
from led_manager import LEDManager
from display_manager import DisplayManager
from ble_manager import BLEManager
from storage_manager import StorageManager

# --- 1. 系統與硬體初始化 ---
# 初始化模組
leds = LEDManager()
display = DisplayManager()
ble = BLEManager()
storage = StorageManager()

# 初始化尚未模組化的單一感測器
button = Pin(BUTTON_PIN, Pin.IN, Pin.PULL_UP)
dht_sensor = dht.DHT11(Pin(DHT11_PIN))
hx = HX711(Pin(HX711_SCK_PIN), Pin(HX711_DT_PIN))
hx.set_scale(HX711_SCALE)

# --- 2. 狀態變數初始化 ---
system_active = False
is_on_coaster = False
is_waiting_for_stable = False

drink_amount = 0
last_stable_volume = 0
diff = 0.0

# 計時器變數
last_interaction_time = 0
last_sensor_ticks = 0
last_display_ticks = 0
place_down_ticks = 0
last_sync_attempt = 0  # 紀錄上次嘗試同步離線數據的時間

# --- 3. 輔助函式 ---
def get_average_weight(samples=15):
    """取得穩定的重量平均值"""
    total = 0
    valid_count = 0
    for _ in range(samples):
        val = hx.read() 
        if val > 0:
            total += val
            valid_count += 1
        utime.sleep_ms(10)
    if valid_count == 0: return 0
    return (total / valid_count - hx.OFFSET) / hx.SCALE

# --- 4. 啟動初始畫面 ---
display.show_init_screen()
leds.turn_off()

# ==========================================
# --- 5. 主迴圈開始 ---
# ==========================================
while True:
    current_ticks = utime.ticks_ms()

    # [區塊 A] 開關機偵測邏輯
    if button.value() == 0:
        utime.sleep_ms(20) # 防彈跳
        if button.value() == 0:
            system_active = not system_active
            
            if system_active:
                display.show_booting()
                hx.tare(15) # 重量歸零
                last_stable_volume = 0
                drink_amount = 0
                last_interaction_time = current_ticks
                print("系統已啟動")
            else:
                display.show_power_off()
                leds.turn_off()
                utime.sleep(1)
                display.clear()
                display.show()
                print("系統進入休眠")
            
            # 等待按鈕放開
            while button.value() == 0:
                utime.sleep_ms(10)

    # [區塊 B] 系統運行中邏輯
    if system_active:
        try:
            # 1. 定期讀取溫溼度 (每 10 秒)
            if utime.ticks_diff(current_ticks, last_sensor_ticks) > SENSOR_INTERVAL_MS:
                try:
                    dht_sensor.measure()
                    current_temp = dht_sensor.temperature()
                    current_hum = dht_sensor.humidity()
                    last_sensor_ticks = current_ticks
                    print("DHT11 Updated: {:.1f}C, {:.1f}%".format(current_temp, current_hum))
                    # 透過藍牙發送環境數據
                    ble.send_env_status(current_temp, current_hum, REMINDER_MS)
                except OSError as e:
                    print("DHT11 讀取失敗:", e)

            # 2. 取得當前重量與計算超時狀態
            current_weight = hx.get_units()
            time_passed = utime.ticks_diff(current_ticks, last_interaction_time)
            is_overdue = time_passed > REMINDER_MS
            data_changed = False

            # --- 邏輯分支 1：水杯在杯墊上 (計算水量、檢查提醒) ---
            if current_weight > WEIGHT_THRESHOLD:
                if not is_on_coaster: 
                    # 剛放回杯墊，開始 3 秒穩定倒數
                    if not is_waiting_for_stable:
                        is_waiting_for_stable = True
                        place_down_ticks = current_ticks
                        leds.turn_off()
                        display.update_main_screen(drink_amount, 0, syncing=True)
                        print("檢測到放下，啟動 3 秒穩定計時")

                    # 已經等滿了 3 秒，進行水量結算
                    elif utime.ticks_diff(current_ticks, place_down_ticks) > STABLE_DELAY_MS:
                        current_volume = get_average_weight() / DRINK_DENSITY
                        diff = last_stable_volume - current_volume

                        leds.turn_off()
                        utime.sleep(1) 
                        
                        if diff > 5:
                            drink_amount = diff
                            last_interaction_time = current_ticks # 喝水了，重設計時器
                            is_overdue = False
                            # 【離線儲存邏輯】
                            if ble.is_connected:
                                # APP 有連線，標記為需要發送
                                data_changed = True 
                            else:
                                # APP 沒連線，存入 Flash 記憶體
                                storage.save_record(diff)
                                print("APP 未連線，已將喝水量存入離線檔案")
                                
                        elif diff <= 15 and diff >= 0:
                            data_changed = False
                        else:
                            last_interaction_time = current_ticks # 補水也算互動
                            data_changed = True
                        
                        last_stable_volume = current_volume 
                        is_on_coaster = True
                        is_waiting_for_stable = False
                        display.update_main_screen(drink_amount, diff, reminder=is_overdue)

                # 放穩後的燈光與螢幕更新
                if is_on_coaster: 
                    if is_overdue:
                        # 橘色呼吸燈提醒
                        breath = (math.sin(current_ticks / 250) + 1) / 2
                        leds.set_fill(255, 100, 0, breath * 0.1)
                    else:
                        leds.turn_off()

                    if utime.ticks_diff(current_ticks, last_display_ticks) > DISPLAY_INTERVAL_MS:
                        display.update_main_screen(drink_amount, diff, reminder=is_overdue)
                        last_display_ticks = current_ticks

            # --- 邏輯分支 2：水杯被拿起來 (燈光特效、顯示喝水中) ---
            elif current_weight < WEIGHT_THRESHOLD:
                is_waiting_for_stable = False 

                if is_on_coaster:
                    is_on_coaster = False
                    display.show_drinking()
                    last_display_ticks = current_ticks
                    data_changed = True

                # 顯示水藍色環繞燈
                current_pos = (current_ticks / 150) % NUM_LEDS
                leds.set_rotate(0, 191, 255, 0.05, current_pos)
                    
            # --- 3. 數據發送邏輯 ---
            if data_changed:
                ble.send_water_status(system_active, is_on_coaster, drink_amount)
                data_changed = False
                
            # --- 4. 歷史離線數據同步邏輯 ---
            if ble.is_connected and storage.has_data():
                if utime.ticks_diff(current_ticks, last_sync_attempt) > 3000:
                    last_sync_attempt = current_ticks # 更新嘗試時間
                    
                    print("偵測到 APP 連線，準備同步離線數據...")
                    display.clear()
                    display.oled.text("Syncing...", 10, 30)
                    display.show()
                    
                    # 讀取所有離線數據
                    offline_records = storage.get_all_data()
                    
                    try:
                        # 將每一筆記錄傳給 APP
                        for record in offline_records:
                            utime.sleep_ms(1000) # 暫停 1000ms 讓 APP 有時間消化
                            ble._notify(record) 
                        
                        # 全部傳送成功後，才清空檔案
                        storage.clear_data()
                        display.clear() # 同步完成後清除畫面，讓它自然回到主儀表板
                        print("✅ 離線數據同步完成！")
                        
                    except Exception as e:
                        print(f"❌ 同步失敗 (APP 尚未準備好): {e}")
                        print("將於 3 秒後重新嘗試...")
                
        except OSError:
            pass
        
    
    
    # 避免迴圈跑太快佔用過多資源
    utime.sleep_ms(20)
