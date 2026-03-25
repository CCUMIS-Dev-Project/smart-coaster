// src/context/AppContext.js
import React, { createContext, useContext, useState } from 'react';
import { calcWaterGoal } from '../constants/theme';

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
    temperature: 28,
    humidity: 72,
    connected: false,
    isOnCoaster: false,
  });

  const goalMl = profile.customGoal ? profile.goalMl : calcWaterGoal(profile);
  const totalMl = logs.reduce((sum, log) => sum + log.ml, 0);

  function completeSetup(data) {
    setProfile(prev => ({ ...prev, ...data }));
    setIsSetupDone(true);
  }

  function updateProfile(data) {
    setProfile(prev => ({ ...prev, ...data }));
  }

  function addLog(ml, type, emoji) {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    setLogs(prev => [...prev, { id: Date.now().toString(), time, ml, type, emoji }]);
  }

  function updateLog(id, updates) {
    setLogs(prev => prev.map(log => log.id === id ? { ...log, ...updates } : log));
  }

  function deleteLog(id) {
    setLogs(prev => prev.filter(log => log.id !== id));
  }

  function deleteLogs(ids) {
    setLogs(prev => prev.filter(log => !ids.includes(log.id)));
  }

  // 當硬體傳來新的喝水量時，計算增量並新增一筆紀錄
  function syncHardwareDrink(currentTotal) {
    if (currentTotal > lastHardwareAmount) {
      const diff = currentTotal - lastHardwareAmount;
      addLog(Math.round(diff), '白開水', ''); // 自動新增紀錄
      setLastHardwareAmount(currentTotal);
    } else if (currentTotal < lastHardwareAmount) {
      // 如果硬體重置了（重開機），同步重置 App 的基準值
      setLastHardwareAmount(currentTotal);
    }
  }

  return (
    <AppContext.Provider value={{
      isSetupDone, completeSetup,
      profile, updateProfile,
      goalMl, totalMl,
      logs, addLog, updateLog, deleteLog, deleteLogs,
      isRecording, setIsRecording,
      weekData,
      sensorData, setSensorData,
      syncHardwareDrink,
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