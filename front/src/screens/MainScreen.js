import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ImageBackground, Image,
  TouchableOpacity, SafeAreaView, Alert, Modal, TextInput,
  Animated, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

const WATER_COLOR    = '#5ab4f5';
const OTHER_COLOR    = '#c8a878';
const CAFFEINE_COLOR = '#3b1f0a';
const CIRCLE_SIZE    = 260;
const CAFF_SIZE      = 110;
const GROQ_API_KEY   = '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';

const BASE_CAFFEINE = {
  '水':   0,
  '咖啡': 80,
  '茶':   30,
  '手搖': 50,
  '其他': 40,
};

export default function MainScreen() {
  const { profile, goalMl, totalMl, logs, addLog, deleteLog, sensorData } = useApp();

  const age = profile?.age || 25;
  const MAX_CAFFEINE = age < 12 ? 0
    : age < 18 ? 100
    : age < 65 ? 400
    : 300;

  const [drinkType, setDrinkType] = useState('水');
  const [customDrinks, setCustomDrinks] = useState([]);
  const [customCaffeine, setCustomCaffeine] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMl, setAddMl] = useState('250');
  const [showCustomDrinkModal, setShowCustomDrinkModal] = useState(false);
  const [customDrinkInput, setCustomDrinkInput] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [lastDeleted, setLastDeleted] = useState(null);

  const isConnected = sensorData.connected;
  const pct = Math.min(totalMl / Math.max(goalMl, 1), 1);

  function getCaffeineMg(type, ml) {
    if (customCaffeine[type]) {
      return Math.round((customCaffeine[type].per100ml * ml) / 100);
    }
    const per100 = BASE_CAFFEINE[type] ?? 40;
    return Math.round((per100 * ml) / 100);
  }

  const totalCaffeine = logs.reduce((sum, log) => sum + getCaffeineMg(log.type, log.ml), 0);
  const caffPct = MAX_CAFFEINE > 0 ? Math.min(totalCaffeine / MAX_CAFFEINE, 1) : 0;
  const caffAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(caffAnim, {
      toValue: caffPct,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [caffPct]);

  const caffHeight = caffAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, CAFF_SIZE],
  });

  const segments = [...logs].reverse().map(log => ({
    id: log.id,
    height: Math.max((log.ml / Math.max(goalMl, 1)) * CIRCLE_SIZE, 2),
    color: log.type === '水' ? WATER_COLOR : OTHER_COLOR,
  }));

  // 復原：刪掉最後一筆
  function handleUndo() {
    if (logs.length === 0) return;
    const last = logs[logs.length - 1];
    setLastDeleted(last);
    deleteLog(last.id);
  }

  // 重做：把剛刪的加回來
  function handleRedo() {
    if (!lastDeleted) return;
    addLog(lastDeleted.ml, lastDeleted.type, '');
    setLastDeleted(null);
  }

  async function lookupCaffeine(drinkName) {
    setIsLookingUp(true);
    setLookupResult(null);
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            {
              role: 'system',
              content: `你是一個飲品咖啡因資料庫。當使用者輸入飲品名稱，你要回答這個飲品的咖啡因含量。
請只用以下 JSON 格式回覆，不要加任何其他文字：
{"name":"飲品名稱","totalCaffeine":數字,"totalMl":數字,"per100ml":數字}
totalCaffeine 是整杯的咖啡因(mg)，totalMl 是整杯容量(ml)，per100ml 是每100ml含咖啡因(mg)。
如果不確定，給出最接近的合理估算值。`
            },
            { role: 'user', content: `請告訴我「${drinkName}」的咖啡因含量` }
          ],
          max_tokens: 200,
        }),
      });
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '';
      const json = JSON.parse(text.match(/\{.*\}/s)?.[0] || '{}');
      if (json.totalCaffeine !== undefined) {
        setLookupResult({
          name: drinkName,
          totalCaffeine: json.totalCaffeine,
          totalMl: json.totalMl || 350,
          per100ml: json.per100ml || Math.round(json.totalCaffeine / (json.totalMl || 350) * 100),
        });
      } else {
        Alert.alert('查詢失敗', '找不到這個飲品的咖啡因資料，請嘗試其他關鍵字');
      }
    } catch (e) {
      Alert.alert('查詢失敗', '請確認網路連線或 API Key 是否正確');
    }
    setIsLookingUp(false);
  }

  function confirmLookupResult() {
    if (!lookupResult) return;
    const { name, per100ml } = lookupResult;
    setCustomDrinks(prev => prev.includes(name) ? prev : [...prev, name]);
    setCustomCaffeine(prev => ({ ...prev, [name]: { per100ml } }));
    setDrinkType(name);
    setLookupResult(null);
    setShowCustomDrinkModal(false);
    setCustomDrinkInput('');
  }

  function quickLog(ml) { addLog(ml, drinkType, ''); setLastDeleted(null); }

  function handleAddCustom() {
    const ml = parseInt(addMl);
    if (!ml || ml <= 0) { Alert.alert('請輸入有效的毫升數'); return; }
    addLog(ml, drinkType, '');
    setLastDeleted(null);
    setShowAddModal(false);
    setAddMl('250');
  }

  const handleChangeDrink = () => {
    const BASE = ['水', '咖啡', '茶'];
    const customOptions = customDrinks
      .filter(d => !BASE.includes(d))
      .map(d => ({ text: d, onPress: () => setDrinkType(d) }));
    Alert.alert(
      '目前飲用',
      '選好飲品後，用快速記錄鍵記錄喝水量',
      [
        { text: '水',          onPress: () => setDrinkType('水') },
        { text: '咖啡',        onPress: () => setDrinkType('咖啡') },
        { text: '茶',          onPress: () => setDrinkType('茶') },
        ...customOptions,
        { text: '＋ 自訂飲品', onPress: () => setShowCustomDrinkModal(true) },
        { text: '取消',        style: 'cancel' },
      ]
    );
  };

  const handleConnect = () => Alert.alert('連接杯墊', '正在掃描附近的智慧杯墊...');
  const cupImage = profile?.selectedCup?.image || require('../assets/cup_main.png');
  const dotColor = drinkType === '水' ? WATER_COLOR : OTHER_COLOR;

  const caffStatus = totalCaffeine === 0 ? '無攝取'
  : totalCaffeine < MAX_CAFFEINE * 0.5 ? '安全範圍'
  : totalCaffeine < MAX_CAFFEINE * 0.85 ? '適量注意'
  : totalCaffeine < MAX_CAFFEINE ? '接近上限'
  : '超過上限';
  const caffStatusColor = totalCaffeine < MAX_CAFFEINE * 0.5 ? '#5ecb6b'
  : totalCaffeine < MAX_CAFFEINE * 0.85 ? '#6b3a1f'
  : '#ff0000';

  return (
    <ImageBackground source={require('../assets/background.png')} style={s.background}>
      <SafeAreaView style={s.container}>

        <View style={s.header}>
          <TouchableOpacity style={s.PickerButton} onPress={handleChangeDrink}>
            <Text style={s.drinkLabel}>更改飲品</Text>
            <View style={s.drinkRow}>
              <View style={[s.drinkDot, { backgroundColor: dotColor }]} />
              <Text style={s.drinkName}>{drinkType}</Text>
              <Ionicons name="chevron-down" size={18} color="#3498db" style={{ marginLeft: 5 }} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={s.PickerButton} onPress={handleConnect}>
            <Text style={s.drinkLabel}>連接杯墊</Text>
            <Text style={[s.drinkName, { fontSize: 14, color: isConnected ? '#4ade80' : '#f87171' }]}>
              {isConnected ? '已連線' : '未連線'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={s.mainRow}>
          <View style={s.waterWrap}>
            <View style={s.circle}>
              <View style={s.liquidContainer}>
                {(() => {
                  const merged = segments.reduce((acc, seg) => {
                    const last = acc[acc.length - 1];
                    if (last && last.color === seg.color) {
                      last.height += seg.height;
                    } else {
                      acc.push({ ...seg });
                    }
                    return acc;
                  }, []);
                  return merged.map((seg, i) => (
                    <View key={i} style={[s.liquidLayer, {
                      height: seg.height,
                      backgroundColor: seg.color,
                      opacity: 0.82,
                    }]} />
                  ));
                })()}
              </View>
              <View style={s.circleContent} pointerEvents="none">
                <Image source={cupImage} style={s.cupImage} resizeMode="contain" />
                <Text style={s.progressPct}>{Math.round(pct * 100)}%</Text>
                <Text style={s.progressMl}>{totalMl}/{goalMl}ml</Text>
              </View>
            </View>
            <View style={s.legendRow}>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: WATER_COLOR }]} />
                <Text style={s.legendTxt}>水</Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: OTHER_COLOR }]} />
                <Text style={s.legendTxt}>其他飲品</Text>
              </View>
            </View>
          </View>

          <View style={s.caffWrap}>
            <View style={s.caffCircle}>
              <Animated.View style={[s.caffLiquid, {
                height: caffHeight,
                backgroundColor: CAFFEINE_COLOR,
              }]} />
              <View style={s.caffContent} pointerEvents="none">
                <Text style={s.caffNum}>{totalCaffeine}</Text>
                <Text style={s.caffUnit}>mg</Text>
              </View>
            </View>
            <Text style={s.caffTitle}>咖啡因</Text>
          </View>
        </View>

        {/* 復原/重做 + 目前飲品提示 */}
        <View style={s.undoRow}>
        <TouchableOpacity
  style={[s.arrowBtn, logs.length === 0 && { opacity: 0.35 }]}
  onPress={handleUndo}
  disabled={logs.length === 0}
  activeOpacity={0.75}>
  <View style={s.arrowLeft} />
