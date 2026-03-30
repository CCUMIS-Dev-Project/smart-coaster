# ==========================================
# 智慧杯墊 - LED 控制模組 (led_manager.py)
# ==========================================
from machine import SPI, Pin
from config import * # 匯入腳位與常數設定

class LEDManager:
    def __init__(self):
        """初始化 SPI 與 SK9822 燈條"""
        # 使用 config.py 中的腳位定義
        self.spi = SPI(0, baudrate=4000000, sck=Pin(LED_SCK_PIN), mosi=Pin(LED_MOSI_PIN))
        self.num_leds = NUM_LEDS

    def update_leds_data(self, led_data):
        """
        核心寫入功能：傳入包含所有 LED 顏色資料的 list，一次性寫入 SPI。
        led_data 格式: [(r,g,b,bright), (r,g,b,bright), ...]
        """
        # SK9822 協定：起始幀(4 bytes 0) + 數據幀(4 bytes * N) + 結束幀
        buf = bytearray(4 + (self.num_leds * 4) + 4)
        
        for i in range(self.num_leds):
            r, g, b, brightness = led_data[i]
            # SK9822 的亮度控制在前 5 bits (最高 31)
            header = 0xE0 | (int(brightness * 31) & 0x1F)
            idx = 4 + (i * 4)
            buf[idx] = header
            buf[idx+1] = b
            buf[idx+2] = g
            buf[idx+3] = r
        
        # 結束幀設為 0xFF
        for j in range(4):
            buf[-(j+1)] = 0xFF
            
        self.spi.write(buf)

    def set_rotate(self, r, g, b, base_brightness, pos):
        """環繞燈光效果 (水杯拿起時的動畫)"""
        data = []
        for i in range(self.num_leds):
            dist = abs(i - pos)
            # 確保環繞效果跨越頭尾時能順暢連接
            if dist > self.num_leds / 2: 
                dist = self.num_leds - dist
            
            pixel_brightness = base_brightness * (1 - dist / 8) if dist < 8 else 0
            data.append((r, g, b, pixel_brightness))
            
        self.update_leds_data(data)

    def set_fill(self, r, g, b, brightness):
        """單一顏色填滿效果 (用於橘燈呼吸提醒)"""
        data = [(r, g, b, brightness)] * self.num_leds
        self.update_leds_data(data)
        
    def turn_off(self):
        """關閉所有 LED (熄燈專用)"""
        self.set_fill(0, 0, 0, 0)
