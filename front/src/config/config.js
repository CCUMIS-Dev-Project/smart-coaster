const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001',

  ENDPOINTS: {
    HEALTH: '/health',
    CHAT: '/api/chat',
    SENSOR_LOG: '/api/sensor/log', // 新增感測器紀錄路徑
    REPORT_WEEKLY: '/api/report/weekly', // 新增週報路徑
  },

  TIMEOUT: 10000,
};

export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

export default API_CONFIG;