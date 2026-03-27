# ==========================================
# 智慧杯墊 - 離線儲存模組 (storage_manager.py)
# ==========================================
import os
import utime

class StorageManager:
    def __init__(self, filename="offline_data.csv"):
        """初始化儲存模組，設定檔案名稱"""
        self.filename = filename

    def save_record(self, diff):
        """
        將喝水量寫入檔案 (附加模式 'a')
        改用與藍牙統一的 '|' 分隔符號，並加上 'O' 標籤代表 Offline
        格式: O|系統相對毫秒數|單次喝水量
        """
        try:
            with open(self.filename, 'a') as f:
                # 寫入格式範例: O|1680000|50.5
                f.write(f"O|{utime.ticks_ms()}|{diff:.1f}\n")
            print(f"[Storage] 成功暫存離線數據: {diff:.1f} ml")
        except Exception as e:
            print(f"[Storage] 寫入失敗: {e}")
            
    def has_data(self):
        """檢查是否有尚未同步的離線資料"""
        try:
            # os.stat 回傳的 tuple 中，索引 6 是檔案大小 (bytes)
            return os.stat(self.filename)[6] > 0
        except OSError:
            # 如果發生 OSError，通常代表檔案還不存在
            return False

    def get_all_data(self):
        """讀取所有離線數據，回傳 list"""
        if not self.has_data():
            return []
            
        records = []
        try:
            with open(self.filename, 'r') as f:
                for line in f:
                    if line.strip(): # 避免讀到空行
                        records.append(line.strip())
            return records
        except Exception as e:
            print(f"[Storage] 讀取失敗: {e}")
            return []

    def clear_data(self):
        """清空暫存檔 (同步完成後呼叫)"""
        try:
            # 用寫入模式 'w' 打開但不寫入任何東西，即可清空檔案
            with open(self.filename, 'w') as f:
                pass 
            print("[Storage] 離線數據已清空")
        except Exception as e:
            print(f"[Storage] 清空失敗: {e}")

