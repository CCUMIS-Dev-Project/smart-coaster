# 官方標準版 SSD1306 驅動程式
from machine import Pin, I2C
import framebuf

class SSD1306(framebuf.FrameBuffer):
    def __init__(self, width, height, external_vcc):
        self.width = width
        self.height = height
        self.external_vcc = external_vcc
        self.pages = self.height // 8
        self.buffer = bytearray(self.pages * self.width)
        super().__init__(self.buffer, self.width, self.height, framebuf.MONO_VLSB)
        self.init_display()

    def init_display(self):
        for cmd in (
            0xAE, 0x20, 0x00, 0x21, 0, self.width - 1, 0x22, 0, self.pages - 1,
            0xA8, self.height - 1, 0xD3, 0x00, 0x40, 0xA1, 0xC8, 0xDA,
            0x02 if self.width > 2 * self.height else 0x12,
            0x81, 0x7F, 0xA4, 0xA6, 0xD5, 0x80, 0x8D, 0x14, 0xAF,
        ):
            self.write_cmd(cmd)
        self.fill(0)
        self.show()

    def poweroff(self): self.write_cmd(0xAE)
    def poweron(self): self.write_cmd(0xAF)
    def contrast(self, contrast): self.write_cmd(0x81); self.write_cmd(contrast)
    def invert(self, invert): self.write_cmd(0xA7 if invert else 0xA6)

    def show(self):
        x0 = 0
        x1 = self.width - 1
        if self.width == 64:
            x0 += 32
            x1 += 32
        self.write_cmd(0x21)
        self.write_cmd(x0)
        self.write_cmd(x1)
        self.write_cmd(0x22)
        self.write_cmd(0)
        self.write_cmd(self.pages - 1)
        self.write_data(self.buffer)

class SSD1306_I2C(SSD1306):
    def __init__(self, width, height, i2c, addr=0x3C, external_vcc=False):
        self.i2c = i2c
        self.addr = addr
        self.temp = bytearray(2)
        super().__init__(width, height, external_vcc)

    def write_cmd(self, cmd):
        self.temp[0] = 0x80  # Co=1, D/C#=0
        self.temp[1] = cmd
        self.i2c.writeto(self.addr, self.temp)

    def write_data(self, buf):
        # 修正後的標準寫法：傳送 0x40 (資料標誌) 加上 緩衝區數據
        self.i2c.writeto(self.addr, b'\x40' + buf)
