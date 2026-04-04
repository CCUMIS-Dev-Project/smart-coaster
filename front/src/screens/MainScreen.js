import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Image, Pressable,
  TouchableOpacity, Alert, Modal, TextInput, KeyboardAvoidingView, Platform,
  Animated, ScrollView, Dimensions, PanResponder
} from 'react-native';
//SafeAreaView from react-native 在 Android 上不處理 status bar。要換成react-native-safe-area-context（Expo 內建）
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useBLE from '../hooks/useBLE';
import SettingScreen from '../screens/SettingScreen.js';
import ReminderSettingScreen from '../screens/ReminderSettingScreen.js';
import apiService from '../services/api';
import { useApp } from '../context/AppContext';
import { colors, DRINK_TYPES } from '../constants/theme';

const { blue: BLUE, text: TEXT, muted: MUTED, border: BORDER, card: CARD, bg: BG } = colors;

//常數區 / 顏色
const CUP_HEIGHT = 260;
const CUP_WIDTH  = 200;

const WATER_COLOR    = '#5ab4f5';
const OTHER_COLOR    = '#c8a878';
const CAFFEINE_COLOR = '#3b1f0a';
const { width: SCREEN_W } = Dimensions.get('window');
// 圓圈大小
const CIRCLE_SIZE = Math.min(240, Math.floor(SCREEN_W * 0.56)); // 依螢幕寬度縮放，最大 240
const CAFF_SIZE   = Math.min(100, Math.floor(SCREEN_W * 0.22)); // 咖啡因圓依比例縮
const BASE_CAFFEINE = {
  '水':   0,
  '咖啡': 80,
  '茶':   30,
};

const DRINK_COLORS = {
  '水':   '#a8d8f0',
  '咖啡': '#c8a878',
  '茶':   '#c8e6a0',
};
// 常數區 / 顏色 結束

