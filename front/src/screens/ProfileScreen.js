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
  { label: '輕度', desc: '每週運動1–2次' },
  { label: '中度', desc: '每週運動3–4次' },
  { label: '高度', desc: '每週運動5次以上' },
  { label: '運動標準', desc: '一、感覺有點喘、說話稍費力，且持續時間超過 30 分鐘\n二、日均步數超過一萬步' },
];

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

// 可點擊編輯的資料列
function EditableRow({ label, value, onEdit }) {
  return (
    <TouchableOpacity style={s.infoRow} onPress={onEdit} activeOpacity={0.6}>
      <Text style={s.infoLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={s.infoValue}>{value}</Text>
        <Text style={{ color: '#ccc', fontSize: 16 }}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { profile, updateProfile, goalMl } = useApp();
  const [urineIdx, setUrineIdx] = useState(0);
  const [showActivityInfo, setShowActivityInfo] = useState(false);

  // 個別編輯 modal 狀態
  const [editField, setEditField] = useState(null); // 'name'|'gender'|'weight'|'age'|'activity'|'goal'|'reminder'|'coaster'
  const [tempVal, setTempVal] = useState('');
  const [tempGender, setTempGender] = useState(profile.gender);
  const [tempActivity, setTempActivity] = useState(profile.activity);
  const [tempCustomGoal, setTempCustomGoal] = useState(profile.customGoal);
  const [tempCustomGoalMl, setTempCustomGoalMl] = useState(String(profile.goalMl));
  const [tempHasCoaster, setTempHasCoaster] = useState(profile.hasCoaster);
  const [tempAutoMode, setTempAutoMode] = useState(profile.autoMode);
  const [tempAutoStart, setTempAutoStart] = useState(profile.autoStart);
  const [tempAutoEnd, setTempAutoEnd] = useState(profile.autoEnd);

  const suggestedGoal = calcWaterGoal({
    gender: tempGender,
    weight: parseFloat(profile.weight) || 65,
    age: parseFloat(profile.age) || 28,
    activity: tempActivity,
  });

  function openEdit(field) {
    setEditField(field);
    if (field === 'name') setTempVal(profile.name || '');
    if (field === 'weight') setTempVal(String(profile.weight));
    if (field === 'age') setTempVal(String(profile.age));
    if (field === 'reminder') setTempVal(String(profile.reminderInterval));
    if (field === 'gender') setTempGender(profile.gender);
    if (field === 'activity') setTempActivity(profile.activity);
    if (field === 'goal') {
      setTempCustomGoal(profile.customGoal);
      setTempCustomGoalMl(String(profile.goalMl));
    }
    if (field === 'coaster') {
      setTempHasCoaster(profile.hasCoaster);
      setTempAutoMode(profile.autoMode);
      setTempAutoStart(profile.autoStart);
      setTempAutoEnd(profile.autoEnd);
    }
  }

  function saveField() {
    let update = {};
    if (editField === 'name') {
      if (!tempVal.trim()) { Alert.alert('請輸入姓名'); return; }
      update = { name: tempVal.trim() };
    }
    if (editField === 'weight') update = { weight: parseFloat(tempVal) || profile.weight };
    if (editField === 'age') update = { age: parseFloat(tempVal) || profile.age };
    if (editField === 'reminder') update = { reminderInterval: parseInt(tempVal) || profile.reminderInterval };
    if (editField === 'gender') update = { gender: tempGender };
    if (editField === 'activity') update = { activity: tempActivity };
    if (editField === 'goal') {
      update = {
        customGoal: tempCustomGoal,
        goalMl: tempCustomGoal
          ? Math.max(parseInt(tempCustomGoalMl) || suggestedGoal, suggestedGoal)
          : suggestedGoal,
      };
    }
    if (editField === 'coaster') {
      update = {
        hasCoaster: tempHasCoaster,
        autoMode: tempAutoMode,
        autoStart: tempAutoStart,
        autoEnd: tempAutoEnd,
      };
    }
    updateProfile(update);
    setEditField(null);
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
            <Text style={s.actCloseTxt}>了解</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // 個別欄位編輯 Modal 內容
  function renderEditModal() {
    if (!editField) return null;
    let title = '';
    let content = null;

    if (editField === 'name') {
      title = '編輯姓名';
      content = (
        <TextInput style={s.inp} value={tempVal} onChangeText={setTempVal}
          placeholder="輸入姓名/暱稱" placeholderTextColor={MUTED} autoFocus />
      );
    }
    if (editField === 'weight') {
      title = '編輯體重';
      content = (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TextInput style={[s.inp, { flex: 1 }]} value={tempVal} onChangeText={setTempVal}
            keyboardType="numeric" autoFocus />
          <Text style={{ color: MUTED, fontWeight: '800', fontSize: 16 }}>kg</Text>
        </View>
      );
    }
    if (editField === 'age') {
      title = '編輯年齡';
      content = (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TextInput style={[s.inp, { flex: 1 }]} value={tempVal} onChangeText={setTempVal}
            keyboardType="numeric" autoFocus />
          <Text style={{ color: MUTED, fontWeight: '800', fontSize: 16 }}>歲</Text>
        </View>
      );
    }
    if (editField === 'reminder') {
      title = '提醒間距';
      content = (
        <>
          <View style={s.segRow}>
            {['30','45','60','90'].map(v => (
              <TouchableOpacity key={v}
                style={[s.seg, tempVal === v && s.segSel]}
                onPress={() => setTempVal(v)} activeOpacity={0.75}>
                <Text style={[s.segTxt, tempVal === v && s.segTxtSel]}>{v}分</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <TextInput style={[s.inp, { flex: 1 }]} value={tempVal} onChangeText={setTempVal}
              keyboardType="numeric" placeholder="自訂" placeholderTextColor={MUTED} />
            <Text style={{ color: MUTED, fontWeight: '800' }}>分鐘</Text>
          </View>
        </>
      );
    }
    if (editField === 'gender') {
      title = '編輯性別';
      content = (
        <View style={s.segRow}>
          {[{key:'male',label:'生理男'},{key:'female',label:'生理女'}].map(g => (
            <TouchableOpacity key={g.key}
              style={[s.seg, tempGender === g.key && s.segSel]}
              onPress={() => setTempGender(g.key)} activeOpacity={0.75}>
              <Text style={[s.segTxt, tempGender === g.key && s.segTxtSel]}>{g.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    if (editField === 'activity') {
      title = '編輯活動量';
      content = (
        <>
          <View style={s.segGrid}>
            {ACTIVITY_LEVELS.map(a => (
              <TouchableOpacity key={a.key}
                style={[s.seg, tempActivity === a.key && s.segSel, s.segHalf]}
                onPress={() => setTempActivity(a.key)} activeOpacity={0.75}>
                <Text style={[s.segTxt, tempActivity === a.key && s.segTxtSel]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={() => setShowActivityInfo(true)} style={{ marginTop: 8 }}>
            <Text style={{ color: BLUE, fontSize: 13, fontWeight: '800' }}>活動量標準說明</Text>
          </TouchableOpacity>
        </>
      );
    }
    if (editField === 'goal') {
      title = '每日飲水目標';
      content = (
        <View style={s.goalBox}>
          <View style={s.goalHeader}>
            <View>
              <Text style={s.goalTitle}>建議值</Text>
              <Text style={s.goalSub}>{suggestedGoal} ml</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: MUTED }}>自訂</Text>
              <Switch value={tempCustomGoal} onValueChange={setTempCustomGoal} trackColor={{ true: BLUE }} />
            </View>
          </View>
          {tempCustomGoal ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TextInput style={[s.inp, { flex: 1 }]} keyboardType="numeric"
                  value={tempCustomGoalMl} onChangeText={setTempCustomGoalMl} />
                <Text style={{ color: MUTED, fontWeight: '800' }}>ml</Text>
              </View>
              {!!tempCustomGoalMl && parseInt(tempCustomGoalMl) < suggestedGoal && (
                <Text style={{ fontSize: 11, color: '#f87171', fontWeight: '700' }}>
                  最低目標為建議值 {suggestedGoal} ml
                </Text>
              )}
            </>
          ) : (
            <Text style={s.goalFinal}>{suggestedGoal} ml</Text>
          )}
        </View>
      );
    }
    if (editField === 'coaster') {
      title = '智慧杯墊設定';
      content = (
        <View style={{ gap: 12 }}>
          <View style={s.switchRow}>
            <Text style={s.switchTitle}>我有智慧杯墊</Text>
            <Switch value={tempHasCoaster} onValueChange={setTempHasCoaster} trackColor={{ true: BLUE }} />
          </View>
          <View style={[s.switchRow, !tempHasCoaster && { opacity: 0.45 }]}>
            <Text style={s.switchTitle}>自動記錄模式</Text>
            <Switch value={tempAutoMode && tempHasCoaster}
              onValueChange={tempHasCoaster ? setTempAutoMode : null}
              disabled={!tempHasCoaster} trackColor={{ true: BLUE }} />
          </View>
          {tempAutoMode && tempHasCoaster && (
            <View style={s.timeBox}>
              <Text style={s.lbl}>自動記錄時段</Text>
              <View style={s.timeRow}>
                <View style={s.timeItem}>
                  <Text style={s.timeLbl}>開始</Text>
                  <TextInput style={s.timeInp} value={tempAutoStart} onChangeText={setTempAutoStart} />
                </View>
                <Text style={s.timeSep}>—</Text>
                <View style={s.timeItem}>
                  <Text style={s.timeLbl}>結束</Text>
                  <TextInput style={s.timeInp} value={tempAutoEnd} onChangeText={setTempAutoEnd} />
                </View>
              </View>
            </View>
          )}
        </View>
      );
    }

    return (
      <Modal visible={!!editField} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={() => setEditField(null)}>
                <Text style={{ fontSize: 24, color: MUTED }}>×</Text>
              </TouchableOpacity>
            </View>
            {content}
            <TouchableOpacity style={s.saveBtn} onPress={saveField} activeOpacity={0.85}>
              <Text style={s.saveBtnTxt}>儲存</Text>
            </TouchableOpacity>
          </View>
        </View>
        {showActivityInfo && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
            <View style={s.actModal}>
              <Text style={s.actTitle}>活動量標準</Text>
              {ACTIVITY_INFO.map(a => (
                <View key={a.label} style={s.actRow}>
                  <Text style={s.actLabel}>{a.label}</Text>
                  <Text style={s.actDesc}>{a.desc}</Text>
                </View>
              ))}
              <TouchableOpacity style={s.actClose} onPress={() => setShowActivityInfo(false)}>
                <Text style={s.actCloseTxt}>了解</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      {ActivityInfoModal}
      {renderEditModal()}

      <ScrollView contentContainerStyle={s.inner} showsVerticalScrollIndicator={false}>
        {/* 頭部 */}
        <View style={s.header}>
          <View style={s.rippleWrap}>
            <RippleRing delay={0} />
            <RippleRing delay={800} />
            <RippleRing delay={1600} />
            <Image source={profile.selectedCup?.image} style={{ width: 80, height: 80 }} resizeMode="contain" />
          </View>
          {profile.name
            ? <Text style={s.userName}>{profile.name}</Text>
            : <TouchableOpacity onPress={() => openEdit('name')}>
                <Text style={{ color: BLUE, fontSize: 14, fontWeight: '800' }}>點此設定暱稱</Text>
              </TouchableOpacity>
          }
        </View>

        {/* 基本資料 */}
        <View style={s.group}>
          <Text style={s.groupTitle}>基本資料</Text>
          <EditableRow label="姓名"   value={profile.name || '未設定'}
            onEdit={() => openEdit('name')} />
          <EditableRow label="性別"   value={profile.gender === 'male' ? '生理男' : '生理女'}
            onEdit={() => openEdit('gender')} />
          <EditableRow label="體重"   value={`${profile.weight} kg`}
            onEdit={() => openEdit('weight')} />
          <EditableRow label="年齡"   value={`${profile.age} 歲`}
            onEdit={() => openEdit('age')} />
          <EditableRow label="活動量" value={ACTIVITY_LEVELS.find(a => a.key === profile.activity)?.label || '-'}
            onEdit={() => openEdit('activity')} />
        </View>

        {/* 飲水設定 */}
        <View style={s.group}>
          <Text style={s.groupTitle}>飲水設定</Text>
          <EditableRow label="每日目標" value={`${goalMl} ml`}
            onEdit={() => openEdit('goal')} />
          <EditableRow label="提醒間距" value={`${profile.reminderInterval} 分鐘`}
            onEdit={() => openEdit('reminder')} />
          <EditableRow label="智慧杯墊" value={profile.hasCoaster ? (profile.autoMode ? '自動記錄' : '手動記錄') : '未連接'}
            onEdit={() => openEdit('coaster')} />
        </View>

        {/* 尿液顏色 */}
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
}

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: BG },
  inner: { padding: 20, paddingTop: 56, paddingBottom: 32, gap: 14 },

  rippleWrap: { width: 130, height: 130, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  rippleRing: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: '#5ab4f5' },
  header:   { alignItems: 'center', gap: 6, paddingVertical: 8 },
  userName: { fontSize: 22, fontWeight: '900', color: TEXT },

  group:      { backgroundColor: CARD, borderRadius: 20, overflow: 'hidden' },
  groupTitle: { fontSize: 14, fontWeight: '900', color: TEXT, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 },
  infoRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 13, borderTopWidth: 1, borderTopColor: '#f0f5fa', gap: 12 },
  infoLabel:  { flex: 1, fontSize: 15, color: '#6b8da8', fontWeight: '600' },
  infoValue:  { fontSize: 15, fontWeight: '800', color: TEXT },
  editChip:   { backgroundColor: '#eaf3fc', borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10 },
  editChipTxt:{ fontSize: 12, fontWeight: '900', color: BLUE },

  urineCard:     { backgroundColor: CARD, borderRadius: 20, padding: 16, gap: 8 },
  urineTitle:    { fontSize: 14, fontWeight: '900', color: TEXT },
  urineSub:      { fontSize: 12, color: MUTED },
  urineScale:    { flexDirection: 'row', gap: 5 },
  urineSwatch:   { flex: 1, height: 28, borderRadius: 7, borderWidth: 3, borderColor: 'transparent' },
  urineSwatchSel:{ borderColor: '#1a2a3a' },
  urineLabel:    { fontSize: 12, fontWeight: '800', color: MUTED, textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard:    { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 16 },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle:   { fontSize: 20, fontWeight: '900', color: TEXT },
  saveBtn:      { backgroundColor: BLUE, paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 4 },
  saveBtnTxt:   { color: '#fff', fontSize: 16, fontWeight: '900' },

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

  switchRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f6fafd', borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: BORDER, justifyContent: 'space-between' },
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