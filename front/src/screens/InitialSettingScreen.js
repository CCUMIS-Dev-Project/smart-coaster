import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, Image, Modal, Alert, Pressable, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, ACTIVITY_LEVELS, CUPS, calcWaterGoal } from '../constants/theme';
import { useApp } from '../context/AppContext';
import apiService from '../services/api';
import useBLE from '../hooks/useBLE';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BLUE = colors.blue, BLUE_DARK = colors.blueDark, BLUE_LIGHT = colors.blueLight;
const TEXT = colors.text, MUTED = colors.muted, BORDER = colors.border;


const ACTIVITY_INFO = [
  { label: '久坐', desc: '幾乎不運動，整天坐著工作或休息' },
  { label: '輕度', desc: '每週運動1–2次' },
  { label: '中度', desc: '每週運動3–4次' },
  { label: '高度', desc: '每週運動5次以上' },
  { label: '運動標準', desc: '一、感覺有點喘、說話稍費力，且持續時間超過 30 分鐘\n二、日均步數超過一萬步' },
];

// 跨平台 Switch：thumb 永遠白色
function CustomSwitch({ value, onValueChange, disabled }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => !disabled && onValueChange && onValueChange(!value)}
      style={{
        width: 50, height: 28, borderRadius: 14,
        backgroundColor: value ? '#5ab4f5' : '#cdd8e3',
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

function Seg({ label, sel, onPress, half }) {
  return (
    <TouchableOpacity style={[s.seg, sel && s.segSel, half && s.segHalf]} onPress={onPress} activeOpacity={0.75}>
      <Text style={[s.segTxt, sel && s.segTxtSel]}>{label}</Text>
    </TouchableOpacity>
  );
}

const toMin = t => {
  const parts = (t || '').split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
};

const InitialSettingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const { username, password } = route.params || {};
  const { completeSetup, updateProfile, setToken } = useApp();
  const [step, setStep] = useState(2);

  // 個人資料
  const [gender,       setGender]       = useState('F');
  const [weight,       setWeight]       = useState('');
  const [age,          setAge]          = useState('');
  const [activity,     setActivity]     = useState('sedentary');
  const [customGoal,   setCustomGoal]   = useState(false);
  const [customGoalMl, setCustomGoalMl] = useState('');

  // 水杯選擇
  const [activeCup, setActiveCup] = useState(CUPS[3]);

  // 提醒設定
  const [reminderInterval, setReminderInterval] = useState('60');
  const [autoStart,  setAutoStart]  = useState('08:00');
  const [autoEnd,    setAutoEnd]    = useState('22:00');
  const [hasCoaster, setHasCoaster] = useState(false);

  // BLE
  const { scanAndConnect, stopScan, connectedDevice } = useBLE(null);
  const [isScanning, setIsScanning] = useState(false);
  const scanTimeoutRef = useRef(null);
  const connectedRef = useRef(null);

  // 監聽裝置連線狀態
  useEffect(() => {
    connectedRef.current = connectedDevice;
    if (connectedDevice && isScanning) {
      clearTimeout(scanTimeoutRef.current);
      setIsScanning(false);
      setHasCoaster(true); // 真的找到才開啟
    }
  }, [connectedDevice]);

  // 離開頁面時清除 timeout
  useEffect(() => {
    return () => { clearTimeout(scanTimeoutRef.current); };
  }, []);

  const handleCoasterToggle = (val) => {
    setFieldError('');
    if (!val) {
      clearTimeout(scanTimeoutRef.current);
      stopScan?.();
      setIsScanning(false);
      setHasCoaster(false);
      return;
    }
    // 開始掃描，hasCoaster 保持 false，找到才設 true
    setIsScanning(true);
    scanAndConnect?.();
    scanTimeoutRef.current = setTimeout(() => {
      stopScan?.();
      setIsScanning(false);
      if (!connectedRef.current) {
        // hasCoaster 維持 false，不需要另外設
        Alert.alert('未找到杯墊', '未偵測到附近的智慧杯墊，\n自動記錄功能未開啟');
      }
    }, 10000);
  };

  const handleCancelScan = () => {
    clearTimeout(scanTimeoutRef.current);
    stopScan?.();
    setIsScanning(false);
    setHasCoaster(false);
  };

  // UI 狀態
  const [showActivityInfo, setShowActivityInfo] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const hasValidInputs = weight.trim() !== '' && age.trim() !== '';
  const suggestedGoal = hasValidInputs
    ? calcWaterGoal({ gender, weight: parseFloat(weight), age: parseFloat(age), activity })
    : null;
  const finalGoal = customGoal
    ? (suggestedGoal !== null
        ? Math.max(parseInt(customGoalMl) || suggestedGoal, suggestedGoal)
        : (parseInt(customGoalMl) || null))
    : suggestedGoal;

  // ── 驗證：Step 2 ────────────────────────────────────────
  const validateStep2 = () => {
    if (!weight.trim()) { setFieldError('請輸入體重'); return false; }
    const w = parseFloat(weight);
    if (isNaN(w)) { setFieldError('體重請輸入數字'); return false; }

    if (!age.trim()) { setFieldError('請輸入年齡'); return false; }
    const a = parseFloat(age);
    if (isNaN(a)) { setFieldError('年齡請輸入數字'); return false; }

    // 年齡硬擋
    if (a < 6)   { setFieldError('本系統適用年齡為 6 歲以上'); return false; }
    if (a > 100) { setFieldError('請確認年齡輸入是否正確'); return false; }

    // 體重範圍（依年齡分層）
    const minW = a < 13 ? 15 : a < 19 ? 30 : 40;
    const maxW = a < 13 ? 80 : a < 19 ? 120 : 150;
    if (w < minW || w > maxW) {
      setFieldError(`${Math.round(a)} 歲建議體重介於 ${minW}–${maxW} kg，若數值正確請諮詢醫師`);
      return false;
    }

    if (!activity) { setFieldError('請選擇活動量'); return false; }
    setFieldError('');

    // 軟警告（不擋關）
    if (a < 10) {
      Alert.alert('提醒', '6–9 歲建議由家長陪同完成設定');
    } else if (a >= 75) {
      Alert.alert('提醒', '75 歲以上飲水目標建議以醫師指示為準，本系統計算僅供參考');
    }

    return true;
  };

  // ── 驗證：Step 4 ────────────────────────────────────────
  const validateStep4 = () => {
    const r = parseInt(reminderInterval);
    if (!r || r < 1 || r > 120) {
      setFieldError('喝水習慣應少量多次！建議提醒間距為 1–120 分鐘');
      return false;
    }
    const startMin = toMin(autoStart);
    const endMin   = toMin(autoEnd);
    if (startMin === null || endMin === null) {
      setFieldError('時間格式無效：小時 00–23，分鐘 00–59');
      return false;
    }
    if (startMin >= endMin) {
      setFieldError('結束時間必須晚於開始時間');
      return false;
    }
    setFieldError('');
    return true;
  };

  // ── API 送出 ────────────────────────────────────────────
  const handleFinalSubmit = async () => {
    if (!validateStep4()) return;
    setSubmitting(true);
    try {
      const levelMapping = { sedentary: 1, light: 2, moderate: 3, intense: 4 };

      // 一次帶齊所有資料：後端 register 同時寫入 users + goals
      const registerResult = await apiService.register({
        username,
        password,
        gender,
        weight: parseFloat(weight),
        levelid: levelMapping[activity] || 1,
        age: parseInt(age),
        daily_target: finalGoal,
        rmd_interval: parseInt(reminderInterval) || 60,
        act_start: autoStart,
        act_end: autoEnd,
      });
      if (!registerResult.success) {
        const errMsg = registerResult.error === '使用者已存在'
          ? '此帳號已被使用，請換一個使用者名稱'
          : `註冊失敗：${registerResult.error}`;
        setFieldError(errMsg);
        setSubmitting(false);
        return;
      }

      const token = registerResult.data.access_token;
      if (!token) {
        setFieldError('註冊成功但未取得 token，請重新登入');
        setSubmitting(false);
        return;
      }

      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userId', registerResult.data.user_id.toString());
      await AsyncStorage.setItem('selectedCupName', activeCup.name);

      updateProfile({
        gender,
        weight: parseFloat(weight), age, activity,
        goalMl: finalGoal,
        selectedCup: { ...activeCup },
        reminderInterval: parseInt(reminderInterval) || 60,
        autoMode: hasCoaster, autoStart, autoEnd, hasCoaster,
      });
      completeSetup();
      setSubmitting(false);
      setToken(token);

    } catch (error) {
      console.error('設定流程發生錯誤:', error);
      setFieldError('系統發生問題，請稍後再試');
      setSubmitting(false);
    }
  };

  // ── 掃描杯墊 Modal ──────────────────────────────────────
  const ScanningModal = (
    <Modal visible={isScanning} transparent animationType="fade">
      <Pressable style={s.actOverlay} onPress={handleCancelScan}>
        <Pressable>
          <View style={[s.actModal, { alignItems: 'center', gap: 16, paddingVertical: 28 }]}>
            <Text style={[s.actTitle, { textAlign: 'center', marginBottom: 0 }]}>連接杯墊</Text>
            <ActivityIndicator size="large" color="#5ab4f5" />
            <Text style={{ color: MUTED, fontSize: 14, textAlign: 'center' }}>
              正在掃描附近的智慧杯墊...
            </Text>
            <TouchableOpacity style={[s.actClose, { marginTop: 0 }]} onPress={handleCancelScan}>
              <Text style={s.actCloseTxt}>取消</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  // ── 活動量說明 Modal ────────────────────────────────────
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

  // ── Step 2: 個人資料 ─────────────────────────────────
  if (step === 2) return (
    <SafeAreaView style={s.safeBg}>
      {ActivityInfoModal}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={s.scrollFull}
          contentContainerStyle={s.formInner}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ minHeight: winH - 160, gap: 14 }}>
            {/* 佔位：對齊 step 3/4 返回按鈕的高度 */}
            <View style={{ height: 44 }} />
            <Text style={s.pageTitle}>個人資料設定</Text>
            <Text style={s.pageSub}>幫你計算個人化每日補水目標</Text>

            <Text style={s.lbl}>生理性別</Text>
            <View style={s.segRow}>
              <Seg label="生理男" sel={gender === 'M'} onPress={() => setGender('M')} />
              <Seg label="生理女" sel={gender === 'F'} onPress={() => setGender('F')} />
            </View>

            <View style={s.twoCol}>
              <View style={s.col}>
                <Text style={s.lbl}>體重 (kg)</Text>
                <TextInput
                  style={s.inp}
                  keyboardType="numeric"
                  value={weight}
                  onChangeText={v => { setWeight(v); setFieldError(''); }}
                  placeholder="例：65"
                  placeholderTextColor={MUTED}
                />
              </View>
              <View style={s.col}>
                <Text style={s.lbl}>年齡</Text>
                <TextInput
                  style={s.inp}
                  keyboardType="numeric"
                  value={age}
                  onChangeText={v => { setAge(v); setFieldError(''); }}
                  placeholder="例：28"
                  placeholderTextColor={MUTED}
                />
              </View>
            </View>

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
                <Seg key={a.key} label={a.label} sel={activity === a.key}
                  onPress={() => setActivity(a.key)} half />
              ))}
            </View>

            <View style={s.goalBox}>
              <View style={s.goalHeader}>
                <View>
                  <Text style={s.goalTitle}>每日飲水目標</Text>
                  <Text style={s.goalSub}>建議值：{suggestedGoal !== null ? `${suggestedGoal} ml` : '---'}</Text>
                </View>
                <View style={{ alignItems: 'center', gap: 2 }}>
                  <Text style={{ fontSize: 11, color: MUTED }}>自訂</Text>
                  <CustomSwitch value={customGoal} onValueChange={setCustomGoal} />
                </View>
              </View>
              {customGoal ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TextInput
                      style={[s.inp, { flex: 1 }]}
                      keyboardType="numeric"
                      value={customGoalMl}
                      onChangeText={setCustomGoalMl}
                      placeholder={suggestedGoal !== null ? String(suggestedGoal) : '---'}
                      placeholderTextColor={MUTED}
                    />
                    <Text style={s.mlUnit}>ml</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: '#f87171', fontWeight: '700', minHeight: 16 }}>
                    {!!customGoalMl && suggestedGoal !== null && parseInt(customGoalMl) < suggestedGoal
                      ? `最低目標為建議值 ${suggestedGoal} ml`
                      : ''}
                  </Text>
                </>
              ) : (
                <Text style={s.goalFinal}>
                  {suggestedGoal !== null ? `${suggestedGoal} ml` : '---'}
                </Text>
              )}
            </View>

            <Text style={s.fieldError}>{fieldError ? `⚠ ${fieldError}` : ''}</Text>
          </View>

          <View style={{ paddingBottom: insets.bottom + 16 }}>
            <TouchableOpacity
              style={s.btn}
              onPress={() => { if (validateStep2()) { setFieldError(''); setStep(3); } }}
              activeOpacity={0.85}
            >
              <Text style={s.btnTxt}>選擇我的水杯 →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  // ── Step 3: 水杯選擇 ─────────────────────────────────
  if (step === 3) return (
    <SafeAreaView style={s.safeBg}>
      <ScrollView
        style={s.scrollFull}
        contentContainerStyle={s.formInner}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ minHeight: winH - 160, gap: 14 }}>
          <TouchableOpacity onPress={() => setStep(2)} style={s.backBtn}>
            <Text style={s.backTxt}>←</Text>
          </TouchableOpacity>
          <Text style={s.pageTitle}>選擇水杯夥伴</Text>

          <View style={s.banner}>
            <Image source={activeCup.image} style={{ width: 60, height: 60 }} resizeMode="contain" />
            <View>
              <Text style={s.bannerSub}>你選擇了</Text>
              <Text style={s.bannerName}>{activeCup.name}</Text>
            </View>
          </View>

          <View style={s.cupGrid}>
            {CUPS.map(c => (
              <TouchableOpacity
                key={c.name}
                style={[s.cupCard, activeCup.name === c.name && s.cupCardSel]}
                onPress={() => setActiveCup(c)}
                activeOpacity={0.8}
              >
                <Image source={c.image} style={{ width: 60, height: 60 }} resizeMode="contain" />
                <Text style={s.cupName}>{c.name}</Text>
                <Text style={s.cupDesc}>{c.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.fieldError} />
        </View>

        <View style={{ paddingBottom: insets.bottom + 16 }}>
          <TouchableOpacity style={s.btn} onPress={() => { setFieldError(''); setStep(4); }} activeOpacity={0.85}>
            <Text style={s.btnTxt}>用 {activeCup.name} 開始補水 →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  // ── Step 4: 提醒設定 ─────────────────────────────────
  return (
    <SafeAreaView style={s.safeBg}>
      {ScanningModal}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={s.scrollFull}
          contentContainerStyle={s.formInner}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ minHeight: winH - 160, gap: 14 }}>
            <TouchableOpacity onPress={() => { setFieldError(''); setStep(3); }} style={s.backBtn}>
              <Text style={s.backTxt}>←</Text>
            </TouchableOpacity>
            <Text style={s.pageTitle}>提醒設定</Text>
            <Text style={s.pageSub}>設定你的補水提醒間距與記錄模式</Text>

            {/* 提醒間距 */}
            <View style={s.section}>
              <Text style={s.lbl}>提醒時間間距</Text>
              <View style={s.segRow}>
                {['30', '45', '60', '90'].map(v => (
                  <Seg key={v} label={`${v}分`} sel={reminderInterval === v}
                    onPress={() => { setReminderInterval(v); setFieldError(''); }} />
                ))}
              </View>
              <View style={s.customRow}>
                <Text style={s.customLbl}>或自訂：</Text>
                <TextInput
                  style={s.customInp}
                  keyboardType="numeric"
                  value={reminderInterval}
                  onChangeText={v => { setReminderInterval(v); setFieldError(''); }}
                />
                <Text style={s.mlUnit}>分鐘</Text>
              </View>
            </View>

            {/* 每日作息時間 */}
            <View style={s.section}>
              <Text style={s.lbl}>作息時間</Text>
              <Text style={{ fontSize: 12, color: MUTED, marginTop: -6 }}>
                用於計算飲水進度與補水建議，請填入通常的起床與就寢時間
              </Text>
              <View style={s.timeBox}>
                <View style={s.timeItem}>
                  <Text style={s.timeLbl}>起床時間</Text>
                  <TextInput
                    style={s.timeInp}
                    value={autoStart}
                    onChangeText={v => { setAutoStart(v); setFieldError(''); }}
                    placeholder="08:00"
                    placeholderTextColor={MUTED}
                  />
                </View>
                <Text style={s.timeSep}>—</Text>
                <View style={s.timeItem}>
                  <Text style={s.timeLbl}>就寢時間</Text>
                  <TextInput
                    style={s.timeInp}
                    value={autoEnd}
                    onChangeText={v => { setAutoEnd(v); setFieldError(''); }}
                    placeholder="22:00"
                    placeholderTextColor={MUTED}
                  />
                </View>
              </View>
            </View>

            {/* 智慧杯墊 */}
            <View style={s.section}>
              <Text style={s.lbl}>智慧杯墊</Text>
              <View style={s.switchCard}>
                <View style={{ flex: 1 }}>
                  <Text style={s.switchTitle}>智慧杯墊自動記錄</Text>
                  <Text style={s.switchDesc}>開啟後由杯墊感測喝水量</Text>
                </View>
                <CustomSwitch value={hasCoaster || isScanning} onValueChange={handleCoasterToggle} disabled={isScanning} />
              </View>
            </View>

            <Text style={s.fieldError}>{fieldError ? `⚠ ${fieldError}` : ''}</Text>
          </View>

          <View style={{ paddingBottom: insets.bottom + 16 }}>
            <TouchableOpacity
              style={[s.btn, (submitting || isScanning) && { opacity: 0.6 }]}
              onPress={handleFinalSubmit}
              disabled={submitting || isScanning}
              activeOpacity={0.85}
            >
              <Text style={s.btnTxt}>{submitting ? '處理中...' : isScanning ? '掃描中...' : '開始使用'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safeBg:     { flex: 1, backgroundColor: '#e8f5fe' },
  scrollFull: { flex: 1 },
  formInner:  { padding: 24, paddingTop: 56, gap: 14 },
  pageTitle:  { fontSize: 24, fontWeight: '900', color: '#5ab4f5' },
  pageSub:    { fontSize: 13, color: MUTED, marginTop: -10 },

  section: { gap: 12 },

  lbl:    { fontSize: 11, fontWeight: '800', color: '#5a7a96', textTransform: 'uppercase', letterSpacing: 0.7 },
  inp:    { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, borderWidth: 2, borderColor: BORDER, fontSize: 16, fontWeight: '700', color: TEXT, backgroundColor: '#fff' },
  twoCol: { flexDirection: 'row', gap: 12 },
  col:    { flex: 1, gap: 6 },
  segRow: { flexDirection: 'row', gap: 8 },
  segGrid:{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  seg:    { flex: 1, paddingVertical: 13, borderRadius: 13, borderWidth: 2, borderColor: BORDER, backgroundColor: '#fff', alignItems: 'center' },
  segSel: { borderColor: '#5ab4f5', backgroundColor: BLUE_LIGHT },
  segHalf:{ minWidth: '47%' },
  segTxt: { fontSize: 14, fontWeight: '800', color: '#6b8da8' },
  segTxtSel: { color: BLUE_DARK },

  customRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  customLbl: { fontSize: 13, color: MUTED, flex: 1 },
  customInp: { width: 80, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 2, borderColor: BORDER, fontSize: 16, fontWeight: '700', color: TEXT, textAlign: 'center', backgroundColor: '#fff' },

  switchCard:  { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 16, padding: 18, borderWidth: 1.5, borderColor: BORDER, gap: 12 },
  switchTitle: { fontSize: 15, fontWeight: '800', color: TEXT, marginBottom: 3 },
  switchDesc:  { fontSize: 12, color: MUTED, lineHeight: 18 },

  timeBox:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 16, padding: 18, borderWidth: 1.5, borderColor: BORDER },
  timeItem: { flex: 1, gap: 6 },
  timeLbl:  { fontSize: 11, color: MUTED, fontWeight: '800', textAlign: 'center' },
  timeInp:  { paddingVertical: 14, paddingHorizontal: 14, borderRadius: 12, borderWidth: 2, borderColor: BORDER, fontSize: 20, fontWeight: '900', color: TEXT, textAlign: 'center', backgroundColor: '#fff' },
  timeSep:  { fontSize: 22, color: MUTED, fontWeight: '900' },

  goalBox:    { backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: '#bde0f8', gap: 10 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalTitle:  { fontSize: 15, fontWeight: '900', color: TEXT },
  goalSub:    { fontSize: 12, color: MUTED },
  goalFinal:  { fontSize: 28, fontWeight: '900', color: '#5ab4f5', textAlign: 'center' },
  mlUnit:     { fontSize: 14, fontWeight: '800', color: MUTED },

  fieldError: { color: '#f87171', fontSize: 12, fontWeight: '700', minHeight: 18 },

  backBtn: { width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  backTxt: { fontSize: 18 },
  banner:     { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 16, padding: 14 },
  bannerSub:  { fontSize: 12, color: MUTED },
  bannerName: { fontSize: 18, fontWeight: '900', color: TEXT },

  cupGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cupCard:    { width: '47%', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 18, padding: 14, alignItems: 'center', gap: 4, borderWidth: 2, borderColor: 'transparent' },
  cupCardSel: { borderColor: '#5ab4f5', backgroundColor: BLUE_LIGHT },
  cupName:    { fontSize: 14, fontWeight: '900', color: TEXT },
  cupDesc:    { fontSize: 11, color: MUTED, textAlign: 'center' },

  btn:    { backgroundColor: '#5ab4f5', paddingVertical: 17, borderRadius: 16, alignItems: 'center', width: '100%', alignSelf: 'center', shadowColor: '#5ab4f5', shadowOpacity: 0.38, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '900' },

  infoBtn:    { width: 18, height: 18, borderRadius: 9, backgroundColor: '#d0e8f8', alignItems: 'center', justifyContent: 'center' },
  infoBtnTxt: { fontSize: 11, fontWeight: '900', color: '#3a90d4' },
  actOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  actModal:   { backgroundColor: '#fff', borderRadius: 22, padding: 22, width: '100%', gap: 12 },
  actTitle:   { fontSize: 17, fontWeight: '900', color: '#1a2a3a', marginBottom: 4 },
  actRow:     { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f0f5fa' },
  actLabel:   { fontSize: 13, fontWeight: '900', color: '#3a90d4', width: 36 },
  actDesc:    { fontSize: 13, color: '#4a6a84', flex: 1, lineHeight: 20 },
  actClose:   { backgroundColor: '#5ab4f5', paddingVertical: 12, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  actCloseTxt:{ color: '#fff', fontSize: 15, fontWeight: '900' },
});

export default InitialSettingScreen;
