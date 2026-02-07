import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView, StyleSheet, RefreshControl , SafeAreaView, TouchableOpacity} from 'react-native';
import useBLE from '../hooks/useBLE';
import VolumeDisplay from '../components/VolumeDisplay';
import VolumeHistory from '../components/VolumeHistory';
import StatusIndicator from '../components/StatusIndicator';
import {
  getSensorData,
  subscribeSensorData,
  startMockUpdates,
  stopMockUpdates,
  getMockHistory,
} from '../services/mockSensorData';

// const DashboardScreen = () => {
//   const [sensorData, setSensorData] = useState(getSensorData());
//   const [history, setHistory] = useState(getMockHistory(10));
//   const [refreshing, setRefreshing] = useState(false);

//   useEffect(() => {
//     // Subscribe to sensor updates
//     const unsubscribe = subscribeSensorData((data) => {
//       setSensorData(data);
//       // Add to history
//       setHistory((prev) => {
//         const newEntry = {
//           id: Date.now().toString(),
//           volume: data.currentVolume,
//           change: data.change,
//           timestamp: data.timestamp,
//           status: data.status,
//         };
//         return [newEntry, ...prev.slice(0, 9)]; // Keep last 10 entries
//       });
//     });

//     // Start mock data simulation
//     startMockUpdates(3000); // Update every 3 seconds

//     return () => {
//       unsubscribe();
//       stopMockUpdates();
//     };
//   }, []);

//   const onRefresh = () => {
//     setRefreshing(true);
//     // Simulate refresh
//     setTimeout(() => {
//       setHistory(getMockHistory(10));
//       setRefreshing(false);
//     }, 1000);
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Smart Coaster</Text>
//         <Text style={styles.headerSubtitle}>Hydration Tracker</Text>
//       </View>

//       <ScrollView
//         style={styles.scrollView}
//         contentContainerStyle={styles.scrollContent}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//         }
//       >
//         <StatusIndicator status={sensorData.status} />

//         <VolumeDisplay
//           currentVolume={sensorData.currentVolume}
//           change={sensorData.change}
//         />

//         <VolumeHistory history={history} />
//       </ScrollView>
//     </View>
//   );
// };

export default function DashboardScreen() {
  const { scanAndConnect, connectedDevice, drinkData } = useBLE();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>智慧杯墊監控</Text>
      
      <View style={styles.statusContainer}>
        <Text>狀態: {connectedDevice ? '已連線 ✅' : '未連線 ❌'}</Text>
        {!connectedDevice && (
          <Button title="搜尋杯墊" onPress={scanAndConnect} />
        )}
      </View>

      <View style={styles.dataContainer}>
        <Text style={styles.label}>目前喝水量</Text>
        <Text style={styles.value}>{drinkData} ml</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    backgroundColor: '#3498db',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 32,
  },
});