const MainScreen = () => {
  const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2IiwiZXhwIjoxNzc0ODQ1MjAyfQ.sg3hv2Et8wdUt5FEAthgw9lhluIg0455kibOyd9AvV0"; // 先寫死access_token，待改！！
  const { scanAndConnect, connectedDevice, bleData ,writeToDevice} = useBLE(testToken); // 先用testToken，待改！！

  const {
      profile, goalMl, totalMl, logs,
      addLog, updateLog, deleteLog, deleteLogs,
      sensorData, setSensorData, syncHardwareDrink,
    } = useApp();
  
    const age = profile?.age || 25;
    // ── 咖啡因每日建議上限（純前端醫學準則，不需後端 DB）──────────
    // 12歲以下: 0mg｜12-17: 100mg｜18-64: 400mg｜65+: 300mg
    const MAX_CAFFEINE = age < 12 ? 0 : age < 18 ? 100 : age < 65 ? 400 : 300;
  
    const [drinkType, setDrinkType] = useState('水');
    const [showDrinkDropdown, setShowDrinkDropdown] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addMl, setAddMl] = useState('250');
    const [selMode, setSelMode] = useState(false);
    const [selected, setSelected] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingLog, setEditingLog] = useState(null);
    const [editMl, setEditMl] = useState('');
    const [editType, setEditType] = useState('水');
    const insets = useSafeAreaInsets();

    // ── 今日紀錄卡片可拉伸 ──── (高度設定)
    const SCREEN_H = Dimensions.get('window').height;
    const CARD_COLLAPSED = SCREEN_H * 0.26;
    const CARD_EXPANDED  = SCREEN_H * 0.74;
    const [logExpanded, setLogExpanded] = useState(false);
    const cardHeightAnim = useRef(new Animated.Value(CARD_COLLAPSED)).current;
    // 刪除確認 Modal（替代 Alert.alert，修正 Expo Web onPress 不觸發的 bug）
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
    const isConnected = sensorData.connected;
    // ⚠️ Math.min(..., 1) 讓進度最多顯示 100%，超過目標也不會超過圓圈
    // 若想讓超喝也繼續計算（例如顯示 120%），把 Math.min 的第二個參數拿掉即可：
    // const pct = totalMl / Math.max(goalMl, 1);
    const pct = Math.min(totalMl / Math.max(goalMl, 1), 1);
  
    // 計算咖啡因的函數
    function getCaffeineMg(type, ml) {
      const per100 = BASE_CAFFEINE[type] ?? 0;
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
      color: DRINK_COLORS[log.type] || WATER_COLOR,
    }));

    //藍牙區
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
    //藍牙區結束

    function quickLog(ml) { addLog(ml, drinkType, ''); }

    function handleAddCustom() {
      const ml = parseInt(addMl);
      if (!ml || ml <= 0) { Alert.alert('請輸入有效的毫升數'); return; }
      addLog(ml, drinkType, '');
      setShowAddModal(false);
      setAddMl('250');
    }

    

    // 開啟刪除確認 Modal（改用 Modal 替代 Alert，修正 Expo Web bug）
    function handleDeleteSelected() {
      if (selected.length === 0) return;
      setShowDeleteConfirm(true);
    }

    // 拖曳 handle：往上拖展開，往下拖收合
    const panResponder = useRef(PanResponder.create({
      onStartShouldSetPanResponder: () => true, // 搶先接管觸控，避免被外層 Pressable 攔截
      onMoveShouldSetPanResponder: (_, { dy }) => Math.abs(dy) > 5,
      onPanResponderRelease: (_, { dy }) => {
        if (dy < -30) {
          Animated.spring(cardHeightAnim, { toValue: CARD_EXPANDED, useNativeDriver: false }).start();
          setLogExpanded(true);
        } else if (dy > 30) {
          Animated.spring(cardHeightAnim, { toValue: CARD_COLLAPSED, useNativeDriver: false }).start();
          setLogExpanded(false);
        }
      },
    })).current;

    function toggleSelect(id) {
      setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }

    function openEdit(log) {
      setEditingLog(log);
      setEditMl(String(log.ml));
      setEditType(log.type || '水');
      setShowEditModal(true);
    }

    function handleEdit() {
      const ml = parseInt(editMl);
      if (!ml || ml <= 0) { Alert.alert('請輸入有效的毫升數'); return; }
      updateLog(editingLog.id, { ml, type: editType, emoji: '' });
      setShowEditModal(false);
      setEditingLog(null);
    }


    const cupImage = profile?.selectedCup?.image || require('../assets/cup_main.png');
    const dotColor = DRINK_COLORS[drinkType] || WATER_COLOR;

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
      const type = parts[0]; // 'W' 或 'E', 或 'O'

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
      }else if (type === 'O') {
        // O | 2024/03/24 15:30:00 | diffAmount
        const offlineTime = parts[1]; // 取出杯墊記錄的真實時間
        const diffAmount = parseFloat(parts[2]);
        
        if (diffAmount > 0) {
          console.log(`[BLE] 接收到離線數據補登: ${diffAmount}ml, 發生時間: ${offlineTime}`);
          
          // 如果你的 addLog 支援傳入時間，可以把 offlineTime 傳進去
          // 目前先維持原本的寫法，加上 🔄 標記
          addLog(diffAmount, drinkType, '🔄'); 
        }
      }
    // 記得在 Dependency Array 加入 drinkType 和 addLog
    }, [bleData]);

    // 更新連線狀態並執行 RTC 校時
    useEffect(() => {
      setSensorData(prev => ({ ...prev, connected: !!connectedDevice }));

      // 當裝置成功連線時
      if (connectedDevice) {
        const now = new Date();
        // 組合時間指令格式: T|YYYY|MM|DD|HH|MM|SS
        const timeCmd = `T|${now.getFullYear()}|${now.getMonth() + 1}|${now.getDate()}|${now.getHours()}|${now.getMinutes()}|${now.getSeconds()}`;
        
        console.log("[BLE] 準備發送校時指令:", timeCmd);
        
        // 呼叫從 useBLE 拿到的寫入函數
        if (writeToDevice) {
            writeToDevice(timeCmd);
        } else {
            console.warn("useBLE 中沒有找到寫入函數，無法執行校時！");
        }
      }
    }, [connectedDevice]);


  return (
    <Pressable style={s.background} onPress={() => setShowDrinkDropdown(false)}>
      <SafeAreaView style={[s.container, { paddingBottom: CARD_COLLAPSED + 16 }]}>

        {/* 下拉選單+連接杯墊 */}
        <View style={s.header}>
          <View style={s.drinkDropdownWrap}>
            
            <TouchableOpacity style={s.PickerButton} onPress={() => setShowDrinkDropdown(v => !v)}>
              {/*<Text style={s.drinkLabel}>飲品</Text>*/}
              <View style={s.drinkRow}>
                <View style={[s.drinkDot, { backgroundColor: dotColor }]} />
                <Text style={s.drinkName}>{drinkType}</Text>
                <Ionicons name={showDrinkDropdown ? "chevron-up" : "chevron-down"} size={18} color="#3498db" style={{ marginLeft: 5 }} />
              </View>
            </TouchableOpacity>

            {showDrinkDropdown && (
              <View style={s.dropdown}>
                {['水', '咖啡', '茶'].map(d => (
                  <TouchableOpacity key={d} style={s.dropdownItem}
                    onPress={() => { setDrinkType(d); setShowDrinkDropdown(false); }}>
                    <View style={[s.drinkDot, { backgroundColor: DRINK_COLORS[d] }]} />
                    <Text style={[s.dropdownTxt, drinkType === d && s.dropdownTxtSel]}>{d}</Text>
                    {drinkType === d && <Ionicons name="checkmark" size={15} color="#3498db" />}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={[s.dropdownItem, s.dropdownItemPlus]}
                  onPress={() => setShowDrinkDropdown(false)}>
                  <Text style={s.dropdownPlus}>＋</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity style={s.PickerButton} onPress={handleConnect}>
            <Text style={s.drinkLabel}>杯墊</Text>
            <Text style={[s.drinkName, { fontSize: 14, color: isConnected ? '#4ade80' : '#f87171' }]}>
              {isConnected ? '已連線' : '未連線'}
            </Text>
          </TouchableOpacity>
        </View>
        {/*下拉選單+連接杯墊區結束 */}

        {/* ── 圓圈區 ──────────────────────────────────────────────────
             flex:1 讓圓圈群組垂直置中於 header 與 quickGrid 之間的剩餘空間
             CIRCLE_SIZE / CAFF_SIZE 已依 SCREEN_W 響應式縮放（見頂部常數區） */}
        <View style={{ flex: 1, justifyContent: 'center', paddingVertical: 12 }}>
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
          </View>

          <View style={s.caffWrap}>
            {/* 咖啡因小圓圈：液面高度由 Animated 控制 */}
            <View style={s.caffCircle}>
              <Animated.View style={[s.caffLiquid, { height: caffHeight, backgroundColor: CAFFEINE_COLOR }]} />
              <View style={s.caffContent} pointerEvents="none">
                <Text style={s.caffNum}>{totalCaffeine}</Text>
                <Text style={s.caffUnit}>mg</Text>
              </View>
            </View>
            {/* 動態攝取狀態 badge（先顯示），再顯示「咖啡因」標題 */}
            <View style={[s.caffStatusBadge, { backgroundColor: caffStatusColor }]}>
              <Text style={s.caffStatusBadgeTxt}>{caffStatus}</Text>
            </View>
            <Text style={s.caffMax}>咖啡因・上限 {MAX_CAFFEINE}mg</Text>
          </View>
        </View>

        </View>{/* 垂直置中 wrapper 結束 */}

        {/* 快速記錄：SafeAreaView 底部，paddingBottom 確保不被 logCard 遮住 */}
        <View style={s.quickGrid}>
          <TouchableOpacity style={s.qBtn} onPress={() => quickLog(30)} activeOpacity={0.6}>
            <Text style={s.qBtnName}>一口</Text>
            <Text style={s.qBtnMl}>30ml</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.qBtn} onPress={() => quickLog(60)} activeOpacity={0.6}>
            <Text style={s.qBtnName}>一大口</Text>
            <Text style={s.qBtnMl}>60ml</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.qBtnPlus} onPress={() => setShowAddModal(true)} activeOpacity={0.5}>
            <Ionicons name="add-circle-outline" size={36} color="#3498db" />
          </TouchableOpacity>
        </View>

      </SafeAreaView>

      {/* 今日紀錄：展開時暗化背景，點空白處收合 */}
      {logExpanded && (
        <TouchableOpacity
          style={s.logOverlay}
          activeOpacity={1}
          onPress={() => {
            Animated.spring(cardHeightAnim, { toValue: CARD_COLLAPSED, useNativeDriver: false }).start();
            setLogExpanded(false);
          }}
        />
      )}

      {/* 今日紀錄卡片：絕對定位貼底，向上展開 */}
      <Animated.View style={[s.logCard, { height: cardHeightAnim }]}>
        {/* 拖曳 handle：向上拖展開，向下拖收合 */}
        <View style={s.dragHandleWrap} {...panResponder.panHandlers}>
          <View style={s.dragHandle} />
        </View>
        <View style={s.logHead}>
          <Text style={s.logTitle}>今日紀錄</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {selMode && (
              <>
                <TouchableOpacity onPress={() => {
                  if (logs.length > 0 && selected.length === logs.length) setSelected([]);
                  else setSelected(logs.map(l => l.id));
                }}>
                  <Text style={s.logAction}>{logs.length > 0 && selected.length === logs.length ? '取消全選' : '全選'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDeleteSelected}>
                  <Text style={[s.logAction, { color: '#f87171' }]}>刪除({selected.length})</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity onPress={() => { setSelMode(!selMode); setSelected([]); }}>
              <Text style={s.logAction}>{selMode ? '取消' : '刪除'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={s.logScroll} showsVerticalScrollIndicator={false}>
          {logs.length === 0 && <Text style={s.emptyTxt}>還沒有記錄，喝水吧！</Text>}
          {/* key 用 `id-idx` 組合，防止後端回傳重複 id 時觸發 duplicate key 警告 */}
          {logs.map((log, idx) => (
            <TouchableOpacity key={`${log.id}-${idx}`}
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
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* 刪除確認 Modal（修正 Expo Web Alert.alert onPress bug） */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade">
        <View style={[s.modalOverlay, { justifyContent: 'center' }]}>
          <View style={s.confirmCard}>
            <Text style={s.confirmTitle}>確認刪除？</Text>
            <Text style={s.confirmMsg}>將刪除 {selected.length} 筆紀錄，此操作無法復原。</Text>
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setShowDeleteConfirm(false)}>
                <Text style={s.modalCancelTxt}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalConfirm, { backgroundColor: '#f87171' }]}
                onPress={() => {
                  deleteLogs(selected);
                  setSelected([]); setSelMode(false); setShowDeleteConfirm(false);
                }}>
                <Text style={s.modalConfirmTxt}>刪除</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 新增飲水 Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { paddingBottom: insets.bottom + 24 }]}>
            <Text style={s.modalTitle}>新增飲水紀錄</Text>
            <Text style={s.modalLbl}>飲品類型</Text>
            <View style={s.drinkTypeRow}>
              {['水', '咖啡', '茶'].map(d => (
                <TouchableOpacity key={d} style={[s.drinkChip, drinkType === d && s.drinkChipSel]} onPress={() => setDrinkType(d)} activeOpacity={0.75}>
                  <View style={[s.chipDot, { backgroundColor: DRINK_COLORS[d] }]} />
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
        </KeyboardAvoidingView>
      </Modal>

      {/* 編輯 Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={s.modalOverlay}>
            <View style={[s.modalCard, { paddingBottom: insets.bottom + 24 }]}>
              <Text style={s.modalTitle}>編輯紀錄</Text>
              <Text style={s.modalLbl}>飲品類型</Text>
              <View style={s.drinkTypeRow}>
                {['水', '咖啡', '茶'].map(d => (
                  <TouchableOpacity key={d}
                    style={[s.drinkChip, editType === d && s.drinkChipSel]}
                    onPress={() => setEditType(d)} activeOpacity={0.75}>
                    <View style={[s.chipDot, { backgroundColor: DRINK_COLORS[d] }]} />
                    <Text style={[s.drinkChipTxt, editType === d && { color: '#3498db' }]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={s.modalLbl}>毫升數</Text>
              <TextInput
                style={s.modalInp}
                keyboardType="numeric"
                value={editMl}
                onChangeText={setEditMl}
                autoFocus
              />
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
        </KeyboardAvoidingView>
      </Modal>

    </Pressable>
  );
}


//按鍵、element樣式
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginHorizontal: 4, zIndex: 100 },
  PickerButton: { backgroundColor: 'rgba(255,255,255,0.9)', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 15, borderWidth: 1, borderColor: '#E1E8EE' },
  drinkDropdownWrap: { position: 'relative', zIndex: 100, width: 110 },
  dropdown: { position: 'absolute', top: 70, left: 0, zIndex: 200, backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 16, borderWidth: 1.5, borderColor: '#E1E8EE', minWidth: 140, paddingVertical: 6, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 16 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 16 },
  dropdownItemPlus: { borderTopWidth: 1, borderTopColor: '#E1E8EE', marginTop: 4, paddingTop: 10 },
  dropdownTxt: { fontSize: 15, fontWeight: '800', color: '#333', flex: 1 },
  dropdownTxtSel: { color: '#3498db' },
  dropdownPlus: { fontSize: 18, fontWeight: '900', color: '#3498db' },
  drinkLabel: { fontSize: 12, color: '#999', fontWeight: '600' },
  drinkRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  drinkDot:   { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  drinkName:  { fontSize: 20, fontWeight: 'bold', color: '#333' },
  mainRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 8, zIndex: 1 },
  waterWrap: { alignItems: 'center', gap: 8 },
  circle: { width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2, backgroundColor: 'rgba(255,255,255,0.85)', borderWidth: 8, borderColor: '#AEE2FF', overflow: 'hidden' },
  liquidContainer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  liquidLayer:     { width: '100%' },
  circleContent:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  cupImage:        { width: CIRCLE_SIZE * 0.4, height: CIRCLE_SIZE * 0.4, marginBottom: 2 },
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
  // ── 快速記錄按鈕區（主畫面中間三個快速記錄鍵）──────────────────
  quickGrid: { flexDirection: 'row', gap: 12, paddingVertical: 10, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' },
  // 一口 / 一大口：白底圓角方框按鈕，固定寬度不撐滿
  qBtn:     { width: 95, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', gap: 2, borderWidth: 1, borderColor: '#E1E8EE' },
  qBtnName: { fontSize: 12, fontWeight: '800', color: '#333' },
  qBtnMl:   { fontSize: 10, fontWeight: '700', color: '#999' },
  // ＋ 手動新增：獨立圓圈樣式，不繼承 qBtn，自然寬度
  qBtnPlus: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  // 今日紀錄卡片：高度由 Animated 控制，不用 flex:1
  logCard:  { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.95)', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 14, paddingTop: 8, zIndex: 10 },
  // 拖曳 handle：paddingVertical 放大可點選面積，移除 overflow:hidden 避免向上拖時手勢被截斷
  dragHandleWrap: { alignItems: 'center', paddingVertical: 14 },
  dragHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ccc' },
  // 展開時暗化背景（overlay）
  logOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.25)', zIndex: 6 },
  // 刪除確認 Modal
  confirmCard:  { backgroundColor: '#fff', borderRadius: 20, padding: 24, margin: 32 },
  confirmTitle: { fontSize: 18, fontWeight: '900', color: '#333', marginBottom: 8 },
  confirmMsg:   { fontSize: 14, color: '#666', marginBottom: 20 },
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
  //喝水快速選擇鍵
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