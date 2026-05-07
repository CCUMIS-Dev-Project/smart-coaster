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
  
  export const CUPS = [
    { name: '洋芋片罐', image: require('../assets/cup_can.png'),   ml: 320, desc: '我才不要喝水，快給我吃餅乾！' },
    { name: '水杯',     image: require('../assets/cup_main.png'),  ml: 350, desc: '平凡中帶點小確幸' },
    { name: '茶杯',     image: require('../assets/cup_tea.png'),   ml: 200, desc: '慢慢來，人生不急' },
    { name: '馬克杯',   image: require('../assets/cup_mug.png'),   ml: 400, desc: '早晨救星，戒不掉' },
    { name: '玻璃杯',   image: require('../assets/cup_lemon.png'), ml: 300, desc: '清新系，夏天的靈魂' },
  ];

  export const ACTIVITY_LEVELS = [
    { label: '久坐',   key: 'sedentary', rate: 0 },
    { label: '輕度',   key: 'light',     rate: 0.10 },
    { label: '中度',   key: 'moderate',  rate: 0.20 },
    { label: '高強度', key: 'intense',   rate: 0.30 },
  ];
  
  export function calcWaterGoal({ gender, weight, age, activity }) {
    const actRate = ACTIVITY_LEVELS.find(a => a.key === activity)?.rate ?? 0.10;
    let base;

    if (age < 13) {
      // 兒童：依衛福部建議體重分段計算
      if (weight <= 10)       base = weight * 30;
      else if (weight <= 20)  base = 1000 + (weight - 10) * 50;
      else                    base = 1500 + (weight - 20) * 20;
    } else {
      // 成人（含青少年）：性別係數 + 年齡調整
      base = Math.round(weight * (gender === 'male' ? 35 : 30));
      if (age > 55) base -= Math.round(base * 0.1);
    }

    const result = Math.round(base + base * actRate);
    return Math.max(800, Math.min(result, 4000));
  }
  