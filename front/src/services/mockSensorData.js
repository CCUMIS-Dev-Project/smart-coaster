// // Mock Sensor Data Service
// // This file provides mock data for development. Replace with real sensor API calls later.


// let systemActive = true;
// let lastStableWeight = 250; // ml
// let isOnCoaster = true;
// let drinkAmount = 0;
// let reminderMs = 1800000; // 30 mins
// let listeners = [];

// // Simulated sensor reading
// const generateMockReading = () => {
//   drinkAmount = 0; // Reset per tick

//   // 10% 機率切換系統開關
//   // if (Math.random() < 0.1) systemActive = !systemActive;

//   if (systemActive) {
//     // 模擬拿起來 (30% 機率)
//     if (isOnCoaster && Math.random() < 0.3) {
//       isOnCoaster = false;
//     } 
//     // 模擬放下去 (30% 機率)
//     else if (!isOnCoaster && Math.random() < 0.3) {
//       isOnCoaster = true;
//       // 放下去時可能喝了水
//       if (Math.random() < 0.5) {
//         const consumed = Math.floor(Math.random() * 30 + 10);
//         if (lastStableWeight >= consumed) {
//           lastStableWeight -= consumed;
//           drinkAmount = consumed;
//         }
//       }
//     }
//   }
//   return getSensorData();
// };

// // Get current sensor data
// export const getSensorData = () => {
//   return {
//     systemActive,
//     lastStableWeight,
//     isOnCoaster,
//     drinkAmount,
//     reminderMs,
//     timestamp: new Date().toISOString(),
//   };
// };

// // Subscribe to sensor updates
// // Returns unsubscribe function
// export const subscribeSensorData = (callback) => {
//   listeners.push(callback);

//   // Send initial data immediately
//   callback(getSensorData());

//   return () => {
//     listeners = listeners.filter(l => l !== callback);
//   };
// };

// // Start mock data simulation
// let intervalId = null;

// export const startMockUpdates = (intervalMs = 3000) => {
//   if (intervalId) return;

//   intervalId = setInterval(() => {
//     const data = generateMockReading();
//     listeners.forEach(callback => callback(data));
//   }, intervalMs);
// };

// export const stopMockUpdates = () => {
//   if (intervalId) {
//     clearInterval(intervalId);
//     intervalId = null;
//   }
// };

// // Generate mock history data
// export const getMockHistory = (count = 10) => {
//   const history = [];
//   let vol = 350;
//   const now = Date.now();

//   for (let i = 0; i < count; i++) {
//     const prevVol = vol;
//     vol = Math.max(0, vol - Math.floor(Math.random() * 30 + 5));

//     history.push({
//       id: i.toString(),
//       volume: prevVol,
//       change: i === 0 ? 0 : vol - prevVol,
//       timestamp: new Date(now - i * 60000).toISOString(), // 1 minute intervals
//       status: prevVol > 0 ? 'occupied' : 'empty',
//     });
//   }

//   return history;
// };

// // For teammate: Replace these exports with real sensor API
// // Example interface expected:
// // {
// //   currentVolume: number (ml),
// //   previousVolume: number (ml),
// //   change: number (ml, negative = consumed),
// //   timestamp: ISO string,
// //   status: 'occupied' | 'empty'
// // }
