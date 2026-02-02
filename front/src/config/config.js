// API Configuration
// Update this URL based on your backend setup

const API_CONFIG = {
  // For local development
  // Use your computer's IP address when testing on physical device
  // Use 'localhost' when testing on web or emulator on same machine
  BASE_URL: 'http://localhost:5000',

  // Endpoints
  ENDPOINTS: {
    HEALTH: '/health',
    CHAT: '/api/chat',
  },

  // Timeout settings (milliseconds)
  TIMEOUT: 10000,
};

// Helper to get full API URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

export default API_CONFIG;
