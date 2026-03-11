// src/screens/MainScreen.js
// 原本：ImageBackground + BLE connect + 簡單 progress circle
// 現在：Ripple Dashboard UI，保留全部 BLE 邏輯 (useBLE, scanAndConnect, bleData)
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView, Alert
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import useBLE from '../hooks/useBLE';

const CIRCUMFERENCE = 2 * Math.PI * 80;
const BLUE = '#5ab4f5', TEXT = '#1a2a3a', MUTED = '#8aaac0', BORDER = '#e2eaf2';

const DRINK_TYPES = ['💧 白開水', '🍵 茶', '☕ 咖啡', '🥤 果汁', '🧋 手搖'];

export default function MainScreen({ navigation }) {
  // ── 保留原有 BLE 邏輯 ─────────────────────────────────
  const { scanAndConnect, connectedDevice, bleData } = useBLE();
  const [totalIntake, setTotalIntake] = useState(0);
  const [logs, setLogs] = useState([]);
  const [timerMin, setTimerMin] = useState(48);

  // 固定目標（未來可從 UserContext 讀取）
  const dailyTarget = 2100;

  // 監聽 BLE 數據更新水量（原有邏輯完整保留）
  useEffect(() => {
    if (bleData.drinkAmount > 0) {
      setTotalIntake(prev => prev + bleData.drinkAmount);
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
      setLogs(prev => [{ id: Date.now().toString(), time, amount: bleData.drinkAmount, type: '白開水' }, ...prev.slice(0,9)]);
    }
  }, [bleData.drinkAmount]);

  // ── UI 計算 ───────────────────────────────────────────
  const pct = Math.min(1, totalIntake / dailyTarget);
  const strokeOffset = CIRCUMFERENCE * (1 - pct);

  const now = new Date();
  const DAYS = ['週日','週一','週二','週三','週四','週五','週六'];
  const dateStr = `${DAYS[now.getDay()]} · ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;

  // 快速記錄（手動補水）
  function quickLog(ml, type = '白開水') {
    setTotalIntake(prev => prev + ml);
    const t = new Date();
    const time = `${t.getHours().toString().padStart(2,'0')}:${t.getMinutes().toString().padStart(2,'0')}`;
    setLogs(prev => [{ id: Date.now().toString(), time, amount: ml, type }, ...prev.slice(0,9)]);
    setTimerMin(Math.max(5, Math.round(dailyTarget / Math.max(1, logs.length + 1) / 60)));
  }

  // 切換飲品（保留原有 Alert 邏輯）
  function handleChangeDrink() {
    Alert.alert('記錄飲水', '請選擇飲品類型：', [
      ...DRINK_TYPES.map(label => ({
        text: label,
        onPress: () => quickLog(250, label.replace(/^. /, ''))
      })),
      { text: '取消', style: 'cancel' }
    ]);
  }

  const logColors = ['#5ab4f5','#4ade80','#f59e0b','#ec4899','#8b5cf6','#06b6d4'];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top bar */}
      <View style={styles.topbar}>
        <View>
          <Text style={styles.greeting}>嗨，Alex 👋</Text>
          <Text style={styles.date}>{dateStr}</Text>
        </View>
        <TouchableOpacity
          style={styles.bleBtn}
          onPress={scanAndConnect}
        >
          <Text style={styles.bleDot}>{connectedDevice ? '🟢' : '🔴'}</Text>
          <Text style={styles.bleTxt}>{connectedDevice ? '已連線' : '連接杯墊'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Ring progress */}
        <View style={styles.ringSection}>
          <View style={styles.ringWrap}>
            <Svg width={180} height={180} viewBox="0 0 180 180">
              <Circle cx="90" cy="90" r="80" stroke={BORDER} strokeWidth="12" fill="none" />
              <Circle
                cx="90" cy="90" r="80"
                stroke={BLUE} strokeWidth="12" fill="none"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                rotation="-90" origin="90, 90"
              />
            </Svg>
            <View style={styles.ringCenter}>
              <Text style={styles.ringCup}>☕</Text>
              <Text style={styles.ringPct}>{Math.round(pct * 100)}%</Text>
              <Text style={styles.ringLbl}>{totalIntake} / {dailyTarget} ml</Text>
            </View>
          </View>
          {/* Timer pill */}
          <View style={styles.timerPill}>
            <View style={styles.timerDot} />
            <Text style={styles.timerTxt}>下次補水</Text>
            <Text style={styles.timerVal}>{timerMin} 分後</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progSection}>
          <View style={styles.progHeader}>
            <Text style={styles.progLbl}>今日進度</Text>
            <Text style={styles.progVal}>{totalIntake}ml / {dailyTarget}ml</Text>
          </View>
          <View style={styles.progTrack}>
            <View style={[styles.progFill, { width: `${pct * 100}%` }]} />
          </View>
        </View>

        {/* Quick log */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>快速記錄</Text>
          <View style={styles.quickGrid}>
            {[150, 250, 350].map(ml => (
              <TouchableOpacity key={ml} style={styles.qBtn} onPress={() => quickLog(ml)} activeOpacity={0.75}>
                <Text style={styles.qBtnTxt}>+{ml}ml</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.qBtn, styles.qBtnBlue]} onPress={handleChangeDrink} activeOpacity={0.75}>
              <Text style={styles.qBtnTxt}>+ 飲品 ▾</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Log list */}
        <View style={styles.section}>
          <View style={styles.logHead}>
            <Text style={styles.sectionTitle}>今日記錄</Text>
            <TouchableOpacity onPress={() => navigation.navigate('手動記錄')}>
              <Text style={styles.logAdd}>＋ 手動新增</Text>
            </TouchableOpacity>
          </View>
          {logs.length === 0 && (
            <Text style={styles.emptyTxt}>還沒有記錄，喝水吧！💧</Text>
          )}
          {logs.map((log, i) => (
            <View key={log.id} style={styles.logItem}>
              <View style={[styles.logDot, { backgroundColor: logColors[i % logColors.length] }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.logAmt}>{log.amount} ml</Text>
                <Text style={styles.logMeta}>{log.time} · {log.type}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f7fc' },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  greeting: { fontSize: 20, fontWeight: '900', color: TEXT },
  date: { fontSize: 13, color: MUTED, marginTop: 2 },
  bleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: BORDER },
  bleDot: { fontSize: 12 },
  bleTxt: { fontSize: 12, fontWeight: '800', color: TEXT },
  scroll: { flex: 1 },

  ringSection: { alignItems: 'center', paddingVertical: 8 },
  ringWrap: { width: 180, height: 180, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  ringCup: { fontSize: 32 },
  ringPct: { fontSize: 26, fontWeight: '900', color: TEXT },
  ringLbl: { fontSize: 11, color: MUTED },
  timerPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, marginTop: 8, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  timerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' },
  timerTxt: { fontSize: 13, color: MUTED },
  timerVal: { fontSize: 13, fontWeight: '900', color: TEXT },

  progSection: { paddingHorizontal: 20, gap: 8, marginBottom: 4 },
  progHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progLbl: { fontSize: 13, fontWeight: '800', color: TEXT },
  progVal: { fontSize: 13, color: MUTED },
  progTrack: { height: 10, backgroundColor: BORDER, borderRadius: 8, overflow: 'hidden' },
  progFill: { height: '100%', backgroundColor: BLUE, borderRadius: 8 },

  section: { paddingHorizontal: 20, paddingTop: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: TEXT, marginBottom: 10 },
  quickGrid: { flexDirection: 'row', gap: 8 },
  qBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1.5, borderColor: BORDER },
  qBtnBlue: { borderColor: BLUE, backgroundColor: '#eaf6ff' },
  qBtnTxt: { fontSize: 12, fontWeight: '900', color: BLUE },

  logHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logAdd: { fontSize: 13, fontWeight: '800', color: BLUE },
  emptyTxt: { fontSize: 13, color: MUTED, textAlign: 'center', paddingVertical: 20 },
  logItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f5fa' },
  logDot: { width: 10, height: 10, borderRadius: 5 },
  logAmt: { fontSize: 15, fontWeight: '900', color: TEXT },
  logMeta: { fontSize: 12, color: MUTED },
});
