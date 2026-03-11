// src/screens/ReminderSettingScreen.js
// 原本：Modal 形式
// 現在：全頁形式（navigation-based），保留所有 BLE 邏輯
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useBLE from '../hooks/useBLE';

const BLUE = '#5ab4f5', TEXT = '#1a2a3a', MUTED = '#8aaac0';

const PRESETS = [30, 45, 60, 90];

export default function ReminderSettingScreen() {
  const navigation = useNavigation();
  const { bleData } = useBLE(); // 保留原有 BLE 邏輯

  // 原本的邏輯保留：預設值從 BLE 讀取
  const currentMinutes = bleData.reminderMs ? Math.floor(bleData.reminderMs / 60000) : 60;
  const [minutes, setMinutes] = useState(currentMinutes.toString());

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
}

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
