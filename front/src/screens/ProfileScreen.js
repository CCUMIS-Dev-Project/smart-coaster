import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Image, Animated, Modal, ActivityIndicator, Alert, Keyboard, Dimensions } from 'react-native';
import { useApp } from '../context/AppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, ACTIVITY_LEVELS, calcWaterGoal } from '../constants/theme';
import apiService from '../services/api';
import useBLE from '../hooks/useBLE';
import { scheduleWaterReminder } from '../utils/notifications';

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

// 自訂 Switch：thumb 永遠白色，跨平台一致（RN Web 的 thumbColor 無效）
function CustomSwitch({ value, onValueChange, disabled }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => !disabled && onValueChange && onValueChange(!value)}
      style={{
        width: 50, height: 28, borderRadius: 14,
        backgroundColor: value ? BLUE : '#cdd8e3',
        justifyContent: 'center', paddingHorizontal: 2,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <View style={{
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: '#fff',
        alignSelf: value ? 'flex-end' : 'flex-start',
        elevation: 3,
      }} />
    </TouchableOpacity>
  );
}

// 時間輸入：HH 與 MM 分開，中間 ":" 固定不可刪
function TimeInput({ value, onChange, style }) {
  const mmRef = useRef(null);
  const parts = (value || '').split(':');
  const hh = parts[0] ?? '';
  const mm = parts[1] ?? '';
  const onH = v => {
    const digits = v.replace(/\D/g, '').slice(0, 2);
    onChange(`${digits}:${mm}`);
    if (digits.length === 2) mmRef.current?.focus();
  };
  const onM = v => onChange(`${hh}:${v.replace(/\D/g, '').slice(0, 2)}`);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
      <TextInput style={[style, { width: 54, textAlign: 'center', paddingHorizontal: 6 }]}
        value={hh} onChangeText={onH} keyboardType="numeric" maxLength={2}
        placeholder="hh" placeholderTextColor={MUTED} />
      <Text style={{ fontSize: 22, fontWeight: '900', color: '#4a6a84', marginHorizontal: 4 }}>:</Text>
      <TextInput ref={mmRef} style={[style, { width: 54, textAlign: 'center', paddingHorizontal: 6 }]}
        value={mm} onChangeText={onM} keyboardType="numeric" maxLength={2}
        placeholder="mm" placeholderTextColor={MUTED} />
    </View>
  );
}

// 登出按鈕（右下角淺灰文字，按下加深）
function LogoutButton() {
  const { logout } = useApp();
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const color = pressed ? '#555' : hovered ? '#999' : '#ccc';
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={logout}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      style={{ alignSelf:'center', paddingVertical: 8, paddingTop: 4}}
    >
      <Text style={{ fontSize: 13, fontWeight: '600', color }}>
        登出
      </Text>
    </TouchableOpacity>
  );
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

