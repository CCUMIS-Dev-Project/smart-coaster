from machine import Pin, I2C, SPI
from hx711_pio import HX711
from ssd1306 import SSD1306_I2C
# from ahtx0 import AHT20
import dht

import utime
import math
import bluetooth
from ble_advertising import advertising_payload

# --- 硬體初始化 ---
# 1. OLED (I2C0, GP4/GP5)
i2c = I2C(0, sda=Pin(4), scl=Pin(5))
oled = SSD1306_I2C(128, 64, i2c)

# 2. HX711 (GP14/GP15)
hx = HX711(Pin(15), Pin(14))
hx.set_scale(420) 

# 3. SK9822 (SPI0, GP2/GP3)
NUM_LEDS = 23
spi = SPI(0, baudrate=4000000, sck=Pin(2), mosi=Pin(3))

# 4. 按鈕設定 (GP16)
button = Pin(16, Pin.IN, Pin.PULL_UP)

# 5. AHT20 (I2C1, GP6/GP7)
# i2c1 = I2C(1, sda=Pin(6), scl=Pin(7))
# aht_sensor = AHT20(i2c1)

# 5. DHT11 (GP6)
dht_sensor = dht.DHT11(Pin(6))

# --- 變數初始化 ---
system_active = False   # 系統開關狀態
last_stable_volume = 0 
is_on_coaster = False  
threshold = 30         
drink_amount = 0 # 每次開啟杯墊的總喝水量
last_interaction_time = 0 
REMINDER_MS = 30 * 60 * 1000 # 正式版：30分鐘
# REMINDER_MS = 20 * 1000    # 測試版
daily_target = 2000
diff = 0.0

drink_density = 1 # 先只用水的密度，之後再根據drink_type_id對映不同飲品密度
# drink_type_id

# --- 溫溼度感測器 ---
last_sensor_ticks = 0
SENSOR_INTERVAL_MS = 10000  # 設定為 10000ms
current_temp = 0.0  # 溫度
current_hum = 0.0   # 濕度

# --- 螢幕刷新控制 ---
last_display_ticks = 0
DISPLAY_INTERVAL_MS = 500  # 每 500ms 更新一次螢幕，既省資源又夠流暢

# --- 等待穩定變數 ---
STABLE_DELAY_MS = 3000   # 等待 3 秒
place_down_ticks = 0     # 記錄放下瞬間的 ticks
is_waiting_for_stable = False

# --- 藍芽設定 ---
_IRQ_CENTRAL_CONNECT = 1
_IRQ_CENTRAL_DISCONNECT = 2


# 自定義 UUID (建議使用工具生成，這裡用範例)
# 服務 UUID
_SMART_COASTER_SERVICE_UUID = bluetooth.UUID('6e400001-b5a3-f393-e0a9-e50e24dcca9e')
# 特徵 UUID (用來傳送喝水量)
_WATER_DATA_CHAR_UUID = (bluetooth.UUID('6e400003-b5a3-f393-e0a9-e50e24dcca9e'), bluetooth.FLAG_NOTIFY | bluetooth.FLAG_READ)
_SMART_COASTER_SERVICE = (_SMART_COASTER_SERVICE_UUID, (_WATER_DATA_CHAR_UUID,),)

# --- 函式定義 ---

def update_leds_data(led_data):
    """
    傳入一個包含所有 LED 顏色資料的 list，一次性寫入 SPI。
    led_data 格式: [(r,g,b,bright), (r,g,b,bright), ...]
    """
    # SK9822 協定：起始幀(4 bytes 0) + 數據幀(4 bytes * N) + 結束幀
    buf = bytearray(4 + (NUM_LEDS * 4) + 4)
    # 起始幀已經是 0，不需動
    
    for i in range(NUM_LEDS):
        r, g, b, brightness = led_data[i]
        header = 0xE0 | (int(brightness * 31) & 0x1F)
        idx = 4 + (i * 4)
        buf[idx] = header
        buf[idx+1] = b
        buf[idx+2] = g
        buf[idx+3] = r
    
    # 結束幀設為 0xFF
    for j in range(4):
        buf[-(j+1)] = 0xFF
        
    spi.write(buf)

