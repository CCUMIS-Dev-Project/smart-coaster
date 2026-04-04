// src/constants/theme.js
export const colors = {
    blue: '#5ab4f5',
    blueDark: '#2196f3',
    blueLight: '#eaf6ff',
    green: '#4ade80',
    greenBg: '#f0f7f2',
    yellow: '#fbbf24',
    red: '#f87171',
    bg: '#f0f7fc',
    card: '#fff',
    text: '#1a2a3a',
    muted: '#8aaac0',
    border: '#e2eaf2',
  };
  
  // 對齊後端 drinks 表（type_id, type_name, caff_per_100ml）
  export const DRINK_TYPES = [
    { type_id: 1, key: 'water',  label: '水',   emoji: '💧', color: '#a8d8f0', caffeinePer100: 0  },
    { type_id: 2, key: 'coffee', label: '咖啡', emoji: '☕', color: '#c8a878', caffeinePer100: 40 },
    { type_id: 3, key: 'tea',    label: '茶',   emoji: '🍵', color: '#c8e6a0', caffeinePer100: 20 },
  ];
  // type_id → DRINK_TYPE 物件
  export const DRINK_BY_ID  = Object.fromEntries(DRINK_TYPES.map(d => [d.type_id, d]));
  // DB type_name（英文）→ DRINK_TYPE 物件
  export const DRINK_BY_KEY = Object.fromEntries(DRINK_TYPES.map(d => [d.key, d]));
  
  export const ACTIVITY_LEVELS = [
    { label: '久坐',   key: 'sedentary', rate: 0 },
    { label: '輕度',   key: 'light',     rate: 0.10 },
    { label: '中度',   key: 'moderate',  rate: 0.20 },
    { label: '高強度', key: 'intense',   rate: 0.30 },
  ];
  
  export function calcWaterGoal({ gender, weight, age, activity }) {
    const base    = Math.round(weight * (gender === 'male' ? 35 : 30));
    const actRate = ACTIVITY_LEVELS.find(a => a.key === activity)?.rate ?? 0.10;
    const actAdd  = Math.round(base * actRate);
    const ageMod  = age > 55 ? -Math.round(base * 0.1) : 0;
    return base + actAdd + ageMod;
  }
  