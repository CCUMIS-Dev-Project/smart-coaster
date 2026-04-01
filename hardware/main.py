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
# 格式: "W|{系統開關}|{是否在位}|{本次喝水量}"
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
import machine
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
# button = Pin(BUTTON_PIN, Pin.IN, Pin.PULL_UP)
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

# --- 重壓雙擊偵測狀態 ---
# 狀態機: 'idle' -> 'pressed1' -> 'released1' -> 'pressed2' -> 觸發！
press_state = 'idle'
press_state_ticks = 0      # 進入目前狀態的時間戳
is_currently_pressed = False  # 上一次迴圈是否處於重壓中

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

def check_double_press(current_weight, current_ticks):
    """
    重壓雙擊偵測狀態機。
    回傳 True 代表偵測到雙擊，應切換開關機。
    
    狀態轉移流程:
    idle ──(重壓持續>debounce)──> pressed1
    pressed1 ──(鬆開)──> released1
    released1 ──(重壓持續>debounce, 且在window內)──> 觸發！回到 idle
    released1 ──(超過window時間)──> idle (超時取消)
    """
    global press_state, press_state_ticks, is_currently_pressed
    
    heavy = current_weight > PRESS_WEIGHT_THRESHOLD
    light = current_weight < PRESS_RELEASE_THRESHOLD
    
    if press_state == 'idle':
        if heavy and not is_currently_pressed:
            # 偵測到第一次重壓開始
            press_state = 'pressing1'
            press_state_ticks = current_ticks
    
    elif press_state == 'pressing1':
        if not heavy:
            # 還沒壓夠久就鬆開了，取消
            press_state = 'idle'
        elif utime.ticks_diff(current_ticks, press_state_ticks) > PRESS_DEBOUNCE_MS:
            # 確認第一次重壓有效
            press_state = 'pressed1'
    
    elif press_state == 'pressed1':
        if light:
            # 第一次鬆開
            press_state = 'released1'
            press_state_ticks = current_ticks
    
    elif press_state == 'released1':
        # 檢查是否超時
        if utime.ticks_diff(current_ticks, press_state_ticks) > DOUBLE_PRESS_WINDOW_MS:
            press_state = 'idle'
        elif heavy:
            # 在時間窗口內偵測到第二次重壓
            press_state = 'pressing2'
            press_state_ticks = current_ticks
    
    elif press_state == 'pressing2':
        if not heavy:
            # 沒壓夠久就放開，回到等待狀態
            press_state = 'released1'
            # 注意：這裡不重設 press_state_ticks，保留原本的超時計算
        elif utime.ticks_diff(current_ticks, press_state_ticks) > PRESS_DEBOUNCE_MS:
            # 第二次重壓確認！觸發開關機
            press_state = 'idle'
            is_currently_pressed = heavy
            print("✅ 偵測到雙擊重壓！")
            return True
    
    is_currently_pressed = heavy
    return False


# --- 設定藍牙接收回呼函數 ---
def handle_ble_rx(data):
    print(f"收到 APP 指令: {data}")
    if data.startswith('T|'):
        try:
            # 解析時間格式: T|YYYY|MM|DD|HH|MM|SS
            parts = data.split('|')
            y, m, d, h, mns, s = map(int, parts[1:])

            # 設定硬體 RTC
            rtc = machine.RTC()
            # 格式: (year, month, day, weekday, hours, minutes, seconds, subseconds)
            rtc.datetime((y, m, d, 0, h, mns, s, 0))
            print(f"✅ 系統 RTC 校時成功: {y}/{m:02d}/{d:02d} {h:02d}:{mns:02d}:{s:02d}")
        except Exception as e:
            print("❌ RTC 校時失敗:", e)

# 將這個函數綁定給藍牙模組
ble.on_rx = handle_ble_rx

# --- 啟動初始畫面 ---
display.show_init_screen()
leds.turn_off()

utime.sleep_ms(500)   # 等待感測器穩定
hx.tare(15)           # 歸零，讓重壓偵測有正確的基準線
print("HX711 歸零完成")

# ==========================================
# --- 5. 主迴圈開始 ---
# ==========================================
while True:
    current_ticks = utime.ticks_ms()

    raw_weight = hx.get_units()

    if check_double_press(raw_weight, current_ticks):
        system_active = not system_active

        if system_active:
            display.show_booting()
            # 等待使用者手離開杯墊後再歸零
            # print("等待鬆開...")
            while hx.get_units() > PRESS_RELEASE_THRESHOLD:
                utime.sleep_ms(50)
            utime.sleep_ms(500)  # 額外等待穩定
            hx.tare(15) # 重量歸零
            last_stable_volume = 0
            drink_amount = 0
            last_interaction_time = utime.ticks_ms()
            print("系統已啟動")
        else:
            display.show_power_off()
            leds.turn_off()
            utime.sleep(1)
            display.clear()
            display.show()
            print("系統進入休眠")

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
            current_weight = raw_weight  # 複用迴圈開頭已讀取的重量，避免重複讀取
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
                drink_amount = 0
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


