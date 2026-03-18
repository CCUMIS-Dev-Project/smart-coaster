// src/screens/MainScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Modal, TextInput, Alert, FlatList
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useApp } from '../context/AppContext';
import { colors, DRINK_TYPES } from '../constants/theme';

const { blue: BLUE, text: TEXT, muted: MUTED, border: BORDER, card: CARD, bg: BG } = colors;
const CIRC = 2 * Math.PI * 76;

export default function MainScreen() {
  const { profile, goalMl, totalMl, logs, addLog, updateLog, deleteLog, deleteLogs, isRecording, setIsRecording, sensorData } = useApp();

  const [showAddModal,  setShowAddModal]  = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLog,    setEditingLog]    = useState(null);
  const [selMode,       setSelMode]       = useState(false);
  const [selected,      setSelected]      = useState([]);

  // Add modal state
  const [addMl,   setAddMl]   = useState('250');
  const [addType, setAddType] = useState(DRINK_TYPES[0]);

  // Edit modal state
  const [editMl,   setEditMl]   = useState('');
  const [editType, setEditType] = useState(DRINK_TYPES[0]);

  const pct = Math.min(1, totalMl / goalMl);
  const strokeOffset = CIRC * (1 - pct);

  const now = new Date();
  const DAYS = ['週日','週一','週二','週三','週四','週五','週六'];
  const dateStr = `${DAYS[now.getDay()]} · ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;

  function handleAdd() {
    const ml = parseInt(addMl);
    if (!ml || ml <= 0) { Alert.alert('請輸入有效的毫升數'); return; }
    addLog(ml, addType.label, addType.emoji);
    setShowAddModal(false);
    setAddMl('250');
    setAddType(DRINK_TYPES[0]);
  }

  function handleEdit() {
    const ml = parseInt(editMl);
    if (!ml || ml <= 0) { Alert.alert('請輸入有效的毫升數'); return; }
    updateLog(editingLog.id, { ml, type: editType.label, emoji: editType.emoji });
    setShowEditModal(false);
    setEditingLog(null);
  }

  function openEdit(log) {
    setEditingLog(log);
    setEditMl(String(log.ml));
    setEditType(DRINK_TYPES.find(d => d.label === log.type) || DRINK_TYPES[0]);
    setShowEditModal(true);
  }

  function toggleSelect(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }

  function handleDeleteSelected() {
    Alert.alert('刪除紀錄', `確定刪除 ${selected.length} 筆紀錄？`, [
      { text: '取消', style: 'cancel' },
      { text: '刪除', style: 'destructive', onPress: () => {
        deleteLogs(selected);
        setSelected([]);
        setSelMode(false);
      }},
    ]);
  }

  function handleDeleteOne(id) {
    Alert.alert('刪除紀錄', '確定刪除這筆紀錄？', [
      { text: '取消', style: 'cancel' },
      { text: '刪除', style: 'destructive', onPress: () => deleteLog(id) },
    ]);
  }

  const logColors = ['#5ab4f5','#4ade80','#f59e0b','#ec4899','#8b5cf6','#06b6d4'];

  return (
    <SafeAreaView style={s.safe}>
      {/* Top bar */}
      <View style={s.topbar}>
        <View>
          <Text style={s.greeting}>嗨，{profile.name || 'Alex'} 👋</Text>
          <Text style={s.date}>{dateStr}</Text>
        </View>
        {/* 溫濕度 */}
        <View style={s.sensorPill}>
          <Text style={s.sensorTxt}>{sensorData.temperature}°C</Text>
          <View style={s.sensorDivider} />
          <Text style={s.sensorTxt}>{sensorData.humidity}%</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Ring */}
        <View style={s.ringSection}>
          <View style={s.ringWrap}>
            <Svg width={170} height={170} viewBox="0 0 170 170">
              <Circle cx="85" cy="85" r="76" stroke={BORDER} strokeWidth="12" fill="none" />
              <Circle cx="85" cy="85" r="76" stroke={BLUE} strokeWidth="12" fill="none"
                strokeDasharray={CIRC} strokeDashoffset={strokeOffset}
                strokeLinecap="round" rotation="-90" origin="85,85" />
            </Svg>
            <View style={s.ringCenter}>
              <Text style={s.ringPct}>{Math.round(pct * 100)}%</Text>
              <Text style={s.ringLbl}>{totalMl} / {goalMl} ml</Text>
            </View>
          </View>

          {/* 手動/自動記錄按鈕 */}
          <View style={s.recordRow}>
            {!isRecording ? (
              <TouchableOpacity
                style={[s.recordBtn, s.recordStart]}
                onPress={() => setIsRecording(true)}
                activeOpacity={0.85}
              >
                <Text style={s.recordBtnTxt}>開始記錄</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[s.recordBtn, s.recordStop]}
                onPress={() => setIsRecording(false)}
                activeOpacity={0.85}
              >
                <Text style={s.recordBtnTxt}>結束記錄</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[s.recordBtn, s.recordAuto, !profile.hasCoaster && s.recordDisabled]}
              disabled={!profile.hasCoaster}
              activeOpacity={0.85}
            >
              <Text style={[s.recordBtnTxt, !profile.hasCoaster && { color: MUTED }]}>
                自動記錄
              </Text>
              {!profile.hasCoaster && <Text style={s.needCoaster}>需要杯墊</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress bar */}
        <View style={s.progSection}>
          <View style={s.progHeader}>
            <Text style={s.progLbl}>今日進度</Text>
            <Text style={s.progVal}>{totalMl}ml / {goalMl}ml</Text>
          </View>
          <View style={s.progTrack}>
            <View style={[s.progFill, { width: `${pct * 100}%` }]} />
          </View>
        </View>

        {/* Today's logs */}
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
                <Text style={s.logAction}>＋ 新增</Text>
              </TouchableOpacity>
            </View>
          </View>

          {logs.length === 0 && (
            <Text style={s.emptyTxt}>還沒有記錄，喝水吧！</Text>
          )}

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
              <View style={[s.logDot, { backgroundColor: logColors[i % logColors.length] }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.logAmt}>{log.emoji} {log.ml} ml</Text>
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

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>新增飲水紀錄</Text>

            <Text style={s.lbl}>毫升數</Text>
            <TextInput style={s.inp} keyboardType="numeric" value={addMl} onChangeText={setAddMl} />

            <Text style={s.lbl}>飲品類型</Text>
            <View style={s.drinkGrid}>
              {DRINK_TYPES.map(d => (
                <TouchableOpacity
                  key={d.label}
                  style={[s.drinkChip, addType.label === d.label && s.drinkChipSel]}
                  onPress={() => setAddType(d)}
                  activeOpacity={0.75}
                >
                  <Text style={s.drinkEmoji}>{d.emoji}</Text>
                  <Text style={[s.drinkLabel, addType.label === d.label && { color: colors.blueDark }]}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.modalBtns}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setShowAddModal(false)}>
                <Text style={s.modalCancelTxt}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalConfirm} onPress={handleAdd}>
                <Text style={s.modalConfirmTxt}>新增</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>編輯飲水紀錄</Text>

            <Text style={s.lbl}>毫升數</Text>
            <TextInput style={s.inp} keyboardType="numeric" value={editMl} onChangeText={setEditMl} />

            <Text style={s.lbl}>飲品類型</Text>
            <View style={s.drinkGrid}>
              {DRINK_TYPES.map(d => (
                <TouchableOpacity
                  key={d.label}
                  style={[s.drinkChip, editType.label === d.label && s.drinkChipSel]}
                  onPress={() => setEditType(d)}
                  activeOpacity={0.75}
                >
                  <Text style={s.drinkEmoji}>{d.emoji}</Text>
                  <Text style={[s.drinkLabel, editType.label === d.label && { color: colors.blueDark }]}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

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
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  greeting: { fontSize: 20, fontWeight: '900', color: TEXT },
  date: { fontSize: 13, color: MUTED, marginTop: 2 },
  sensorPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: BORDER },
  sensorTxt: { fontSize: 13, fontWeight: '800', color: TEXT },
  sensorDivider: { width: 1, height: 14, backgroundColor: BORDER, marginHorizontal: 8 },

  ringSection: { alignItems: 'center', paddingVertical: 8 },
  ringWrap: { width: 170, height: 170, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  ringPct: { fontSize: 28, fontWeight: '900', color: TEXT },
  ringLbl: { fontSize: 11, color: MUTED },

  recordRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  recordBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center', borderWidth: 2 },
  recordStart: { backgroundColor: BLUE, borderColor: BLUE },
  recordStop: { backgroundColor: '#f87171', borderColor: '#f87171' },
  recordAuto: { backgroundColor: CARD, borderColor: BORDER },
  recordDisabled: { opacity: 0.45 },
  recordBtnTxt: { fontSize: 14, fontWeight: '900', color: '#fff' },
  needCoaster: { fontSize: 10, color: MUTED, marginTop: 2 },

  progSection: { paddingHorizontal: 20, gap: 8, marginBottom: 4 },
  progHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progLbl: { fontSize: 13, fontWeight: '800', color: TEXT },
  progVal: { fontSize: 13, color: MUTED },
  progTrack: { height: 10, backgroundColor: BORDER, borderRadius: 8, overflow: 'hidden' },
  progFill: { height: '100%', backgroundColor: BLUE, borderRadius: 8 },

  logSection: { paddingHorizontal: 20, paddingTop: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: TEXT },
  logHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  logAction: { fontSize: 13, fontWeight: '800', color: BLUE },
  emptyTxt: { fontSize: 13, color: MUTED, textAlign: 'center', paddingVertical: 20 },
  logItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, marginBottom: 8, backgroundColor: CARD },
  logItemSel: { backgroundColor: colors.blueLight, borderWidth: 1.5, borderColor: BLUE },
  logDot: { width: 10, height: 10, borderRadius: 5 },
  logAmt: { fontSize: 15, fontWeight: '900', color: TEXT },
  logMeta: { fontSize: 12, color: MUTED },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  checkboxSel: { backgroundColor: BLUE, borderColor: BLUE },

  lbl: { fontSize: 11, fontWeight: '800', color: '#5a7a96', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6 },
  inp: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, borderWidth: 2, borderColor: BORDER, fontSize: 16, fontWeight: '700', color: TEXT, backgroundColor: '#f6fafd', marginBottom: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: CARD, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: TEXT, marginBottom: 20 },
  drinkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  drinkChip: { width: '30%', paddingVertical: 10, borderRadius: 12, borderWidth: 2, borderColor: BORDER, alignItems: 'center', backgroundColor: '#f6fafd' },
  drinkChipSel: { borderColor: BLUE, backgroundColor: colors.blueLight },
  drinkEmoji: { fontSize: 22 },
  drinkLabel: { fontSize: 12, fontWeight: '800', color: MUTED, marginTop: 3 },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalCancel: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 2, borderColor: BORDER },
  modalCancelTxt: { fontSize: 15, fontWeight: '800', color: MUTED },
  modalConfirm: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: BLUE },
  modalConfirmTxt: { fontSize: 15, fontWeight: '900', color: '#fff' },
});
