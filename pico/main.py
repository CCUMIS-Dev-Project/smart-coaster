from machine import Pin, I2C, SPI
from hx711_pio import HX711
from ssd1306 import SSD1306_I2C
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

# --- 變數初始化 ---
system_active = False   # 系統開關狀態
last_stable_weight = 0 
is_on_coaster = False  
threshold = 30         
drink_amount = 0
last_interaction_time = 0 
# REMINDER_MS = 30 * 60 * 1000 # 正式版：30分鐘
REMINDER_MS = 20 * 1000    # 測試版

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
def update_leds_fill(r, g, b, brightness):
    """全體填充燈效 (用於提醒)"""
    spi.write(b'\x00\x00\x00\x00')
    header = 0xE0 | (int(brightness * 31) & 0x1F)
    for _ in range(NUM_LEDS):
        spi.write(bytearray([header, b, g, r]))
    spi.write(b'\xFF\xFF\xFF\xFF')

def update_leds_rotate(r, g, b, base_brightness, pos):
    """
    pos: 當前光點的中心位置 (0 ~ NUM_LEDS-1)
    """
    spi.write(b'\x00\x00\x00\x00') # 起始幀
    
    for i in range(NUM_LEDS):
        # 計算每顆燈距離中心點的距離
        # 為了讓環繞看起來滑順，我們計算最短圓周距離
        dist = abs(i - pos)
        if dist > NUM_LEDS / 2:
            dist = NUM_LEDS - dist
            
        # 根據距離決定亮度：距離中心 5 顆以內的燈才會亮，且越遠越暗
        if dist < 16:
            # 距離 0 = 100% 亮度, 距離 1 = 66%, 距離 2 = 33%
            pixel_brightness = base_brightness * (1 - dist / 16)
        else:
            pixel_brightness = 0
            
        header = 0xE0 | (int(pixel_brightness * 31) & 0x1F)
        spi.write(bytearray([header, b, g, r]))
        
    spi.write(b'\xFF\xFF\xFF\xFF') # 結束幀

def update_display(current, diff, reminder = False):
    oled.fill(0)
    oled.text("Smart Coaster", 10, 0)
    oled.text("Now: {:.1f}g".format(current), 0, 25)
    if reminder:
        oled.text("!! DRINK WATER !!", 0, 45)
    elif diff > 0:
        oled.text("Drank: -{:.1f}g".format(diff), 0, 45)
    else:
        oled.text("Waiting...", 0, 45)
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

    def send_full_status(self, active, weight, on_coaster, drink, reminder):
        # 格式: active(0/1),weight,on_coaster(0/1),drink,reminder
        # 範例: "1,250.5,1,10.0,1800000"
        data = "{},{},{},{},{}".format(
            1 if active else 0,
            "{:.1f}".format(weight),
            1 if on_coaster else 0,
            "{:.1f}".format(drink),
            reminder
        )
        print(f"BLE發送: {data}")
        for conn_handle in self._connections:
            self._ble.gatts_notify(conn_handle, self._handle, data)

ble = BLEPeripheral()

# 初始畫面
oled.fill(0)
oled.text("Power Off", 30, 25)
oled.text("Press to Start", 10, 40)
oled.show()
update_leds_rotate(0, 0, 0,0,0) # 確保初始燈滅

# --- 主迴圈 ---
while True:
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
                last_stable_weight = 0
                drink_amount = 0
                last_interaction_time = utime.ticks_ms() # 重設計時器
                print("系統已啟動")
            else:
                oled.fill(0)
                oled.text("Power Off", 30, 25)
                oled.show()
                update_leds_rotate(0, 0, 0,0,0) # 關機時滅燈
                utime.sleep(1)
                oled.fill(0)
                oled.show()
                print("系統進入休眠")
            
            while button.value() == 0:
                utime.sleep_ms(10)

    # 2. 系統啟動後的邏輯
    if system_active:
        try:
            current_weight = hx.get_units()
            
            # 計算距離上一次喝水過多久
            time_passed = utime.ticks_diff(utime.ticks_ms(), last_interaction_time)
            is_overdue = time_passed > REMINDER_MS
            
            # 狀態改變或喝水時發送數據
            data_changed = False
            
            # 邏輯 A：水壺放下 (熄燈)
            if current_weight > threshold:
                if not is_on_coaster: #剛放回
                    update_leds_rotate(0, 0, 0,0,0) # 放下時關燈
                    utime.sleep(1) 
                    new_weight = get_average_weight()
                    diff = last_stable_weight - new_weight
                    
                    if diff > 5:
                        drink_amount = diff
                        last_interaction_time = utime.ticks_ms() # 【核心】喝水了，重設計時器
                        is_overdue = False
                        data_changed = True
                        
                    elif diff < -5:
                        drink_amount = 0
                        last_interaction_time = utime.ticks_ms() # 補水也算互動，重設計時器
                        data_changed = True
                    
                    last_stable_weight = new_weight 
                    is_on_coaster = True
                    update_display(new_weight, drink_amount, reminder=is_overdue)
                if is_overdue:
                    ms = utime.ticks_ms()
                    breath = (math.sin(ms / 250) + 1) / 2 # 呼吸效果
                    # 橘色提醒 RGB(255, 100, 0)
                    update_leds_fill(255, 100, 0, breath * 0.1)
                    update_display(new_weight, drink_amount, reminder=is_overdue)
                else:
                    update_leds_fill(0, 0, 0, 0) # 沒超時則熄燈

            # 邏輯 B：水壺拿起 (亮水藍色)
            elif current_weight < threshold:
                # --- 環繞燈邏輯 ---
                ms = utime.ticks_ms()
                # 調整 150 這個數字：數字越大轉越慢，數字越小轉越快
                current_pos = (ms / 150) % NUM_LEDS
                
                # 水藍色 RGB(0, 191, 255)，亮度上限設為 0.15
                update_leds_rotate(0, 191, 255, 0.05, current_pos)
                
                last_interaction_time = utime.ticks_ms() # 拿起的每一刻都更新last_interaction_time
                
                if is_on_coaster:
                    is_on_coaster = False
                    oled.fill(0)
                    oled.text("Drinking...", 30, 30)
                    oled.show()
                    data_changed = True
                    
            # 統一發送邏輯
            # 您可以選擇在 data_changed 為 True 時發送，或是設定一個計時器每秒發送一次
            if data_changed:
                ble.send_full_status(
                    system_active, 
                    last_stable_weight, 
                    is_on_coaster, 
                    drink_amount, 
                    REMINDER_MS
                )
                drink_amount = 0 # 發送後歸零單次喝水量，避免重複計算
                    
                
        except OSError:
            pass
    
    utime.sleep_ms(20)
