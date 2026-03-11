// src/screens/ReportScreen.js
// 原本：react-native-chart-kit BarChart + 簡單 streak card
// 現在：Ripple Report UI，自製 bar chart（不依賴 chart-kit），保留資料結構
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';

const BLUE = '#5ab4f5', TEXT = '#1a2a3a', MUTED = '#8aaac0', BORDER = '#e2eaf2';

// 模擬週資料（原本就有，保留結構）
const WEEK_DATA = [
  { d: '一', v: 1600 }, { d: '二', v: 2100 }, { d: '三', v: 1800 },
  { d: '四', v: 2000 }, { d: '五', v: 1750 }, { d: '六', v: 900 },
];

// 模擬當日記錄（原本的 dailyLogs 結構保留）
const DAILY_LOGS = [
  { id: '1', time: '09:30', amount: 350, type: '水' },
  { id: '2', time: '11:15', amount: 200, type: '咖啡' },
  { id: '3', time: '14:40', amount: 500, type: '水' },
];

const GOAL = 2100;
const STREAK = 7; // 原本的 consecutiveDays

export default function ReportScreen() {
  const [period, setPeriod] = useState('週');

  const data = [...WEEK_DATA, { d: '今', v: 1050 }];
  const maxV = Math.max(...data.map(x => x.v), GOAL);
  const avg  = Math.round(data.reduce((a, x) => a + x.v, 0) / data.length);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>報表</Text>
          <View style={styles.toggle}>
            {['週', '月'].map(p => (
              <TouchableOpacity key={p} style={[styles.toggleOpt, period === p && styles.toggleSel]} onPress={() => setPeriod(p)}>
                <Text style={[styles.toggleTxt, period === p && styles.toggleTxtSel]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Streak（保留原本的 consecutiveDays 卡片概念） */}
        <View style={styles.streakCard}>
          <Text style={{ fontSize: 32 }}>🔥</Text>
          <View style={styles.streakInfo}>
            <Text style={styles.streakNum}>{STREAK} 天</Text>
            <Text style={styles.streakLbl}>連續達標！加油 💪</Text>
          </View>
          <View style={{ flex: 1 }} />
          <View style={styles.compareMini}>
            <Text style={styles.compareDelta}>↑ 18%</Text>
            <Text style={styles.compareSub}>vs 上週</Text>
          </View>
        </View>

        {/* Bar chart（自製，不需要 chart-kit） */}
        <View style={styles.chartBox}>
          <Text style={styles.chartTitle}>每日飲水量 (ml)</Text>
          <View style={styles.chartArea}>
            {/* Avg line */}
            <View style={[styles.avgLine, { bottom: `${(avg / maxV) * 82}%` }]}>
              <Text style={styles.avgLabel}>平均 {avg}ml</Text>
            </View>
            {data.map(x => {
              const h = Math.round((x.v / maxV) * 130);
              const isGoal = x.v >= GOAL;
              const isLow  = x.v < 1200;
              return (
                <View key={x.d} style={styles.barCol}>
                  <View style={[styles.barFill, {
                    height: h,
                    backgroundColor: isGoal ? '#4ade80' : isLow ? '#f87171' : BLUE
                  }]} />
                  <Text style={styles.barDay}>{x.d}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* AI insight */}
        <View style={styles.aiBox}>
          <Text style={{ fontSize: 26 }}>🤖</Text>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.aiLabel}>AI 改善建議</Text>
            <Text style={styles.aiText}>你下午 2–4 點補水量偏低，建議午餐後設 2:00 PM 提醒。週間達標率 <Text style={{ fontWeight: '900' }}>71%</Text>，比上週提升 14%！🎉</Text>
          </View>
        </View>

        {/* Compare */}
        <View style={styles.compareRow}>
          <View style={styles.compareCard}>
            <Text style={styles.compareVal}>1920<Text style={styles.compareUnit}>ml</Text></Text>
            <Text style={styles.compareSub2}>本週平均</Text>
            <Text style={styles.compareDelta}>↑ 18% vs 上週</Text>
          </View>
          <View style={styles.compareCard}>
            <Text style={styles.compareVal}>5<Text style={styles.compareUnit}>/7</Text></Text>
            <Text style={styles.compareSub2}>達標天數</Text>
            <Text style={styles.compareDelta}>↑ 2天 vs 上週</Text>
          </View>
        </View>

        {/* Daily logs（保留原本的 dailyLogs 結構） */}
        <Text style={styles.sectionTitle}>今日紀錄</Text>
        {DAILY_LOGS.map(log => {
          const w = Math.round((log.amount / GOAL) * 100);
          return (
            <View key={log.id} style={styles.recItem}>
              <Text style={styles.recTime}>{log.time}</Text>
              <View style={styles.recBarWrap}>
                <View style={[styles.recBar, { width: `${w}%` }]} />
              </View>
              <Text style={styles.recType}>{log.type}</Text>
              <Text style={styles.recMl}>+{log.amount}ml</Text>
            </View>
          );
        })}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f7fc' },
  inner: { padding: 20, paddingTop: 56, paddingBottom: 32, gap: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '900', color: TEXT },
  toggle: { flexDirection: 'row', backgroundColor: '#dde8f0', borderRadius: 10, padding: 3 },
  toggleOpt: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 },
  toggleSel: { backgroundColor: '#fff' },
  toggleTxt: { fontSize: 13, fontWeight: '800', color: MUTED },
  toggleTxtSel: { color: TEXT },

  streakCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 20, padding: 16 },
  streakInfo: { gap: 2 },
  streakNum: { fontSize: 22, fontWeight: '900', color: TEXT },
  streakLbl: { fontSize: 13, color: MUTED },
  compareMini: { alignItems: 'flex-end' },
  compareDelta: { fontSize: 14, fontWeight: '900', color: '#4ade80' },
  compareSub: { fontSize: 11, color: MUTED },

  chartBox: { backgroundColor: '#fff', borderRadius: 20, padding: 16 },
  chartTitle: { fontSize: 13, fontWeight: '900', color: TEXT, marginBottom: 12 },
  chartArea: { height: 170, flexDirection: 'row', alignItems: 'flex-end', gap: 6, position: 'relative' },
  avgLine: { position: 'absolute', left: 0, right: 0, height: 1.5, backgroundColor: 'rgba(90,180,245,0.5)', zIndex: 1 },
  avgLabel: { position: 'absolute', right: 0, top: -14, fontSize: 10, fontWeight: '800', color: BLUE },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barFill: { width: '100%', borderRadius: 6, minHeight: 4 },
  barDay: { fontSize: 11, fontWeight: '800', color: MUTED },

  aiBox: { flexDirection: 'row', gap: 12, backgroundColor: '#fff', borderRadius: 18, padding: 14 },
  aiLabel: { fontSize: 12, fontWeight: '900', color: BLUE },
  aiText: { fontSize: 13, color: '#4a6a84', lineHeight: 20 },

  sectionTitle: { fontSize: 14, fontWeight: '900', color: TEXT },
  compareRow: { flexDirection: 'row', gap: 12 },
  compareCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 3 },
  compareVal: { fontSize: 26, fontWeight: '900', color: TEXT },
  compareUnit: { fontSize: 14, color: MUTED },
  compareSub2: { fontSize: 12, color: MUTED },

  recItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f5fa' },
  recTime: { fontSize: 12, fontWeight: '800', color: MUTED, width: 40 },
  recBarWrap: { flex: 1, height: 8, backgroundColor: BORDER, borderRadius: 4, overflow: 'hidden' },
  recBar: { height: '100%', backgroundColor: BLUE, borderRadius: 4 },
  recType: { fontSize: 12, color: MUTED, width: 30, textAlign: 'center' },
  recMl: { fontSize: 13, fontWeight: '900', color: BLUE, width: 55, textAlign: 'right' },
});
