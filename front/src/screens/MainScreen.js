import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ImageBackground, 
  Image, 
  TouchableOpacity, 
  SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useBLE from '../hooks/useBLE';

const MainScreen = () => {
  // 延用 DashboardScreen 的 BLE 邏輯
  const { scanAndConnect, connectedDevice, bleData } = useBLE();
  const [totalIntake, setTotalIntake] = useState(0);
  const dailyTarget = 2000; // 假設目標為 2000ml

  // 監聽 BLE 數據更新水量
  useEffect(() => {
    if (bleData.drinkAmount > 0) {
      setTotalIntake((prev) => prev + bleData.drinkAmount);
    }
  }, [bleData.drinkAmount]);

  // 計算百分比
  const progress = Math.min((totalIntake / dailyTarget) * 100, 100).toFixed(0);

  return (
    <ImageBackground 
      source={require('../assets/background.png')} // 你的設計背景圖
      style={styles.background}
    >
      <SafeAreaView style={styles.container}>
        {/* 頂部狀態與標題 */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>哈囉！</Text>
            <Text style={styles.subText}>今天也要記得喝水喔</Text>
          </View>
          <TouchableOpacity onPress={scanAndConnect}>
            <Ionicons 
              name="bluetooth" 
              size={28} 
              color={connectedDevice ? "#4CD964" : "#FF3B30"} 
            />
          </TouchableOpacity>
        </View>

        {/* 中央杯子進度區 (對應 main_cup.jpg) */}
        <View style={styles.progressContainer}>
          <View style={styles.circleOutline}>
            <Image 
              source={require('../assets/main_cup.png')} // 杯子圖示
              style={styles.cupImage}
              resizeMode="contain"
            />
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
        </View>

        {/* 下方數據卡片 */}
        <View style={styles.infoCard}>
          <View style={styles.dataRow}>
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>已飲用</Text>
              <Text style={styles.dataValue}>{totalIntake} <Text style={styles.unit}>ml</Text></Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.dataItem}>
              <Text style={styles.dataLabel}>今日目標</Text>
              <Text style={styles.dataValue}>{dailyTarget} <Text style={styles.unit}>ml</Text></Text>
            </View>
          </View>
          
          {/* 連接狀態提示 */}
          <Text style={styles.statusText}>
            裝置狀態：{connectedDevice ? '已連線' : '未連線'}
          </Text>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    paddingHorizontal: 25,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subText: {
    fontSize: 16,
    color: '#666',
  },
  progressContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleOutline: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: '#AEE2FF', // 淺藍色邊框
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cupImage: {
    width: 140,
    height: 140,
    marginBottom: 10,
  },
  progressText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#3498db',
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 30,
    padding: 25,
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  dataItem: {
    alignItems: 'center',
  },
  dataLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 5,
  },
  dataValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  unit: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#EEE',
  },
  statusText: {
    textAlign: 'center',
    marginTop: 15,
    fontSize: 12,
    color: '#BBB',
  }
});

export default MainScreen;