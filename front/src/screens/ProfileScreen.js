// src/screens/ProfileScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Switch, Alert, Image, Animated, Modal } from 'react-native';
import { useApp } from '../context/AppContext';
import { colors, ACTIVITY_LEVELS, calcWaterGoal } from '../constants/theme';

const { blue: BLUE, blueDark: BLUE_DARK, blueLight: BLUE_LIGHT, text: TEXT, muted: MUTED, border: BORDER, card: CARD, bg: BG } = colors;

const URINE_COLORS = ['#fff7c0','#ffe980','#f5c842','#d4a017','#a87000','#6b4500'];
const URINE_LABELS = ['淺黃 → 補水充足','淡黃 → 正常','黃色 → 建議多喝','深黃 → 補水不足','琥珀 → 嚴重缺水','深褐 → 請就醫'];

const ACTIVITY_INFO = [
  { label: '久坐', desc: '幾乎不運動，整天坐著工作或休息' },
  { label: '輕度', desc: '每週 1–2 次輕鬆散步或瑜珈' },
  { label: '中度', desc: '每週 3–4 次 30 分鐘有氧或健走' },
  { label: '高度', desc: '每週 5 次以上激烈運動或勞動工作' },
];

function Seg({ label, sel, onPress }) {
  return (
    <TouchableOpacity style={[s.seg, sel && s.segSel]} onPress={onPress} activeOpacity={0.75}>
      <Text style={[s.segTxt, sel && s.segTxtSel]}>{label}</Text>
    </TouchableOpacity>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

function RippleRing({ delay }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 2600, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const scale   = anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] });
  const opacity = anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.5, 0] });
  return <Animated.View style={[s.rippleRing, { transform: [{ scale }], opacity }]} />;
}

