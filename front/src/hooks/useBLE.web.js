// front/src/hooks/useBLE.js (網頁/Mock 版)
import { useState } from 'react';

export default function useBLE() {
  const [connectedDevice, setConnectedDevice] = useState(null);

  // 初始值為 null，與 Android 版一致（MainScreen 的 if (!bleData) return 會擋住）
  const [bleData, setBleData] = useState(null);

  const scanAndConnect = async () => {
    console.log("Web 環境：不支援藍牙掃描");
    alert("提醒：網頁版不支援實體藍牙連線，請使用手機 APK 測試。");
    
    // (選用) 你可以在這裡寫一點 mock 邏輯，讓網頁版點擊按鈕後也能變更數字來測試 UI
    // 例如：
    // setBleData(prev => ({ ...prev, lastStableWeight: 200, drinkAmount: 50 }));
  };

  // 必須回傳 bleData
  return { scanAndConnect, connectedDevice, bleData };
}