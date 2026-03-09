// import React, { useState, useEffect } from 'react';
// import { View, Text, Button, ScrollView, StyleSheet, RefreshControl , SafeAreaView, TouchableOpacity} from 'react-native';
// import useBLE from '../hooks/useBLE';
// import VolumeDisplay from '../components/VolumeDisplay';
// import VolumeHistory from '../components/VolumeHistory';
// import StatusIndicator from '../components/StatusIndicator';
// import apiService from '../services/api';

// const DashboardScreen = () => {
//   const { scanAndConnect, connectedDevice, bleData } = useBLE();
//   const [history, setHistory] = useState([]);
//   const [refreshing, setRefreshing] = useState(false);
//   const [isConnecting, setIsConnecting] = useState(false);
  
//   // 累積喝水量狀態
//   const [totalIntake, setTotalIntake] = useState(0);

//   // 屏幕加載時自動連接設備
//   useEffect(() => {
//     const connectDevice = async () => {
//       setIsConnecting(true);
//       await scanAndConnect();
//       setIsConnecting(false);
//     };
    
//     connectDevice();
//   }, []);

//   // 當 BLE 數據更新時，同步到歷史記錄
//   useEffect(() => {
//     if (bleData.drinkAmount > 0) {
//       // 累加喝水量
//       setTotalIntake((prevTotal) => prevTotal + bleData.drinkAmount);
      
//       setHistory((prev) => {
//         const safePrev = prev || []; // 如果 prev 是 undefined，就用空陣列
//         const newEntry = {
//           id: Date.now().toString(),
//           lastStableWeight: bleData.lastStableWeight, 
//           drinkAmount: bleData.drinkAmount,           
//           timestamp: new Date().toISOString(),
//         };
//         return [newEntry, ...safePrev.slice(0, 9)];

//         apiService.uploadSensorData(bleData);
//       });
//     }
//   }, [bleData]);

//   const onRefresh = () => {
//     setRefreshing(true);
//     // 清空歷史並重新連接
//     // setHistory([]);
//     setTimeout(() => {
//       setRefreshing(false);
//     }, 1000);
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Smart Coaster</Text>
//         <Text style={styles.headerSubtitle}>Hydration Tracker</Text>
//         {!connectedDevice && (
//           <TouchableOpacity onPress={scanAndConnect} disabled={isConnecting}>
//             <Text style={styles.connectButton}>
//               {isConnecting ? '連接中...' : '點擊連接杯墊'}
//             </Text>
//           </TouchableOpacity>
//         )}
//       </View>

//       <ScrollView
//         style={styles.scrollView}
//         contentContainerStyle={styles.scrollContent}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//         }
//       >
//         {/* 1. 狀態指示燈：傳入 System Active 與 Is On Coaster */}
//         <StatusIndicator 
//           systemActive={bleData.systemActive} 
//           isOnCoaster={bleData.isOnCoaster} 
//         />

//         {/* 2. 水量顯示：傳入 重量、喝水量、提醒時間 */}
//         <VolumeDisplay 
//           currentVolume={totalIntake} 
//           drinkAmount={bleData.drinkAmount}
//           reminderMs={bleData.reminderMs}
//         />

//         {/* 3. 歷史紀錄 */}
//         <VolumeHistory history={history} />

//       </ScrollView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f6fa',
//   },
//   header: {
//     backgroundColor: '#3498db',
//     paddingTop: 60,
//     paddingBottom: 20,
//     paddingHorizontal: 20,
//   },
//   headerTitle: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#fff',
//   },
//   headerSubtitle: {
//     fontSize: 16,
//     color: '#fff',
//     opacity: 0.9,
//     marginTop: 4,
//   },
//   connectButton: {
//     marginTop: 12,
//     fontSize: 14,
//     color: '#fff',
//     backgroundColor: 'rgba(255, 255, 255, 0.3)',
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderRadius: 6,
//     overflow: 'hidden',
//   },
//   scrollView: {
//     flex: 1,
//   },
//   scrollContent: {
//     paddingVertical: 16,
//     paddingBottom: 32,
//   },
// });

// export default DashboardScreen;
