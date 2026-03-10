import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, SafeAreaView } from 'react-native';
import { BarChart } from 'react-native-chart-kit'; // 需要安裝 react-native-chart-kit
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get("window").width;

const ReportScreen = () => {
  // 模擬數據：連續喝水天數
  const consecutiveDays = 7;

  // 模擬數據：一週喝水量 (ml)
  const weeklyData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: [1500, 2100, 1800, 2400, 1200, 1900, 2000]
      }
    ]
  };

  // 模擬數據：當日詳細紀錄
  const dailyLogs = [
    { id: '1', time: '09:30', amount: 350, type: '水' },
    { id: '2', time: '11:15', amount: 200, type: '咖啡' },
    { id: '3', time: '14:40', amount: 500, type: '水' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>飲水報告</Text>

        {/* 1. 連續喝水天數卡片 */}
        <View style={styles.streakCard}>
          <Ionicons name="flame" size={40} color="#FF9500" />
          <View style={styles.streakInfo}>
            <Text style={styles.streakCount}>{consecutiveDays} 天</Text>
            <Text style={styles.streakLabel}>您已連續達成目標！</Text>
          </View>
        </View>

        {/* 2. 一週喝水量長條圖 */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>本週飲水統計 (ml)</Text>
          <BarChart
            data={weeklyData}
            width={screenWidth - 40}
            height={220}
            yAxisLabel=""
            chartConfig={chartConfig}
            verticalLabelRotation={0}
            style={styles.chart}
            fromZero={true}
          />
        </View>

        {/* 3. 當日喝水紀錄列表 */}
        <View style={styles.logSection}>
          <Text style={styles.sectionTitle}>今日紀錄</Text>
          {dailyLogs.map((log) => (
            <View key={log.id} style={styles.logItem}>
              <View style={styles.logIcon}>
                <Ionicons name={log.type === '咖啡' ? 'cafe' : 'water'} size={24} color="#3498db" />
              </View>
              <View style={styles.logDetails}>
                <Text style={styles.logType}>{log.type}</Text>
                <Text style={styles.logTime}>{log.time}</Text>
              </View>
              <Text style={styles.logAmount}>+{log.amount} ml</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// 圖表設定
const chartConfig = {
  backgroundColor: "#ffffff",
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  decimalPlaces: 0, 
  color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`, // 主色調：藍色
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16
  },
  propsForBackgroundLines: {
    strokeDasharray: "" // 實線背景線
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  streakCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  streakInfo: {
    marginLeft: 15,
  },
  streakCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  streakLabel: {
    fontSize: 14,
    color: '#666',
  },
  chartSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#444',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  logSection: {
    flex: 1,
  },
  logItem: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  logIcon: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#EBF5FB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logDetails: {
    flex: 1,
    marginLeft: 15,
  },
  logType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  logTime: {
    fontSize: 13,
    color: '#999',
  },
  logAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
  },
});

export default ReportScreen;