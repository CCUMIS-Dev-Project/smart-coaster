# ==========================================
# 智慧杯墊 - LED 控制模組 (led_manager.py)
# ==========================================
from machine import Pin
import neopixel
from config import * # 匯入腳位與常數設定

class LEDManager:
    def __init__(self):
        """初始化 WS2812B 燈條"""
        self.np = neopixel.NeoPixel(Pin(LED_PIN), NUM_LEDS)
        self.num_leds = NUM_LEDS

    def update_leds_data(self, led_data):
        """
        核心寫入功能：傳入包含所有 LED 顏色資料的 list，一次性寫入。
        led_data 格式: [(r,g,b,bright), (r,g,b,bright), ...]
        WS2812B 無獨立亮度位元，亮度直接縮放進 RGB 值。
        """
        for i in range(self.num_leds):
            r, g, b, brightness = led_data[i]
            self.np[i] = (int(r * brightness), int(g * brightness), int(b * brightness))
        self.np.write()

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