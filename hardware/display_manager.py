# ==========================================
# 智慧杯墊 - OLED 顯示模組 (display_manager.py)
# ==========================================
from machine import Pin, I2C
from ssd1306 import SSD1306_I2C
from config import * # 匯入腳位與常數設定

class DisplayManager:
    def __init__(self):
        """初始化 I2C 與 SSD1306 OLED 螢幕"""
        self.i2c = I2C(0, sda=Pin(OLED_SDA_PIN), scl=Pin(OLED_SCL_PIN))
        self.oled = SSD1306_I2C(OLED_WIDTH, OLED_HEIGHT, self.i2c)
        self.daily_target = DAILY_TARGET
        
    def clear(self):
        """清除螢幕畫面 (不立即顯示，需配合 show())"""
        self.oled.fill(0)
        
    def show(self):
        """將緩衝區的畫面推送到螢幕上"""
        self.oled.show()

    # ==========================================
    # 狀態提示畫面 (供 main.py 快速呼叫)
    # ==========================================
    def show_init_screen(self):
        self.clear()
        self.oled.text("Power Off", 30, 25)
        self.oled.text("Press to Start", 10, 40)
        self.show()

    def show_booting(self):
        self.clear()
        self.oled.text("Booting...", 30, 30)
        self.show()

    def show_power_off(self):
        self.clear()
        self.oled.text("Power Off", 30, 25)
        self.show()

    def show_drinking(self):
        self.clear()
        self.oled.text("Drinking...", 30, 30)
        self.show()

    # ==========================================
    # 主數據儀表板 (核心畫面)
    # ==========================================
    def update_main_screen(self, amount, diff, reminder=False, syncing=False):
        """
        繪製喝水進度主畫面
        :param amount: 目前累積喝水量
        :param diff: 剛剛喝了多少水
        :param reminder: 是否處於提醒喝水狀態
        :param syncing: 是否正在等待重量穩定
        """
        self.clear()
        
        # 1. 標題
        self.oled.text("Day Day", 12, 0)
        
        # 2. 顯示喝水數據
        self.oled.text("{:.0f}/{:d} ml".format(amount, self.daily_target), 25, 12)
        
        # 3. 進度條設計
        bar_x, bar_y = 10, 28
        bar_width, bar_height = 108, 12
        
        # 畫出進度條外框
        self.oled.rect(bar_x, bar_y, bar_width, bar_height, 1)
        
        # 計算進度比例 (限制最大值為 1.0，避免爆表)
        progress = min(amount / self.daily_target, 1.0)
        fill_width = int(progress * (bar_width - 4))
        
        # 畫出填滿部分 (內縮 2 像素)
        if fill_width > 0:
            self.oled.fill_rect(bar_x + 2, bar_y + 2, fill_width, bar_height - 4, 1)
            
        # 4. 底部狀態資訊
        if syncing:
            self.oled.text("Syncing...", 35, 50)
        elif reminder:
            self.oled.text("!! DRINK WATER !!", 0, 50)
        elif diff > 5:
            self.oled.text("Nice! -{:.1f}ml".format(diff), 5, 50)
        else:
            percent = int(progress * 100)
            self.oled.text("Progress: {:d}%".format(percent), 15, 50)
            
        self.show()