def set_leds_rotate(r, g, b, base_brightness, pos): # 提醒藍燈
    data = []
    for i in range(NUM_LEDS):
        dist = abs(i - pos)
        if dist > NUM_LEDS / 2: dist = NUM_LEDS - dist
        
        pixel_brightness = base_brightness * (1 - dist / 8) if dist < 8 else 0
        data.append((r, g, b, pixel_brightness))
    update_leds_data(data)

def set_leds_fill(r, g, b, brightness): # 提醒橘燈
    data = [(r, g, b, brightness)] * NUM_LEDS
    update_leds_data(data)


def update_display(amount, diff, reminder=False, syncing=False):
    oled.fill(0)
    
    # 1. 標題
    oled.text("Day Day", 12, 0)
    
    # 2. 顯示喝水數據
    oled.text("{:.0f}/{:d} ml".format(amount, daily_target), 25, 12)
    
    # 3. 進度條設計
    # 設定進度條的坐標與長寬
    bar_x = 10
    bar_y = 28
    bar_width = 108
    bar_height = 12
    
    # 畫出進度條外框 (x, y, w, h, color)
    oled.rect(bar_x, bar_y, bar_width, bar_height, 1)
    
    # 計算進度比例 (限制最大值為 1.0，避免爆表)
    progress = min(amount / daily_target, 1.0)
    # 計算填滿部分的寬度 (內縮 2 像素看起來比較美觀)
    fill_width = int(progress * (bar_width - 4))
    
    # 畫出填滿部分
    if fill_width > 0:
        oled.fill_rect(bar_x + 2, bar_y + 2, fill_width, bar_height - 4, 1)
        
    # 4. 底部狀態資訊
    if syncing:
        oled.text("Syncing...", 35, 50) # 正在等 3 秒時顯示
    elif reminder:
        oled.text("!! DRINK WATER !!", 0, 50)
    elif diff > 5:
        oled.text("Nice! -{:.1f}ml".format(diff), 5, 50)
    else:
        # 平時顯示百分比
        percent = int(progress * 100)
        oled.text("Progress: {:d}%".format(percent), 15, 50)
        
    oled.show()
    
def get_average_weight(samples=15):
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

class BLEPeripheral:
    def __init__(self):
        self._ble = bluetooth.BLE()
        self._ble.active(True)
        
        # 【新增】除了廣播，也設定系統端的名稱
        self._ble.config(gap_name="SmartCoaster")
        self._ble.irq(self._irq)
        ((self._handle,),) = self._ble.gatts_register_services((_SMART_COASTER_SERVICE,))
        self._connections = set()
        
        # 1. 廣播封包：只放服務 UUID
        self._adv_payload = advertising_payload(
            services=[_SMART_COASTER_SERVICE_UUID]
        )
        # 2. 掃描回應封包：只放名稱
        self._resp_payload = advertising_payload(
            name="SmartCoaster"
        )
        self._advertise()

    def _irq(self, event, data):
        if event == _IRQ_CENTRAL_CONNECT:
            conn_handle, _, _ = data
            self._connections.add(conn_handle)
            print("APP 已連線")
        elif event == _IRQ_CENTRAL_DISCONNECT:
            conn_handle, _, _ = data
            self._connections.remove(conn_handle)
            print("APP 已斷線")
            self._advertise()

    def _advertise(self):
        # 同時傳入 adv_data 和 resp_data
        self._ble.gap_advertise(
            100, 
            adv_data=self._adv_payload, 
            resp_data=self._resp_payload
        )

    # def send_full_status(self, active, on_coaster, drink, reminder, temp, hum):
    #     # 格式: active(0/1),weight,on_coaster(0/1),drink,reminder,temp,hum
    #     # 範例: "1,250.5,1,10.0,1800000,25.5,65.0"
    #     data = "{}|{}|{:.1f}|{}|{:.1f}|{:.1f}".format(
    #         1 if active else 0, 1 if on_coaster else 0, 
    #         drink, reminder, temp, hum
    #     )
    #     print(f"BLE發送: {data}")
    #     for conn_handle in self._connections:
    #         self._ble.gatts_notify(conn_handle, self._handle, data)

    def send_water_status(self, active, on_coaster, drink):
        """傳送核心狀態與喝水量 (標記: W)"""
        # 格式範例: "W|1|0|150.5" (約 10-12 bytes)
        data = "W|{}|{}|{:.1f}".format(
            1 if active else 0, 
            1 if on_coaster else 0, 
            drink
        )
        self._notify(data)

    def send_env_status(self, temp, hum, reminder_ms):
        """傳送環境數據與提醒設定 (標記: E)"""
        # 將提醒時間轉為分鐘，縮短字串長度
        reminder_min = reminder_ms // 60000
        # 格式範例: "E|25.5|60.0|30" (約 12-15 bytes)
        data = "E|{:.1f}|{:.1f}|{}".format(temp, hum, reminder_min)
        self._notify(data)

    def _notify(self, data):
        """私有輔助函式，執行實際發送"""
        print(f"BLE發送: {data}")
        for conn_handle in self._connections:
            self._ble.gatts_notify(conn_handle, self._handle, data)
    

