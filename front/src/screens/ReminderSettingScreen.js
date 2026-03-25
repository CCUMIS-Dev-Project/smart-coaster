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
  Keyboard,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useBLE from '../hooks/useBLE'; // 引入藍牙邏輯
import { useNavigation } from '@react-navigation/native'; // 引入導覽鉤子


const BLUE = '#5ab4f5', TEXT = '#1a2a3a', MUTED = '#8aaac0';

const PRESETS = [30, 45, 60, 90];

const ReminderSettingScreen = ({ visible, onClose }) => {
  const { bleData } = useBLE(); // 取得目前的 BLE 數據
  // 預設值取自目前杯墊設定，若無則設為 60 分鐘
  const currentMinutes = bleData.reminderMs ? Math.floor(bleData.reminderMs / 60000) : 60;
  const [minutes, setMinutes] = useState(currentMinutes.toString());
  const navigation = useNavigation(); // 取得導覽物件

  function handleSave() {
    const ms = parseInt(minutes) * 60000;
    if (isNaN(ms) || ms <= 0) {
      alert('請輸入有效的時間');
      return;
    }
    // TODO: 實作透過 BLE 寫入數據到 Pico W 的邏輯（保留原有 TODO）
    console.log(`將提醒時間設定為: ${ms} 毫秒`);
    navigation.goBack();
  }

  // return (
  //   <Modal
  //     animationType="fade"
  //     transparent={true} // 設定為透明以實現背景變暗效果
  //     visible={visible}
  //     onRequestClose={onClose}
  //   >
  //     <TouchableWithoutFeedback onPress={onClose}>
  //       <View style={styles.overlay}>
  //         <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
  //           <KeyboardAvoidingView 
  //             behavior={Platform.OS === "ios" ? "padding" : "height"}
  //             style={styles.modalContainer}
  //           >
  //             <View style={styles.card}>
  //               <View style={styles.header}>
  //                 <Text style={styles.title}>提醒設定</Text>
  //                 <TouchableOpacity onPress={handleClose}>
  //                   <Ionicons name="close" size={24} color="#999" />
  //                 </TouchableOpacity>
  //               </View>

  //               <View style={styles.content}>
  //                 <Text style={styles.label}>提醒間隔 (分鐘)</Text>
  //                 <View style={styles.inputContainer}>
  //                   <TextInput
  //                     style={styles.input}
  //                     value={minutes}
  //                     onChangeText={setMinutes}
  //                     keyboardType="number-pad"
  //                     placeholder="例如: 60"
  //                     maxLength={3}
  //                   />
  //                   <Text style={styles.unit}>min</Text>
  //                 </View>
  //                 <Text style={styles.hint}>杯墊將在您設定的時間到時閃爍 LED 提醒。</Text>
  //               </View>

  //               <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
  //                 <Text style={styles.saveButtonText}>儲存並更新杯墊</Text>
  //               </TouchableOpacity>
  //             </View>
  //           </KeyboardAvoidingView>
  //         </TouchableWithoutFeedback>
  //       </View>
  //     </TouchableWithoutFeedback>
  //   </Modal>
  // );
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.inner}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backTxt}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>提醒設定</Text>
          </View>

          {/* Main input card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>提醒間隔</Text>
            <Text style={styles.cardSub}>杯墊將在設定時間到時閃爍 LED 提醒</Text>

            {/* Big number input */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.bigInput}
                value={minutes}
                onChangeText={setMinutes}
                keyboardType="number-pad"
                maxLength={3}
                placeholder="60"
                placeholderTextColor="#ccc"
              />
              <Text style={styles.unit}>分鐘</Text>
            </View>

            {/* Preset buttons */}
            <View style={styles.presetRow}>
              {PRESETS.map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.presetBtn, minutes === String(p) && styles.presetBtnSel]}
                  onPress={() => setMinutes(String(p))}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.presetTxt, minutes === String(p) && styles.presetTxtSel]}>{p} 分</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* BLE status hint */}
          <View style={styles.hintBox}>
            <Text style={styles.hintTxt}>
              💡 目前從杯墊讀取的提醒間隔：{currentMinutes} 分鐘
            </Text>
          </View>

          <View style={{ flex: 1 }} />

          {/* Save button */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={styles.saveBtnTxt}>儲存並更新杯墊</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// const styles = StyleSheet.create({
//   overlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.6)', // 背景變暗的核心設定
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   modalContainer: {
//     width: '100%',
//     maxWidth: 400,
//   },
//   card: {
//     backgroundColor: '#FFF',
//     borderRadius: 25,
//     padding: 25,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 10 },
//     shadowOpacity: 0.2,
//     shadowRadius: 20,
//     elevation: 10,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 25,
//   },
//   title: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   content: {
//     marginBottom: 30,
//   },
//   label: {
//     fontSize: 14,
//     color: '#666',
//     marginBottom: 10,
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'flex-end',
//     borderBottomWidth: 2,
//     borderBottomColor: '#3498db',
//     paddingBottom: 5,
//   },
//   input: {
//     fontSize: 32,
//     fontWeight: 'bold',
//     color: '#333',
//     flex: 1,
//     padding: 0,
//   },
//   unit: {
//     fontSize: 18,
//     color: '#3498db',
//     fontWeight: '600',
//     marginBottom: 5,
//   },
//   hint: {
//     fontSize: 12,
//     color: '#BBB',
//     marginTop: 15,
//     lineHeight: 18,
//   },
//   saveButton: {
//     backgroundColor: '#3498db',
//     borderRadius: 15,
//     paddingVertical: 15,
//     alignItems: 'center',
//   },
//   saveButtonText: {
//     color: '#FFF',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
// });
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f7fc' },
  inner: { flex: 1, padding: 20, paddingTop: 56 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  backBtn: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  backTxt: { fontSize: 18 },
  title: { fontSize: 22, fontWeight: '900', color: TEXT },

  card: { backgroundColor: '#fff', borderRadius: 24, padding: 24, gap: 8, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  cardTitle: { fontSize: 16, fontWeight: '900', color: TEXT },
  cardSub: { fontSize: 12, color: MUTED, marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', borderBottomWidth: 2, borderBottomColor: BLUE, paddingBottom: 6, marginBottom: 20 },
  bigInput: { fontSize: 56, fontWeight: '900', color: TEXT, flex: 1, padding: 0 },
  unit: { fontSize: 22, color: BLUE, fontWeight: '700', marginBottom: 8 },
  presetRow: { flexDirection: 'row', gap: 8 },
  presetBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: '#e2eaf2', alignItems: 'center', backgroundColor: '#f6fafd' },
  presetBtnSel: { borderColor: BLUE, backgroundColor: '#eaf6ff' },
  presetTxt: { fontSize: 14, fontWeight: '800', color: MUTED },
  presetTxtSel: { color: '#2196f3' },

  hintBox: { backgroundColor: '#eaf6ff', borderRadius: 14, padding: 14, marginTop: 12 },
  hintTxt: { fontSize: 13, color: '#4a6a84' },

  saveBtn: { backgroundColor: BLUE, paddingVertical: 17, borderRadius: 16, alignItems: 'center', marginBottom: 20, shadowColor: BLUE, shadowOpacity: 0.38, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
  saveBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '900' },
});

export default ReminderSettingScreen;