const ProfileScreen = () => {
  const { 
    profile, updateProfile, goalMl, exerciseLevels, 
    token,scanAndConnect, stopScan, connectedDevice, bleData, writeToDevice,
    nextReminderAt, setNextReminderAt, 
  } = useApp();
  const insets = useSafeAreaInsets();
  const [urineIdx, setUrineIdx] = useState(0);
  const [showUrineInfo, setShowUrineInfo] = useState(false);
  const [showActivityInfo, setShowActivityInfo] = useState(false);

  // 個別編輯 modal 狀態
  const [editField, setEditField] = useState(null); // 'name'|'gender'|'weight'|'age'|'activity'|'goal'|'reminder'|'coaster'
  const [tempVal, setTempVal] = useState('');
  const [fieldError, setFieldError] = useState(''); // inline 驗證錯誤訊息
  const [tempGender, setTempGender] = useState(profile.gender);
  const [tempActivity, setTempActivity] = useState(profile.activity);
  const [tempCustomGoal, setTempCustomGoal] = useState(profile.customGoal);
  const [tempCustomGoalMl, setTempCustomGoalMl] = useState(String(profile.goalMl));
  const [tempHasCoaster, setTempHasCoaster] = useState(profile.hasCoaster);
  const [tempAutoStart, setTempAutoStart] = useState(profile.autoStart);
  const [tempAutoEnd, setTempAutoEnd] = useState(profile.autoEnd);

  // BLE 掃描（杯墊設定用）
  // const { scanAndConnect, stopScan, connectedDevice } = useBLE(token);
  const [isCoasterScanning, setIsCoasterScanning] = useState(false);
  const scanTimeoutRef = useRef(null);
  const connectedRef   = useRef(null);

  // 提醒計時
  const [reminderCountdown, setReminderCountdown] = useState('');

  useEffect(() => {
    if (!nextReminderAt) { setReminderCountdown(''); return; }
    function tick() {
      const diff = Math.max(0, Math.round((nextReminderAt - Date.now()) / 1000));
      const m = Math.floor(diff / 60);
      const s = diff % 60;
      setReminderCountdown(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextReminderAt]);

  useEffect(() => {
    connectedRef.current = connectedDevice;
    if (connectedDevice && isCoasterScanning) {
      clearTimeout(scanTimeoutRef.current);
      setIsCoasterScanning(false);
      setTempHasCoaster(true);
    }
  }, [connectedDevice]);

  useEffect(() => () => clearTimeout(scanTimeoutRef.current), []);

  const [kbHeight, setKbHeight] = useState(0);
  const [baseH] = useState(() => Dimensions.get('window').height);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKbHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKbHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const handleCoasterSwitchToggle = (val) => {
    if (!val) {
      clearTimeout(scanTimeoutRef.current);
      stopScan?.();
      setIsCoasterScanning(false);
      setTempHasCoaster(false);
      return;
    }
    setIsCoasterScanning(true);
    scanAndConnect?.();
    scanTimeoutRef.current = setTimeout(() => {
      stopScan?.();
      setIsCoasterScanning(false);
      if (!connectedRef.current) {
        Alert.alert('未找到杯墊', '未偵測到附近的智慧杯墊，\n自動記錄功能未開啟');
      }
    }, 10000);
  };

  const suggestedGoal = calcWaterGoal({
    gender: tempGender,
    weight: parseFloat(profile.weight) || 65,
    age: parseFloat(profile.age) || 28,
    activity: tempActivity,
  });

  function openEdit(field) {
    setFieldError(''); // 開新欄位時清除上一次錯誤
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
      setTempAutoStart(profile.autoStart || '08:00');
      setTempAutoEnd(profile.autoEnd || '22:00');
    }
  }

  function saveField() {
    let update = {};
    // ── 姓名：不可空白 ──────────────────────────────────────────────
    if (editField === 'name') {
      if (!tempVal.trim()) {
        setFieldError('姓名不可為空，請輸入你的姓名或暱稱');
        return;
      }
      update = { name: tempVal.trim() };
    }
    // ── 體重：依年齡分層驗證 ─────────────────────────────────────
    if (editField === 'weight') {
      const w = parseFloat(tempVal);
      const curAge = parseFloat(profile.age) || 25;
      const minW = curAge < 13 ? 15 : curAge < 19 ? 30 : 40;
      const maxW = curAge < 13 ? 80 : curAge < 19 ? 120 : 150;
      if (!w || w < minW || w > maxW) {
        setFieldError(`體重需介於 ${minW}–${maxW} kg，若數值正確請諮詢醫師`);
        return;
      }
      update = { weight: w };
    }
    // ── 年齡：6–100 歲 ──────────────────────────────────────────
    if (editField === 'age') {
      const a = parseFloat(tempVal);
      if (!a || a < 6 || a > 100) {
        setFieldError('本系統適用年齡為 6–100 歲');
        return;
      }
      update = { age: a };
    }
    if (editField === 'reminder') {
      const r = parseInt(tempVal);
      if (!r || r < 1 || r > 120) {
        setFieldError('喝水習慣應少量多次！建議提醒間距為 1–120 分鐘');
        return;
      }
      update = { reminderInterval: r };
    }
    if (editField === 'gender') update = { gender: tempGender };
    if (editField === 'activity') update = { activity: tempActivity };
    if (editField === 'goal') {
      if (tempCustomGoal) {
        const goalVal = parseInt(tempCustomGoalMl);
        if (!isNaN(goalVal) && goalVal > 10000) {
          setFieldError('超過 10000 ml 可能導致水中毒，請重新設定目標');
          return;
        }
        if (!isNaN(goalVal) && goalVal < suggestedGoal) {
          setFieldError(`目標不能低於公式建議值 ${suggestedGoal} ml`);
          return;
        }
      }
      update = {
        customGoal: tempCustomGoal,
        goalMl: tempCustomGoal
          ? Math.max(parseInt(tempCustomGoalMl) || suggestedGoal, suggestedGoal)
          : suggestedGoal,
      };
    }
    if (editField === 'coaster') {
      if (tempHasCoaster) {
        const toMin = t => {
          const parts = (t || '').split(':');
          const h = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10);
          if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
          return h * 60 + m;
        };
        const startMin = toMin(tempAutoStart);
        const endMin   = toMin(tempAutoEnd);
        if (startMin === null || endMin === null) {
          setFieldError('時間無效：小時需為 00–23，分鐘需為 00–59');
          return;
        }
        if (startMin >= endMin) {
          setFieldError('結束時間必須晚於開始時間');
          return;
        }
      }
      const padT = t => {
        const [h, m] = (t || '').split(':');
        return `${(h || '0').padStart(2, '0')}:${(m || '0').padStart(2, '0')}`;
      };
      update = {
        hasCoaster: tempHasCoaster,
        autoMode: tempHasCoaster,
        autoStart: tempHasCoaster ? padT(tempAutoStart) : '08:00',
        autoEnd:   tempHasCoaster ? padT(tempAutoEnd)   : '22:00',
      };
    }
    updateProfile(update);

    // Phase B：基本資料回寫 → PATCH /users/me
    if (['name','gender','weight','age','activity'].includes(editField)) {
      const payload = { age: profile.age }; // age 目前後端必帶
      if (editField === 'name')     payload.username = update.name;
      if (editField === 'gender')   payload.gender   = update.gender === 'male' ? 'M' : 'F';
      if (editField === 'weight')   payload.weight   = update.weight;
      if (editField === 'age')      payload.age      = update.age;
      if (editField === 'activity') {
        const ACTIVITY_TO_LEVELID = { sedentary: 1, light: 2, moderate: 3, intense: 4 };
        payload.levelid = ACTIVITY_TO_LEVELID[update.activity];
      }
      apiService.updateProfile(payload, token);
      if (['gender', 'weight', 'age', 'activity'].includes(editField)) {
        const newFormula = calcWaterGoal({ ...profile, ...update });
        if (!profile.customGoal) {
          // 自動計算模式：公式結果直接同步
          updateProfile({ goalMl: newFormula });
          apiService.patchGoal({ daily_target: newFormula }, token);
        } else if (newFormula > profile.goalMl) {
          // 手動目標模式：公式上升超過手動目標時，自動抬高至公式值
          updateProfile({ goalMl: newFormula });
          apiService.patchGoal({ daily_target: newFormula }, token);
        }
      }
    }
    // Phase C：飲水設定回寫 → PATCH /goals
    if (editField === 'goal') {
      apiService.patchGoal({ daily_target: update.goalMl }, token);
      // 若杯墊已連線，立即同步飲水目標給硬體
      if (connectedDevice && writeToDevice) {
        writeToDevice(`D|${update.goalMl}`);
      }
    }
    if (editField === 'coaster') {
      apiService.patchGoal({ act_start: update.autoStart, act_end: update.autoEnd }, token);
    }
    if (editField === 'reminder') {
      apiService.patchGoal({ rmd_interval: update.reminderInterval }, token);
      // 若杯墊已連線，立即同步提醒間隔給硬體
      if (connectedDevice && writeToDevice) {
        writeToDevice(`R|${update.reminderInterval}`);
      }

      // 新增：重設本地通知排程
      scheduleWaterReminder(update.reminderInterval)
        .then(ts => setNextReminderAt(ts));
    }

    setEditField(null);
  }

  // 個別欄位編輯 Modal 內容
  function renderEditModal() {
    if (!editField) return null;
    let title = '';
    let content = null;

    if (editField === 'name') {
      title = '編輯姓名';
      content = (
        <TextInput style={s.inp} value={tempVal} onChangeText={v => { setTempVal(v); setFieldError(''); }}
          placeholder="輸入姓名/暱稱" placeholderTextColor={MUTED} autoFocus />
      );
    }
    if (editField === 'weight') {
      title = '編輯體重';
      content = (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TextInput style={[s.inp, { flex: 1 }]} value={tempVal} onChangeText={v => { setTempVal(v); setFieldError(''); }}
            keyboardType="numeric" autoFocus />
          <Text style={{ color: MUTED, fontWeight: '800', fontSize: 16 }}>kg</Text>
        </View>
      );
    }
    if (editField === 'age') {
      title = '編輯年齡';
      content = (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TextInput style={[s.inp, { flex: 1 }]} value={tempVal} onChangeText={v => { setTempVal(v); setFieldError(''); }}
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
                onPress={() => { setTempVal(v); setFieldError(''); }} activeOpacity={0.75}>
                <Text style={[s.segTxt, tempVal === v && s.segTxtSel]}>{v}分</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <TextInput style={[s.inp, { flex: 1 }]} value={tempVal} onChangeText={v => { setTempVal(v); setFieldError(''); }}
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
          {/* row 1：建議值 ↔ Switch */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={s.goalTitle}>建議值</Text>
            <CustomSwitch value={tempCustomGoal} onValueChange={setTempCustomGoal} />
          </View>
          {/* row 2：ml 數字 ↔ 自訂文字（同行對齊） */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={s.goalSub}>{suggestedGoal} ml</Text>
            <Text style={{ fontSize: 11, color: tempCustomGoal ? BLUE_DARK : MUTED, fontWeight: '800' }}>
              自訂
            </Text>
          </View>
          <View style={{ minHeight: 72, justifyContent: 'center' }}>
            {tempCustomGoal ? (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TextInput style={[s.inp, { flex: 1 }]} keyboardType="numeric"
                    value={tempCustomGoalMl} onChangeText={setTempCustomGoalMl} maxLength={5} />
                  <Text style={{ color: MUTED, fontWeight: '800' }}>ml</Text>
                </View>
                {!!tempCustomGoalMl && parseInt(tempCustomGoalMl) < suggestedGoal && (
                  <Text style={{ fontSize: 11, color: '#f87171', fontWeight: '700', marginTop: 4 }}>
                    最低目標為建議值 {suggestedGoal} ml
                  </Text>
                )}
                {!!tempCustomGoalMl && parseInt(tempCustomGoalMl) > 10000 && (
                  <Text style={{ fontSize: 11, color: '#f87171', fontWeight: '700', marginTop: 4 }}>
                    ⚠ 超過 10000 ml 可能導致水中毒，請謹慎設定
                  </Text>
                )}
              </>
            ) : (
              <Text style={s.goalFinal}>{suggestedGoal} ml</Text>
            )}
          </View>
        </View>
      );
    }
    if (editField === 'coaster') {
      title = '智慧杯墊設定';
      content = (
        <View style={{ gap: 12 }}>
          <View style={s.switchRow}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.switchTitle}>智慧杯墊自動記錄</Text>
              <Text style={{ fontSize: 11, color: MUTED }}>
                {isCoasterScanning ? '正在掃描附近的智慧杯墊...' : '開啟後由杯墊感測喝水量，並設定記錄時段'}
              </Text>
            </View>
            {isCoasterScanning
              ? <ActivityIndicator size="small" color={BLUE} />
              : <CustomSwitch value={tempHasCoaster} onValueChange={handleCoasterSwitchToggle} />
            }
          </View>
          {tempHasCoaster && (
            <View style={s.timeBox}>
              <Text style={s.lbl}>自動記錄時段</Text>
              <View style={s.timeRow}>
                <View style={s.timeItem}>
                  <TimeInput value={tempAutoStart} onChange={setTempAutoStart} style={s.timeInp} />
                  <Text style={s.timeLbl}>開始</Text>
                </View>
                <Text style={s.timeSep}>—</Text>
                <View style={s.timeItem}>
                  <TimeInput value={tempAutoEnd} onChange={setTempAutoEnd} style={s.timeInp} />
                  <Text style={s.timeLbl}>結束</Text>
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
          <View style={[s.modalCard, {
            marginBottom: kbHeight > 0 ? kbHeight : 0,
            maxHeight: baseH - kbHeight - 16,
            paddingBottom: kbHeight > 0 ? 8 : insets.bottom + 24,
          }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={() => setEditField(null)}>
                <Text style={{ fontSize: 24, color: MUTED }}>×</Text>
              </TouchableOpacity>
            </View>
            {content}
            {/* inline 驗證錯誤，Alert 在 Modal 內無法顯示，改為內嵌紅字 */}
            {!!fieldError && (
              <Text style={{ fontSize: 12, color: '#f87171', fontWeight: '700', marginTop: 6 }}>
                ⚠ {fieldError}
              </Text>
            )}
            <TouchableOpacity
              style={[s.saveBtn, isCoasterScanning && { opacity: 0.5 }]}
              onPress={saveField}
              disabled={isCoasterScanning}
              activeOpacity={0.85}
            >
              <Text style={s.saveBtnTxt}>{isCoasterScanning ? '掃描中...' : '儲存'}</Text>
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
      {renderEditModal()}

      <ScrollView contentContainerStyle={s.inner} showsVerticalScrollIndicator={false}>
        {/* 頭部 */}
        <View style={s.header}>
          <View style={s.rippleWrap}>
            <RippleRing delay={0} />
            <RippleRing delay={800} />
            <RippleRing delay={1600} />
            {/* 頭像：有自訂杯子圖片用杯子圖，否則預設 icon.png */}
            <Image
              source={profile.selectedCup?.image ?? require('../assets/icon.png')}
              style={{ width: 120, height: 120 }}
              resizeMode="contain"
            />
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
          <EditableRow label="智慧杯墊" value={connectedDevice  ? '已連線' : '未連接'}
            onEdit={() => openEdit('coaster')} />
          <EditableRow label="每日目標" value={`${goalMl} ml`}
            onEdit={() => openEdit('goal')} />
          <EditableRow label="提醒間距" value={`${profile.reminderInterval} 分鐘`}
            onEdit={() => openEdit('reminder')} />
          {reminderCountdown ? (
            <View style={s.reminderCountRow}>
              <Text style={s.reminderCountTxt}>⏱ 距下次提醒：{reminderCountdown}</Text>
            </View>
          ) : null}
        </View>

        {/* 尿液顏色 */}
        <View style={s.urineCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={s.urineTitle}>今日尿液顏色</Text>
            <TouchableOpacity onPress={() => setShowUrineInfo(v => !v)}>
              <Text style={{ fontSize: 13, color: '#8aaac0' }}>ⓘ</Text>
            </TouchableOpacity>
          </View>
          {showUrineInfo && (
            <Text style={{ fontSize: 10, color: '#8aaac0' }}>
              參考來源：Armstrong Urine Color Scale
            </Text>
          )}
          <Text style={s.urineSub}>可透過尿液顏色去調整自己的喝水量喔！</Text>
          <View style={s.urineScale}>
            {URINE_COLORS.map((c, i) => (
              <TouchableOpacity key={i}
                style={[s.urineSwatch, { backgroundColor: c }, urineIdx === i && s.urineSwatchSel]}
                onPress={() => setUrineIdx(i)} activeOpacity={0.75} />
            ))}
          </View>
          <Text style={s.urineLabel}>{URINE_LABELS[urineIdx]}</Text>
        </View>

        <LogoutButton />
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
  urineCard:     { backgroundColor: CARD, borderRadius: 20, padding: 16, gap: 6 },
  urineTitle:    { fontSize: 14, fontWeight: '900', color: TEXT },
  urineSub:      { fontSize: 12, color: MUTED },
  urineScale:    { flexDirection: 'row', gap: 5 },
  urineSwatch:   { flex: 1, height: 28, borderRadius: 7, borderWidth: 3, borderColor: 'transparent' },
  urineSwatchSel:{ borderColor: '#1a2a3a' },
  urineLabel:    { fontSize: 12, fontWeight: '800', color: MUTED, textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard:    { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle:   { fontSize: 20, fontWeight: '900', color: TEXT },
  saveBtn:      { backgroundColor: BLUE, paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 4 },
  saveBtnTxt:   { color: '#fff', fontSize: 16, fontWeight: '900' },

  lbl:    { fontSize: 11, fontWeight: '800', color: '#5a7a96', textTransform: 'uppercase', letterSpacing: 0.7 },
  inp:    { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, borderWidth: 2, borderColor: BORDER, fontSize: 16, fontWeight: '700', color: TEXT, backgroundColor: '#f6fafd' },
  segRow: { flexDirection: 'row', gap: 8 },
  segGrid:{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  seg:    { flex: 1, paddingVertical: 13, borderRadius: 13, borderWidth: 2, borderColor: BORDER, backgroundColor: '#f6fafd', alignItems: 'center' },
  segSel: { borderColor: BLUE, backgroundColor: BLUE_LIGHT },
  segHalf:{ minWidth: '47%' },
  segTxt: { fontSize: 14, fontWeight: '800', color: '#6b8da8' },
  segTxtSel: { color: BLUE_DARK },

  goalBox:    { backgroundColor: '#eaf6ff', borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: '#bde0f8', gap: 10 },
  goalTitle:  { fontSize: 15, fontWeight: '900', color: TEXT },
  goalSub:    { fontSize: 12, color: MUTED },
  goalFinal:  { fontSize: 28, fontWeight: '900', color: BLUE, textAlign: 'center' },

  switchRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f6fafd', borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: BORDER, justifyContent: 'space-between' },
  switchTitle: { fontSize: 15, fontWeight: '800', color: TEXT },

  timeBox:  { backgroundColor: '#f6fafd', borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: BORDER, gap: 10 },
  timeRow:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 16 },
  timeItem: { gap: 4 },
  timeLbl:  { fontSize: 11, color: MUTED, fontWeight: '800', textAlign: 'left'},
  timeInp:  { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 2, borderColor: BORDER, fontSize: 18, fontWeight: '900', color: TEXT, textAlign: 'center', backgroundColor: '#fff' },
  timeSep:  { fontSize: 20, color: MUTED, fontWeight: '900', paddingTop: 11 },


  actOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  actModal:    { backgroundColor: '#fff', borderRadius: 22, padding: 22, width: '100%', gap: 12 },
  actTitle:    { fontSize: 17, fontWeight: '900', color: '#1a2a3a', marginBottom: 4 },
  actRow:      { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f0f5fa' },
  actLabel:    { fontSize: 13, fontWeight: '900', color: '#3a90d4', width: 36 },
  actDesc:     { fontSize: 13, color: '#4a6a84', flex: 1, lineHeight: 20 },
  actClose:    { backgroundColor: '#5ab4f5', paddingVertical: 12, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  actCloseTxt: { color: '#fff', fontSize: 15, fontWeight: '900' },
  reminderCountRow: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(174,226,255,0.2)',
    borderRadius: 8,
    marginHorizontal: 4,
    marginBottom: 4,
  },
  reminderCountTxt: {
    fontSize: 12,
    color: '#4AABDD',
    fontWeight: '700',
  },
});
export default ProfileScreen;