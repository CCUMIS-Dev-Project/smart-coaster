// src/screens/InitialSettingScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, SafeAreaView, Platform, Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// ─── 常數 ───────────────────────────────────────────────
const CUPS = [
  { name: '洋芋片罐', emoji: '🥫', ml: 320, desc: '細水長流型' },
  { name: '水杯',     emoji: '🥤', ml: 350, desc: '每天必備' },
  { name: '茶杯',     emoji: '🍵', ml: 200, desc: '細啜慢飲' },
  { name: '馬克杯',   emoji: '☕', ml: 400, desc: '早晨首選' },
  { name: '玻璃杯',   emoji: '🍋', ml: 300, desc: '清爽感爆表' },
];

function calcGoal({ gender, weight, age, activity, tempLevel }) {
  const base    = Math.round(weight * (gender === 'male' ? 35 : 30));
  const actMap  = { sedentary: 0, light: 0.10, moderate: 0.20, intense: 0.30 };
  const actAdd  = Math.round(base * (actMap[activity] ?? 0.10));
  const tempAdd = Math.round(base * (tempLevel === 'hot' ? 0.20 : tempLevel === 'cold' ? 0 : 0.10));
  const ageMod  = age > 55 ? -Math.round(base * 0.1) : 0;
  return { base, actAdd, tempAdd, ageMod, total: base + actAdd + tempAdd + ageMod };
}

// ─── 漣漪元件 ────────────────────────────────────────────
function RippleRing({ delay }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = () => {
      anim.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 2600, useNativeDriver: true }),
      ]).start(() => loop());
    };
    loop();
  }, []);

  const scale   = anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] });
  const opacity = anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.5, 0] });

  return (
    <Animated.View style={[s.rippleRing, { transform: [{ scale }], opacity }]} />
  );
}

