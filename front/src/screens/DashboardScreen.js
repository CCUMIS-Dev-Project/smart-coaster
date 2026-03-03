import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, RefreshControl, SafeAreaView, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useBLE from '../hooks/useBLE';
import WaterProgressBar from '../components/WaterProgressBar';
import VolumeHistory from '../components/VolumeHistory';

const DashboardScreen = () => {
  const { scanAndConnect, connectedDevice, bleData } = useBLE();
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // 累積喝水量狀態
  const [totalIntake, setTotalIntake] = useState(0);
  const [targetAmount, setTargetAmount] = useState(2000); // 假設目標 2000ml

  // 手動新增飲水量狀態
  const [modalVisible, setModalVisible] = useState(false);
  const [addAmountStr, setAddAmountStr] = useState('200');

  // 每當有硬件傳來的喝水量時，更新總喝水量
  useEffect(() => {
    if (bleData && bleData.drinkAmount > 0) {
      setTotalIntake((prevTotal) => prevTotal + bleData.drinkAmount);

      const newEntry = {
        id: Date.now().toString(),
        drinkAmount: bleData.drinkAmount,
        timestamp: new Date().toISOString(),
      };
      setHistory((prev) => [newEntry, ...(prev || []).slice(0, 9)]);
    }
  }, [bleData?.drinkAmount]);

  const handleManualAdd = () => {
    const amount = parseInt(addAmountStr, 10);
    if (!isNaN(amount) && amount > 0) {
      setTotalIntake(prev => prev + amount);
      const newEntry = {
        id: Date.now().toString(),
        drinkAmount: amount,
        timestamp: new Date().toISOString(),
        manual: true
      };
      setHistory(prev => [newEntry, ...(prev || []).slice(0, 9)]);
    }
    setModalVisible(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>今日飲水</Text>
        <Text style={styles.headerSubtitle}>
          {connectedDevice ? `已連線: ${connectedDevice.name || '杯墊'}` : '尚未連線杯墊'}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00FA9A" />}
      >
        <View style={styles.progressContainer}>
          <WaterProgressBar currentAmount={totalIntake} targetAmount={targetAmount} />
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>下次喝水倒數</Text>
            <Text style={styles.statValue}>
              {bleData?.reminderMs > 0 ? `${Math.ceil(bleData.reminderMs / 60000)}` : '--'} <Text style={styles.statUnit}>分</Text>
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>硬體狀態</Text>
            <Text style={[styles.statValue, { color: connectedDevice ? '#FF9800' : '#ff3b30' }]}>
              {connectedDevice ? '連線中' : '未連線'}
            </Text>
          </View>
        </View>

        {/* 歷史紀錄元件 (復用並稍微套用深色主題) */}
        <View style={styles.historyContainer}>
          <VolumeHistory history={history} />
        </View>
      </ScrollView>

      {/* 底部按鈕區 */}
      <View style={styles.footerActions}>
        {!connectedDevice && (
          <TouchableOpacity
            style={[styles.actionButton, styles.connectButton]}
            onPress={scanAndConnect}
          >
            <Ionicons name="bluetooth" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>連接杯墊</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.addButton]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="water" size={24} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>手動紀錄</Text>
        </TouchableOpacity>
      </View>

      {/* 新增飲水 Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>手動新增飲水量 (ml)</Text>

            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={addAmountStr}
              onChangeText={setAddAmountStr}
              placeholder="e.g. 200"
              placeholderTextColor="#888"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.textStyle}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSubmit]}
                onPress={handleManualAdd}
              >
                <Text style={styles.textStyle}>確認</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingTop: 10,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 10,
    paddingTop: 20,
  },
  headerTitle: {
    color: '#333333',
    fontSize: 32,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#FF9800',
    fontSize: 14,
    marginTop: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statBox: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    width: '45%',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  statLabel: {
    color: '#666666',
    fontSize: 14,
    marginBottom: 8,
  },
  statValue: {
    color: '#333333',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statUnit: {
    fontSize: 14,
    color: '#666666',
  },
  historyContainer: {
    paddingHorizontal: 20,
  },
  footerActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(250, 250, 250, 0.95)',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 30,
    flex: 1,
    marginHorizontal: 5,
  },
  connectButton: {
    backgroundColor: '#4DA8DA',
  },
  addButton: {
    backgroundColor: '#29b6f6',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalText: {
    marginBottom: 20,
    color: '#333333',
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    backgroundColor: '#F0F0F0',
    color: '#333333',
    borderRadius: 10,
    padding: 15,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 25,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    borderRadius: 20,
    padding: 15,
    width: '45%',
    alignItems: 'center',
  },
  buttonCancel: {
    backgroundColor: '#E0E0E0',
  },
  buttonSubmit: {
    backgroundColor: '#29b6f6',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default DashboardScreen;
