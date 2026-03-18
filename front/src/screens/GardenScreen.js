// src/screens/GardenScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Modal, TextInput, Animated
} from 'react-native';
import Svg, { Rect, Circle, Path, Ellipse, G } from 'react-native-svg';
import { useApp } from '../context/AppContext';
import { colors } from '../constants/theme';

const BLUE = colors.blue, TEXT = colors.text, MUTED = colors.muted;
const BORDER = colors.border, CARD = colors.card, BG = colors.greenBg;
const GREEN = '#5ecb6b', GREEN_BG = '#f0fff4';

const GROQ_API_KEY = 'YOUR_GROQ_API_KEY';

const FLOWERS = [
  { name: '向日葵', emoji: '🌻', unlocked: true,  isNew: false },
  { name: '玫瑰',   emoji: '🌹', unlocked: true,  isNew: true  },
  { name: '櫻花',   emoji: '🌸', unlocked: false, isNew: false },
  { name: '鬱金香', emoji: '🌷', unlocked: false, isNew: false },
  { name: '薰衣草', emoji: '💜', unlocked: false, isNew: false },
  { name: '雛菊',   emoji: '🌼', unlocked: false, isNew: false },
  { name: '水仙',   emoji: '🌾', unlocked: false, isNew: false },
  { name: '彩虹花', emoji: '🌈', unlocked: false, isNew: false },
];

// 植物 SVG（五個成長階段）
function PlantSVG({ stage, colored }) {
  const c = colored ? 1 : 0;
  const green1 = c ? '#7ec860' : '#ccc';
  const green2 = c ? '#9adc78' : '#ddd';
  const green3 = c ? '#6bb850' : '#bbb';
  const floral = c ? '#f4a0c0' : '#ddd';
  const yellow = c ? '#ffe066' : '#eee';
  const stem   = c ? '#5a9e50' : '#aaa';

  if (stage === 1) return (
    <Svg width={24} height={28} viewBox="0 0 28 32">
      <Ellipse cx="14" cy="28" rx="8" ry="3" fill="#8B6914" opacity={0.2} />
      <Rect x="12.5" y="14" width="3" height="14" rx="1.5" fill={stem} />
      <Ellipse cx="14" cy="12" rx="6" ry="6" fill={green1} />
    </Svg>
  );
  if (stage === 2) return (
    <Svg width={29} height={40} viewBox="0 0 34 46">
      <Ellipse cx="17" cy="43" rx="10" ry="3" fill="#8B6914" opacity={0.18} />
      <Rect x="15.5" y="18" width="3" height="25" rx="1.5" fill={stem} />
      <Ellipse cx="17" cy="15" rx="7" ry="7" fill={green2} />
    </Svg>
  );
  if (stage === 3) return (
    <Svg width={33} height={52} viewBox="0 0 38 58">
      <Ellipse cx="19" cy="55" rx="11" ry="3" fill="#8B6914" opacity={0.18} />
      <Rect x="17.5" y="24" width="3" height="31" rx="1.5" fill={stem} />
      <Path d="M19 50 C8 45 5 34 15 36 C20 37 19 50 19 50Z" fill={green3} />
      <Path d="M19 50 C30 45 33 34 23 36 C18 37 19 50 19 50Z" fill={green1} />
      <Ellipse cx="19" cy="20" rx="8" ry="8" fill={green2} />
    </Svg>
  );
  if (stage === 4) return (
    <Svg width={37} height={62} viewBox="0 0 42 70">
      <Ellipse cx="21" cy="67" rx="12" ry="3" fill="#8B6914" opacity={0.18} />
      <Rect x="19.5" y="30" width="3" height="37" rx="1.5" fill={stem} />
      <Path d="M21 56 C10 51 8 41 17 42 C21 43 21 56 21 56Z" fill={green3} />
      <Path d="M21 56 C32 51 34 41 25 42 C21 43 21 56 21 56Z" fill={green1} />
      <Rect x="19" y="16" width="4" height="12" rx="2" fill={stem} />
      <Ellipse cx="21" cy="16" rx="6" ry="9" fill={floral} />
    </Svg>
  );
  // stage 5 - full bloom
  return (
    <Svg width={42} height={72} viewBox="0 0 48 80">
      <Ellipse cx="24" cy="77" rx="13" ry="3" fill="#8B6914" opacity={0.18} />
      <Rect x="22.5" y="38" width="3" height="39" rx="1.5" fill={stem} />
      <Path d="M24 64 C12 59 10 48 20 49 C24 50 24 64 24 64Z" fill={green3} />
      <Path d="M24 64 C36 59 38 48 28 49 C24 50 24 64 24 64Z" fill={green1} />  
     
      {/* 完整六瓣花 */}
      <Ellipse cx="24" cy="14" rx="5" ry="10" fill={c ? '#ff9ab8' : '#ddd'} />
      <Ellipse cx="24" cy="14" rx="5" ry="10" transform="rotate(60 24 24)" fill={c ? '#ffb4cc' : '#eee'} />
      <Ellipse cx="24" cy="14" rx="5" ry="10" transform="rotate(120 24 24)" fill={c ? '#ff9ab8' : '#ddd'} />
      <Ellipse cx="24" cy="14" rx="5" ry="10" transform="rotate(180 24 24)" fill={c ? '#ffb4cc' : '#eee'} />
      <Ellipse cx="24" cy="14" rx="5" ry="10" transform="rotate(240 24 24)" fill={c ? '#ff9ab8' : '#ddd'} />
      <Ellipse cx="24" cy="14" rx="5" ry="10" transform="rotate(300 24 24)" fill={c ? '#ffb4cc' : '#eee'} />
  
      {/* 花心 */}
      <Circle cx="24" cy="24" r="8" fill={c ? '#ffe066' : '#eee'} />
      <Circle cx="24" cy="24" r="5" fill={c ? '#ffd040' : '#e0e0e0'} />
  
      {/* 花心臉 */}
      <Circle cx="22" cy="23" r="1.2" fill="#7a4a10" />
      <Circle cx="26" cy="23" r="1.2" fill="#7a4a10" />
      <Path d="M21.5 25.5 Q24 28 26.5 25.5" stroke="#7a4a10" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </Svg>
  ); 
}

