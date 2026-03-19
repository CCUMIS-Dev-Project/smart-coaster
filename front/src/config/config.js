import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri?.split(':').shift();
const API_URL = debuggerHost ? `http://${debuggerHost}:5001` : 'http://localhost:5001';

const API_CONFIG = {
  // 讀取環境變數，若沒設定則回退到 localhost
  BASE_URL: API_URL,

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