ble = BLEPeripheral()

# 初始畫面
oled.fill(0)
oled.text("Power Off", 30, 25)
oled.text("Press to Start", 10, 40)
oled.show()
set_leds_rotate(0, 0, 0,0,0) # 確保初始燈滅

# --- 主迴圈 ---
while True:
    current_ticks = utime.ticks_ms()

    # 1. 偵測按鈕切換開關
    if button.value() == 0:
        utime.sleep_ms(20)
        if button.value() == 0:
            system_active = not system_active
            
            if system_active:
                oled.fill(0)
                oled.text("Booting...", 30, 30)
                oled.show()
                hx.tare(15) 
                last_stable_volume = 0
                drink_amount = 0
                last_interaction_time = current_ticks # 重設計時器
                print("系統已啟動")
            else:
                oled.fill(0)
                oled.text("Power Off", 30, 25)
                oled.show()
                set_leds_rotate(0, 0, 0,0,0) # 關機時滅燈
                utime.sleep(1)
                oled.fill(0)
                oled.show()
                print("系統進入休眠")
            
            while button.value() == 0:
                utime.sleep_ms(10)

    # 2. 系統啟動後的邏輯
    if system_active:
        try:
            # --- 溫溼度感測器讀取 (每 3 秒一次) ---
            if utime.ticks_diff(current_ticks, last_sensor_ticks) > SENSOR_INTERVAL_MS:
                # current_temp = aht_sensor.temperature     # 讀取溫度
                # current_hum = aht_sensor.relative_humidity # 讀取濕度
                # last_sensor_ticks = current_ticks         # 更新最後感測時間
                # print("Sensor Updated: {:.1f}C".format(current_temp))

                try:
                    dht_sensor.measure()               # 先進行測量
                    current_temp = dht_sensor.temperature() # 讀取溫度
                    current_hum = dht_sensor.humidity()    # 讀取濕度
                    last_sensor_ticks = current_ticks
                    print("DHT11 Updated: {:.1f}C, {:.1f}%".format(current_temp, current_hum))
                    ble.send_env_status(current_temp, current_hum, REMINDER_MS)
                except OSError as e:
                    print("DHT11 讀取失敗:", e) # DHT11 有時會發生隨機讀取失敗，需捕捉異常


            current_weight = hx.get_units()
            
            # 計算距離上一次喝水過多久
            time_passed = utime.ticks_diff(current_ticks, last_interaction_time)
            is_overdue = time_passed > REMINDER_MS
            
            # 狀態改變或喝水時發送數據
            data_changed = False

            # 每隔一段時間讀取一次溫溼度，避免頻繁讀取導致傳感器發熱
            # if utime.ticks_diff(current_ticks, last_display_ticks) > DISPLAY_INTERVAL_MS:
            #     current_temp = aht_sensor.temperature     #
            #     current_hum = aht_sensor.relative_humidity #
            
            # 邏輯 A：水壺放下 (熄燈)
            if current_weight > threshold:
                if not is_on_coaster: #剛放回
                    if not is_waiting_for_stable:
                        # 剛放下的那一刻，啟動計時
                        is_waiting_for_stable = True
                        place_down_ticks = current_ticks
                        set_leds_rotate(0,0,0,0,0) # 熄滅拿起時的藍燈
                        # 立即顯示目前的水量，並帶上 syncing 提示
                        update_display(drink_amount, 0, syncing=True) 
                        print("檢測到放下，啟動 3 秒穩定計時")

                    # 檢查是否已經等滿了 3 秒
                    elif utime.ticks_diff(current_ticks, place_down_ticks) > STABLE_DELAY_MS:
                        # 時間到！執行計算喝水量邏輯
                        # 計算目前容量 & 與上一次容量差
                        current_volume = get_average_weight() / drink_density
                        diff = last_stable_volume - current_volume

                        set_leds_rotate(0, 0, 0,0,0) # 放下時關燈
                        utime.sleep(1) 
                        
                        if diff > 15:
                            drink_amount += diff
                            last_interaction_time = current_ticks # 【核心】喝水了，重設計時器
                            is_overdue = False
                            data_changed = True
                            
                        elif diff <= 15 and diff >= 0 :
                            data_changed = False
                            
                        else:
                            last_interaction_time = current_ticks # 補水也算互動，重設計時器
                            data_changed = True
                        
                        last_stable_volume = current_volume 
                        is_on_coaster = True
                        is_waiting_for_stable = False
                        update_display(drink_amount, diff, reminder=is_overdue,syncing=False)

                    
                # ----------------- 橘燈提醒與熄燈邏輯 -----------------
                if is_on_coaster: # 只有確認放穩了才處理燈號
                    if is_overdue:
                        # 狀態：已超時 -> 閃爍橘燈
                        ms = current_ticks
                        breath = (math.sin(ms / 250) + 1) / 2 # 呼吸效果
                        # 橘色提醒 RGB(255, 100, 0)
                        set_leds_fill(255, 100, 0, breath * 0.1)
                    else:
                        # 狀態：未超時 (剛開機、剛喝完水、剛補完水) -> 確保熄燈
                        set_leds_fill(0, 0, 0, 0)

                    # 判斷是否到了該刷新螢幕的時間
                    if utime.ticks_diff(current_ticks, last_display_ticks) > DISPLAY_INTERVAL_MS:
                        # 這裡使用安全的 getattr 或預設值，避免 diff 未定義的錯誤
                        current_diff = diff if 'diff' in locals() else 0
                        update_display(drink_amount, current_diff, reminder=is_overdue, syncing=False)
                        last_display_ticks = current_ticks
                # --------------------------------------------------------

            # 邏輯 B：水壺拿起 (亮水藍色)
            elif current_weight < threshold:
                
                is_waiting_for_stable = False # 拿起後重置等待

                if is_on_coaster:
                    is_on_coaster = False
                    oled.fill(0)
                    oled.text("Drinking...", 30, 30)
                    oled.show()
                    last_display_ticks = current_ticks # 重設計時器
                    data_changed = True

                # --- 環繞燈邏輯 ---
                # 調整 150 這個數字：數字越大轉越慢，數字越小轉越快
                current_pos = (current_ticks / 150) % NUM_LEDS
                
                # 水藍色 RGB(0, 191, 255)，亮度上限設為 0.15
                set_leds_rotate(0, 191, 255, 0.05, current_pos)
                    
            # 統一發送邏輯
            # 您可以選擇在 data_changed 為 True 時發送，或是設定一個計時器每秒發送一次
            # 格式: active(0/1),weight,on_coaster(0/1),drink,reminder,temp,hum
            # 範例: "1,250.5,1,10.0,1800000,25.5,65.0"
            if data_changed:
                # ble.send_full_status(
                #     system_active, 
                #     is_on_coaster, 
                #     drink_amount, 
                #     REMINDER_MS,
                #     current_temp,
                #     current_hum
                # )
                ble.send_water_status(
                    system_active, 
                    is_on_coaster, 
                    drink_amount
                )
                data_changed = False
                    
                
        except OSError:
            pass
    
    utime.sleep_ms(20)


