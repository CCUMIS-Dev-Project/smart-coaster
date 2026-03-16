// src/screens/SettingScreen.js
// 原本：Modal 形式的設定選單
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const BLUE = '#5ab4f5', TEXT = '#1a2a3a', MUTED = '#8aaac0', BORDER = '#e2eaf2';

const URINE_COLORS = ['#fff7c0','#ffe980','#f5c842','#d4a017','#a87000','#6b4500'];
const URINE_LABELS = ['淺黃 → 補水充足 ✓','淡黃 → 正常','黃色 → 建議多喝','深黃 → 補水不足！','琥珀 → 嚴重缺水！','深褐 → 請就醫！'];

export default function SettingScreen() {
  const navigation = useNavigation();
  const [notifOn, setNotifOn] = useState(true);
  const [smartOn, setSmartOn] = useState(true);
  const [sleepOn, setSleepOn] = useState(true);
  const [locOn, setLocOn]     = useState(true);
  const [urineIdx, setUrineIdx] = useState(0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>設定</Text>

        {/* 我的水杯 */}
        <SettingsGroup title="我的水杯">
          <SettingsRow icon="☕" name="馬克杯" sub="400ml・點此更換水杯"
            onPress={() => navigation.navigate('Initial')} arrow />
        </SettingsGroup>

        {/* 每日目標 */}
        <SettingsGroup title="每日目標">
          <SettingsRow icon="🎯" name="每日飲水目標" sub="根據個資自動計算" val="2100 ml" arrow />
          <SettingsRow icon="⏱" name="提醒間隔" sub="根據目標與清醒時數計算" val="50 分鐘" arrow />
          <SettingsRow icon="🧠" name="智慧調整提醒" sub="2 週後根據習慣自動優化">
            <Switch value={smartOn} onValueChange={setSmartOn} trackColor={{ true: BLUE }} />
          </SettingsRow>
        </SettingsGroup>

        {/* 提醒設定（保留原本的 onOpenReminder，改為 navigate） */}
        <SettingsGroup title="提醒設定">
          <SettingsRow icon="🔔" name="啟用提醒" sub="按時提醒你補水">
            <Switch value={notifOn} onValueChange={setNotifOn} trackColor={{ true: BLUE }} />
          </SettingsRow>
          <SettingsRow icon="⏰" name="提醒間隔設定" sub="設定杯墊 LED 閃爍間隔"
            onPress={() => navigation.navigate('提醒設定')} arrow />
          <SettingsRow icon="😴" name="睡眠時段暫停" sub="22:00 – 07:00" val="設定" arrow />
        </SettingsGroup>

        {/* 尿液顏色卡 */}
        <View style={styles.urineCard}>
          <Text style={styles.urineTitle}>🪣 今日尿液顏色</Text>
          <Text style={styles.urineSub}>幫助系統微調明日補水目標（可選填）</Text>
          <View style={styles.urineScale}>
            {URINE_COLORS.map((c, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.urineSwatch, { backgroundColor: c }, urineIdx === i && styles.urineSwatchSel]}
                onPress={() => setUrineIdx(i)}
                activeOpacity={0.75}
              />
            ))}
          </View>
          <Text style={styles.urineLabel}>{URINE_LABELS[urineIdx]}</Text>
        </View>

        {/* 個人資料（保留原本的 handleGoToProfile 導覽） */}
        <SettingsGroup title="個人資料">
          <SettingsRow icon="👤" name="重新設定個資" sub="性別・體重・活動量・年齡"
            onPress={() => navigation.navigate('Initial')} arrow />
          <SettingsRow icon="📍" name="位置與氣溫" sub="自動更新">
            <Switch value={locOn} onValueChange={setLocOn} trackColor={{ true: BLUE }} />
          </SettingsRow>
        </SettingsGroup>

        {/* 我的花園 */}
        <SettingsGroup title="我的花園">
          <SettingsRow icon="🌸" name="花朵收藏" sub="已解鎖 2 / 8 朵花" val="連續 3 天🔥" arrow />
        </SettingsGroup>

        {/* 原本的 SettingScreen 選項：關於我們、登出 */}
        <SettingsGroup title="其他">
          <SettingsRow icon="ℹ️" name="關於我們" arrow />
          <SettingsRow icon="🚪" name="登出" danger />
        </SettingsGroup>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsGroup({ title, children }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      {children}
    </View>
  );
}

function SettingsRow({ icon, name, sub, val, arrow, onPress, danger, children }) {
  const inner = (
    <View style={styles.row}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowName, danger && { color: '#FF3B30' }]}>{name}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      {val   ? <Text style={styles.rowVal}>{val}</Text>    : null}
      {arrow ? <Text style={styles.rowArrow}>›</Text>      : null}
      {children}
    </View>
  );
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.75}>{inner}</TouchableOpacity>;
  return inner;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f7fc' },
  inner: { padding: 20, paddingTop: 56, paddingBottom: 32, gap: 14 },
  pageTitle: { fontSize: 22, fontWeight: '900', color: TEXT },
  group: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  groupTitle: { fontSize: 11, fontWeight: '900', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 13, borderTopWidth: 1, borderTopColor: '#f0f5fa', gap: 12 },
  rowIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '800', color: TEXT },
  rowSub: { fontSize: 12, color: MUTED, marginTop: 2 },
  rowVal: { fontSize: 14, fontWeight: '800', color: BLUE },
  rowArrow: { fontSize: 18, color: MUTED },
  urineCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, gap: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  urineTitle: { fontSize: 14, fontWeight: '900', color: TEXT },
  urineSub: { fontSize: 12, color: MUTED },
  urineScale: { flexDirection: 'row', gap: 5 },
  urineSwatch: { flex: 1, height: 28, borderRadius: 7, borderWidth: 3, borderColor: 'transparent' },
  urineSwatchSel: { borderColor: '#1a2a3a' },
  urineLabel: { fontSize: 12, fontWeight: '800', color: MUTED, textAlign: 'center' },
});
