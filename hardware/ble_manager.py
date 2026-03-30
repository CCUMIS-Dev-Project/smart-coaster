# ==========================================
# 智慧杯墊 - 藍牙通訊模組 (ble_manager.py)
# ==========================================
import bluetooth
from ble_advertising import advertising_payload
from config import * # 匯入 UUID 與設備名稱等設定

# BLE 事件常數
_IRQ_CENTRAL_CONNECT = 1
_IRQ_CENTRAL_DISCONNECT = 2
_IRQ_GATTS_WRITE = 3

class BLEManager:
    def __init__(self):
        """初始化藍牙模組與 GATT 服務"""
        self._ble = bluetooth.BLE()
        self._ble.active(True)
        self._ble.config(gap_name=BLE_DEVICE_NAME)
        self._ble.irq(self._irq)
        
        # 1. 將 config.py 的字串 UUID 轉為藍牙物件
        service_uuid = bluetooth.UUID(BLE_SERVICE_UUID)
        char_uuid = (bluetooth.UUID(BLE_CHAR_UUID), bluetooth.FLAG_NOTIFY | bluetooth.FLAG_READ | bluetooth.FLAG_WRITE)
        self._service = (service_uuid, (char_uuid,),)
        
        # 2. 註冊服務並取得特徵控制碼 (handle)
        ((self._handle,),) = self._ble.gatts_register_services((self._service,))
        self._connections = set()
        
        # 3. 設定廣播封包 (ADV: 放服務 UUID, RESP: 放設備名稱)
        self._adv_payload = advertising_payload(services=[service_uuid])
        self._resp_payload = advertising_payload(name=BLE_DEVICE_NAME)
        
        # 4. 開始廣播
        self._advertise()
        self.on_rx = None  # 用來把收到的資料傳回給 main.py

    def _irq(self, event, data):
        """處理藍牙中斷事件 (連線/斷線)"""
        if event == _IRQ_CENTRAL_CONNECT:
            conn_handle, _, _ = data
            self._connections.add(conn_handle)
            print("APP 已連線")
        elif event == _IRQ_CENTRAL_DISCONNECT:
            conn_handle, _, _ = data
            self._connections.remove(conn_handle)
            print("APP 已斷線")
            self._advertise()  # 斷線後重新開始廣播
        elif event == _IRQ_GATTS_WRITE:
            # 當 APP 傳送資料給杯墊時會觸發
            conn_handle, value_handle = data
            value = self._ble.gatts_read(value_handle)
            if self.on_rx:
                # 將 byte 轉成字串並呼叫 main.py 的處理函式
                self.on_rx(value.decode('utf-8').strip())

    def _advertise(self):
        """開始發送藍牙廣播"""
        self._ble.gap_advertise(100, adv_data=self._adv_payload, resp_data=self._resp_payload)
        print("BLE 廣播中...")

    def _notify(self, data):
        """私有輔助函式：將數據推播給所有已連線的設備"""
        print(f"BLE發送: {data}")
        for conn_handle in self._connections:
            self._ble.gatts_notify(conn_handle, self._handle, data)

    # ==========================================
    # 以下為提供給 main.py 呼叫的公開方法
    # ==========================================

    def send_water_status(self, active, on_coaster, drink):
        """傳送核心狀態與喝水量 (標記: W)"""
        data = "W|{}|{}|{:.1f}".format(
            1 if active else 0, 
            1 if on_coaster else 0, 
            drink
        )
        self._notify(data)

    def send_env_status(self, temp, hum, reminder_ms):
        """傳送環境數據與提醒設定 (標記: E)"""
        reminder_min = reminder_ms // 60000
        data = "E|{:.1f}|{:.1f}|{}".format(temp, hum, reminder_min)
        self._notify(data)
        
    @property
    def is_connected(self):
        """
        [新增功能] 回傳目前是否有 APP 連線。
        這對於實作「離線暫存」非常重要！
        """
        return len(self._connections) > 0
