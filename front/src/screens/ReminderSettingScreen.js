import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  KeyboardAvoidingView, 
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useBLE from '../hooks/useBLE'; // 引入藍牙邏輯
import { useNavigation } from '@react-navigation/native'; // 引入導覽鉤子

const ReminderSettingScreen = ({ visible, onClose }) => {
  const { bleData } = useBLE(); // 取得目前的 BLE 數據
  // 預設值取自目前杯墊設定，若無則設為 60 分鐘
  const currentMinutes = bleData.reminderMs ? Math.floor(bleData.reminderMs / 60000) : 60;
  const [minutes, setMinutes] = useState(currentMinutes.toString());
  const navigation = useNavigation(); // 取得導覽物件

  const handleSave = () => {
    const ms = parseInt(minutes) * 60000;
    if (isNaN(ms) || ms <= 0) {
      alert("請輸入有效的時間");
      return;
    }
    
    // TODO: 實作透過 BLE 寫入數據到 Pico W 的邏輯
    console.log(`將提醒時間設定為: ${ms} 毫秒`);
    
    // 儲存成功後關閉視窗
    onClose();
  };

  const handleClose = () => {
    navigation.navigate('主頁'); 
  };

  return (
    <Modal
      animationType="fade"
      transparent={true} // 設定為透明以實現背景變暗效果
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.modalContainer}
            >
              <View style={styles.card}>
                <View style={styles.header}>
                  <Text style={styles.title}>提醒設定</Text>
                  <TouchableOpacity onPress={handleClose}>
                    <Ionicons name="close" size={24} color="#999" />
                  </TouchableOpacity>
                </View>

                <View style={styles.content}>
                  <Text style={styles.label}>提醒間隔 (分鐘)</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      value={minutes}
                      onChangeText={setMinutes}
                      keyboardType="number-pad"
                      placeholder="例如: 60"
                      maxLength={3}
                    />
                    <Text style={styles.unit}>min</Text>
                  </View>
                  <Text style={styles.hint}>杯墊將在您設定的時間到時閃爍 LED 提醒。</Text>
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>儲存並更新杯墊</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // 背景變暗的核心設定
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderBottomWidth: 2,
    borderBottomColor: '#3498db',
    paddingBottom: 5,
  },
  input: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    padding: 0,
  },
  unit: {
    fontSize: 18,
    color: '#3498db',
    fontWeight: '600',
    marginBottom: 5,
  },
  hint: {
    fontSize: 12,
    color: '#BBB',
    marginTop: 15,
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: '#3498db',
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReminderSettingScreen;