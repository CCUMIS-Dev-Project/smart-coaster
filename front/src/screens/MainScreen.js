import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ImageBackground, Image,
  TouchableOpacity, SafeAreaView, Alert, Modal, TextInput,
  Animated, ActivityIndicator, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useBLE from '../hooks/useBLE';
import SettingScreen from '../screens/SettingScreen.js';
import ReminderSettingScreen from '../screens/ReminderSettingScreen.js';
import apiService from '../services/api';
import { useApp } from '../context/AppContext';
import { colors, DRINK_TYPES } from '../constants/theme';

const { blue: BLUE, text: TEXT, muted: MUTED, border: BORDER, card: CARD, bg: BG } = colors;

const CUP_HEIGHT = 260;
const CUP_WIDTH  = 200;

const WATER_COLOR    = '#5ab4f5';
const OTHER_COLOR    = '#c8a878';
const CAFFEINE_COLOR = '#3b1f0a';
const CIRCLE_SIZE    = 260;
const CAFF_SIZE      = 110;
const GROQ_API_KEY   = 'YOUR_GROQ_API_KEY';

const BASE_CAFFEINE = {
  '水':   0,
  '咖啡': 80,
  '茶':   30,
  '手搖': 50,
  '其他': 40,
};

const DRINK_COLORS = {
  '水':   '#a8d8f0',
  '咖啡': '#c8a878',
  '茶':   '#c8e6a0',
  '手搖': '#f0a8c8',
  '其他': '#c8c0e8',
};

// ── 大水杯元件 ────────────────────────────────────────────
function WaterCup({ logs, goalMl, totalMl }) {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const pct = Math.min(1, totalMl / Math.max(goalMl, 1));

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: pct,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const totalFillHeight = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, CUP_HEIGHT],
  });

  const progressWidth = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const segments = logs.map(log => ({
    ...log,
    segHeight: Math.max(Math.round((log.ml / Math.max(goalMl, 1)) * CUP_HEIGHT), 30),
    color: DRINK_COLORS[log.type] || '#c8c0e8',
  }));

  return (
    <View style={cup.wrap}>
      <View style={cup.cupOuter}>
        <View style={cup.rim} />
        <View style={cup.cupBody}>
          <Animated.View style={[cup.fillWrap, { height: totalFillHeight }]}>
            {[...segments].reverse().map((seg, i) => (
              <View key={seg.id} style={[cup.segment, {
                height: seg.segHeight,
                backgroundColor: seg.color,
                borderTopWidth: i > 0 ? 1.5 : 0,
                borderTopColor: 'rgba(255,255,255,0.5)',
              }]}>
                <Text style={cup.segName}>{seg.type}</Text>
                <Text style={cup.segMl}>{seg.ml}ml</Text>
              </View>
            ))}
          </Animated.View>
          {logs.length > 0 && (
            <Animated.View style={[cup.waterLine, { bottom: totalFillHeight }]} />
          )}
          {logs.length === 0 && (
            <View style={cup.emptyWrap}>
              <Text style={cup.emptyTxt}>還沒有記錄</Text>
              <Text style={cup.emptySubTxt}>喝水吧</Text>
            </View>
          )}
        </View>
        <View style={cup.handle} />
      </View>

      {/* 進度條 */}
      <View style={cup.progressWrap}>
        <View style={cup.progressHeader}>
          <Text style={cup.progressPct}>{Math.round(pct * 100)}%</Text>
          <Text style={cup.progressMl}>{totalMl} / {goalMl} ml</Text>
        </View>
        <View style={cup.progressTrack}>
          <Animated.View style={[cup.progressFill, { width: progressWidth }]} />
        </View>
      </View>
    </View>
  );
}



const MainScreen = () => {
  const { scanAndConnect, connectedDevice, bleData } = useBLE();

  const {
      profile, goalMl, totalMl, logs,
      addLog, updateLog, deleteLog, deleteLogs,
      sensorData, setSensorData, syncHardwareDrink,
    } = useApp();
  
    const age = profile?.age || 25;
    const MAX_CAFFEINE = age < 12 ? 0 : age < 18 ? 100 : age < 65 ? 400 : 300;
  
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
    const [selMode, setSelMode] = useState(false);
    const [selected, setSelected] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingLog, setEditingLog] = useState(null);
    const [editMl, setEditMl] = useState('');
  
    const isConnected = sensorData.connected;
    const pct = Math.min(totalMl / Math.max(goalMl, 1), 1);
  

    // const [showAddModal,     setShowAddModal]     = useState(false);
    // const [showEditModal,    setShowEditModal]    = useState(false);
    // const [editingLog,       setEditingLog]       = useState(null);
    // const [selMode,          setSelMode]          = useState(false);
    // const [selected,         setSelected]         = useState([]);
    // const [addMl,            setAddMl]            = useState('250');
    // const [addType,          setAddType]          = useState(DRINK_TYPES[0]);
    // const [customDrinkName,  setCustomDrinkName]  = useState('');
    // const [editMl,           setEditMl]           = useState('');
    // const [editType,         setEditType]         = useState(DRINK_TYPES[0]);
    // const [editCustomName,   setEditCustomName]   = useState('');
  
    // const now = new Date();
    // const DAYS = ['週日','週一','週二','週三','週四','週五','週六'];
    // const dateStr = `${DAYS[now.getDay()]} · ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
  
    // const hasCoaster  = profile.hasCoaster;
    // const isConnected = sensorData.connected;
  
    // 計算咖啡因的函數
    function getCaffeineMg(type, ml) {
      if (customCaffeine[type]) return Math.round((customCaffeine[type].per100ml * ml) / 100);
      const per100 = BASE_CAFFEINE[type] ?? 40;
      return Math.round((per100 * ml) / 100);
    }
    // 計算總咖啡因
    const totalCaffeine = logs.reduce((sum, log) => sum + getCaffeineMg(log.type, log.ml), 0);
    const caffPct = MAX_CAFFEINE > 0 ? Math.min(totalCaffeine / MAX_CAFFEINE, 1) : 0;
    const caffAnim = useRef(new Animated.Value(0)).current;
  
    useEffect(() => {
      Animated.timing(caffAnim, { toValue: caffPct, duration: 600, useNativeDriver: false }).start();
    }, [caffPct]);
  
    const caffHeight = caffAnim.interpolate({ inputRange: [0, 1], outputRange: [0, CAFF_SIZE] });
  
    const segments = [...logs].reverse().map(log => ({
      id: log.id,
      height: Math.max((log.ml / Math.max(goalMl, 1)) * CIRCLE_SIZE, 2),
      color: log.type === '水' ? WATER_COLOR : OTHER_COLOR,
    }));


    const handleConnect = async () => {
      // 顯示掃描中的提示
      Alert.alert('連接杯墊', '正在掃描附近的智慧杯墊...');
      
      try {
        await scanAndConnect(); 
        // scanAndConnect 是從 useBLE() 拿出來的
      } catch (error) {
        console.error(error);
        Alert.alert('連線失敗', '請確認藍牙已開啟');
      }
    };

    function handleUndo() {
      if (logs.length === 0) return;
      const last = logs[logs.length - 1];
      setLastDeleted(last);
      deleteLog(last.id);
    }
    
    function handleRedo() {
      if (!lastDeleted) return;
      addLog(lastDeleted.ml, lastDeleted.type, '');
      setLastDeleted(null);
    }
    
    function handleDeleteOne(id) {
      const target = logs.find(l => l.id === id);
      if (target) setLastDeleted(target);
      deleteLog(id);
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

    

    function handleDeleteSelected() {
      Alert.alert('刪除紀錄', `確定刪除 ${selected.length} 筆紀錄？`, [
        { text: '取消', style: 'cancel' },
        { text: '刪除', style: 'destructive', onPress: () => {
          deleteLogs(selected); setSelected([]); setSelMode(false);
        }},
      ]);
    }

    function toggleSelect(id) {
      setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }

    function openEdit(log) {
      setEditingLog(log);
      setEditMl(String(log.ml));
      setShowEditModal(true);
    }

    function handleEdit() {
      const ml = parseInt(editMl);
      if (!ml || ml <= 0) { Alert.alert('請輸入有效的毫升數'); return; }
      updateLog(editingLog.id, { ml, type: editingLog.type, emoji: '' });
      setShowEditModal(false);
      setEditingLog(null);
    }

    async function lookupCaffeine(drinkName) {
      setIsLookingUp(true);
      setLookupResult(null);
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
          body: JSON.stringify({
            model: 'llama3-8b-8192',
            messages: [
              { role: 'system', content: `你是一個飲品咖啡因資料庫。當使用者輸入飲品名稱，你要回答這個飲品的咖啡因含量。請只用以下 JSON 格式回覆，不要加任何其他文字：{"name":"飲品名稱","totalCaffeine":數字,"totalMl":數字,"per100ml":數字}` },
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
          Alert.alert('查詢失敗', '找不到這個飲品的咖啡因資料');
        }
      } catch { Alert.alert('查詢失敗', '請確認網路連線或 API Key'); }
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

    const handleChangeDrink = () => {
      const BASE = ['水', '咖啡', '茶'];
      Alert.alert(
        '目前飲用',
        '選好飲品後，用快速記錄鍵記錄喝水量',
        [
          { text: '水',   onPress: () => setDrinkType('水') },
          { text: '咖啡', onPress: () => setDrinkType('咖啡') },
          { text: '茶',   onPress: () => setDrinkType('茶') },
          { text: '取消', style: 'cancel' },
        ]
      );
    };

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

    // 監聽藍牙原始數據並解析
    useEffect(() => {
      if (!bleData) return;

      const parts = bleData.split('|');
      const type = parts[0]; // 'W' 或 'E'

      if (type === 'W') {
        // 格式: W | systemActive | isOnCoaster | drinkAmount
        const isOnCoaster = parts[2] === '1';
        const drinkAmount = parseFloat(parts[3]);

        setSensorData(prev => ({ 
          ...prev, 
          connected: true, 
          isOnCoaster: isOnCoaster 
        }));

        // 同步喝水量到 App 紀錄中
        syncHardwareDrink(drinkAmount);

      } else if (type === 'E') {
        // 格式: E | temp | hum | reminder_min
        const temp = parseFloat(parts[1]);
        const hum = parseFloat(parts[2]);

        setSensorData(prev => ({ 
          ...prev, 
          temperature: temp, 
          humidity: hum,
          connected: true
        }));
      }
    }, [bleData]);

    // 更新連線狀態 (處理斷線情況)
    useEffect(() => {
      setSensorData(prev => ({ ...prev, connected: !!connectedDevice }));
    }, [connectedDevice]);


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

        {/* 圓圈區 */}
        <View style={s.mainRow}>
          <View style={s.waterWrap}>
            <View style={s.circle}>
              <View style={s.liquidContainer}>
                {(() => {
                  const merged = segments.reduce((acc, seg) => {
                    const last = acc[acc.length - 1];
                    if (last && last.color === seg.color) { last.height += seg.height; }
                    else { acc.push({ ...seg }); }
                    return acc;
                  }, []);
                  return merged.map((seg, i) => (
                    <View key={i} style={[s.liquidLayer, { height: seg.height, backgroundColor: seg.color, opacity: 0.82 }]} />
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
              <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: WATER_COLOR }]} /><Text style={s.legendTxt}>水</Text></View>
              <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: OTHER_COLOR }]} /><Text style={s.legendTxt}>其他飲品</Text></View>
            </View>
          </View>

          <View style={s.caffWrap}>
            <View style={s.caffCircle}>
              <Animated.View style={[s.caffLiquid, { height: caffHeight, backgroundColor: CAFFEINE_COLOR }]} />
              <View style={s.caffContent} pointerEvents="none">
                <Text style={s.caffNum}>{totalCaffeine}</Text>
                <Text style={s.caffUnit}>mg</Text>
              </View>
            </View>
            <Text style={s.caffTitle}>咖啡因</Text>
<View style={[s.caffStatusBadge, { backgroundColor: caffStatusColor }]}>
  <Text style={s.caffStatusBadgeTxt}>{caffStatus}</Text>
</View>
<Text style={s.caffMax}>上限 {MAX_CAFFEINE}mg</Text>
</View>
        </View>

        {/* 復原/重做 + 飲品提示 */}
        <View style={s.undoRow}>
          <TouchableOpacity style={[s.arrowBtn, logs.length === 0 && { opacity: 0.35 }]} onPress={handleUndo} disabled={logs.length === 0} activeOpacity={0.75}>
            <View style={s.arrowLeft} />
          </TouchableOpacity>
          <View style={s.currentDrinkBadge}>
            <View style={[s.drinkDot, { backgroundColor: dotColor, width: 7, height: 7 }]} />
            <Text style={s.currentDrinkTxt}>目前飲品：{drinkType}</Text>
          </View>
          <TouchableOpacity style={[s.arrowBtn, !lastDeleted && { opacity: 0.35 }]} onPress={handleRedo} disabled={!lastDeleted} activeOpacity={0.75}>
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
          <TouchableOpacity style={[s.qBtn, s.qBtnPlus]} onPress={() => setShowAddModal(true)} activeOpacity={0.75}>
            <Text style={[s.qBtnName, { color: '#3498db', fontSize: 20 }]}>＋</Text>
            <Text style={s.qBtnMl}>手動新增</Text>
          </TouchableOpacity>
        </View>

        {/* 今日紀錄 */}
        <View style={s.logCard}>
          <View style={s.logHead}>
            <Text style={s.logTitle}>今日紀錄</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {selMode && (
                <>
                  <TouchableOpacity onPress={() => {
                    if (selected.length === logs.length) setSelected([]);
                    else setSelected(logs.map(l => l.id));
                  }}>
                    <Text style={s.logAction}>{selected.length === logs.length ? '取消全選' : '全選'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDeleteSelected}>
                    <Text style={[s.logAction, { color: '#f87171' }]}>刪除({selected.length})</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity onPress={() => { setSelMode(!selMode); setSelected([]); }}>
                <Text style={s.logAction}>{selMode ? '取消' : '編輯'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={s.logScroll} showsVerticalScrollIndicator={false}>
            {logs.length === 0 && <Text style={s.emptyTxt}>還沒有記錄，喝水吧！</Text>}
            {logs.map((log) => (
              <TouchableOpacity key={log.id}
                style={[s.logItem, selMode && selected.includes(log.id) && s.logItemSel]}
                onPress={() => selMode ? toggleSelect(log.id) : openEdit(log)}
                onLongPress={() => { setSelMode(true); toggleSelect(log.id); }}
                activeOpacity={0.75}>
                {selMode && (
                  <View style={[s.checkbox, selected.includes(log.id) && s.checkboxSel]}>
                    {selected.includes(log.id) && <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>}
                  </View>
                )}
                <View style={[s.logDot, { backgroundColor: DRINK_COLORS[log.type] || '#5ab4f5' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.logAmt}>{log.ml} ml · {log.type}</Text>
                  <Text style={s.logMeta}>{log.time} · {getCaffeineMg(log.type, log.ml)}mg 咖啡因</Text>
                </View>
                {!selMode && (
                  <TouchableOpacity onPress={() => handleDeleteOne(log.id)}>
                    <Text style={{ color: '#f87171', fontSize: 18 }}>×</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

      </SafeAreaView>

      {/* 自訂飲品 Modal */}
      <Modal visible={showCustomDrinkModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>自訂飲品</Text>
            <Text style={s.modalLbl}>飲品名稱</Text>
            <TextInput style={s.modalInp} value={customDrinkInput}
              onChangeText={v => { setCustomDrinkInput(v); setLookupResult(null); }}
              placeholder="例：全家中冰美、珍珠奶茶..." placeholderTextColor="#bbb" autoFocus />
            <TouchableOpacity style={[s.lookupBtn, isLookingUp && { opacity: 0.6 }]}
              onPress={() => { if (!customDrinkInput.trim()) { Alert.alert('請先輸入飲品名稱'); return; } lookupCaffeine(customDrinkInput.trim()); }}
              disabled={isLookingUp} activeOpacity={0.8}>
              {isLookingUp ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.lookupBtnTxt}>AI 查詢咖啡因含量</Text>}
            </TouchableOpacity>
            {lookupResult && (
              <View style={s.resultBox}>
                <Text style={s.resultTitle}>{lookupResult.name}</Text>
                <View style={s.resultRow}>
                  <View style={s.resultItem}><Text style={s.resultLbl}>整杯咖啡因</Text><Text style={s.resultVal}>{lookupResult.totalCaffeine} mg</Text></View>
                  <View style={s.resultItem}><Text style={s.resultLbl}>整杯容量</Text><Text style={s.resultVal}>{lookupResult.totalMl} ml</Text></View>
                  <View style={s.resultItem}><Text style={s.resultLbl}>每 100ml</Text><Text style={s.resultVal}>{lookupResult.per100ml} mg</Text></View>
                </View>
                <Text style={s.resultNote}>* 數值為 AI 估算，僅供參考</Text>
              </View>
            )}
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.modalCancel} onPress={() => { setShowCustomDrinkModal(false); setCustomDrinkInput(''); setLookupResult(null); }}>
                <Text style={s.modalCancelTxt}>取消</Text>
              </TouchableOpacity>
              {!lookupResult && (
                <TouchableOpacity style={s.modalConfirm} onPress={() => {
                  const name = customDrinkInput.trim();
                  if (!name) { Alert.alert('請輸入飲品名稱'); return; }
                  setCustomDrinks(prev => prev.includes(name) ? prev : [...prev, name]);
                  setDrinkType(name); setShowCustomDrinkModal(false); setCustomDrinkInput('');
                }}>
                  <Text style={s.modalConfirmTxt}>直接新增</Text>
                </TouchableOpacity>
              )}
              {lookupResult && (
                <TouchableOpacity style={[s.modalConfirm, { backgroundColor: '#5ecb6b' }]} onPress={confirmLookupResult}>
                  <Text style={s.modalConfirmTxt}>確認並使用</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* 新增飲水 Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>新增飲水紀錄</Text>
            <Text style={s.modalLbl}>飲品類型</Text>
            <View style={s.drinkTypeRow}>
              {['水', '咖啡', '茶', ...customDrinks].map(d => (
                <TouchableOpacity key={d} style={[s.drinkChip, drinkType === d && s.drinkChipSel]} onPress={() => setDrinkType(d)} activeOpacity={0.75}>
                  <View style={[s.chipDot, { backgroundColor: d === '水' ? WATER_COLOR : OTHER_COLOR }]} />
                  <Text style={[s.drinkChipTxt, drinkType === d && { color: '#3498db' }]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.modalLbl}>毫升數</Text>
            <View style={s.mlQuickRow}>
              {['100','150','200','250','350','500'].map(v => (
                <TouchableOpacity key={v} style={[s.mlChip, addMl === v && s.mlChipSel]} onPress={() => setAddMl(v)}>
                  <Text style={[s.mlChipTxt, addMl === v && { color: '#3498db' }]}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={s.modalInp} keyboardType="numeric" value={addMl} onChangeText={setAddMl} placeholder="或輸入自訂毫升數" placeholderTextColor="#bbb" />
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

      {/* 編輯 Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>編輯紀錄</Text>
            <Text style={s.modalLbl}>毫升數</Text>
            <TextInput style={s.modalInp} keyboardType="numeric" value={editMl} onChangeText={setEditMl} />
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setShowEditModal(false)}>
                <Text style={s.modalCancelTxt}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalConfirm} onPress={handleEdit}>
                <Text style={s.modalConfirmTxt}>儲存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ImageBackground>
  );
}

const cup = StyleSheet.create({
  wrap:     { alignItems: 'center', paddingVertical: 12 },
  cupOuter: { width: CUP_WIDTH, position: 'relative' },
  rim: {
    width: CUP_WIDTH, height: 16,
    backgroundColor: '#d0e8f8', borderRadius: 8,
    borderWidth: 3, borderColor: '#a8cce8', zIndex: 2,
  },
  cupBody: {
    width: CUP_WIDTH - 8, height: CUP_HEIGHT,
    marginHorizontal: 4,
    backgroundColor: 'rgba(220,240,255,0.3)',
    borderWidth: 3, borderTopWidth: 0, borderColor: '#a8cce8',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    overflow: 'hidden', justifyContent: 'flex-end',
  },
  fillWrap: {
    width: '100%', position: 'absolute', bottom: 0,
    overflow: 'hidden',
    borderBottomLeftRadius: 21, borderBottomRightRadius: 21,
    justifyContent: 'flex-end', zIndex: 1,
  },
  segment: {
    width: '100%', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 8,
  },
  segName:  { fontSize: 11, fontWeight: '800', color: 'rgba(0,0,0,0.6)' },
  segMl:    { fontSize: 11, fontWeight: '900', color: 'rgba(0,0,0,0.7)' },
  waterLine: {
    position: 'absolute', left: 0, right: 0, height: 2,
    backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 2,
  },
  emptyWrap:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  emptyTxt:    { fontSize: 14, color: '#8aaac0', fontWeight: '800' },
  emptySubTxt: { fontSize: 12, color: '#aac0d4' },
  handle: {
    position: 'absolute', right: -20, top: 40,
    width: 22, height: 60,
    borderWidth: 3, borderColor: '#a8cce8', borderLeftWidth: 0,
    borderTopRightRadius: 14, borderBottomRightRadius: 14,
    backgroundColor: 'transparent',
  },
  progressWrap:   { width: CUP_WIDTH, marginTop: 14, gap: 6 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressPct:    { fontSize: 20, fontWeight: '900', color: '#3a90d4' },
  progressMl:     { fontSize: 12, fontWeight: '700', color: MUTED },
  progressTrack:  { height: 10, backgroundColor: '#d0e8f8', borderRadius: 8, overflow: 'hidden' },
  progressFill:   { height: '100%', backgroundColor: '#5ab4f5', borderRadius: 8 },
});

const s = StyleSheet.create({
  background: { flex: 1, width: '100%' },
  container:  { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40 },
  PickerButton: { backgroundColor: 'rgba(255,255,255,0.9)', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 15, borderWidth: 1, borderColor: '#E1E8EE' },
  drinkLabel: { fontSize: 12, color: '#999', fontWeight: '600' },
  drinkRow:   { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  drinkDot:   { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  drinkName:  { fontSize: 20, fontWeight: 'bold', color: '#333' },
  mainRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 8 },
  waterWrap: { alignItems: 'center', gap: 8 },
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
  caffWrap:   { alignItems: 'center', gap: 4 },
  caffCircle: { width: CAFF_SIZE, height: CAFF_SIZE, borderRadius: CAFF_SIZE / 2, backgroundColor: 'rgba(255,255,255,0.85)', borderWidth: 5, borderColor: '#d4b896', overflow: 'hidden' },
  caffLiquid:  { position: 'absolute', bottom: 0, left: 0, right: 0, opacity: 0.85 },
  caffContent: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  caffNum:     { fontSize: 22, fontWeight: '900', color: '#fff' },
  caffUnit:    { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '700' },
  caffTitle:   { fontSize: 13, fontWeight: '900', color: 'rgba(255,255,255,0.95)' },
  caffStatusBadge:    { borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10, marginTop: 2 },
  caffStatusBadgeTxt: { fontSize: 11, fontWeight: '900', color: '#fff' },
  caffMax:     { fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: '700' },
  undoRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  arrowBtn:   { backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#E1E8EE' },
  arrowLeft:  { width: 0, height: 0, borderTopWidth: 8, borderBottomWidth: 8, borderRightWidth: 14, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: '#555', marginRight: 3 },
  arrowRight: { width: 0, height: 0, borderTopWidth: 8, borderBottomWidth: 8, borderLeftWidth: 14, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: '#555', marginLeft: 3 },
  currentDrinkBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 },
  currentDrinkTxt:   { fontSize: 12, fontWeight: '800', color: '#333' },
  quickGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  qBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 16, paddingVertical: 12, alignItems: 'center', gap: 3, borderWidth: 1.5, borderColor: '#E1E8EE' },
  qBtnPlus: { borderColor: '#3498db', backgroundColor: 'rgba(52,152,219,0.08)' },
  qBtnName: { fontSize: 13, fontWeight: '900', color: '#333' },
  qBtnMl:   { fontSize: 11, fontWeight: '700', color: '#999' },
  logCard:  { flex: 1, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 24, padding: 14, marginBottom: 16 },
  logHead:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  logTitle: { fontSize: 14, fontWeight: '900', color: '#333' },
  logAction:{ fontSize: 13, fontWeight: '800', color: '#3498db' },
  logScroll:{ flex: 1 },
  emptyTxt: { fontSize: 13, color: '#999', textAlign: 'center', paddingVertical: 16 },
  logItem:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 12, marginBottom: 6, backgroundColor: '#f8fafc' },
  logItemSel:{ backgroundColor: '#e8f4ff', borderWidth: 1.5, borderColor: '#3498db' },
  logDot:   { width: 10, height: 10, borderRadius: 5 },
  logAmt:   { fontSize: 14, fontWeight: '900', color: '#333' },
  logMeta:  { fontSize: 11, color: '#999' },
  checkbox:    { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center' },
  checkboxSel: { backgroundColor: '#3498db', borderColor: '#3498db' },
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

export default MainScreen;