// ─── 主元件 ─────────────────────────────────────────────
export default function InitialSettingScreen() {
  const navigation = useNavigation();
  const [step, setStep] = useState(1);

  const [gender,    setGender]    = useState('male');
  const [weight,    setWeight]    = useState('65');
  const [height,    setHeight]    = useState('170');
  const [age,       setAge]       = useState('28');
  const [activity,  setActivity]  = useState('light');
  const [tempLevel, setTemp]      = useState('mild');
  const [activeCup, setActiveCup] = useState(CUPS[3]);
  const [customMl,  setCustomMl]  = useState('400');

  // 杯子上下飄動
  const bobAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, { toValue: -12, duration: 1400, useNativeDriver: true }),
        Animated.timing(bobAnim, { toValue: 0,   duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const calc   = calcGoal({ gender, weight: parseFloat(weight)||65, age: parseFloat(age)||28, activity, tempLevel });
  const goalMl = calc.total;
  const ml     = parseInt(customMl) || activeCup.ml;

  // ── Step 1: Welcome ──────────────────────────────────
  if (step === 1) return (
    <View style={s.welcomeBg}>
      <Text style={s.logoTxt}>Day Day補給站</Text>

      {/* 漣漪 + 杯子 */}
      <View style={s.rippleWrap}>
        <RippleRing delay={0} />
        <RippleRing delay={800} />
        <RippleRing delay={1600} />
        <Animated.Text style={[s.bigCup, { transform: [{ translateY: bobAnim }] }]}>
          💧
        </Animated.Text>
      </View>

      <View style={s.copyWrap}>
        <Text style={s.headline}>喝Day Day{'\n'}Day Day Happy!</Text>
        <Text style={s.subTxt}>選擇你的水杯夥伴{'\n'}一起開始補給day day</Text>
      </View>

      <TouchableOpacity style={s.btn} onPress={() => setStep(2)} activeOpacity={0.85}>
        <Text style={s.btnTxt}>開始設定 →</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Step 2: Profile ──────────────────────────────────
  if (step === 2) return (
    <SafeAreaView style={s.safeBg}>
      <ScrollView
        style={s.scrollFull}
        contentContainerStyle={s.formInner}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.pageTitle}>個人資料設定</Text>
        <Text style={s.pageSub}>幫你計算個人化每日補水目標</Text>

        <Lbl>生理性別</Lbl>
        <View style={s.segRow}>
          <Seg label="生理男" sel={gender==='male'}   onPress={() => setGender('male')} />
          <Seg label="生理女" sel={gender==='female'} onPress={() => setGender('female')} />
        </View>

        <View style={s.twoCol}>
          <View style={s.col}>
            <Lbl>身高 (CM)</Lbl>
            <TextInput style={s.inp} keyboardType="numeric" value={height} onChangeText={setHeight} />
          </View>
          <View style={s.col}>
            <Lbl>體重 (KG)</Lbl>
            <TextInput style={s.inp} keyboardType="numeric" value={weight} onChangeText={setWeight} />
          </View>
        </View>

        <Lbl>年齡</Lbl>
        <TextInput style={s.inp} keyboardType="numeric" value={age} onChangeText={setAge} />

        <Lbl>活動量</Lbl>
        <View style={s.segGrid}>
          <Seg label="久坐"   sel={activity==='sedentary'} onPress={() => setActivity('sedentary')} half />
          <Seg label="輕度"   sel={activity==='light'}     onPress={() => setActivity('light')}     half />
          <Seg label="中度"   sel={activity==='moderate'}  onPress={() => setActivity('moderate')}  half />
          <Seg label="高強度" sel={activity==='intense'}   onPress={() => setActivity('intense')}   half />
        </View>

        <Lbl>氣溫區間</Lbl>
        <View style={s.segRow}>
          <Seg label="< 20°C"   sel={tempLevel==='cold'} onPress={() => setTemp('cold')} />
          <Seg label="20-27°C"  sel={tempLevel==='mild'} onPress={() => setTemp('mild')} />
          <Seg label=">= 28°C"  sel={tempLevel==='hot'}  onPress={() => setTemp('hot')} />
        </View>

        <View style={s.formulaBox}>
          <Text style={s.formulaTitle}>計算過程</Text>
          <FRow label="基礎需水量" val={`${calc.base} ml`} />
          <FRow label="活動量修正" val={`+${calc.actAdd} ml`} />
          <FRow label="氣溫修正"   val={`+${calc.tempAdd} ml`} />
          <FRow label="年齡修正"   val={calc.ageMod===0 ? '-0 ml' : `${calc.ageMod} ml`} />
          <View style={s.fDivider} />
          <View style={s.fTotalRow}>
            <Text style={s.fTotalLbl}>每日建議補水量</Text>
            <Text style={s.fTotalVal}>{calc.total} ml</Text>
          </View>
        </View>

        <TouchableOpacity style={s.btn} onPress={() => setStep(3)} activeOpacity={0.85}>
          <Text style={s.btnTxt}>選擇我的水杯 →</Text>
        </TouchableOpacity>
        <View style={{ height: Platform.OS === 'ios' ? 40 : 20 }} />
      </ScrollView>
    </SafeAreaView>
  );

  // ── Step 3: Cup Select ───────────────────────────────
  if (step === 3) return (
    <SafeAreaView style={s.safeBg2}>
      <ScrollView
        style={s.scrollFull}
        contentContainerStyle={s.formInner}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => setStep(2)} style={s.backBtn}>
          <Text style={s.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={s.pageTitle}>選擇水杯夥伴</Text>
        <Text style={s.pageSub}>每次喝水，夥伴會慢慢裝滿水！</Text>

        <View style={s.banner}>
          <Text style={{ fontSize: 26 }}>{activeCup.emoji}</Text>
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
              onPress={() => { setActiveCup(c); setCustomMl(String(c.ml)); }}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 34 }}>{c.emoji}</Text>
              <Text style={s.cupName}>{c.name}</Text>
              <Text style={s.cupMl}>{c.ml}ml</Text>
              <Text style={s.cupDesc}>{c.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.customRow}>
          <Text style={s.customLbl}>自訂杯子容量</Text>
          <TextInput style={s.customInp} keyboardType="numeric" value={customMl} onChangeText={setCustomMl} />
          <Text style={s.mlUnit}>ml</Text>
        </View>

        <View style={s.preview}>
          <Text style={{ fontSize: 32 }}>{activeCup.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.previewName}>每次喝一杯 {activeCup.name}</Text>
            <Text style={s.previewMl}>+{ml}ml</Text>
            <Text style={s.previewGoal}>今日目標 {goalMl}ml・還需 {(goalMl/ml).toFixed(1)} 杯</Text>
          </View>
        </View>

        <TouchableOpacity style={s.btn} onPress={() => setStep(4)} activeOpacity={0.85}>
          <Text style={s.btnTxt}>用 {activeCup.name} 開始補水 →</Text>
        </TouchableOpacity>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );

  // ── Step 4: Setup Complete ───────────────────────────
  return (
    <View style={s.completeBg}>
      <View style={s.chip}><Text style={s.chipTxt}>設定完成</Text></View>
      <Text style={{ fontSize: 90 }}>{activeCup.emoji}</Text>
      <Text style={s.completeTitle}>設定完成！</Text>
      <View style={s.goalCard}>
        <Text style={s.goalNum}>{goalMl}<Text style={s.goalUnit}>ml</Text></Text>
        <Text style={s.goalLbl}>你的每日補水目標</Text>
        <View style={{ gap: 6, marginTop: 8, width: '100%' }}>
          <Text style={s.infoRow}>建議補水間隔：<Text style={{ fontWeight: '900' }}>~50 分鐘</Text></Text>
          <Text style={s.infoRow}>水杯夥伴：<Text style={{ fontWeight: '900' }}>{activeCup.name} {ml}ml</Text></Text>
          <Text style={s.infoRow}>連續 5 天達標可以解鎖花朵！</Text>
        </View>
      </View>
      <TouchableOpacity style={[s.btn, { width: '100%' }]} onPress={() => navigation.replace('MainTabs')} activeOpacity={0.85}>
        <Text style={s.btnTxt}>開始我的旅程</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── 小元件 ─────────────────────────────────────────────
const Lbl = ({ children }) => <Text style={s.lbl}>{children}</Text>;
const Seg = ({ label, sel, onPress, half }) => (
  <TouchableOpacity
    style={[s.seg, sel && s.segSel, half && s.segHalf]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <Text style={[s.segTxt, sel && s.segTxtSel]}>{label}</Text>
  </TouchableOpacity>
);
const FRow = ({ label, val }) => (
  <View style={s.fRow}>
    <Text style={s.fLbl}>{label}</Text>
    <Text style={s.fVal}>{val}</Text>
  </View>
);

// ─── Styles ──────────────────────────────────────────────
const BLUE = '#5ab4f5', BLUE_DARK = '#2196f3', BLUE_LIGHT = '#eaf6ff';
const TEXT = '#1a2a3a', MUTED = '#8aaac0', BORDER = '#e2eaf2';

const s = StyleSheet.create({
  // Welcome
  welcomeBg: { flex: 1, backgroundColor: '#e8f5fe', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 48, paddingHorizontal: 32 },
  logoTxt:   { fontSize: 20, fontWeight: '900', color: '#3a90d4', alignSelf: 'flex-start' },

  // 漣漪
  rippleWrap: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  rippleRing: { position: 'absolute', width: 180, height: 180, borderRadius: 90, borderWidth: 2, borderColor: '#5ab4f5' },
  bigCup:     { fontSize: 80 },

  copyWrap:   { alignItems: 'center', marginBottom: 20 },  headline:  { fontSize: 32, fontWeight: '900', color: TEXT, textAlign: 'center', lineHeight: 40, marginBottom: 12 },
  subTxt:     { fontSize: 15, color: '#6b8da8', lineHeight: 24, textAlign: 'center' },

  safeBg:     { flex: 1, backgroundColor: '#fff' },
  safeBg2:    { flex: 1, backgroundColor: '#f0f7fc' },
  scrollFull: { flex: 1 },
  formInner:  { padding: 24, paddingTop: 56, paddingBottom: 40, gap: 14 },

  pageTitle: { fontSize: 24, fontWeight: '900', color: TEXT },
  pageSub:   { fontSize: 13, color: MUTED, marginTop: -8 },

  lbl:    { fontSize: 11, fontWeight: '800', color: '#5a7a96', textTransform: 'uppercase', letterSpacing: 0.7 },
  inp:    { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, borderWidth: 2, borderColor: BORDER, fontSize: 16, fontWeight: '700', color: TEXT, backgroundColor: '#f6fafd' },
  twoCol: { flexDirection: 'row', gap: 12 },
  col:    { flex: 1, gap: 6 },

  segRow:    { flexDirection: 'row', gap: 8 },
  segGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  seg:       { flex: 1, paddingVertical: 13, borderRadius: 13, borderWidth: 2, borderColor: BORDER, backgroundColor: '#f6fafd', alignItems: 'center' },
  segSel:    { borderColor: BLUE, backgroundColor: BLUE_LIGHT },
  segHalf:   { minWidth: '47%' },
  segTxt:    { fontSize: 14, fontWeight: '800', color: '#6b8da8' },
  segTxtSel: { color: BLUE_DARK },

  formulaBox:   { backgroundColor: '#eaf6ff', borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: '#bde0f8', gap: 6 },
  formulaTitle: { fontSize: 13, fontWeight: '900', color: BLUE_DARK },
  fRow:         { flexDirection: 'row', justifyContent: 'space-between' },
  fLbl:         { fontSize: 13, color: '#4a6a84' },
  fVal:         { fontSize: 13, fontWeight: '900', color: TEXT },
  fDivider:     { height: 1.5, backgroundColor: '#bde0f8', marginVertical: 4 },
  fTotalRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fTotalLbl:    { fontSize: 14, fontWeight: '900', color: TEXT },
  fTotalVal:    { fontSize: 22, fontWeight: '900', color: BLUE },

  backBtn:    { width: 40, height: 40, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  backTxt:    { fontSize: 18 },
  banner:     { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: BLUE_LIGHT, borderRadius: 16, padding: 14 },
  bannerSub:  { fontSize: 12, color: MUTED },
  bannerName: { fontSize: 18, fontWeight: '900', color: TEXT },
  cupGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cupCard:    { width: '47%', backgroundColor: '#fff', borderRadius: 18, padding: 14, alignItems: 'center', gap: 4, borderWidth: 2, borderColor: 'transparent' },
  cupCardSel: { borderColor: BLUE, backgroundColor: BLUE_LIGHT },
  cupName:    { fontSize: 14, fontWeight: '900', color: TEXT },
  cupMl:      { fontSize: 13, fontWeight: '800', color: BLUE },
  cupDesc:    { fontSize: 11, color: MUTED, textAlign: 'center' },
  customRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  customLbl:  { flex: 1, fontSize: 14, fontWeight: '800', color: '#4a6a84' },
  customInp:  { width: 70, padding: 10, borderRadius: 12, borderWidth: 2, borderColor: BORDER, fontSize: 16, fontWeight: '700', color: TEXT, textAlign: 'center', backgroundColor: '#f6fafd' },
  mlUnit:     { fontSize: 13, fontWeight: '800', color: MUTED },
  preview:    { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 16, padding: 14 },
  previewName:  { fontSize: 14, fontWeight: '900', color: TEXT },
  previewMl:    { fontSize: 22, fontWeight: '900', color: BLUE },
  previewGoal:  { fontSize: 12, color: MUTED },

  completeBg:    { flex: 1, backgroundColor: '#f0f7fc', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 20 },
  chip:          { backgroundColor: 'rgba(90,180,245,0.18)', borderRadius: 99, paddingVertical: 8, paddingHorizontal: 20 },
  chipTxt:       { fontSize: 12, fontWeight: '900', color: '#3a90d4' },
  completeTitle: { fontSize: 30, fontWeight: '900', color: TEXT },
  goalCard:      { width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center', gap: 6 },
  goalNum:       { fontSize: 48, fontWeight: '900', color: BLUE },
  goalUnit:      { fontSize: 18, color: MUTED },
  goalLbl:       { fontSize: 14, color: MUTED },
  infoRow:       { fontSize: 13, color: '#4a6a84' },

  btn:    { backgroundColor: BLUE, paddingVertical: 17, borderRadius: 16, alignItems: 'center', width: '60%', alignSelf: 'center', shadowColor: BLUE, shadowOpacity: 0.38, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '900' },
});