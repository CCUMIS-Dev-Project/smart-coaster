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

  uploadSensorData: async (sensorData) => {
    try {
      // 假設後端有一個 /api/sensor/log 的路由
      const response = await apiClient.post('/api/sensor/log', sensorData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Upload sensor data failed:', error);
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
