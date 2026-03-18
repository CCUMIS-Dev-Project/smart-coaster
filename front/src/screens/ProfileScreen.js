// src/screens/ProfileScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Switch, Alert
} from 'react-native';
import { useApp } from '../context/AppContext';
import { colors, ACTIVITY_LEVELS, calcWaterGoal } from '../constants/theme';

const { blue: BLUE, blueDark: BLUE_DARK, blueLight: BLUE_LIGHT, text: TEXT, muted: MUTED, border: BORDER, card: CARD, bg: BG } = colors;

function Seg({ label, sel, onPress }) {
  return (
    <TouchableOpacity style={[s.seg, sel && s.segSel]} onPress={onPress} activeOpacity={0.75}>
      <Text style={[s.segTxt, sel && s.segTxtSel]}>{label}</Text>
    </TouchableOpacity>
  );
}

function InfoRow({ label, value, icon }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoIcon}>{icon}</Text>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { profile, updateProfile, goalMl } = useApp();
  const [editing, setEditing] = useState(false);

  // Edit state
  const [name,     setName]     = useState(profile.name);
  const [gender,   setGender]   = useState(profile.gender);
  const [weight,   setWeight]   = useState(String(profile.weight));
  const [age,      setAge]      = useState(String(profile.age));
  const [activity, setActivity] = useState(profile.activity);
  const [customGoal, setCustomGoal] = useState(profile.customGoal);
  const [customGoalMl, setCustomGoalMl] = useState(String(profile.goalMl));
  const [reminderInterval, setReminderInterval] = useState(String(profile.reminderInterval));
  const [autoMode, setAutoMode] = useState(profile.autoMode);
  const [autoStart, setAutoStart] = useState(profile.autoStart);
  const [autoEnd,   setAutoEnd]   = useState(profile.autoEnd);
  const [hasCoaster, setHasCoaster] = useState(profile.hasCoaster);

  const suggestedGoal = calcWaterGoal({ gender, weight: parseFloat(weight)||65, age: parseFloat(age)||28, activity });

  function handleSave() {
    updateProfile({
      name, gender,
      weight: parseFloat(weight)||65,
      age: parseFloat(age)||28,
      activity,
      goalMl: customGoal ? (parseInt(customGoalMl)||suggestedGoal) : suggestedGoal,
      customGoal,
      reminderInterval: parseInt(reminderInterval)||60,
      autoMode,
      autoStart,
      autoEnd,
      hasCoaster,
    });
    setEditing(false);
    Alert.alert('儲存成功', '個人資料已更新');
  }

  if (!editing) return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.inner} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.avatarCircle}>
            <Text style={{ fontSize: 40 }}>☕</Text>
          </View>
          <Text style={s.userName}>{profile.name || '使用者'}</Text>
          <Text style={s.userTag}>健康飲水者</Text>
        </View>

        {/* 基本資料 */}
        <View style={s.group}>
          <Text style={s.groupTitle}>基本資料</Text>
          <InfoRow label="性別"   value={profile.gender === 'male' ? '生理男' : '生理女'} icon="👤" />
          <InfoRow label="體重"   value={`${profile.weight} kg`} icon="⚖️" />
          <InfoRow label="年齡"   value={`${profile.age} 歲`}    icon="🎂" />
          <InfoRow label="活動量" value={ACTIVITY_LEVELS.find(a => a.key === profile.activity)?.label || '-'} icon="🏃" />
        </View>

        {/* 飲水設定 */}
        <View style={s.group}>
          <Text style={s.groupTitle}>飲水設定</Text>
          <InfoRow label="每日目標"   value={`${goalMl} ml`}              icon="🎯" />
          <InfoRow label="提醒間距"   value={`${profile.reminderInterval} 分鐘`} icon="⏰" />
          <InfoRow label="記錄模式"   value={profile.autoMode ? '自動' : '手動'} icon="📱" />
          {profile.autoMode && (
            <InfoRow label="記錄時段" value={`${profile.autoStart} – ${profile.autoEnd}`} icon="🕐" />
          )}
          <InfoRow label="智慧杯墊"   value={profile.hasCoaster ? '已連接' : '未連接'} icon="☕" />
        </View>

        <TouchableOpacity style={s.editBtn} onPress={() => setEditing(true)} activeOpacity={0.85}>
          <Text style={s.editBtnTxt}>編輯個人資料</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );

  // ── 編輯模式 ──────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.inner} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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

        <Text style={s.lbl}>活動量</Text>
        <View style={s.segGrid}>
          {ACTIVITY_LEVELS.map(a => (
            <TouchableOpacity key={a.key} style={[s.seg, activity===a.key && s.segSel, s.segHalf]} onPress={() => setActivity(a.key)} activeOpacity={0.75}>
              <Text style={[s.segTxt, activity===a.key && s.segTxtSel]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 飲水目標 */}
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
              <TextInput style={[s.inp, { flex: 1 }]} keyboardType="numeric" value={customGoalMl} onChangeText={setCustomGoalMl} />
              <Text style={{ color: MUTED, fontWeight: '800' }}>ml</Text>
            </View>
          ) : (
            <Text style={s.goalFinal}>{suggestedGoal} ml</Text>
          )}
        </View>

        {/* 提醒間距 */}
        <Text style={s.lbl}>提醒時間間距（分鐘）</Text>
        <View style={s.segRow}>
          {['30','45','60','90'].map(v => (
            <TouchableOpacity key={v} style={[s.seg, reminderInterval===v && s.segSel]} onPress={() => setReminderInterval(v)} activeOpacity={0.75}>
              <Text style={[s.segTxt, reminderInterval===v && s.segTxtSel]}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 杯墊 */}
        <View style={s.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.switchTitle}>我有智慧杯墊</Text>
          </View>
          <Switch value={hasCoaster} onValueChange={setHasCoaster} trackColor={{ true: BLUE }} />
        </View>

        {/* 記錄模式 */}
        <View style={[s.switchRow, !hasCoaster && { opacity: 0.5 }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.switchTitle}>自動記錄模式</Text>
          </View>
          <Switch value={autoMode && hasCoaster} onValueChange={hasCoaster ? setAutoMode : null} disabled={!hasCoaster} trackColor={{ true: BLUE }} />
        </View>

        {/* 自動時段 */}
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

  header:      { alignItems: 'center', gap: 6, paddingVertical: 8 },
  avatarCircle:{ width: 90, height: 90, borderRadius: 45, backgroundColor: BLUE_LIGHT, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: BLUE },
  userName:    { fontSize: 22, fontWeight: '900', color: TEXT },
  userTag:     { fontSize: 13, color: BLUE, fontWeight: '700' },

  group:      { backgroundColor: CARD, borderRadius: 20, overflow: 'hidden' },
  groupTitle: { fontSize: 11, fontWeight: '900', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 },
  infoRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 13, borderTopWidth: 1, borderTopColor: '#f0f5fa', gap: 12 },
  infoIcon:   { fontSize: 18, width: 26, textAlign: 'center' },
  infoLabel:  { flex: 1, fontSize: 15, color: '#6b8da8', fontWeight: '600' },
  infoValue:  { fontSize: 15, fontWeight: '800', color: TEXT },

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
});