export default function ProfileScreen() {
  const { profile, updateProfile, goalMl } = useApp();
  const [editing, setEditing] = useState(false);
  const [urineIdx, setUrineIdx] = useState(0);
  const [showActivityInfo, setShowActivityInfo] = useState(false);

  const [name,             setName]             = useState(profile.name);
  const [gender,           setGender]           = useState(profile.gender);
  const [weight,           setWeight]           = useState(String(profile.weight));
  const [age,              setAge]              = useState(String(profile.age));
  const [activity,         setActivity]         = useState(profile.activity);
  const [customGoal,       setCustomGoal]       = useState(profile.customGoal);
  const [customGoalMl,     setCustomGoalMl]     = useState(String(profile.goalMl));
  const [reminderInterval, setReminderInterval] = useState(String(profile.reminderInterval));
  const [autoMode,         setAutoMode]         = useState(profile.autoMode);
  const [autoStart,        setAutoStart]        = useState(profile.autoStart);
  const [autoEnd,          setAutoEnd]          = useState(profile.autoEnd);
  const [hasCoaster,       setHasCoaster]       = useState(profile.hasCoaster);

  const suggestedGoal = calcWaterGoal({ gender, weight: parseFloat(weight)||65, age: parseFloat(age)||28, activity });

  function handleSave() {
    updateProfile({
      name, gender,
      weight: parseFloat(weight)||65,
      age: parseFloat(age)||28,
      activity,
      goalMl: customGoal ? Math.max(parseInt(customGoalMl)||suggestedGoal, suggestedGoal) : suggestedGoal,
      reminderInterval: parseInt(reminderInterval)||60,
      autoMode, autoStart, autoEnd, hasCoaster,
    });
    setEditing(false);
    Alert.alert('儲存成功', '個人資料已更新');
  }

  const ActivityInfoModal = (
    <Modal visible={showActivityInfo} transparent animationType="fade">
      <TouchableOpacity style={s.actOverlay} activeOpacity={1} onPress={() => setShowActivityInfo(false)}>
        <View style={s.actModal}>
          <Text style={s.actTitle}>活動量標準</Text>
          {ACTIVITY_INFO.map(a => (
            <View key={a.label} style={s.actRow}>
              <Text style={s.actLabel}>{a.label}</Text>
              <Text style={s.actDesc}>{a.desc}</Text>
            </View>
          ))}
          <TouchableOpacity style={s.actClose} onPress={() => setShowActivityInfo(false)}>
            <Text style={s.actCloseTxt}>了解了</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // ── 檢視模式 ─────────────────────────────────────────
  if (!editing) return (
    <SafeAreaView style={s.safe}>
      {ActivityInfoModal}
      
      <ScrollView contentContainerStyle={s.inner} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View style={s.rippleWrap}>
            <RippleRing delay={0} />
            <RippleRing delay={800} />
            <RippleRing delay={1600} />
            <Image source={profile.selectedCup?.image} style={{ width: 80, height: 80 }} resizeMode="contain" />
          </View>
        </View>

        <View style={s.group}>
          <Text style={s.groupTitle}>基本資料</Text>
          <InfoRow label="姓名"   value={profile.name || '沒有填名字的小呆呆'} />
          <InfoRow label="性別"   value={profile.gender === 'male' ? '生理男' : '生理女'} />
          <InfoRow label="體重"   value={`${profile.weight} kg`} />
          <InfoRow label="年齡"   value={`${profile.age} 歲`} />
          <InfoRow label="活動量" value={ACTIVITY_LEVELS.find(a => a.key === profile.activity)?.label || '-'} />
        </View>

        <View style={s.group}>
          <Text style={s.groupTitle}>飲水設定</Text>
          <InfoRow label="每日目標" value={`${goalMl} ml`} />
          <InfoRow label="提醒間距" value={`${profile.reminderInterval} 分鐘`} />
          <InfoRow label="記錄模式" value={profile.autoMode ? '自動' : '手動'} />
          {profile.autoMode && (
            <InfoRow label="記錄時段" value={`${profile.autoStart} – ${profile.autoEnd}`} />
          )}
          <InfoRow label="智慧杯墊" value={profile.hasCoaster ? '已連接' : '未連接'} />
        </View>

        <View style={s.urineCard}>
          <Text style={s.urineTitle}>今日尿液顏色</Text>
          <Text style={s.urineSub}>幫助系統微調明日補水目標（可選填）</Text>
          <View style={s.urineScale}>
            {URINE_COLORS.map((c, i) => (
              <TouchableOpacity key={i}
                style={[s.urineSwatch, { backgroundColor: c }, urineIdx === i && s.urineSwatchSel]}
                onPress={() => setUrineIdx(i)} activeOpacity={0.75} />
            ))}
          </View>
          <Text style={s.urineLabel}>{URINE_LABELS[urineIdx]}</Text>
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );

  // ── 編輯模式 ─────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      {ActivityInfoModal}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.inner}
        showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={s.editHeader}>
          <TouchableOpacity onPress={() => setEditing(false)}>
            <Text style={s.cancelTxt}>取消</Text>
          </TouchableOpacity>
          <Text style={s.editTitle}>編輯資料</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={s.saveTxt}>儲存</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.lbl}>姓名</Text>
        <TextInput style={s.inp} value={name} onChangeText={setName} />

        <Text style={s.lbl}>生理性別</Text>
        <View style={s.segRow}>
          <Seg label="生理男" sel={gender==='male'}   onPress={() => setGender('male')} />
          <Seg label="生理女" sel={gender==='female'} onPress={() => setGender('female')} />
        </View>

        <View style={s.twoCol}>
          <View style={s.col}>
            <Text style={s.lbl}>體重 (kg)</Text>
            <TextInput style={s.inp} keyboardType="numeric" value={weight} onChangeText={setWeight} />
          </View>
          <View style={s.col}>
            <Text style={s.lbl}>年齡</Text>
            <TextInput style={s.inp} keyboardType="numeric" value={age} onChangeText={setAge} />
          </View>
        </View>

        {/* 活動量 + 問號 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={s.lbl}>活動量</Text>
          <TouchableOpacity onPress={() => setShowActivityInfo(true)} activeOpacity={0.75}>
            <View style={s.infoBtn}>
              <Text style={s.infoBtnTxt}>?</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={s.segGrid}>
          {ACTIVITY_LEVELS.map(a => (
            <TouchableOpacity key={a.key}
              style={[s.seg, activity===a.key && s.segSel, s.segHalf]}
              onPress={() => setActivity(a.key)} activeOpacity={0.75}>
              <Text style={[s.segTxt, activity===a.key && s.segTxtSel]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.goalBox}>
          <View style={s.goalHeader}>
            <View>
              <Text style={s.goalTitle}>每日飲水目標</Text>
              <Text style={s.goalSub}>建議值：{suggestedGoal} ml</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: MUTED }}>自訂</Text>
              <Switch value={customGoal} onValueChange={setCustomGoal} trackColor={{ true: BLUE }} />
            </View>
          </View>
          {customGoal ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TextInput style={[s.inp, { flex: 1 }]} keyboardType="numeric"
                value={customGoalMl} onChangeText={setCustomGoalMl} />
              <Text style={{ color: MUTED, fontWeight: '800' }}>ml</Text>
            </View>
          ) : (
            <Text style={s.goalFinal}>{suggestedGoal} ml</Text>
          )}
        </View>

        <Text style={s.lbl}>提醒時間間距（分鐘）</Text>
        <View style={s.segRow}>
          {['30','45','60','90'].map(v => (
            <TouchableOpacity key={v}
              style={[s.seg, reminderInterval===v && s.segSel]}
              onPress={() => setReminderInterval(v)} activeOpacity={0.75}>
              <Text style={[s.segTxt, reminderInterval===v && s.segTxtSel]}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.switchTitle}>我有智慧杯墊</Text>
          </View>
          <Switch value={hasCoaster} onValueChange={setHasCoaster} trackColor={{ true: BLUE }} />
        </View>

        <View style={[s.switchRow, !hasCoaster && { opacity: 0.5 }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.switchTitle}>自動記錄模式</Text>
          </View>
          <Switch value={autoMode && hasCoaster} onValueChange={hasCoaster ? setAutoMode : null}
            disabled={!hasCoaster} trackColor={{ true: BLUE }} />
        </View>

        {autoMode && hasCoaster && (
          <View style={s.timeBox}>
            <Text style={s.lbl}>自動記錄時段</Text>
            <View style={s.timeRow}>
              <View style={s.timeItem}>
                <Text style={s.timeLbl}>開始</Text>
                <TextInput style={s.timeInp} value={autoStart} onChangeText={setAutoStart} />
              </View>
              <Text style={s.timeSep}>—</Text>
              <View style={s.timeItem}>
                <Text style={s.timeLbl}>結束</Text>
                <TextInput style={s.timeInp} value={autoEnd} onChangeText={setAutoEnd} />
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: BG },
  inner: { padding: 20, paddingTop: 56, paddingBottom: 32, gap: 14 },

  rippleWrap: { width: 130, height: 130, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  rippleRing: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: '#5ab4f5' },
  header:   { alignItems: 'center', gap: 6, paddingVertical: 8 },
  userName: { fontSize: 22, fontWeight: '900', color: TEXT },
  userTag:  { fontSize: 13, color: BLUE, fontWeight: '700' },

  group:      { backgroundColor: CARD, borderRadius: 20, overflow: 'hidden' },
  groupTitle: { fontSize: 14, fontWeight: '900', color: TEXT, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 },
  infoRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 13, borderTopWidth: 1, borderTopColor: '#f0f5fa', gap: 12 },
  infoLabel:  { flex: 1, fontSize: 15, color: '#6b8da8', fontWeight: '600' },
  infoValue:  { fontSize: 15, fontWeight: '800', color: TEXT },

  urineCard:     { backgroundColor: CARD, borderRadius: 20, padding: 16, gap: 8 },
  urineTitle:    { fontSize: 14, fontWeight: '900', color: TEXT },
  urineSub:      { fontSize: 12, color: MUTED },
  urineScale:    { flexDirection: 'row', gap: 5 },
  urineSwatch:   { flex: 1, height: 28, borderRadius: 7, borderWidth: 3, borderColor: 'transparent' },
  urineSwatchSel:{ borderColor: '#1a2a3a' },
  urineLabel:    { fontSize: 12, fontWeight: '800', color: MUTED, textAlign: 'center' },

  editBtn:    { backgroundColor: BLUE, paddingVertical: 17, borderRadius: 16, alignItems: 'center' },
  editBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '900' },
  editHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  editTitle:  { fontSize: 18, fontWeight: '900', color: TEXT },
  cancelTxt:  { fontSize: 16, color: MUTED, fontWeight: '700' },
  saveTxt:    { fontSize: 16, color: BLUE, fontWeight: '900' },

  lbl:    { fontSize: 11, fontWeight: '800', color: '#5a7a96', textTransform: 'uppercase', letterSpacing: 0.7 },
  inp:    { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, borderWidth: 2, borderColor: BORDER, fontSize: 16, fontWeight: '700', color: TEXT, backgroundColor: '#f6fafd' },
  twoCol: { flexDirection: 'row', gap: 12 },
  col:    { flex: 1, gap: 6 },
  segRow: { flexDirection: 'row', gap: 8 },
  segGrid:{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  seg:    { flex: 1, paddingVertical: 13, borderRadius: 13, borderWidth: 2, borderColor: BORDER, backgroundColor: '#f6fafd', alignItems: 'center' },
  segSel: { borderColor: BLUE, backgroundColor: BLUE_LIGHT },
  segHalf:{ minWidth: '47%' },
  segTxt: { fontSize: 14, fontWeight: '800', color: '#6b8da8' },
  segTxtSel: { color: BLUE_DARK },

  goalBox:    { backgroundColor: '#eaf6ff', borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: '#bde0f8', gap: 10 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalTitle:  { fontSize: 15, fontWeight: '900', color: TEXT },
  goalSub:    { fontSize: 12, color: MUTED },
  goalFinal:  { fontSize: 28, fontWeight: '900', color: BLUE, textAlign: 'center' },

  switchRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f6fafd', borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: BORDER },
  switchTitle: { fontSize: 15, fontWeight: '800', color: TEXT },

  timeBox:  { backgroundColor: '#f6fafd', borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: BORDER, gap: 10 },
  timeRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timeItem: { flex: 1, gap: 4 },
  timeLbl:  { fontSize: 11, color: MUTED, fontWeight: '800' },
  timeInp:  { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 2, borderColor: BORDER, fontSize: 18, fontWeight: '900', color: TEXT, textAlign: 'center', backgroundColor: '#fff' },
  timeSep:  { fontSize: 20, color: MUTED, fontWeight: '900' },

  infoBtn:     { width: 18, height: 18, borderRadius: 9, backgroundColor: '#d0e8f8', alignItems: 'center', justifyContent: 'center' },
  infoBtnTxt:  { fontSize: 11, fontWeight: '900', color: '#3a90d4' },
  actOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  actModal:    { backgroundColor: '#fff', borderRadius: 22, padding: 22, width: '100%', gap: 12 },
  actTitle:    { fontSize: 17, fontWeight: '900', color: '#1a2a3a', marginBottom: 4 },
  actRow:      { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f0f5fa' },
  actLabel:    { fontSize: 13, fontWeight: '900', color: '#3a90d4', width: 36 },
  actDesc:     { fontSize: 13, color: '#4a6a84', flex: 1, lineHeight: 20 },
  actClose:    { backgroundColor: '#5ab4f5', paddingVertical: 12, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  actCloseTxt: { color: '#fff', fontSize: 15, fontWeight: '900' },
});