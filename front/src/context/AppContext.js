// src/context/AppContext.js
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode as atob } from 'base-64';
import { calcWaterGoal, CUPS } from '../constants/theme';
import apiService from '../services/api';
import useBLE from '../hooks/useBLE';
import * as Location from 'expo-location';

const AppContext = createContext(null);

const DEFAULT_PROFILE = {
  name: '',
  gender: 'male',
  weight: 65,
  age: 28,
  activity: 'light',
  goalMl: 0,
  customGoal: false,
  selectedCup: CUPS[3], // 馬克杯（預設）
  reminderInterval: 60,
  autoMode: true,
  autoStart: '08:00',
  autoEnd: '22:00',
  hasCoaster: false,
};

export function AppProvider({ children }) {
  const [isSetupDone, setIsSetupDone] = useState(false);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [logs, setLogs] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [nextReminderAt, setNextReminderAt] = useState(0);

  const [weekData] = useState([
    { day: '一', ml: 1600 },
    { day: '二', ml: 2100 },
    { day: '三', ml: 1800 },
    { day: '四', ml: 2000 },
    { day: '五', ml: 1750 },
    { day: '六', ml: 900 },
    { day: '今', ml: 0 },
  ]);

  // const [lastHardwareAmount, setLastHardwareAmount] = useState(0);

  const [sensorData, setSensorData] = useState({
    temperature: "--",
    humidity: "--",
    connected: false,
    isOnCoaster: false,
  });

  const [exerciseLevels, setExerciseLevels] = useState([]);
  const [token, setToken] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const goalMl = profile.customGoal ? profile.goalMl : calcWaterGoal(profile);

  const { scanAndConnect, stopScan, connectedDevice, bleData, writeToDevice,disconnectDevice } = useBLE(token);

  // 啟動時從 AsyncStorage 讀取 token
  useEffect(() => {
    const isExpired = (token) => {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
      } catch {
        return true;
      }
    };

    const initAuth = async () => {
      const [stored, cupName] = await Promise.all([
        AsyncStorage.getItem('userToken'),
        AsyncStorage.getItem('selectedCupName'),
      ]);
      if (cupName) {
        const cup = CUPS.find(c => c.name === cupName);
        if (cup) setProfile(prev => ({ ...prev, selectedCup: cup }));
      }
      if (stored && !isExpired(stored)) {
        setToken(stored);
      } else if (stored) {
        await AsyncStorage.removeItem('userToken');
      }
      setIsAuthLoading(false);
    };
    initAuth();
  }, []);

  // token 變化時（登入 / 啟動帶 token）抓 profile
  useEffect(() => {
    if (!token) return;
    const loadProfile = async () => {
      const [goalRes, meRes, exRes] = await Promise.all([
        apiService.getGoal(token),
        apiService.getMe(token),
        apiService.getExerciseLevels(),
      ]);
      setProfile(prev => {
        let u = { ...prev };
        if (goalRes.success) {
          u.goalMl           = goalRes.data.daily_target;
          u.customGoal       = true;
          u.reminderInterval = goalRes.data.rmd_interval ?? prev.reminderInterval;
          u.autoStart        = goalRes.data.act_start    ?? prev.autoStart;
          u.autoEnd          = goalRes.data.act_end      ?? prev.autoEnd;
        }
        if (meRes.success) {
          const d = meRes.data;
          u.name    = d.username ?? prev.name;
          const gMap = { M: 'male', F: 'female', male: 'male', female: 'female' };
          u.gender  = gMap[d.gender] ?? prev.gender;
          u.weight  = d.weight   ?? prev.weight;
          u.age     = d.age      ?? prev.age;
          u.levelid = d.levelid  ?? null;
          if (d.levelid) {
            const LEVELID_TO_ACTIVITY = { 1: 'sedentary', 2: 'light', 3: 'moderate', 4: 'intense' };
            u.activity = LEVELID_TO_ACTIVITY[d.levelid] ?? prev.activity;
          }
        }
        return u;
      });
      if (exRes.success) setExerciseLevels(exRes.data);
    };
    loadProfile();
  }, [token]);

  // 監聽杯墊 BLE 資料，上傳後端並以真實 log_id 加入 local state
  useEffect(() => {
    if (!bleData || !token) return;
    const parts = bleData.split('|');
    if (parts[0] !== 'W') return;
    const volume = parseFloat(parts[3]);
    if (volume <= 0) return;  

    apiService.handleWaterData(bleData, token).then(result => {
      if (result?.success && result.data) {
        addLog(result.data); // result.data.log_id 是後端真實整數 ID
      }
    });
  }, [bleData]);

  // log 欄位對齊後端：{ log_id, type_id, d_volume, record_at, type_name }
  const totalMl = logs.reduce((sum, log) => sum + (log.d_volume ?? 0), 0);

  function completeSetup(data) {
    setProfile(prev => ({ ...prev, ...data }));
    setIsSetupDone(true);
  }

  function updateProfile(data) {
    setProfile(prev => ({ ...prev, ...data }));
  }

  async function logout() {
    await AsyncStorage.multiRemove(['userToken', 'userId']);
    setToken(null);
    const cupName = await AsyncStorage.getItem('selectedCupName');
    const savedCup = cupName ? (CUPS.find(c => c.name === cupName) ?? DEFAULT_PROFILE.selectedCup) : DEFAULT_PROFILE.selectedCup;
    setProfile({ ...DEFAULT_PROFILE, selectedCup: savedCup });
    setLogs([]);
  }

  // 樂觀更新：直接插入 local state
  function addLog(logData) {
    setLogs(prev => [logData, ...prev]);
  }

  function updateLog(logId, updates) {
    setLogs(prev => prev.map(log => log.log_id === logId ? { ...log, ...updates } : log));
  }

  function deleteLog(logId) {
    setLogs(prev => prev.filter(log => log.log_id !== logId));
  }

  function deleteLogs(logIds) {
    setLogs(prev => prev.filter(log => !logIds.includes(log.log_id)));
  }

  function replaceLogs(newLogs) {
    setLogs(newLogs);
  }

  // 當硬體傳來新的喝水量時，計算增量並新增一筆紀錄（type_id 1 = water）
  // function syncHardwareDrink(currentTotal) {
  //   if (currentTotal > lastHardwareAmount) {
  //     const diff = currentTotal - lastHardwareAmount;
  //     addLog({
  //       log_id: `hw-${Date.now()}`,
  //       type_id: 1,
  //       type_name: 'water',
  //       d_volume: Math.round(diff),
  //       record_at: new Date().toISOString(),
  //       is_auto: true,
  //     });
  //     setLastHardwareAmount(currentTotal);
  //   } else if (currentTotal < lastHardwareAmount) {
  //     setLastHardwareAmount(currentTotal);
  //   }
  // }

  useEffect(() => {
    setSensorData(prev => ({ ...prev, connected: !!connectedDevice }));
  }, [connectedDevice]);


  // 天氣api輪巡
  const weatherIntervalRef = useRef(null);
  const locationRef = useRef(null); // 快取座標，避免重複申請

  const fetchAndSetWeather = async () => {
    // 若已連線，直接跳過（DHT11 優先）
    if (connectedDevice) return;

    // 取得（或使用快取）座標
    if (!locationRef.current) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('[Weather] 位置權限被拒');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      locationRef.current = { lat: loc.coords.latitude, lon: loc.coords.longitude };
    }

    const { lat, lon } = locationRef.current;
    const result = await apiService.fetchWeather(lat, lon);
    if (result.success) {
      setSensorData(prev => ({
        ...prev,
        temperature: result.temperature,
        humidity: result.humidity,
      }));
    }
  };

  useEffect(() => {
    if (connectedDevice) {
      // 杯墊連線：停止天氣輪詢
      if (weatherIntervalRef.current) {
        clearInterval(weatherIntervalRef.current);
        weatherIntervalRef.current = null;
      }
    } else {
      // 杯墊未連線：立即取一次，然後每 10 分鐘更新
      fetchAndSetWeather();
      weatherIntervalRef.current = setInterval(fetchAndSetWeather, 10 * 60 * 1000);
    }

    return () => {
      if (weatherIntervalRef.current) {
        clearInterval(weatherIntervalRef.current);
        weatherIntervalRef.current = null;
      }
    };
  }, [connectedDevice]);
  // 天氣api輪尋結束

  return (
    <AppContext.Provider value={{
      isSetupDone, completeSetup,
      profile, updateProfile,
      goalMl, totalMl,
      logs, addLog, updateLog, deleteLog, deleteLogs, replaceLogs,
      isRecording, setIsRecording,
      weekData,
      sensorData, setSensorData,
      // syncHardwareDrink,
      exerciseLevels,
      token, setToken, isAuthLoading, logout,
      scanAndConnect, stopScan, connectedDevice, bleData, writeToDevice, disconnectDevice,
      nextReminderAt, setNextReminderAt,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
