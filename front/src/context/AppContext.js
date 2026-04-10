// src/context/AppContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { calcWaterGoal } from '../constants/theme';
import apiService from '../services/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [isSetupDone, setIsSetupDone] = useState(false);

  const [profile, setProfile] = useState({
    name: '',
    gender: 'male',
    weight: 65,
    age: 28,
    activity: 'light',
    goalMl: 0,
    customGoal: false,
    selectedCup: { name: '馬克杯', emoji: '☕', ml: 400 }, // 預設水杯
    reminderInterval: 60,
    autoMode: true,
    autoStart: '08:00',
    autoEnd: '22:00',
    hasCoaster: true,
  });

  const [logs, setLogs] = useState([]);
  const [isRecording, setIsRecording] = useState(false);

  const [weekData] = useState([
    { day: '一', ml: 1600 },
    { day: '二', ml: 2100 },
    { day: '三', ml: 1800 },
    { day: '四', ml: 2000 },
    { day: '五', ml: 1750 },
    { day: '六', ml: 900 },
    { day: '今', ml: 0 },
  ]);

  // 紀錄硬體上一次傳來的總喝水量，用來計算差值
  const [lastHardwareAmount, setLastHardwareAmount] = useState(0);

  const [sensorData, setSensorData] = useState({
    temperature: "--",
    humidity: "--",
    connected: false,
    isOnCoaster: false,
  });

  const [exerciseLevels, setExerciseLevels] = useState([]); // [{id, level_type, addition}]

  const goalMl = profile.customGoal ? profile.goalMl : calcWaterGoal(profile);

  const TOKEN = process.env.EXPO_PUBLIC_DEV_TOKEN ?? '';

  useEffect(() => {
    const load = async () => {
      const [goalRes, meRes, exRes] = await Promise.all([
        apiService.getGoal(TOKEN),
        apiService.getMe(TOKEN),
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
    load();
  }, []);
  // log 欄位對齊後端：{ log_id, type_id, d_volume, record_at, type_name }
  const totalMl = logs.reduce((sum, log) => sum + (log.d_volume ?? 0), 0);

  function completeSetup(data) {
    setProfile(prev => ({ ...prev, ...data }));
    setIsSetupDone(true);
  }

  function updateProfile(data) {
    setProfile(prev => ({ ...prev, ...data }));
  }

  // 樂觀更新：直接插入 local state（Phase B 的 API 呼叫在 MainScreen 做）
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
  function syncHardwareDrink(currentTotal) {
    if (currentTotal > lastHardwareAmount) {
      const diff = currentTotal - lastHardwareAmount;
      addLog({
        log_id: `hw-${Date.now()}`,
        type_id: 1,
        type_name: 'water',
        d_volume: Math.round(diff),
        record_at: new Date().toISOString(),
        is_auto: true,
      });
      setLastHardwareAmount(currentTotal);
    } else if (currentTotal < lastHardwareAmount) {
      setLastHardwareAmount(currentTotal);
    }
  }

  return (
    <AppContext.Provider value={{
      isSetupDone, completeSetup,
      profile, updateProfile,
      goalMl, totalMl,
      logs, addLog, updateLog, deleteLog, deleteLogs, replaceLogs,
      isRecording, setIsRecording,
      weekData,
      sensorData, setSensorData,
      syncHardwareDrink,
      exerciseLevels,
      TOKEN,
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