export default function GardenScreen() {
  const { weekData, goalMl, totalMl } = useApp();

  const gardenDays   = ['done', 'done', 'done', 'today', 'empty'];
  const gardenStreak = 3;

  const [showChat,  setShowChat]  = useState(false);
  const [messages,  setMessages]  = useState([
    { role: 'assistant', content: '你好！我是你的補水 AI 助理，有任何補水問題都可以問我 💧' }
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showWeekCompare, setShowWeekCompare] = useState(false);
  const chatScrollRef = useRef(null);

  // 週比較
  const prevWeek = [1400, 1600, 1200, 1800, 1500, 2000, 1700];
  const thisWeekMl = weekData.map(d => d.ml);
  const prevAvg = Math.round(prevWeek.reduce((a, b) => a + b, 0) / prevWeek.length);
  const thisAvg = Math.round(thisWeekMl.reduce((a, b) => a + b, 0) / thisWeekMl.length);
  const diffPct = prevAvg > 0 ? Math.round(((thisAvg - prevAvg) / prevAvg) * 100) : 0;
  const isUp    = diffPct >= 0;

  const maxV = Math.max(...weekData.map(d => d.ml), goalMl, 100);

  const doneCount = gardenDays.filter(d => d === 'done').length;
  const unlockedCount = FLOWERS.filter(f => f.unlocked).length;

  // 今日進度
  const todayPct = Math.min(100, Math.round((totalMl / goalMl) * 100));

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            { role: 'system', content: '你是一個專業的補水健康助理，用繁體中文回答，保持簡短友善，每次回答不超過100字。' },
            ...newMsgs,
          ],
          max_tokens: 300,
        }),
      });
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || '抱歉，我現在無法回答。';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '連線失敗，請稍後再試。' }]);
    }
    setLoading(false);
  }

  const DAY_LABELS = ['第1天', '第2天', '第3天', '第4天', '第5天'];
  const DOT_COLOR  = { done: '#5ecb6b', today: BLUE, fail: '#f87171', empty: '#dde8de' };
  const DOT_LABEL  = { done: '✓', today: '▶', fail: '✕', empty: '' };

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.head}>
        <View>
          <Text style={s.title}>我的花園</Text>
          <Text style={s.subtitle}>連續 5 天達標，綻放一朵花！</Text>
        </View>
        <View style={s.streakBadge}>
          <Text style={s.streakNum}>{gardenStreak}</Text>
          <Text style={s.streakLbl}>連續天🔥</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.inner} showsVerticalScrollIndicator={false}>

        {/* ── 本週成長進度（plant card）── */}
        <View style={s.plantCard}>
          <View style={s.plantCardBg} />
          <Text style={s.plantCardTitle}>本週成長進度</Text>

          {/* 植物階段 */}
          <View style={s.stagesRow}>
            {gardenDays.map((status, i) => {
              const colored = status === 'done' || status === 'today';
              return (
                <View key={i} style={s.stage}>
                  <PlantSVG stage={i + 1} colored={colored} />
                  <View style={[s.stageDot, { backgroundColor: DOT_COLOR[status] || '#dde8de' }]}>
                    <Text style={s.stageDotTxt}>{DOT_LABEL[status]}</Text>
                  </View>
                  <Text style={s.stageDay}>{DAY_LABELS[i]}</Text>
                </View>
              );
            })}
          </View>

          {/* 進度資訊 */}
          <View style={s.progInfo}>
            <View style={s.daysLeft}>
              {doneCount >= 5
                ? <Text style={s.daysLeftTxt}>🌸 開花了！</Text>
                : <><Text style={s.daysLeftNum}>{5 - doneCount}</Text><Text style={s.daysLeftSub}>天後{'\n'}開花</Text></>
              }
            </View>
            <View style={{ flex: 1 }}>
              <View style={s.progTopG}>
                <Text style={s.progLblG}>今日水量</Text>
                <Text style={s.progValG}>{totalMl}/{goalMl}ml</Text>
              </View>
              <View style={s.progBarG}>
                <View style={[s.progFillG, { width: `${todayPct}%` }]} />
              </View>
            </View>
          </View>
        </View>

        {/* ── 本週每日記錄 + 週比較按鈕 ── */}
        <View style={s.histCard}>
          <View style={s.histHeader}>
            <Text style={s.histTitle}>本週每日記錄</Text>
            <TouchableOpacity
              style={[s.weekBtn, isUp ? s.weekBtnUp : s.weekBtnDown]}
              onPress={() => setShowWeekCompare(true)}
              activeOpacity={0.8}
            >
              <Text style={[s.weekBtnTxt, isUp ? { color: '#16a34a' } : { color: '#dc2626' }]}>
                {isUp ? '↑' : '↓'} {Math.abs(diffPct)}% vs 上週
              </Text>
            </TouchableOpacity>
          </View>

          <View style={s.histRow}>
            {weekData.map((d, i) => {
              const barH = Math.round((d.ml / maxV) * 80);
              const hit  = d.ml >= goalMl;
              const pe   = hit ? '🌸' : d.ml > goalMl * 0.8 ? '🌿' : d.ml > goalMl * 0.5 ? '🌱' : '🥀';
              return (
                <View key={d.day} style={s.histDay}>
                  <Text style={s.histPlant}>{pe}</Text>
                  <View style={s.histBarWrap}>
                    <View style={[s.histBarFill, {
                      height: Math.max(barH, 3),
                      backgroundColor: hit ? GREEN : '#f87171'
                    }]} />
                  </View>
                  <Text style={s.histDayLbl}>{d.day}</Text>
                  <Text style={s.histMl}>{d.ml >= 1000 ? `${(d.ml/1000).toFixed(1)}k` : d.ml || '-'}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── AI 改善建議 ── */}
        <View style={s.aiCard}>
          <View style={s.aiHeader}>
            <Text style={s.aiTitle}>AI 改善建議</Text>
            <TouchableOpacity style={s.chatBtn} onPress={() => setShowChat(true)} activeOpacity={0.8}>
              <Text style={s.chatBtnTxt}>對話</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.aiText}>
            {isUp
              ? `你這週的補水表現進步了！平均 ${thisAvg}ml，比上週提升 ${Math.abs(diffPct)}%。`
              : `這週補水量比上週減少了 ${Math.abs(diffPct)}%，平均 ${thisAvg}ml。`
            }
            {thisAvg < goalMl
              ? `每天再多補充約 ${goalMl - thisAvg}ml 就能達標！建議在下午 2 點設個提醒。`
              : ` 持續保持，你已經連續 ${gardenStreak} 天達標了！`
            }
          </Text>
        </View>

        {/* ── 花朵收藏 ── */}
        <View style={s.collCard}>
          <View style={s.collHeader}>
            <Text style={s.collTitle}>花朵收藏</Text>
            <Text style={s.collCount}>已收集 {unlockedCount} / {FLOWERS.length}</Text>
          </View>
          <View style={s.flowerGrid}>
            {FLOWERS.map((f, i) => {
              const isNext = !f.unlocked && i === FLOWERS.findIndex(x => !x.unlocked);
              return (
                <View key={f.name} style={[s.flowerSlot, f.unlocked ? s.flowerUnlocked : s.flowerLocked]}>
                  {f.isNew && <View style={s.newBadge}><Text style={s.newBadgeTxt}>NEW</Text></View>}
                  <Text style={[s.flowerEmoji, !f.unlocked && { opacity: 0.3 }]}>{f.emoji}</Text>
                  <Text style={f.unlocked ? s.flowerName : s.flowerLockTxt}>
                    {f.unlocked ? f.name : isNext ? `再${5 - doneCount}天` : ''}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── 週比較 Modal ── */}
      <Modal visible={showWeekCompare} transparent animationType="fade">
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowWeekCompare(false)}>
          <View style={s.compareModal}>
            <Text style={s.compareModalTitle}>週平均比較</Text>
            <View style={s.compareRow}>
              <View style={s.compareCol}>
                <Text style={s.compareColLbl}>上週平均</Text>
                <Text style={s.compareColVal}>{prevAvg}<Text style={s.compareColUnit}>ml</Text></Text>
              </View>
              <View style={s.compareArrow}>
                <Text style={[s.compareArrowTxt, isUp ? { color: '#16a34a' } : { color: '#dc2626' }]}>
                  {isUp ? '↑' : '↓'}{Math.abs(diffPct)}%
                </Text>
              </View>
              <View style={s.compareCol}>
                <Text style={s.compareColLbl}>本週平均</Text>
                <Text style={[s.compareColVal, { color: isUp ? '#16a34a' : '#dc2626' }]}>
                  {thisAvg}<Text style={s.compareColUnit}>ml</Text>
                </Text>
              </View>
            </View>
            <Text style={s.compareDesc}>
              {isUp
                ? `你本週每天平均多喝了 ${thisAvg - prevAvg}ml，進步很多！`
                : `你本週每天平均少喝了 ${prevAvg - thisAvg}ml，下週加油！`
              }
            </Text>
            <TouchableOpacity style={s.compareClose} onPress={() => setShowWeekCompare(false)}>
              <Text style={s.compareCloseTxt}>關閉</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Chatbot Modal ── */}
      <Modal visible={showChat} transparent animationType="slide">
        <View style={s.chatOverlay}>
          <View style={s.chatCard}>
            <View style={s.chatTopbar}>
              <Text style={s.chatTitle}>AI 補水助理</Text>
              <TouchableOpacity onPress={() => setShowChat(false)}>
                <Text style={{ fontSize: 24, color: MUTED }}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={chatScrollRef}
              style={s.chatMsgs}
              contentContainerStyle={{ padding: 16, gap: 10 }}
              onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.map((m, i) => (
                <View key={i} style={[s.bubble, m.role === 'user' ? s.bubbleUser : s.bubbleAI]}>
                  <Text style={[s.bubbleTxt, m.role === 'user' ? { color: '#fff' } : { color: TEXT }]}>
                    {m.content}
                  </Text>
                </View>
              ))}
              {loading && (
                <View style={s.bubbleAI}>
                  <Text style={s.bubbleTxt}>思考中...</Text>
                </View>
              )}
            </ScrollView>

            <View style={s.chatInputRow}>
              <TextInput
                style={s.chatInput}
                value={input}
                onChangeText={setInput}
                placeholder="問我任何補水問題..."
                placeholderTextColor={MUTED}
                returnKeyType="send"
                onSubmitEditing={sendMessage}
              />
              <TouchableOpacity style={s.sendBtn} onPress={sendMessage} activeOpacity={0.8}>
                <Text style={s.sendBtnTxt}>送出</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: '#f0f7f2' },
  head:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '900', color: '#1a2a1e' },
  subtitle: { fontSize: 12, color: '#8aaa90', marginTop: 3 },
  streakBadge: { backgroundColor: '#ff6b35', borderRadius: 12, paddingVertical: 7, paddingHorizontal: 12, alignItems: 'center' },
  streakNum: { fontSize: 20, fontWeight: '900', color: '#fff', lineHeight: 22 },
  streakLbl: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.85)' },

  inner: { padding: 16, paddingBottom: 32, gap: 14 },

  // Plant card
  plantCard:   { backgroundColor: CARD, borderRadius: 24, padding: 18, position: 'relative', overflow: 'hidden' },
  plantCardBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#f0fff4', borderRadius: 24 },
  plantCardTitle: { fontSize: 11, fontWeight: '900', color: '#8aaa90', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 14 },

  stagesRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 },
  stage:     { alignItems: 'center', gap: 5, flex: 1 },
  stageDot:  { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  stageDotTxt: { fontSize: 9, fontWeight: '900', color: '#fff' },
  stageDay:  { fontSize: 9, fontWeight: '800', color: '#8aaa90' },

  progInfo:  { backgroundColor: '#f0fff4', borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  daysLeft:  { alignItems: 'center', minWidth: 48 },
  daysLeftTxt: { fontSize: 13, fontWeight: '900', color: TEXT },
  daysLeftNum: { fontSize: 22, fontWeight: '900', color: TEXT, lineHeight: 24 },
  daysLeftSub: { fontSize: 10, color: '#8aaa90', fontWeight: '700', textAlign: 'center' },
  progTopG:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  progLblG:  { fontSize: 12, fontWeight: '800', color: TEXT },
  progValG:  { fontSize: 12, fontWeight: '800', color: GREEN },
  progBarG:  { height: 9, backgroundColor: '#d0e8d4', borderRadius: 99, overflow: 'hidden' },
  progFillG: { height: '100%', backgroundColor: GREEN, borderRadius: 99 },

  // Hist card
  histCard:   { backgroundColor: CARD, borderRadius: 18, padding: 14 },
  histHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  histTitle:  { fontSize: 13, fontWeight: '900', color: TEXT },
  weekBtn:    { borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12, borderWidth: 1.5 },
  weekBtnUp:  { backgroundColor: '#dcfce7', borderColor: '#86efac' },
  weekBtnDown:{ backgroundColor: '#fee2e2', borderColor: '#fca5a5' },
  weekBtnTxt: { fontSize: 12, fontWeight: '900' },
  histRow:    { flexDirection: 'row', gap: 6 },
  histDay:    { flex: 1, alignItems: 'center', gap: 4 },
  histPlant:  { fontSize: 16 },
  histBarWrap:{ width: '100%', height: 80, backgroundColor: '#e8f2ea', borderRadius: 99, overflow: 'hidden', justifyContent: 'flex-end' },
  histBarFill:{ width: '100%', borderRadius: 99 },
  histDayLbl: { fontSize: 9, fontWeight: '800', color: '#8aaa90' },
  histMl:     { fontSize: 9, fontWeight: '900', color: TEXT },

  // AI card
  aiCard:   { backgroundColor: CARD, borderRadius: 20, padding: 16 },
  aiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  aiTitle:  { fontSize: 15, fontWeight: '900', color: TEXT },
  chatBtn:  { backgroundColor: BLUE, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20 },
  chatBtnTxt: { fontSize: 13, fontWeight: '900', color: '#fff' },
  aiText:   { fontSize: 13, color: '#4a6a84', lineHeight: 20 },

  // Flower collection
  collCard:   { backgroundColor: CARD, borderRadius: 22, padding: 16 },
  collHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  collTitle:  { fontSize: 15, fontWeight: '900', color: TEXT },
  collCount:  { fontSize: 12, fontWeight: '800', color: GREEN },
  flowerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  flowerSlot: { width: '22%', aspectRatio: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 3, position: 'relative' },
  flowerUnlocked: { backgroundColor: '#f8fff8', borderWidth: 2, borderColor: '#b8e8c0' },
  flowerLocked:   { backgroundColor: '#f4f4f4', borderWidth: 2, borderColor: '#e8e8e8' },
  flowerEmoji:    { fontSize: 26 },
  flowerName:     { fontSize: 8, fontWeight: '800', color: '#6a8a6e', textAlign: 'center' },
  flowerLockTxt:  { fontSize: 8, fontWeight: '800', color: '#b0b0b0' },
  newBadge:    { position: 'absolute', top: 3, right: 3, backgroundColor: '#ff6b35', borderRadius: 5, paddingVertical: 2, paddingHorizontal: 3 },
  newBadgeTxt: { fontSize: 7, fontWeight: '900', color: '#fff' },

  // Week compare modal
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  compareModal:  { backgroundColor: CARD, borderRadius: 24, padding: 24, width: '100%', gap: 16 },
  compareModalTitle: { fontSize: 18, fontWeight: '900', color: TEXT, textAlign: 'center' },
  compareRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  compareCol:    { flex: 1, alignItems: 'center', gap: 4 },
  compareColLbl: { fontSize: 12, color: MUTED, fontWeight: '800' },
  compareColVal: { fontSize: 28, fontWeight: '900', color: TEXT },
  compareColUnit:{ fontSize: 14, color: MUTED },
  compareArrow:  { paddingHorizontal: 12 },
  compareArrowTxt: { fontSize: 22, fontWeight: '900' },
  compareDesc:   { fontSize: 13, color: '#4a6a84', textAlign: 'center', lineHeight: 20 },
  compareClose:  { backgroundColor: BLUE, paddingVertical: 13, borderRadius: 14, alignItems: 'center' },
  compareCloseTxt: { color: '#fff', fontWeight: '900', fontSize: 15 },

  // Chatbot
  chatOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  chatCard:    { backgroundColor: CARD, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '75%' },
  chatTopbar:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: BORDER },
  chatTitle:   { fontSize: 18, fontWeight: '900', color: TEXT },
  chatMsgs:    { flex: 1 },
  bubble:      { maxWidth: '80%', padding: 12, borderRadius: 16 },
  bubbleUser:  { alignSelf: 'flex-end', backgroundColor: BLUE, borderBottomRightRadius: 4 },
  bubbleAI:    { alignSelf: 'flex-start', backgroundColor: '#f0f5fa', borderBottomLeftRadius: 4 },
  bubbleTxt:   { fontSize: 14, lineHeight: 20 },
  chatInputRow:{ flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: BORDER },
  chatInput:   { flex: 1, backgroundColor: '#f6fafd', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, fontSize: 15, color: TEXT, borderWidth: 1.5, borderColor: BORDER },
  sendBtn:     { backgroundColor: BLUE, borderRadius: 14, paddingHorizontal: 18, justifyContent: 'center' },
  sendBtnTxt:  { color: '#fff', fontWeight: '900', fontSize: 15 },
});