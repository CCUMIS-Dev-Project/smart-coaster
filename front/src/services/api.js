import axios from 'axios';
import API_CONFIG, { getApiUrl } from '../config/config';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API service functions
const apiService = {
  /**
   * Health check endpoint
   * @returns {Promise} Response with backend health status
   */
  checkHealth: async () => {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.HEALTH);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Health check failed:', error);
      return { success: false, error: error.message };
    }
  },

  // 登入
  login: async (username, password) => {
    try {
      const response = await apiClient.post('/auth/login', { username, password });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || "登入失敗" };
    }
  },

  // 註冊
  register: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || "註冊失敗" };
    }
  },

  // 更新個人資料
  updateProfile: async (userData, userToken) => {
    try {
      const response = await apiClient.patch('/users/me', userData, {
        headers: {
          'Authorization': `Bearer ${userToken}` // 必須帶上 Token 才能知道是誰在更新
        }
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("更新資料失敗:", error.response?.data || error.message);
      return { success: false, error: error.response?.data?.detail || "更新失敗" };
    }
  },

  /**
   * Send message to chatbot
   * @param {string} message - User message to send
   * @returns {Promise} Response from chatbot
   */
  sendChatMessage: async (message) => {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.CHAT, {
        message: message,
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Chat request failed:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  /**
   * Generic GET request
   * @param {string} endpoint - API endpoint
   * @returns {Promise} Response data
   * 上傳感測器數據到後端資料庫
   * @param {object} sensorData - { systemActive, weight, isOnCoaster, ... }
   */

  // 解析並上傳喝水紀錄
  handleWaterData : async (rawString, userToken) => {
    // 1. 解析字串，格式範例: "W|1|0|150.5"
    const parts = rawString.split('|');
    // switch(parts[0]){
    //   // W：連線模式
    //   case 'W':
    //     const isSystemActive = parts[1] === '1';
    //     const isOnCoaster = parts[2] === '1';
    //     const volume = parseFloat(parts[3]);

    //     // 2. 判斷是否有新的喝水量（例如 > 0），且杯子目前是在位狀態或剛拿起
    //     if (volume > 0) {
    //       const payload = {
    //         type_id: 1, // 1 是「水」的 ID
    //         d_volume: Math.round(volume), // 轉為整數以符合後端 schemas 要求
    //         record_at: new Date().toISOString(),
    //         is_auto: true
    //       };

    //       // 3. 發送至 FastAPI 後端
    //       try {
    //         const response = await apiClient.post('/logs', payload, {
    //           headers: {
    //             'Authorization': `Bearer ${userToken}`
    //           }
    //         });

    //         console.log("上傳成功:", response.data);
    //         return { success: true, data: response.data };
    //       } catch (error) {
    //         console.error("API 上傳失敗:", error.response?.data || error.message);
    //         return { success: false, error: error.message };
    //       }
    //     }
    //   // W：離線模式
    //   case 'O':
    //     const volume = parseFloat(parts[3]);
    // }

    if (parts[0] === 'W') {
      const isSystemActive = parts[1] === '1';
      const isOnCoaster = parts[2] === '1';
      const volume = parseFloat(parts[3]);

      // 2. 判斷是否有新的喝水量（例如 > 0），且杯子目前是在位狀態或剛拿起
      if (volume > 0) {
        const payload = {
          type_id: 1, // 1 是「水」的 ID
          d_volume: Math.round(volume), // 轉為整數以符合後端 schemas 要求
          record_at: new Date().toISOString(),
          is_auto: true
        };

        // 3. 發送至 FastAPI 後端
        try {
          const response = await apiClient.post('/logs', payload, {
            headers: {
              'Authorization': `Bearer ${userToken}`
            }
          });

          console.log("上傳成功:", response.data);
          return { success: true, data: response.data };
        } catch (error) {
          console.error("API 上傳失敗:", error.response?.data || error.message);
          return { success: false, error: error.message };
        }
      }
    }
  },


  // ── 飲水紀錄 CRUD ────────────────────────────────────────────

  // GET /logs?date=YYYY-MM-DD
  getLogs: async (date, token) => {
    try {
      const response = await apiClient.get('/logs', {
        params: { date },
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || error.message };
    }
  },

  // POST /logs
  postLog: async (payload, token) => {
    try {
      const response = await apiClient.post('/logs', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || error.message };
    }
  },

  // PATCH /logs/{log_id}
  patchLog: async (logId, payload, token) => {
    try {
      const response = await apiClient.patch(`/logs/${logId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || error.message };
    }
  },

  // DELETE /logs/{log_id}
  deleteLog: async (logId, token) => {
    try {
      const response = await apiClient.delete(`/logs/${logId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || error.message };
    }
  },

  // ── Stats & Rewards ──────────────────────────────────────────

  // GET /stats/weekly
  getWeeklyStat: async (token) => {
    try {
      const response = await apiClient.get('/stats/weekly', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || error.message };
    }
  },

  // GET /stats/daily
  getDailyStat: async (token) => {
    try {
      const response = await apiClient.get('/stats/daily', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || error.message };
    }
  },

  // GET /rewards/streaks
  getStreaks: async (token) => {
    try {
      const response = await apiClient.get('/rewards/streaks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || error.message };
    }
  },

  // GET /rewards/garden
  getGarden: async (token) => {
    try {
      const response = await apiClient.get('/rewards/garden', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || error.message };
    }
  },

  // 獲取 AI 週報
  getWeeklyReport: async (userId) => {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.REPORT_WEEKLY, { user_id: userId });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  get: async (endpoint) => {
    try {
      const response = await apiClient.get(endpoint);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('GET request failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Generic POST request
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request payload
   * @returns {Promise} Response data
   */
  post: async (endpoint, data) => {
    try {
      const response = await apiClient.post(endpoint, data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('POST request failed:', error);
      return { success: false, error: error.message };
    }
  },
};

export default apiService;
