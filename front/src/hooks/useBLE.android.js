// src/hooks/useBLE.js
import { useMemo, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import * as ExpoDevice from 'expo-device';
import { decode as atob } from 'base-64';

// 如果沒有 react-native-quick-base64，可以用這個簡單函式
const base64ToString = (base64) => {
  return decodeURIComponent(
    Array.prototype.map.call(atob(base64), (c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join('')
  );
};

// 簡單的 polyfill 如果環境沒有 atob
if (!global.atob) {
  global.atob = (input) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let str = input.replace(/=+$/, '');
    let output = '';
    // ... (建議直接 npm install react-native-quick-base64 或 base-64 比較穩)
    // 為了簡化，這裡假設你收到的數據是純 ASCII 數字，直接解碼即可
    return new Buffer(input, 'base64').toString('ascii'); 
  };
}


export default function useBLE() {
  const bleManager = useMemo(() => new BleManager(), []);
  const [connectedDevice, setConnectedDevice] = useState(null);
//   const [drinkData, setDrinkData] = useState(0);


  // 這裡的狀態可以保留，作為內部暫存，或直接回傳給外部處理
  const [bleData, setBleData] = useState(null);
  // // 定義一個結構化的狀態來存放所有感測器數據
  // const [bleData, setBleData] = useState({
  //   systemActive: false,
  //   lastStableWeight: 0,
  //   isOnCoaster: false,
  //   drinkAmount: 0,
  //   reminderMs: 0,
  // });

  // 核心 UUID (需與 Pico W 端完全一致)
  const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e'; 
  const CHAR_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

  // 1. 請求權限
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      // Android 11 (API 30) 只需要 ACCESS_FINE_LOCATION
      // 但必須在 app.json 中也聲明此權限
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: '定位權限請求',
          message: '掃描藍牙裝置需要開啟定位權限',
          buttonNeutral: '稍後再說',
          buttonNegative: '拒絕',
          buttonPositive: '確定',
        }
      );
      
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('❌ 權限被拒絕：Android 11 掃描藍牙必須開啟定位權限');
        return false;
      }
      return true;
    }
    return true;
  };

  // 2. 掃描並連線
  const scanAndConnect = async () => {
    const isPermissionGranted = await requestPermissions();
    if (!isPermissionGranted) return;

    // 檢查藍牙硬體狀態
    const state = await bleManager.state();
    if (state !== 'PoweredOn') {
      alert('請檢查藍牙是否開啟，並確認手機 GPS 定位已打開！');
      console.log('當前狀態:', state);
      return;
    }

    console.log('--- 🔍 開始掃描杯墊 (Android 11) ---');
    bleManager.startDeviceScan(null, null, (error, device) => {
    if (error) {
        console.log('❌ 掃描失敗:', error.message);
        return;
    }

    // 【偵錯關鍵】印出所有搜到的裝置名稱與 ID
    // if (device.name || device.localName) {
    //     console.log(`發現裝置: [${device.name || '無名稱'}] ID: ${device.id}`);
    // }

    // 嘗試用 ID 或 名稱 進行比對
    if (device.name === 'SmartCoaster' || device.localName === 'SmartCoaster') {
        console.log('✅ 成功鎖定 SmartCoaster！');
        bleManager.stopDeviceScan();
        connectToDevice(device);
    }
    });
  };

  // 3. 連線與監聽
  const connectToDevice = async (device) => {
    try {
      const deviceConnection = await device.connect();
      setConnectedDevice(deviceConnection);
      await deviceConnection.discoverAllServicesAndCharacteristics();
      
      console.log('✅ 連線成功，開始監聽數據...');
      deviceConnection.monitorCharacteristicForService(
        SERVICE_UUID,
        CHAR_UUID,
        (error, characteristic) => {
          if (error) {
            console.log('❌ 監聽錯誤:', error.message);
            return;
          }
          if (characteristic?.value) {
            // 解碼 Base64 得到原始字串，例如 "W|1|0|150.5"
            const rawString = atob(characteristic.value); 
            console.log('收到數據:', rawString);
            setBleData(rawString); // 將原始字串傳出去給外部解析

            // // 2. 解析 CSV (格式: active,weight,on_coaster,drink,reminder)
            // const parts = rawString.split(',');
            // if (parts.length === 5) {
            //   setBleData({
            //     systemActive: parts[0] === '1',
            //     lastStableWeight: parseFloat(parts[1]),
            //     isOnCoaster: parts[2] === '1',
            //     drinkAmount: parseFloat(parts[3]),
            //     reminderMs: parseInt(parts[4]),
            //   });
            // }
          }
        }
      );
    } catch (e) {
      console.log('❌ 連線失敗:', e.message);
    }
  };

  return { scanAndConnect, connectedDevice, bleData };
}