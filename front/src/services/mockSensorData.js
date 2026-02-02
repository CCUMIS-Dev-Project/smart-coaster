// Mock Sensor Data Service
// This file provides mock data for development. Replace with real sensor API calls later.

let currentVolume = 250; // Starting volume in ml
let previousVolume = 280;
let listeners = [];

// Simulated sensor reading
const generateMockReading = () => {
  previousVolume = currentVolume;

  // Simulate drinking (volume decreases) or refilling (volume increases)
  const random = Math.random();
  if (random < 0.6) {
    // 60% chance: drinking (decrease by 10-50ml)
    currentVolume = Math.max(0, currentVolume - Math.floor(Math.random() * 40 + 10));
  } else if (random < 0.8) {
    // 20% chance: no change
  } else {
    // 20% chance: refill (set to 250-350ml)
    currentVolume = Math.floor(Math.random() * 100 + 250);
  }

  return getSensorData();
};

// Get current sensor data
export const getSensorData = () => {
  const change = currentVolume - previousVolume;
  return {
    currentVolume,
    previousVolume,
    change,
    timestamp: new Date().toISOString(),
    status: currentVolume > 0 ? 'occupied' : 'empty',
  };
};

// Subscribe to sensor updates
// Returns unsubscribe function
export const subscribeSensorData = (callback) => {
  listeners.push(callback);

  // Send initial data immediately
  callback(getSensorData());

  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
};

// Start mock data simulation
let intervalId = null;

export const startMockUpdates = (intervalMs = 3000) => {
  if (intervalId) return;

  intervalId = setInterval(() => {
    const data = generateMockReading();
    listeners.forEach(callback => callback(data));
  }, intervalMs);
};

export const stopMockUpdates = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

// Generate mock history data
export const getMockHistory = (count = 10) => {
  const history = [];
  let vol = 350;
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const prevVol = vol;
    vol = Math.max(0, vol - Math.floor(Math.random() * 30 + 5));

    history.push({
      id: i.toString(),
      volume: prevVol,
      change: i === 0 ? 0 : vol - prevVol,
      timestamp: new Date(now - i * 60000).toISOString(), // 1 minute intervals
      status: prevVol > 0 ? 'occupied' : 'empty',
    });
  }

  return history;
};

// For teammate: Replace these exports with real sensor API
// Example interface expected:
// {
//   currentVolume: number (ml),
//   previousVolume: number (ml),
//   change: number (ml, negative = consumed),
//   timestamp: ISO string,
//   status: 'occupied' | 'empty'
// }