</TouchableOpacity>

<View style={s.currentDrinkBadge}>
  <View style={[s.drinkDot, { backgroundColor: dotColor, width: 7, height: 7 }]} />
  <Text style={s.currentDrinkTxt}>目前飲品：{drinkType}</Text>
</View>

<TouchableOpacity
  style={[s.arrowBtn, !lastDeleted && { opacity: 0.35 }]}
  onPress={handleRedo}
  disabled={!lastDeleted}
  activeOpacity={0.75}>
  <View style={s.arrowRight} />
</TouchableOpacity>
        </View>

        {/* 快速記錄 */}
        <View style={s.quickGrid}>
          <TouchableOpacity style={s.qBtn} onPress={() => quickLog(30)} activeOpacity={0.75}>
            <Text style={s.qBtnName}>一口</Text>
            <Text style={s.qBtnMl}>30ml</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.qBtn} onPress={() => quickLog(60)} activeOpacity={0.75}>
            <Text style={s.qBtnName}>一大口</Text>
            <Text style={s.qBtnMl}>60ml</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.qBtn, s.qBtnPlus]}
            onPress={() => setShowAddModal(true)} activeOpacity={0.75}>
            <Text style={[s.qBtnName, { color: '#3498db', fontSize: 20 }]}>＋</Text>
            <Text style={s.qBtnMl}>自訂 ml</Text>
          </TouchableOpacity>
        </View>

        <View style={s.infoCard}>
          <View style={s.dataRow}>
            <View style={s.dataItem}>
              <Text style={s.dataLabel}>已飲用</Text>
              <Text style={s.dataValue}>{totalMl} <Text style={s.unit}>ml</Text></Text>
            </View>
            <View style={s.divider} />
            <View style={s.dataItem}>
              <Text style={s.dataLabel}>今日目標</Text>
              <Text style={s.dataValue}>{goalMl} <Text style={s.unit}>ml</Text></Text>
            </View>
            <View style={s.divider} />
            <View style={s.dataItem}>
                <Text style={s.dataLabel}>咖啡因｜上限 {MAX_CAFFEINE}mg</Text>
                <Text style={[s.dataValue, { color: caffStatusColor, fontSize: 18 }]}>
                    {totalCaffeine} <Text style={s.unit}>mg</Text>
                </Text>
                <Text style={[s.caffStatusSmall, { color: caffStatusColor }]}>{caffStatus}</Text>
            </View>
          </View>
          <Text style={s.statusText}>裝置狀態：{isConnected ? '已連線' : '未連線'}</Text>
        </View>

      </SafeAreaView>

      <Modal visible={showCustomDrinkModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>自訂飲品</Text>
            <Text style={s.modalLbl}>飲品名稱</Text>
            <TextInput
              style={s.modalInp}
              value={customDrinkInput}
              onChangeText={v => { setCustomDrinkInput(v); setLookupResult(null); }}
              placeholder="例：全家中冰美、珍珠奶茶..."
              placeholderTextColor="#bbb"
              autoFocus
            />
            <TouchableOpacity
              style={[s.lookupBtn, isLookingUp && { opacity: 0.6 }]}
              onPress={() => {
                if (!customDrinkInput.trim()) { Alert.alert('請先輸入飲品名稱'); return; }
                lookupCaffeine(customDrinkInput.trim());
              }}
              disabled={isLookingUp}
              activeOpacity={0.8}>
              {isLookingUp
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.lookupBtnTxt}>AI 查詢咖啡因含量</Text>
              }
            </TouchableOpacity>

            {lookupResult && (
              <View style={s.resultBox}>
                <Text style={s.resultTitle}>{lookupResult.name}</Text>
                <View style={s.resultRow}>
                  <View style={s.resultItem}>
                    <Text style={s.resultLbl}>整杯咖啡因</Text>
                    <Text style={s.resultVal}>{lookupResult.totalCaffeine} mg</Text>
                  </View>
                  <View style={s.resultItem}>
                    <Text style={s.resultLbl}>整杯容量</Text>
                    <Text style={s.resultVal}>{lookupResult.totalMl} ml</Text>
                  </View>
                  <View style={s.resultItem}>
                    <Text style={s.resultLbl}>每 100ml</Text>
                    <Text style={s.resultVal}>{lookupResult.per100ml} mg</Text>
                  </View>
                </View>
                <Text style={s.resultNote}>* 數值為 AI 估算，僅供參考</Text>
              </View>
            )}

            <View style={s.modalBtns}>
              <TouchableOpacity style={s.modalCancel}
                onPress={() => {
                  setShowCustomDrinkModal(false);
                  setCustomDrinkInput('');
                  setLookupResult(null);
                }}>
                <Text style={s.modalCancelTxt}>取消</Text>
              </TouchableOpacity>
              {!lookupResult && (
                <TouchableOpacity style={s.modalConfirm}
                  onPress={() => {
                    const name = customDrinkInput.trim();
                    if (!name) { Alert.alert('請輸入飲品名稱'); return; }
                    setCustomDrinks(prev => prev.includes(name) ? prev : [...prev, name]);
                    setDrinkType(name);
                    setShowCustomDrinkModal(false);
                    setCustomDrinkInput('');
                  }}>
                  <Text style={s.modalConfirmTxt}>直接新增</Text>
                </TouchableOpacity>
              )}
              {lookupResult && (
                <TouchableOpacity style={[s.modalConfirm, { backgroundColor: '#5ecb6b' }]}
                  onPress={confirmLookupResult}>
                  <Text style={s.modalConfirmTxt}>確認並使用</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>新增飲水紀錄</Text>
            <Text style={s.modalLbl}>飲品類型</Text>
            <View style={s.drinkTypeRow}>
              {['水', '咖啡', '茶', ...customDrinks].map(d => (
                <TouchableOpacity key={d}
                  style={[s.drinkChip, drinkType === d && s.drinkChipSel]}
                  onPress={() => setDrinkType(d)} activeOpacity={0.75}>
                  <View style={[s.chipDot, { backgroundColor: d === '水' ? WATER_COLOR : OTHER_COLOR }]} />
                  <Text style={[s.drinkChipTxt, drinkType === d && { color: '#3498db' }]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.modalLbl}>毫升數</Text>
            <View style={s.mlQuickRow}>
              {['100','150','200','250','350','500'].map(v => (
                <TouchableOpacity key={v}
                  style={[s.mlChip, addMl === v && s.mlChipSel]}
                  onPress={() => setAddMl(v)}>
                  <Text style={[s.mlChipTxt, addMl === v && { color: '#3498db' }]}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={s.modalInp} keyboardType="numeric"
              value={addMl} onChangeText={setAddMl}
              placeholder="或輸入自訂毫升數" placeholderTextColor="#bbb" />
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setShowAddModal(false)}>
                <Text style={s.modalCancelTxt}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalConfirm} onPress={handleAddCustom}>
                <Text style={s.modalConfirmTxt}>新增</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ImageBackground>
  );
}

const s = StyleSheet.create({
  background: { flex: 1, width: '100%' },
  container:  { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40 },
  PickerButton: { backgroundColor: 'rgba(255,255,255,0.9)', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 15, borderWidth: 1, borderColor: '#E1E8EE' },
  drinkLabel: { fontSize: 12, color: '#999', fontWeight: '600' },
  drinkRow:   { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  drinkDot:   { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  drinkName:  { fontSize: 20, fontWeight: 'bold', color: '#333' },
  mainRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 8 },
  waterWrap: { alignItems: 'center', gap: 10 },
  circle: { width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2, backgroundColor: 'rgba(255,255,255,0.85)', borderWidth: 8, borderColor: '#AEE2FF', overflow: 'hidden' },
  liquidContainer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  liquidLayer:     { width: '100%' },
  circleContent:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  cupImage:        { width: 100, height: 100, marginBottom: 2 },
  progressPct:     { fontSize: 30, fontWeight: '900', color: '#333' },
  progressMl:      { fontSize: 11, color: '#666', fontWeight: '700' },
  legendRow:  { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:  { width: 9, height: 9, borderRadius: 5 },
  legendTxt:  { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '700' },
  caffStatusSmall: { fontSize: 11, fontWeight: '800', marginTop: 2 },
  caffWrap:   { alignItems: 'center', gap: 6 },
  caffCircle: { width: CAFF_SIZE, height: CAFF_SIZE, borderRadius: CAFF_SIZE / 2, backgroundColor: 'rgba(255,255,255,0.85)', borderWidth: 5, borderColor: '#d4b896', overflow: 'hidden' },
  caffLiquid:  { position: 'absolute', bottom: 0, left: 0, right: 0, opacity: 0.85 },
  caffContent: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  caffNum:     { fontSize: 22, fontWeight: '900', color: '#fff' },
  caffUnit:    { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '700' },
  caffTitle:   { fontSize: 13, fontWeight: '900', color: 'rgba(255,255,255,0.95)' },
  caffStatus:  { fontSize: 11, fontWeight: '800' },
  caffMax:     { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '700' },

  undoRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  arrowBtn:   { backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#E1E8EE' },
  arrowLeft:  { width: 0, height: 0, borderTopWidth: 8, borderBottomWidth: 8, borderRightWidth: 14, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: '#555', marginRight: 3 },
  arrowRight: { width: 0, height: 0, borderTopWidth: 8, borderBottomWidth: 8, borderLeftWidth: 14, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: '#555', marginLeft: 3 },
  currentDrinkBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 },
  currentDrinkTxt:   { fontSize: 12, fontWeight: '800', color: '#333' },

  quickGrid: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  qBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 16, paddingVertical: 13, alignItems: 'center', gap: 3, borderWidth: 1.5, borderColor: '#E1E8EE' },
  qBtnPlus: { borderColor: '#3498db', backgroundColor: 'rgba(52,152,219,0.08)' },
  qBtnName: { fontSize: 13, fontWeight: '900', color: '#333' },
  qBtnMl:   { fontSize: 11, fontWeight: '700', color: '#999' },
  infoCard:   { backgroundColor: '#FFF', borderRadius: 30, padding: 22, marginBottom: 36 },
  dataRow:    { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  dataItem:   { alignItems: 'center' },
  dataLabel:  { fontSize: 12, color: '#999', marginBottom: 4 },
  dataValue:  { fontSize: 20, fontWeight: 'bold', color: '#333' },
  unit:       { fontSize: 12, color: '#666' },
  divider:    { width: 1, height: 36, backgroundColor: '#EEE' },
  statusText: { textAlign: 'center', marginTop: 12, fontSize: 12, color: '#BBB' },
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard:      { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle:     { fontSize: 20, fontWeight: '900', color: '#333', marginBottom: 18 },
  modalLbl:       { fontSize: 11, fontWeight: '800', color: '#5a7a96', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 },
  lookupBtn:      { backgroundColor: '#a07850', paddingVertical: 13, borderRadius: 14, alignItems: 'center', marginBottom: 14 },
  lookupBtnTxt:   { color: '#fff', fontSize: 14, fontWeight: '900' },
  resultBox:      { backgroundColor: '#fef9f4', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1.5, borderColor: '#e8d5b8' },
  resultTitle:    { fontSize: 15, fontWeight: '900', color: '#5a3e1b', marginBottom: 10 },
  resultRow:      { flexDirection: 'row', justifyContent: 'space-between' },
  resultItem:     { alignItems: 'center', flex: 1 },
  resultLbl:      { fontSize: 10, color: '#8a6a4a', fontWeight: '800', marginBottom: 3 },
  resultVal:      { fontSize: 16, fontWeight: '900', color: '#5a3e1b' },
  resultNote:     { fontSize: 10, color: '#b8a090', marginTop: 8, textAlign: 'center' },
  drinkTypeRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  drinkChip:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 2, borderColor: '#E1E8EE', backgroundColor: '#f6fafd' },
  drinkChipSel:   { borderColor: '#3498db', backgroundColor: 'rgba(52,152,219,0.08)' },
  chipDot:        { width: 8, height: 8, borderRadius: 4 },
  drinkChipTxt:   { fontSize: 13, fontWeight: '800', color: '#999' },
  mlQuickRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  mlChip:         { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, borderColor: '#E1E8EE', backgroundColor: '#f6fafd' },
  mlChipSel:      { borderColor: '#3498db', backgroundColor: 'rgba(52,152,219,0.08)' },
  mlChipTxt:      { fontSize: 13, fontWeight: '800', color: '#999' },
  modalInp:       { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, borderWidth: 2, borderColor: '#E1E8EE', fontSize: 16, fontWeight: '700', color: '#333', backgroundColor: '#f6fafd', marginBottom: 14 },
  modalBtns:      { flexDirection: 'row', gap: 10 },
  modalCancel:    { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 2, borderColor: '#E1E8EE' },
  modalCancelTxt: { fontSize: 15, fontWeight: '800', color: '#999' },
  modalConfirm:   { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: '#3498db' },
  modalConfirmTxt:{ fontSize: 15, fontWeight: '900', color: '#fff' },
});