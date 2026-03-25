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
  
  export const DRINK_TYPES = [
    { label: '白開水', emoji: '💧' },
    { label: '茶',     emoji: '🍵' },
    { label: '咖啡',   emoji: '☕' },
    { label: '果汁',   emoji: '🥤' },
    { label: '手搖',   emoji: '🧋' },
    { label: '其他',   emoji: '🧃' },
  ];
  
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
  