import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Modal, TextInput, Alert, Animated
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

const DRINK_COLORS = {
  '白開水': '#a8d8f0',
  '茶':     '#c8e6a0',
  '咖啡':   '#c8a878',
  '果汁':   '#f8d070',
  '手搖':   '#f0a8c8',
  '其他':   '#c8c0e8',
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
  
    const [showAddModal,     setShowAddModal]     = useState(false);
    const [showEditModal,    setShowEditModal]    = useState(false);
    const [editingLog,       setEditingLog]       = useState(null);
    const [selMode,          setSelMode]          = useState(false);
    const [selected,         setSelected]         = useState([]);
    const [addMl,            setAddMl]            = useState('250');
    const [addType,          setAddType]          = useState(DRINK_TYPES[0]);
    const [customDrinkName,  setCustomDrinkName]  = useState('');
    const [editMl,           setEditMl]           = useState('');
    const [editType,         setEditType]         = useState(DRINK_TYPES[0]);
    const [editCustomName,   setEditCustomName]   = useState('');
  
    const now = new Date();
    const DAYS = ['週日','週一','週二','週三','週四','週五','週六'];
    const dateStr = `${DAYS[now.getDay()]} · ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
  
    const hasCoaster  = profile.hasCoaster;
    const isConnected = sensorData.connected;
  
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

    function quickLog(ml) { addLog(ml, '白開水', ''); }
  
    function handleAdd() {
      const ml = parseInt(addMl);
      if (!ml || ml <= 0) { Alert.alert('請輸入有效的毫升數'); return; }
      const typeName = addType.label === '其他' && customDrinkName.trim()
        ? customDrinkName.trim()
        : addType.label;
      addLog(ml, typeName, '');
      setShowAddModal(false);
      setAddMl('250');
      setAddType(DRINK_TYPES[0]);
      setCustomDrinkName('');
    }
  
    function handleEdit() {
      const ml = parseInt(editMl);
      if (!ml || ml <= 0) { Alert.alert('請輸入有效的毫升數'); return; }
      const typeName = editType.label === '其他' && editCustomName.trim()
        ? editCustomName.trim()
        : editType.label;
      updateLog(editingLog.id, { ml, type: typeName, emoji: '' });
      setShowEditModal(false);
      setEditingLog(null);
      setEditCustomName('');
    }
  
    function openEdit(log) {
      setEditingLog(log);
      setEditMl(String(log.ml));
      const found = DRINK_TYPES.find(d => d.label === log.type);
      if (found) {
        setEditType(found);
        setEditCustomName('');
      } else {
        setEditType(DRINK_TYPES[DRINK_TYPES.length - 1]); // 其他
        setEditCustomName(log.type);
      }
      setShowEditModal(true);
    }
  
    function toggleSelect(id) {
      setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }
  
    function handleDeleteSelected() {
      Alert.alert('刪除紀錄', `確定刪除 ${selected.length} 筆紀錄？`, [
        { text: '取消', style: 'cancel' },
        { text: '刪除', style: 'destructive', onPress: () => {
          deleteLogs(selected); setSelected([]); setSelMode(false);
        }},
      ]);
    }
  
    function handleDeleteOne(id) {
      Alert.alert('刪除紀錄', '確定刪除這筆紀錄？', [
        { text: '取消', style: 'cancel' },
        { text: '刪除', style: 'destructive', onPress: () => deleteLog(id) },
      ]);
    }

    
  
    function renderRecordArea() {
      if (hasCoaster && isConnected) {
        return (
          <View style={s.autoRecordBanner}>
            <View style={s.autoRecordDot} />
            <Text style={s.autoRecordTxt}>自動記錄中</Text>
            <Text style={s.autoRecordSub}>杯墊已連線，喝水會自動偵測</Text>
          </View>
        );
      }
      if (hasCoaster && !isConnected) {
        return (
          <View style={s.recordRow}>

            <TouchableOpacity 
              style={[s.recordBtn, s.recordConnect]}
              onPress={handleConnect} // 直接指向定義好的函數
              activeOpacity={0.85}
            >
              <Text style={s.recordBtnTxt}>連接杯墊</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.recordBtn, s.recordManual]}
              onPress={() => setShowAddModal(true)} activeOpacity={0.85}>
              <Text style={s.recordManualTxt}>手動新增</Text>
            </TouchableOpacity>
          </View>
        );
      }
      return (
        <View style={s.recordRow}>
          <TouchableOpacity style={[s.recordBtn, s.recordStart]}
            onPress={() => setShowAddModal(true)} activeOpacity={0.85}>
            <Text style={s.recordBtnTxt}>記錄飲水</Text>
          </TouchableOpacity>
        </View>
      );
    }
  
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
      <SafeAreaView style={s.safe}>
        <View style={s.topbar}>
          <View>
            <Text style={s.greeting}>嗨，{profile.name || 'Alex'}</Text>
            <Text style={s.date}>{dateStr}</Text>
          </View>
        </View>
  
        <View style={s.sensorCard}>
          <View style={s.sensorItem}>
            <Text style={s.sensorLabel}>氣溫</Text>
            <Text style={s.sensorValue}>{sensorData.temperature}°C</Text>
          </View>
          <View style={s.sensorDividerV} />
          <View style={s.sensorItem}>
            <Text style={s.sensorLabel}>濕度</Text>
            <Text style={s.sensorValue}>{sensorData.humidity}%</Text>
          </View>
          <View style={s.sensorDividerV} />
          <View style={s.sensorItem}>
            <Text style={s.sensorLabel}>杯墊</Text>
            <Text style={[s.sensorValue, { color: isConnected ? '#4ade80' : '#f87171' }]}>
              {isConnected ? '已連線' : '未連線'}
            </Text>
          </View>
        </View>
  
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <WaterCup logs={logs} goalMl={goalMl} totalMl={totalMl} />
  
          <View style={s.recordSection}>{renderRecordArea()}</View>
  
          {/* 快捷喝水 */}
          <View style={s.quickSection}>
            <Text style={s.sectionTitle}>快速記錄</Text>
            <View style={s.quickGrid}>
              <TouchableOpacity style={s.qBtn} onPress={() => quickLog(30)} activeOpacity={0.75}>
                <Text style={s.qBtnName}>一口水</Text>
                <Text style={s.qBtnMl}>30ml</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.qBtn} onPress={() => quickLog(60)} activeOpacity={0.75}>
                <Text style={s.qBtnName}>一大口水</Text>
                <Text style={s.qBtnMl}>60ml</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.qBtn, s.qBtnBlue]}
                onPress={() => setShowAddModal(true)} activeOpacity={0.75}>
                <Text style={[s.qBtnName, { color: BLUE }]}>其他飲品</Text>
                <Text style={s.qBtnMl}>自訂</Text>
              </TouchableOpacity>
            </View>
          </View>
  
          {/* 今日紀錄 */}
          <View style={s.logSection}>
            <View style={s.logHead}>
              <Text style={s.sectionTitle}>今日紀錄</Text>
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
                <TouchableOpacity onPress={() => setShowAddModal(true)}>
                  <Text style={s.logAction}>新增</Text>
                </TouchableOpacity>
              </View>
            </View>
  
            {logs.length === 0 && <Text style={s.emptyTxt}>還沒有記錄，喝水吧！</Text>}
  
            {logs.map((log, i) => (
              <TouchableOpacity
                key={log.id}
                style={[s.logItem, selMode && selected.includes(log.id) && s.logItemSel]}
                onPress={() => selMode ? toggleSelect(log.id) : openEdit(log)}
                onLongPress={() => { setSelMode(true); toggleSelect(log.id); }}
                activeOpacity={0.75}
              >
                {selMode && (
                  <View style={[s.checkbox, selected.includes(log.id) && s.checkboxSel]}>
                    {selected.includes(log.id) && <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>}
                  </View>
                )}
                <View style={[s.logDot, { backgroundColor: DRINK_COLORS[log.type] || '#5ab4f5' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.logAmt}>{log.ml} ml</Text>
                  <Text style={s.logMeta}>{log.time} · {log.type}</Text>
                </View>
                {!selMode && (
                  <TouchableOpacity onPress={() => handleDeleteOne(log.id)}>
                    <Text style={{ color: '#f87171', fontSize: 18 }}>×</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>
  
          <View style={{ height: 30 }} />
        </ScrollView>
  
        {/* 新增 Modal */}
        <Modal visible={showAddModal} transparent animationType="slide">
          <View style={s.modalOverlay}>
            <View style={s.modalCard}>
              <Text style={s.modalTitle}>新增飲水紀錄</Text>
              <Text style={s.lbl}>毫升數</Text>
              <TextInput style={s.inp} keyboardType="numeric" value={addMl} onChangeText={setAddMl} />
              <Text style={s.lbl}>飲品類型</Text>
              <View style={s.drinkGrid}>
                {DRINK_TYPES.map(d => (
                  <TouchableOpacity key={d.label}
                    style={[s.drinkChip, addType.label === d.label && s.drinkChipSel]}
                    onPress={() => setAddType(d)} activeOpacity={0.75}>
                    <Text style={[s.drinkLabel, addType.label === d.label && { color: colors.blueDark }]}>{d.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* 選「其他」時顯示自訂名稱輸入 */}
              {addType.label === '其他' && (
                <View style={{ marginBottom: 14 }}>
                  <Text style={s.lbl}>飲品名稱</Text>
                  <TextInput
                    style={s.inp}
                    value={customDrinkName}
                    onChangeText={setCustomDrinkName}
                    placeholder="請輸入飲品名稱"
                    placeholderTextColor={MUTED}
                  />
                </View>
              )}
              <View style={s.modalBtns}>
                <TouchableOpacity style={s.modalCancel} onPress={() => { setShowAddModal(false); setCustomDrinkName(''); }}>
                  <Text style={s.modalCancelTxt}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.modalConfirm} onPress={handleAdd}>
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
              <Text style={s.modalTitle}>編輯飲水紀錄</Text>
              <Text style={s.lbl}>毫升數</Text>
              <TextInput style={s.inp} keyboardType="numeric" value={editMl} onChangeText={setEditMl} />
              <Text style={s.lbl}>飲品類型</Text>
              <View style={s.drinkGrid}>
                {DRINK_TYPES.map(d => (
                  <TouchableOpacity key={d.label}
                    style={[s.drinkChip, editType.label === d.label && s.drinkChipSel]}
                    onPress={() => setEditType(d)} activeOpacity={0.75}>
                    <Text style={[s.drinkLabel, editType.label === d.label && { color: colors.blueDark }]}>{d.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* 選「其他」時顯示自訂名稱輸入 */}
              {editType.label === '其他' && (
                <View style={{ marginBottom: 14 }}>
                  <Text style={s.lbl}>飲品名稱</Text>
                  <TextInput
                    style={s.inp}
                    value={editCustomName}
                    onChangeText={setEditCustomName}
                    placeholder="請輸入飲品名稱"
                    placeholderTextColor={MUTED}
                  />
                </View>
              )}
              <View style={s.modalBtns}>
                <TouchableOpacity style={s.modalCancel} onPress={() => { setShowEditModal(false); setEditCustomName(''); }}>
                  <Text style={s.modalCancelTxt}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.modalConfirm} onPress={handleEdit}>
                  <Text style={s.modalConfirmTxt}>儲存</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
      // const { scanAndConnect, connectedDevice, bleData } = useBLE();
  // const [totalIntake, setTotalIntake] = useState(0);
  // const dailyTarget = 2000; // 假設目標為 2000ml
  // const [drinkType, setDrinkType] = useState('水');
  // const [isSettingVisible, setSettingVisible] = useState(false);
  // const [isReminderVisible, setReminderVisible] = useState(false);

  // // 監聽 BLE 數據更新水量
  // useEffect(() => {
  //   if (bleData.drinkAmount > 0) {
  //     // 1. 更新前端畫面數字
  //     setTotalIntake((prev) => prev + bleData.drinkAmount);

  //     // 2. 將數據上傳到 FastAPI 後端
  //     const uploadData = async () => {
  //       const payload = {
  //         lastStableWeight: bleData.lastStableWeight, 
  //         drinkAmount: bleData.drinkAmount,
  //         isOnCoaster: bleData.isOnCoaster
  //       };
        
  //       const response = await apiService.uploadSensorData(payload);
  //       if (response.success) {
  //         console.log("💧 喝水數據已成功同步至後端資料庫！");
  //       } else {
  //         console.error("❌ 同步失敗：", response.error);
  //       }
  //     };
      
  //     uploadData();
  //   }
  // }, [bleData.drinkAmount]);

  // // 計算百分比
  // const progress = Math.min((totalIntake / dailyTarget) * 100, 100).toFixed(0);

  // // 處理切換飲品的邏輯
  // const handleChangeDrink = () => {
  //   Alert.alert(
  //     "更換飲品",
  //     "請選擇您目前飲用的液體：",
  //     [
  //       { text: "水", onPress: () => setDrinkType("水") },
  //       { text: "咖啡", onPress: () => setDrinkType("咖啡") },
  //       { text: "茶", onPress: () => setDrinkType("茶") },
  //       // { text: "神奇水水", onPress: () => setDrinkType("神奇水水") },
  //       { text: "取消", style: "cancel" } // 這邊bug顯示不出取消按鈕
  //     ]
  //   );
  // };

  // return (
  //   <ImageBackground 
  //     source={require('../assets/background.png')} 
  //     style={styles.background}
  //   >
  //     <SafeAreaView style={styles.container}>
  //       {/* 頂部狀態與標題 */}
  //       <View style={styles.header}>
  //         <TouchableOpacity style={styles.PickerButton} onPress={handleChangeDrink}>
  //           <View>
  //               <Text style={styles.drinkLabel}>目前飲用</Text>
  //               <View style={styles.drinkRow}>
  //               <Text style={styles.drinkName}>{drinkType}</Text>
  //               <Ionicons name="chevron-down" size={18} color="#3498db" style={{ marginLeft: 5 }} />
  //               </View>
  //           </View>
  //         </TouchableOpacity>

  //         <TouchableOpacity style={styles.PickerButton} onPress={scanAndConnect}>
  //           <View>
  //               <Text style={styles.drinkLabel}>連接杯墊</Text>
  //           </View>
  //         </TouchableOpacity>
          
  //       </View>

  //       {/* 中央杯子進度區 (對應 main_cup.jpg) */}
  //       <View style={styles.progressContainer}>
  //         <View style={styles.circleOutline}>
  //           <Image 
  //             source={require('../assets/main_cup.png')} // 杯子圖示
  //             style={styles.cupImage}
  //             resizeMode="contain"
  //           />
  //           <Text style={styles.progressText}>{progress}%</Text>
  //         </View>
  //       </View>

  //       {/* 下方數據卡片 */}
  //       <View style={styles.infoCard}>
  //         <View style={styles.dataRow}>
  //           <View style={styles.dataItem}>
  //             <Text style={styles.dataLabel}>已飲用</Text>
  //             <Text style={styles.dataValue}>{totalIntake} <Text style={styles.unit}>ml</Text></Text>
  //           </View>
  //           <View style={styles.divider} />
  //           <View style={styles.dataItem}>
  //             <Text style={styles.dataLabel}>今日目標</Text>
  //             <Text style={styles.dataValue}>{dailyTarget} <Text style={styles.unit}>ml</Text></Text>
  //           </View>
  //         </View>
          
  //         {/* 連接狀態提示 */}
  //         <Text style={styles.statusText}>
  //           裝置狀態：{connectedDevice ? '已連線' : '未連線'}
  //         </Text>
  //       </View>
  //     </SafeAreaView>

  //     {/* 設定選單 Modal */}
  //   <SettingScreen 
  //     visible={isSettingVisible} 
  //     onClose={() => setSettingVisible(false)}
  //     onOpenReminder={() => setReminderVisible(true)} 
  //   />

  //   {/* 提醒時長設定 Modal */}
  //   <ReminderSettingScreen 
  //     visible={isReminderVisible} 
  //     onClose={() => setReminderVisible(false)} 
  //   />
  //   </ImageBackground>
  // );

};

// const styles = StyleSheet.create({
//   background: {
//     flex: 1,
//     width: '100%',
//   },
//   container: {
//     flex: 1,
//     paddingHorizontal: 25,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginTop: 40,
//   },
//   greeting: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   subText: {
//     fontSize: 16,
//     color: '#666',
//   },
//   progressContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   circleOutline: {
//     width: 280,
//     height: 280,
//     borderRadius: 140,
//     backgroundColor: 'rgba(255, 255, 255, 0.8)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 8,
//     borderColor: '#AEE2FF', // 淺藍色邊框
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 10,
//     elevation: 5,
//   },
//   cupImage: {
//     width: 140,
//     height: 140,
//     marginBottom: 10,
//   },
//   progressText: {
//     fontSize: 40,
//     fontWeight: '800',
//     color: '#3498db',
//   },
//   infoCard: {
//     backgroundColor: '#FFF',
//     borderRadius: 30,
//     padding: 25,
//     marginBottom: 40,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 5 },
//     shadowOpacity: 0.1,
//     shadowRadius: 15,
//     elevation: 10,
//   },
//   dataRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     alignItems: 'center',
//   },
//   dataItem: {
//     alignItems: 'center',
//   },
//   dataLabel: {
//     fontSize: 14,
//     color: '#999',
//     marginBottom: 5,
//   },
//   dataValue: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   unit: {
//     fontSize: 14,
//     color: '#666',
//   },
//   divider: {
//     width: 1,
//     height: 40,
//     backgroundColor: '#EEE',
//   },
//   statusText: {
//     textAlign: 'center',
//     marginTop: 15,
//     fontSize: 12,
//     color: '#BBB',
//   },
//   PickerButton: {
//     backgroundColor: 'rgba(255, 255, 255, 0.9)',
//     paddingVertical: 10,
//     paddingHorizontal: 15,
//     borderRadius: 15,
//     borderWidth: 1,
//     borderColor: '#E1E8EE',
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 5,
//     elevation: 2,
//   },
//   drinkLabel: {
//     fontSize: 12,
//     color: '#999',
//     fontWeight: '600',
//   },
//   drinkRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 2,
//   },
//   drinkName: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#333',
//   },
// });

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
  safe: { flex: 1, backgroundColor: BG },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  greeting: { fontSize: 20, fontWeight: '900', color: TEXT },
  date: { fontSize: 13, color: MUTED, marginTop: 2 },

  sensorCard:    { flexDirection: 'row', backgroundColor: CARD, borderRadius: 16, marginHorizontal: 20, marginBottom: 4, paddingVertical: 12, borderWidth: 1, borderColor: BORDER },
  sensorItem:    { flex: 1, alignItems: 'center', gap: 3 },
  sensorLabel:   { fontSize: 10, color: MUTED, fontWeight: '800' },
  sensorValue:   { fontSize: 15, fontWeight: '900', color: TEXT },
  sensorDividerV:{ width: 1, backgroundColor: BORDER },

  recordSection:   { paddingHorizontal: 20, marginTop: 4 },
  recordRow:       { flexDirection: 'row', gap: 10 },
  recordBtn:       { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 2 },
  recordStart:     { backgroundColor: BLUE, borderColor: BLUE },
  recordConnect:   { backgroundColor: '#4ade80', borderColor: '#4ade80' },
  recordManual:    { backgroundColor: CARD, borderColor: BORDER },
  recordBtnTxt:    { fontSize: 14, fontWeight: '900', color: '#fff' },
  recordManualTxt: { fontSize: 14, fontWeight: '900', color: TEXT },
  autoRecordBanner:{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f0fff4', borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: '#86efac' },
  autoRecordDot:   { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4ade80' },
  autoRecordTxt:   { fontSize: 15, fontWeight: '900', color: '#16a34a' },
  autoRecordSub:   { fontSize: 12, color: '#4ade80', flex: 1 },

  quickSection: { paddingHorizontal: 20, paddingTop: 14, gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: TEXT },
  quickGrid:    { flexDirection: 'row', gap: 10 },
  qBtn:         { flex: 1, backgroundColor: CARD, borderRadius: 16, paddingVertical: 14, alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: BORDER },
  qBtnBlue:     { borderColor: BLUE, backgroundColor: colors.blueLight },
  qBtnName:     { fontSize: 13, fontWeight: '900', color: TEXT },
  qBtnMl:       { fontSize: 11, fontWeight: '700', color: MUTED },

  logSection: { paddingHorizontal: 20, paddingTop: 14 },
  logHead:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  logAction:  { fontSize: 13, fontWeight: '800', color: BLUE },
  emptyTxt:   { fontSize: 13, color: MUTED, textAlign: 'center', paddingVertical: 20 },
  logItem:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, marginBottom: 8, backgroundColor: CARD },
  logItemSel: { backgroundColor: colors.blueLight, borderWidth: 1.5, borderColor: BLUE },
  logDot:     { width: 10, height: 10, borderRadius: 5 },
  logAmt:     { fontSize: 15, fontWeight: '900', color: TEXT },
  logMeta:    { fontSize: 12, color: MUTED },
  checkbox:    { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  checkboxSel: { backgroundColor: BLUE, borderColor: BLUE },

  lbl: { fontSize: 11, fontWeight: '800', color: '#5a7a96', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6 },
  inp: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, borderWidth: 2, borderColor: BORDER, fontSize: 16, fontWeight: '700', color: TEXT, backgroundColor: '#f6fafd', marginBottom: 14 },

  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard:       { backgroundColor: CARD, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle:      { fontSize: 20, fontWeight: '900', color: TEXT, marginBottom: 20 },
  drinkGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  drinkChip:       { width: '30%', paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: BORDER, alignItems: 'center', backgroundColor: '#f6fafd' },
  drinkChipSel:    { borderColor: BLUE, backgroundColor: colors.blueLight },
  drinkLabel:      { fontSize: 13, fontWeight: '800', color: MUTED },
  modalBtns:       { flexDirection: 'row', gap: 10 },
  modalCancel:     { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 2, borderColor: BORDER },
  modalCancelTxt:  { fontSize: 15, fontWeight: '800', color: MUTED },
  modalConfirm:    { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: BLUE },
  modalConfirmTxt: { fontSize: 15, fontWeight: '900', color: '#fff' },
});

export default MainScreen;