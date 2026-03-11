/**
 * front/src/screens/GardenScreen.js
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useUser } from '../context/UserContext';
import { Colors, FlowerList, Shadow } from '../constants/theme';

export default function GardenScreen() {
  const { todayMl, goalMl, garden, refreshToday } = useUser();
  const { cycle, flowers = [], streak = 0 } = garden;

  useEffect(() => { refreshToday(); }, []);

  const doneDays = cycle
    ? ['day_1','day_2','day_3','day_4','day_5'].filter(d => cycle[d] === true).length
    : 0;

  const gardenDays = cycle
    ? ['day_1','day_2','day_3','day_4','day_5'].map(d => {
        if (cycle[d] === true) return 'done';
        if (cycle[d] === false) return 'fail';
        return d === `day_${doneDays + 1}` ? 'today' : 'empty';
      })
    : ['today','empty','empty','empty','empty'];

  const stageEmojis = ['🌱','🌿','🪴','🌸','🌺'];
  const dotColors = { done: Colors.green, today: Colors.blue, fail: Colors.red, empty: '#dde8de' };
  const dotLabels = { done: '✓', today: '▶', fail: '✕', empty: '' };

  const unlockedEmojis = flowers.map(f => f.flower_emoji);
  const todayPct = Math.min(100, Math.round(todayMl / goalMl * 100));

  const weekData = [
    { day: '一', ml: 2200 }, { day: '二', ml: 1800 }, { day: '三', ml: 2100 },
    { day: '四', ml: 2300 }, { day: '五', ml: 2050 }, { day: '六', ml: 950 },
    { day: '今', ml: todayMl },
  ];
  const maxMl = Math.max(...weekData.map(d => d.ml), goalMl);
  const histEmoji = (ml) => ml >= goalMl ? '🌸' : ml > goalMl * 0.8 ? '🌿' : ml > goalMl * 0.5 ? '🌱' : '🥀';

  return (
    <View style={s.root}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>我的花園 🌸</Text>
          <Text style={s.sub}>連續 5 天達標，綻放一朵花！</Text>
        </View>
        <View style={s.streakBadge}>
          <Text style={s.streakNum}>{streak}</Text>
          <Text style={s.streakLbl}>連續天🔥</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Plant card */}
        <View style={s.plantCard}>
          <Text style={s.sectionLabel}>本週成長進度</Text>
          <View style={s.stagesRow}>
            {gardenDays.map((status, i) => (
              <View key={i} style={s.stage}>
                <Text style={[s.stageEmoji, (status === 'fail' || status === 'empty') && { opacity: 0.35 }]}>
                  {stageEmojis[i]}
                </Text>
                <View style={[s.stageDot, { backgroundColor: dotColors[status] }]}>
                  <Text style={s.stageDotText}>{dotLabels[status]}</Text>
                </View>
                <Text style={s.stageLbl}>第{i+1}天</Text>
              </View>
            ))}
          </View>
          <View style={s.progInfo}>
            <View style={s.daysLeft}>
              {doneDays >= 5
                ? <Text style={{ fontSize: 26 }}>🌸</Text>
                : <Text style={s.daysNum}>{5 - doneDays}</Text>}
              <Text style={s.daysLbl}>{doneDays >= 5 ? '開花！' : '天開花'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={s.progLbl}>今日水量</Text>
                <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.green }}>{todayMl}/{goalMl}ml</Text>
              </View>
              <View style={s.progBar}><View style={[s.progFill, { width: `${todayPct}%` }]} /></View>
            </View>
          </View>
        </View>

        {/* History */}
        <View style={s.histCard}>
          <Text style={s.sectionLabel}>本週每日記錄</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {weekData.map(d => {
              const h   = Math.round((d.ml / maxMl) * 40);
              const hit = d.ml >= goalMl;
              return (
                <View key={d.day} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 16 }}>{histEmoji(d.ml)}</Text>
                  <View style={{ width: '100%', height: 40, backgroundColor: '#e8f2ea', borderRadius: 99, justifyContent: 'flex-end', overflow: 'hidden' }}>
                    <View style={{ width: '100%', height: h, backgroundColor: hit ? Colors.green : '#f0c0c0', borderRadius: 99 }} />
                  </View>
                  <Text style={{ fontSize: 9, fontWeight: '800', color: Colors.gardenMuted }}>{d.day}</Text>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: Colors.gardenText }}>{d.ml >= 1000 ? (d.ml/1000).toFixed(1)+'k' : d.ml}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Flower collection */}
        <View style={s.collCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '900', color: Colors.text }}>🌸 花朵收藏</Text>
            <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.green }}>已收集 {unlockedEmojis.length} / {FlowerList.length}</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
            {FlowerList.map((f, i) => {
              const owned  = unlockedEmojis.includes(f.emoji);
              const isNext = !owned && FlowerList.findIndex(x => !unlockedEmojis.includes(x.emoji)) === i;
              return (
                <View key={f.emoji} style={[s.flowerSlot, owned ? s.flowerUnlocked : s.flowerLocked]}>
                  <Text style={[{ fontSize: 26 }, !owned && { opacity: 0.3 }]}>{f.emoji}</Text>
                  {owned
                    ? <Text style={{ fontSize: 8, fontWeight: '800', color: '#6a8a6e', textAlign: 'center' }}>{f.name}</Text>
                    : <Text style={{ fontSize: 8, fontWeight: '800', color: '#b0b0b0' }}>{isNext ? `再${5-doneDays}天` : '🔒'}</Text>}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.greenBg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '900', color: '#1a2a1e' },
  sub: { fontSize: 12, color: '#8aaa90', marginTop: 3 },
  streakBadge: { backgroundColor: '#ff9a56', borderRadius: 12, paddingVertical: 7, paddingHorizontal: 12, alignItems: 'center' },
  streakNum: { fontSize: 20, fontWeight: '900', color: '#fff', lineHeight: 22 },
  streakLbl: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,.85)' },
  scroll: { padding: 16, gap: 14, paddingBottom: 100 },
  sectionLabel: { fontSize: 11, fontWeight: '900', color: '#8aaa90', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12 },
  plantCard: { backgroundColor: Colors.card, borderRadius: 24, padding: 18, ...Shadow.card },
  stagesRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 2, marginBottom: 14 },
  stage: { flex: 1, alignItems: 'center', gap: 5 },
  stageEmoji: { fontSize: 28 },
  stageDot: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  stageDotText: { fontSize: 9, fontWeight: '900', color: '#fff' },
  stageLbl: { fontSize: 9, fontWeight: '800', color: '#8aaa90' },
  progInfo: { backgroundColor: '#f0fff4', borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  daysLeft: { alignItems: 'center', minWidth: 52 },
  daysNum: { fontSize: 22, fontWeight: '900', color: '#1a2a1e' },
  daysLbl: { fontSize: 10, color: '#8aaa90' },
  progLbl: { fontSize: 12, fontWeight: '800', color: '#1a2a1e' },
  progBar: { height: 9, backgroundColor: '#d0e8d4', borderRadius: 99, overflow: 'hidden' },
  progFill: { height: '100%', backgroundColor: Colors.green, borderRadius: 99 },
  histCard: { backgroundColor: Colors.card, borderRadius: 18, padding: 14, ...Shadow.card },
  collCard: { backgroundColor: Colors.card, borderRadius: 22, padding: 16, ...Shadow.card },
  flowerSlot: { width: '22%', aspectRatio: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 3, borderWidth: 2 },
  flowerUnlocked: { backgroundColor: '#f8fff8', borderColor: '#b8e8c0' },
  flowerLocked: { backgroundColor: '#f4f4f4', borderColor: '#e8e8e8' },
});
