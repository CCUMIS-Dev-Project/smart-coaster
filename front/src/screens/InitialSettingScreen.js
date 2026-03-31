import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Platform, Animated, Switch, Image, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, ACTIVITY_LEVELS, calcWaterGoal } from '../constants/theme';
import { useApp } from '../context/AppContext';
import apiService from '../services/api'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

const BLUE = colors.blue, BLUE_DARK = colors.blueDark, BLUE_LIGHT = colors.blueLight;
const TEXT = colors.text, MUTED = colors.muted, BORDER = colors.border;

const CUPS = [
  { name: '洋芋片罐', image: require('../assets/cup_can.png'),   ml: 320, desc: '我才不要喝水，快給我吃餅乾！' },
  { name: '水杯',     image: require('../assets/cup_main.png'),  ml: 350, desc: '平凡中帶點小確幸' },
  { name: '茶杯',     image: require('../assets/cup_tea.png'),   ml: 200, desc: '慢慢來，人生不急' },
  { name: '馬克杯',   image: require('../assets/cup_mug.png'),   ml: 400, desc: '早晨救星，戒不掉' },
  { name: '玻璃杯',   image: require('../assets/cup_lemon.png'), ml: 300, desc: '清新系，夏天的靈魂' },
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

function Seg({ label, sel, onPress, half }) {
  return (
    <TouchableOpacity style={[s.seg, sel && s.segSel, half && s.segHalf]} onPress={onPress} activeOpacity={0.75}>
      <Text style={[s.segTxt, sel && s.segTxtSel]}>{label}</Text>
    </TouchableOpacity>
  );
}

const ACTIVITY_INFO = [
  { label: '久坐', desc: '幾乎不運動，整天坐著工作或休息' },
  { label: '輕度', desc: '每週運動1–2次' },
  { label: '中度', desc: '每週運動3–4次' },
  { label: '高度', desc: '每週運動5次以上' },
  { label: '運動標準', desc: '一、感覺有點喘、說話稍費力，且持續時間超過 30 分鐘\n二、日均步數超過一萬步' },
];

const InitialSettingScreen = () => {
  const navigation = useNavigation();
  const { completeSetup, updateProfile} = useApp();
  const [step, setStep] = useState(1);

  // 個人資料
  const [name,     setName]     = useState('');
  const [gender,   setGender]   = useState('F'); // 預設為F
  const [weight,   setWeight]   = useState('65');
  const [age,      setAge]      = useState('28');
  const [activity, setActivity] = useState('1');
  const [customGoal,   setCustomGoal]   = useState(false);
  const [customGoalMl, setCustomGoalMl] = useState('');

  // 水杯選擇
  const [activeCup, setActiveCup] = useState(CUPS[3]);

  // 提醒設定
  const [reminderInterval, setReminderInterval] = useState('60');
  const [autoMode,   setAutoMode]   = useState(true);
  const [autoStart,  setAutoStart]  = useState('08:00');
  const [autoEnd,    setAutoEnd]    = useState('22:00');
  const [hasCoaster, setHasCoaster] = useState(true);

  // 活動量說明
  const [showActivityInfo, setShowActivityInfo] = useState(false);

  // 動畫
  const bobAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, { toValue: -12, duration: 1400, useNativeDriver: true }),
        Animated.timing(bobAnim, { toValue: 0,   duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const suggestedGoal = calcWaterGoal({
    gender, weight: parseFloat(weight)||65, age: parseFloat(age)||28, activity,
  });
  const finalGoal = customGoal ? (parseInt(customGoalMl)||suggestedGoal) : suggestedGoal;

  // function handleComplete() {
  //   completeSetup({
  //     name, gender,
  //     weight: parseFloat(weight)||65,
  //     age: parseFloat(age)||28,
  //     activity,
  //     goalMl: finalGoal,
  //     customGoal,
  //     selectedCup: { ...activeCup },
  //     reminderInterval: parseInt(reminderInterval)||60,
  //     autoMode, autoStart, autoEnd, hasCoaster,
  //   });
  // }

  const handleFinalSubmit = () => {
    // 1. 稍微延遲 50 毫秒，讓按鈕變暗的點擊特效 (activeOpacity) 可以先渲染
    setTimeout(() => {
      // 2. 執行狀態儲存 
      handleStart(); 
      
      // 3. 執行頁面跳轉
      navigation.replace('MainTabs'); 
    }, 50);
  };

  const handleStart = async () => {
    try {
      // 1. 取得儲存的 Token
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        Alert.alert('錯誤', '找不到登入資訊，請重新登入');
        navigation.replace('Login');
        return;
      }

      // 2. 準備更新資料
      const levelMapping = {
        'Sedentary': 1,
        'Low': 2,
        'Moderate': 3,
        'High': 4
      };

      const updateData = {
        gender: gender,
        weight: parseFloat(weight),            // 確保是數字
        age: age,
        levelid: levelMapping[activity] || 1,  // 轉換運動量等級 ID
      };

      // 3. 呼叫後端 API 更新資料
      const result = await apiService.updateProfile(updateData, userToken);

      if (result.success) {
        // 4. 更新 App 內部的全域狀態 (AppContext)
        updateProfile({
          gender,
          weight: parseFloat(weight),
          age: age,
          activity,
          goalMl: calcWaterGoal(parseFloat(weight), activity), // 使用 theme.js 提供的計算公式
        });

        // 5. 標記初始化完成並進入主頁
        completeSetup(); // 這會觸發 AppContext 的狀態變更
      } else {
        Alert.alert('設定失敗', result.error);
      }
    } catch (error) {
      console.error("設定流程發生錯誤:", error);
      Alert.alert('錯誤', '系統發生問題，請稍後再試');
    }
  };

  // 活動量說明 Modal（共用）
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

  const InputField = ({ label, value, onChangeText, placeholder, keyboardType = 'default', icon }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <Ionicons name={icon} size={20} color="#3498db" style={styles.icon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
          placeholderTextColor="#CCC"
        />
      </View>
    </View>
  );

  // ── Step 1: 歡迎 ─────────────────────────────────────
  if (step === 1) return (
    <View style={s.welcomeBg}>
      <Text style={s.logoTxt}>Day Day補給站</Text>
      <View style={s.rippleWrap}>
        <RippleRing delay={0} />
        <RippleRing delay={800} />
        <RippleRing delay={1600} />
        <Animated.Image
          source={require('../assets/cup_main.png')}
          style={[s.cupImg, { transform: [{ translateY: bobAnim }] }]}
          resizeMode="contain"
        />
      </View>
      <View style={{ alignItems: 'center' }}>
        <Text style={s.headline}>喝Day Day{'\n'}讓你Day Day Happy!</Text>
        <Text style={s.subTxt}>選擇你的水杯夥伴{'\n'}一起養成好習慣</Text>
      </View>
      <TouchableOpacity style={s.btn} onPress={() => setStep(2)} activeOpacity={0.85}>
        <Text style={s.btnTxt}>開始設定 →</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Step 2: 個人資料 ─────────────────────────────────
  if (step === 2) return (
    <SafeAreaView style={s.safeBg}>
      {ActivityInfoModal}
      <ScrollView style={s.scrollFull} contentContainerStyle={s.formInner}
        showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={s.pageTitle}>個人資料設定</Text>
        <Text style={s.pageSub}>幫你計算個人化每日補水目標</Text>

        <Text style={s.lbl}>姓名</Text>
        <TextInput style={s.inp} value={name} onChangeText={setName}
          placeholder="輸入姓名/暱稱" placeholderTextColor={MUTED} />

        <Text style={s.lbl}>生理性別</Text>
        <View style={s.segRow}>
          <Seg label="生理男" sel={gender==='M'}   onPress={() => setGender('M')} />
          <Seg label="生理女" sel={gender==='F'} onPress={() => setGender('F')} />
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
            <Seg key={a.key} label={a.label} sel={activity===a.key}
              onPress={() => setActivity(a.key)} half />
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
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TextInput style={[s.inp, { flex: 1 }]} keyboardType="numeric"
                  value={customGoalMl} onChangeText={setCustomGoalMl}
                  placeholder={String(suggestedGoal)} placeholderTextColor={MUTED} />
                <Text style={s.mlUnit}>ml</Text>
              </View>
              {!!customGoalMl && parseInt(customGoalMl) < suggestedGoal && (
                <Text style={{ fontSize: 11, color: '#f87171', fontWeight: '700' }}>
                  最低目標為建議值 {suggestedGoal} ml
                </Text>
              )}
            </>
          ) : (
            <Text style={s.goalFinal}>{suggestedGoal} ml</Text>
          )}
        </View>

        <TouchableOpacity 
        style={s.btn} onPress={() => {
          if (!name.trim()) {
            Alert.alert('請輸入姓名', '請填寫你的名字或暱稱才能繼續');
            return;
          }
          setStep(3);
        }} activeOpacity={0.85}>
          <Text style={s.btnTxt}>選擇我的水杯 →</Text>
        </TouchableOpacity>

        <View style={{ height: Platform.OS === 'ios' ? 40 : 20 }} />
      </ScrollView>
    </SafeAreaView>
  );

  // ── Step 3: 水杯選擇 ─────────────────────────────────
  if (step === 3) return (
    <SafeAreaView style={s.safeBg2}>
      <ScrollView style={s.scrollFull} contentContainerStyle={s.formInner}
        showsVerticalScrollIndicator={false}>
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
            <TouchableOpacity key={c.name}
              style={[s.cupCard, activeCup.name === c.name && s.cupCardSel]}
              onPress={() => setActiveCup(c)} activeOpacity={0.8}>
              <Image source={c.image} style={{ width: 60, height: 60 }} resizeMode="contain" />
              <Text style={s.cupName}>{c.name}</Text>
              <Text style={s.cupDesc}>{c.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={s.btn} onPress={() => setStep(4)} activeOpacity={0.85}>
          <Text style={s.btnTxt}>用 {activeCup.name} 開始補水 →</Text>
        </TouchableOpacity>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );

  // ── Step 4: 提醒設定 ─────────────────────────────────
  return (
    <SafeAreaView style={s.safeBg}>
      <ScrollView style={s.scrollFull} contentContainerStyle={s.formInner4}
        showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => setStep(3)} style={s.backBtn}>
          <Text style={s.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={s.pageTitle}>提醒設定</Text>
        <Text style={s.pageSub}>設定你的補水提醒間距與記錄模式</Text>

        {/* 提醒間距 */}
        <View style={s.section}>
          <Text style={s.lbl}>提醒時間間距</Text>
          <View style={s.segRow}>
            {['30','45','60','90'].map(v => (
              <Seg key={v} label={`${v}分`} sel={reminderInterval===v}
                onPress={() => setReminderInterval(v)} />
            ))}
          </View>
          <View style={s.customRow}>
            <Text style={s.customLbl}>或自訂：</Text>
            <TextInput style={s.customInp} keyboardType="numeric"
              value={reminderInterval} onChangeText={setReminderInterval} />
            <Text style={s.mlUnit}>分鐘</Text>
          </View>
        </View>

        {/* 杯墊設定 */}
        <View style={s.section}>
          <Text style={s.lbl}>智慧杯墊</Text>
          <View style={s.switchCard}>
            <View style={{ flex: 1 }}>
              <Text style={s.switchTitle}>我有智慧杯墊</Text>
              <Text style={s.switchDesc}>擁有智慧杯墊了嗎？開啟後即可使用自動記錄功能</Text>
            </View>
            <Switch value={hasCoaster} onValueChange={setHasCoaster} trackColor={{ true: BLUE }} />
          </View>

          <View style={[s.switchCard, !hasCoaster && { opacity: 0.45 }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.switchTitle}>自動記錄模式</Text>
              <Text style={s.switchDesc}>關閉則為手動記錄</Text>
            </View>
            <Switch value={autoMode && hasCoaster} onValueChange={hasCoaster ? setAutoMode : null}
              trackColor={{ true: BLUE }} disabled={!hasCoaster} />
          </View>
        </View>

        {/* 自動記錄時段 */}
        {autoMode && hasCoaster && (
          <View style={s.section}>
            <Text style={s.lbl}>自動記錄時段</Text>
            <View style={s.timeBox}>
              <View style={s.timeItem}>
                <Text style={s.timeLbl}>開始時間</Text>
                <TextInput style={s.timeInp} value={autoStart} onChangeText={setAutoStart}
                  placeholder="08:00" placeholderTextColor={MUTED} />
              </View>
              <Text style={s.timeSep}>—</Text>
              <View style={s.timeItem}>
                <Text style={s.timeLbl}>結束時間</Text>
                <TextInput style={s.timeInp} value={autoEnd} onChangeText={setAutoEnd}
                  placeholder="22:00" placeholderTextColor={MUTED} />
              </View>
            </View>
          </View>
        )}

        <View style={{ flex: 1 }} />

        <TouchableOpacity style={s.btn} onPress={handleFinalSubmit} activeOpacity={0.85}>
          <Text style={s.btnTxt}>開始使用</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  welcomeBg:  { flex: 1, backgroundColor: '#e8f5fe', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 48, paddingHorizontal: 32 },
  logoTxt:    { fontSize: 20, fontWeight: '900', color: '#3a90d4', alignSelf: 'flex-start' },
  rippleWrap: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  rippleRing: { position: 'absolute', width: 180, height: 180, borderRadius: 90, borderWidth: 2, borderColor: '#5ab4f5' },
  cupImg:     { width: 120, height: 120 },
  headline:   { fontSize: 30, fontWeight: '900', color: TEXT, textAlign: 'center', lineHeight: 38, marginBottom: 10 },
  subTxt:     { fontSize: 14, color: '#6b8da8', lineHeight: 22, textAlign: 'center' },
  safeBg:     { flex: 1, backgroundColor: '#fff' },
  safeBg2:    { flex: 1, backgroundColor: '#f0f7fc' },
  scrollFull: { flex: 1 },
  formInner:  { padding: 24, paddingTop: 56, paddingBottom: 40, gap: 14 },
  formInner4: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 24, gap: 24 },
  pageTitle:  { fontSize: 24, fontWeight: '900', color: TEXT },
  pageSub:    { fontSize: 13, color: MUTED, marginTop: -12 },

  section:    { gap: 12 },

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

  customRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  customLbl: { fontSize: 13, color: MUTED, flex: 1 },
  customInp: { width: 80, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 2, borderColor: BORDER, fontSize: 16, fontWeight: '700', color: TEXT, textAlign: 'center', backgroundColor: '#f6fafd' },

  switchCard:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f6fafd', borderRadius: 16, padding: 18, borderWidth: 1.5, borderColor: BORDER, gap: 12 },
  switchTitle: { fontSize: 15, fontWeight: '800', color: TEXT, marginBottom: 3 },
  switchDesc:  { fontSize: 12, color: MUTED, lineHeight: 18 },

  timeBox:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f6fafd', borderRadius: 16, padding: 18, borderWidth: 1.5, borderColor: BORDER },
  timeItem: { flex: 1, gap: 6 },
  timeLbl:  { fontSize: 11, color: MUTED, fontWeight: '800', textAlign: 'center' },
  timeInp:  { paddingVertical: 14, paddingHorizontal: 14, borderRadius: 12, borderWidth: 2, borderColor: BORDER, fontSize: 20, fontWeight: '900', color: TEXT, textAlign: 'center', backgroundColor: '#fff' },
  timeSep:  { fontSize: 22, color: MUTED, fontWeight: '900' },

  goalBox:    { backgroundColor: '#eaf6ff', borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: '#bde0f8', gap: 10 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalTitle:  { fontSize: 15, fontWeight: '900', color: TEXT },
  goalSub:    { fontSize: 12, color: MUTED },
  goalFinal:  { fontSize: 28, fontWeight: '900', color: BLUE, textAlign: 'center' },
  mlUnit:     { fontSize: 14, fontWeight: '800', color: MUTED },

  backBtn:    { width: 40, height: 40, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  backTxt:    { fontSize: 18 },
  banner:     { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: BLUE_LIGHT, borderRadius: 16, padding: 14 },
  bannerSub:  { fontSize: 12, color: MUTED },
  bannerName: { fontSize: 18, fontWeight: '900', color: TEXT },

  cupGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cupCard:    { width: '47%', backgroundColor: '#fff', borderRadius: 18, padding: 14, alignItems: 'center', gap: 4, borderWidth: 2, borderColor: 'transparent' },
  cupCardSel: { borderColor: BLUE, backgroundColor: BLUE_LIGHT },
  cupName:    { fontSize: 14, fontWeight: '900', color: TEXT },
  cupDesc:    { fontSize: 11, color: MUTED, textAlign: 'center' },

  btn:    { backgroundColor: BLUE, paddingVertical: 17, borderRadius: 16, alignItems: 'center', width: '100%', alignSelf: 'center', shadowColor: BLUE, shadowOpacity: 0.38, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '900' },

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

export default InitialSettingScreen;