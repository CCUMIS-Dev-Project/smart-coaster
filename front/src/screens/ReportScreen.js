// src/screens/ReportScreen.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Modal, TextInput, Dimensions, Keyboard
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { colors, DRINK_BY_ID } from '../constants/theme';
import apiService from '../services/api';
import Svg, { Rect, Circle, Path, Ellipse } from 'react-native-svg';

const BLUE = colors.blue, TEXT = colors.text, MUTED = colors.muted;
const BORDER = colors.border, CARD = colors.card;
const GREEN = '#5ecb6b';

const GROQ_API_KEY = 'YOUR_GROQ_API_KEY';

// ── 植物生長 SVG（stage 1 幼苗 → 2 小植株 → 3 長葉片 → 4 花苞 → 5 完整開花）
// colored=true 顯示彩色，false 顯示灰色（未達標日）
function PlantSVG({ stage, colored }) {
  const c = colored;
  const green1 = c?'#7ec860':'#ccc', green2=c?'#9adc78':'#ddd', green3=c?'#6bb850':'#bbb';
  const floral=c?'#f4a0c0':'#ddd', stem=c?'#5a9e50':'#aaa';
  if(stage===1) return(
    <Svg width={24} height={28} viewBox="0 0 28 32">
      <Ellipse cx="14" cy="28" rx="8" ry="3" fill="#8B6914" opacity={0.2}/>
      <Rect x="12.5" y="14" width="3" height="14" rx="1.5" fill={stem}/>
      <Ellipse cx="14" cy="12" rx="6" ry="6" fill={green1}/>
    </Svg>
  );
  if(stage===2) return(
    <Svg width={29} height={40} viewBox="0 0 34 46">
      <Ellipse cx="17" cy="43" rx="10" ry="3" fill="#8B6914" opacity={0.18}/>
      <Rect x="15.5" y="18" width="3" height="25" rx="1.5" fill={stem}/>
      <Ellipse cx="17" cy="15" rx="7" ry="7" fill={green2}/>
    </Svg>
  );
  if(stage===3) return(
    <Svg width={33} height={52} viewBox="0 0 38 58">
      <Ellipse cx="19" cy="55" rx="11" ry="3" fill="#8B6914" opacity={0.18}/>
      <Rect x="17.5" y="24" width="3" height="31" rx="1.5" fill={stem}/>
      <Path d="M19 50 C8 45 5 34 15 36 C20 37 19 50 19 50Z" fill={green3}/>
      <Path d="M19 50 C30 45 33 34 23 36 C18 37 19 50 19 50Z" fill={green1}/>
      <Ellipse cx="19" cy="20" rx="8" ry="8" fill={green2}/>
    </Svg>
  );
  if(stage===4) return(
    <Svg width={37} height={62} viewBox="0 0 42 70">
      <Ellipse cx="21" cy="67" rx="12" ry="3" fill="#8B6914" opacity={0.18}/>
      <Rect x="19.5" y="30" width="3" height="37" rx="1.5" fill={stem}/>
      <Path d="M21 56 C10 51 8 41 17 42 C21 43 21 56 21 56Z" fill={green3}/>
      <Path d="M21 56 C32 51 34 41 25 42 C21 43 21 56 21 56Z" fill={green1}/>
      <Rect x="19" y="16" width="4" height="12" rx="2" fill={stem}/>
      <Ellipse cx="21" cy="16" rx="6" ry="9" fill={floral}/>
    </Svg>
  );
  // stage 5：完整開花
  return(
    <Svg width={42} height={72} viewBox="0 0 48 80">
      <Ellipse cx="24" cy="77" rx="13" ry="3" fill="#8B6914" opacity={0.18}/>
      <Rect x="22.5" y="38" width="3" height="39" rx="1.5" fill={stem}/>
      <Path d="M24 64 C12 59 10 48 20 49 C24 50 24 64 24 64Z" fill={green3}/>
      <Path d="M24 64 C36 59 38 48 28 49 C24 50 24 64 24 64Z" fill={green1}/>
      <Ellipse cx="24" cy="14" rx="5" ry="10" fill={c?'#ff9ab8':'#ddd'}/>
      <Ellipse cx="24" cy="14" rx="5" ry="10" transform="rotate(60 24 24)" fill={c?'#ffb4cc':'#eee'}/>
      <Ellipse cx="24" cy="14" rx="5" ry="10" transform="rotate(120 24 24)" fill={c?'#ff9ab8':'#ddd'}/>
      <Ellipse cx="24" cy="14" rx="5" ry="10" transform="rotate(180 24 24)" fill={c?'#ffb4cc':'#eee'}/>
      <Ellipse cx="24" cy="14" rx="5" ry="10" transform="rotate(240 24 24)" fill={c?'#ff9ab8':'#ddd'}/>
      <Ellipse cx="24" cy="14" rx="5" ry="10" transform="rotate(300 24 24)" fill={c?'#ffb4cc':'#eee'}/>
      <Circle cx="24" cy="24" r="8" fill={c?'#ffe066':'#eee'}/>
      <Circle cx="24" cy="24" r="5" fill={c?'#ffd040':'#e0e0e0'}/>
      <Circle cx="22" cy="23" r="1.2" fill="#7a4a10"/>
      <Circle cx="26" cy="23" r="1.2" fill="#7a4a10"/>
      <Path d="M21.5 25.5 Q24 28 26.5 25.5" stroke="#7a4a10" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    </Svg>
  );
}
//植物生長圖示變化結束

// ── Pie Chart（react-native-svg，互動式——點選扇形或標籤顯示 %）──
const SW = Dimensions.get('window').width;
const SH = Dimensions.get('window').height;
// s.inner padding 16*2=32, statsRow gap 12, 兩卡各佔一半
const CARD_W   = Math.floor((SW - 32 - 12) / 2);   // 每張卡片精確像素寬
// 圓餅尺寸：卡片內寬（扣 padding 14*2=28）的 52%
const PIE_SIZE = Math.floor((CARD_W - 28) * 0.52);

function polarToCartesian(cx, cy, r, deg) {
  const rad = (deg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function PieChart({ data }) {
  const [sel, setSel] = useState(null);
  const size = PIE_SIZE, cx = size / 2, cy = size / 2, r = size / 2 - 1;
  const total = data.reduce((s, d) => s + d.value, 0);

  let startDeg = 0;
  const slices = data.map((d, i) => {
    const sweep = (d.value / total) * 360;
    const endDeg = startDeg + sweep;
    const s = polarToCartesian(cx, cy, r, startDeg);
    const e = polarToCartesian(cx, cy, r, endDeg - 0.3); // 0.3° 細縫分隔
    const large = sweep > 180 ? 1 : 0;
    // M 圓心 → 起點弧邊 → arc → 終點弧邊 → 回圓心
    const path = `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`;
    startDeg = endDeg;
    return { ...d, path, pct: Math.round((d.value / total) * 100) };
  });

  const toggle = i => setSel(sel === i ? null : i);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {/* 圓餅圖 */}
      <Svg width={size} height={size}>
        {slices.map((seg, i) => (
          <Path
            key={i}
            d={seg.path}
            fill={seg.color}
            opacity={sel === null || sel === i ? 1 : 0.35}
            onPress={() => toggle(i)}
          />
        ))}
      </Svg>

      {/* 標籤：flex:1 確保不溢出覆蓋圓餅 */}
      <View style={{ flex: 1, gap: 6 }}>
        {slices.map((seg, i) => (
          <TouchableOpacity key={i} onPress={() => toggle(i)} activeOpacity={0.7}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: seg.color },
                sel === i && { width: 10, height: 10, borderRadius: 5 }]} />
              <Text style={{ fontSize: 11, fontWeight: sel === i ? '900' : '700',
                color: sel === i ? TEXT : MUTED }}>
                {seg.label}{sel === i ? `  ${seg.pct}%` : ''}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function ReportScreen() {
  const { goalMl, totalMl } = useApp();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const token = process.env.EXPO_PUBLIC_DEV_TOKEN ?? ''; // TODO [串接 auth flow 時刪除]

  const [kbHeight, setKbHeight] = useState(0);
  const [showWeekCompare, setShowWeekCompare] = useState(false);
  const [showChat,  setShowChat]  = useState(false);
  const [messages,  setMessages]  = useState([{ role: 'assistant', content: '你好！我是你的補水 AI 助理，有任何補水問題都可以問我' }]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const chatScrollRef = useRef(null);

  // ── API 資料 state ───────────────────────────────────────────
  const [weeklyStat, setWeeklyStat]   = useState(null);
  const [dailyStat,  setDailyStat]    = useState(null);
  const [streak,     setStreak]       = useState(null);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', e => setKbHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKbHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  // ── Phase A/B：每次切換到此頁重新載入 ───────────────────────
  useFocusEffect(useCallback(() => {
    apiService.getWeeklyStat(token).then(r => { if (r.success) setWeeklyStat(r.data); else console.warn('[Report] weekly:', r.error); });
    apiService.getDailyStat(token).then(r => { if (r.success) setDailyStat(r.data); else console.warn('[Report] daily:', r.error); });
    apiService.getStreaks(token).then(r => { if (r.success) setStreak(r.data); else console.warn('[Report] streak:', r.error); });
  }, []));

  // ── 衍生資料（API 回來後計算）────────────────────────────────
  const DAY_ZH = ['日', '一', '二', '三', '四', '五', '六'];
  // 用 device 本地時間（非 UTC），避免和後端台北時間的日期對不上
  const _now = new Date();
  const todayStr = [
    _now.getFullYear(),
    String(_now.getMonth() + 1).padStart(2, '0'),
    String(_now.getDate()).padStart(2, '0'),
  ].join('-');

  // 直方圖資料：7天，未來顯示 null
  const barData = weeklyStat?.days?.map(d => ({
    day: DAY_ZH[new Date(d.date + 'T12:00:00').getDay()],
    ml:  d.date > todayStr ? null : d.total_ml,
    hit: d.total_ml >= (dailyStat?.daily_target ?? goalMl),
  })) ?? [];

  const thisAvg  = Math.round(weeklyStat?.avg_this_week ?? 0);
  const prevAvg  = Math.round(weeklyStat?.avg_last_week ?? 0);
  const diffPct  = weeklyStat?.change_pct ?? 0;
  const isUp     = diffPct >= 0;
  const maxV     = Math.max(...barData.map(d => d.ml ?? 0), dailyStat?.daily_target ?? goalMl, 100);

  // 圓餅圖：by_type → label + color（用 DRINK_BY_ID mapping）
  const drinkBreakdown = (weeklyStat?.by_type ?? []).map(t => ({
    label: DRINK_BY_ID[t.type_id]?.label ?? t.type_name,
    value: t.volume_ml,
    color: DRINK_BY_ID[t.type_id]?.color ?? '#aaa',
  }));

  // 本週日平均咖啡因：只除「到今天為止」的天數，不除未來天
  const pastDaysCount = Math.max(1, (weeklyStat?.days ?? []).filter(d => d.date <= todayStr).length);
  const weekCaffeineMg = Math.round(
    (weeklyStat?.by_type ?? []).reduce((sum, t) => {
      const per100 = DRINK_BY_ID[t.type_id]?.caffeinePer100 ?? 0;
      return sum + (t.volume_ml * per100 / 100);
    }, 0) / pastDaysCount
  );
  const caffeineLimitMg = 400;

  // 今日進度（優先用 dailyStat，fallback AppContext）
  const todayTotal  = dailyStat?.total_ml  ?? totalMl;
  const todayTarget = dailyStat?.daily_target ?? goalMl;
  const todayPct    = Math.min(100, Math.round((todayTotal / Math.max(todayTarget, 1)) * 100));

  // ── Phase B：streak → gardenDays ─────────────────────────────
  const gardenStreak = streak?.current_streak ?? 0;
  const gardenDays = (() => {
    if (!streak) return Array(5).fill('empty');
    const achievedToday = streak.last_achieved === todayStr;
    const posInCycle = gardenStreak % 5;
    return Array(5).fill('empty').map((_, i) => {
      if (achievedToday) {
        const done = posInCycle === 0 ? 5 : posInCycle;
        return i < done ? 'done' : 'empty';
      } else {
        if (i < posInCycle) return 'done';
        if (i === posInCycle) return 'today';
        return 'empty';
      }
    });
  })();
  const doneCount = gardenDays.filter(d => d === 'done').length;

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs); setInput(''); setLoading(true);
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({ model: 'llama3-8b-8192', messages: [{ role: 'system', content: '你是一個專業的補水健康助理，用繁體中文回答，保持簡短友善，每次回答不超過100字。' }, ...newMsgs], max_tokens: 300 }),
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
      <ScrollView contentContainerStyle={s.inner} showsVerticalScrollIndicator={false}>

        <View style={s.head}>
          <Text style={s.title}>進度報告</Text>
          <View style={s.headRight}>
            <TouchableOpacity style={s.gardenBtn} onPress={() => navigation.navigate('花園')} activeOpacity={0.85}>
              <Text style={s.gardenBtnTxt}>🌸 花園</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 本週成長進度 */}
        <View style={s.plantCard}>
          <View style={s.plantCardBg} />
          <Text style={s.plantCardTitle}>本週成長進度</Text>
          {/* gardenDays 'done'/'today'/'empty' 決定 colored（彩色/灰色） */}
          <View style={s.stagesRow}>
            {gardenDays.map((status, i) => {
              const colored = status === 'done'; // 只有達標才彩色，today 未達標前維持灰色
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
          <View style={s.progInfo}>
            <View style={s.daysLeft}>
              {doneCount >= 5
                ? <Text style={s.daysLeftTxt}>開花了！</Text>
                : <><Text style={s.daysLeftNum}>{streak?.days_until_next_flower ?? 5}</Text><Text style={s.daysLeftSub}>天後開花</Text></>
              }
            </View>
            <View style={{ flex: 1 }}>
              <View style={s.progTopG}><Text style={s.progLblG}>今日水量</Text><Text style={s.progValG}>{todayTotal}/{todayTarget}ml</Text></View>
              <View style={s.progBarG}><View style={[s.progFillG, { width: `${todayPct}%` }]} /></View>
            </View>
          </View>
        </View>

        {/* 本週每日記錄長條圖 */}
        <View style={s.histCard}>
          <View style={s.histHeader}>
            <Text style={s.histTitle}>本週每日記錄</Text>
            <TouchableOpacity style={[s.weekBtn, isUp ? s.weekBtnUp : s.weekBtnDown]} onPress={() => setShowWeekCompare(true)} activeOpacity={0.8}>
              <Text style={[s.weekBtnTxt, isUp ? { color: '#16a34a' } : { color: '#dc2626' }]}>{isUp ? '↑' : '↓'} {Math.abs(diffPct)}% vs 上週</Text>
            </TouchableOpacity>
          </View>
          <View style={s.histRow}>
            {barData.map((d, i) => {
              const ml = d.ml;
              const barH = ml != null ? Math.round((ml / maxV) * 80) : 0;
              return (
                <View key={i} style={s.histDay}>
                  <View style={s.histBarWrap}>
                    {ml != null && <View style={[s.histBarFill, { height: Math.max(barH, 3), backgroundColor: d.hit ? GREEN : '#f87171' }]} />}
                  </View>
                  <Text style={s.histDayLbl}>{d.day}</Text>
                  <Text style={s.histMl}>{ml == null ? '-' : ml >= 1000 ? `${(ml / 1000).toFixed(1)}k` : ml || '-'}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 飲品比例 & 咖啡因 — 並排 */}
        <View style={s.statsRow}>

          {/* 左：飲品比例 pie chart（互動式，點選顯示 %） */}
          <View style={s.statsCard}>
            <Text style={s.statsTitle}>本週飲品比例</Text>
            <View style={{ marginTop: 15, alignItems: 'center' }}>
              <PieChart data={drinkBreakdown} />
            </View>
          </View>

          {/* 右：咖啡因 — 週平均 / 每日上限 */}
          <View style={s.statsCard}>
            <Text style={s.statsTitle}>本週平均咖啡因</Text>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ textAlign: 'center' }}>
                <Text style={s.caffNum}>{weekCaffeineMg}</Text>
                <Text style={s.caffLimit}>/{caffeineLimitMg} </Text>
                <Text style={s.caffUnit}>mg</Text>
              </Text>
            </View>
          </View>

        </View>

        {/* AI 改善建議 */}
        <View style={s.aiCard}>
          <View style={s.aiHeader}>
            <Text style={s.aiTitle}>AI 改善建議</Text>
            <TouchableOpacity style={s.chatBtn} onPress={() => setShowChat(true)} activeOpacity={0.8}>
              <Text style={s.chatBtnTxt}>對話</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.aiText}>
            {isUp ? `你這週的補水表現進步了！平均 ${thisAvg}ml，比上週提升 ${Math.abs(diffPct)}%。` : `這週補水量比上週減少了 ${Math.abs(diffPct)}%，平均 ${thisAvg}ml。`}
            {thisAvg < (todayTarget) ? `每天再多補充約 ${todayTarget - thisAvg}ml 就能達標！建議在下午 2 點設個提醒。` : `持續保持，你已經連續 ${gardenStreak} 天達標了！`}
          </Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* 週平均比較 Modal */}
      <Modal visible={showWeekCompare} transparent animationType="fade">
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowWeekCompare(false)}>
          <View style={s.compareModal}>
            <Text style={s.compareModalTitle}>週平均比較</Text>
            <View style={s.compareRow}>
              <View style={s.compareCol}><Text style={s.compareColLbl}>上週平均</Text><Text style={s.compareColVal}>{prevAvg}<Text style={s.compareColUnit}>ml</Text></Text></View>
              <View style={s.compareArrow}><Text style={[s.compareArrowTxt, isUp ? { color: '#16a34a' } : { color: '#dc2626' }]}>{isUp ? '↑' : '↓'}{Math.abs(diffPct)}%</Text></View>
              <View style={s.compareCol}><Text style={s.compareColLbl}>本週平均</Text><Text style={[s.compareColVal, { color: isUp ? '#16a34a' : '#dc2626' }]}>{thisAvg}<Text style={s.compareColUnit}>ml</Text></Text></View>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={s.compareDesc}>{isUp ? `你本週每天平均多喝了 ${thisAvg - prevAvg}ml，進步很多！` : `你本週每天平均少喝了 ${prevAvg - thisAvg}ml，下週加油！`}</Text>
            </View>
            <TouchableOpacity style={s.compareClose} onPress={() => setShowWeekCompare(false)}><Text style={s.compareCloseTxt}>關閉</Text></TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* AI 對話 Modal */}
      <Modal visible={showChat} transparent animationType="slide">
        <View style={s.chatOverlay}>
          <View style={[s.chatCard, kbHeight > 0 && {
            marginBottom: kbHeight,
            height: SH - kbHeight - (insets.top || 40) - 16,
          }]}>
            <View style={s.chatTopbar}>
              <Text style={s.chatTitle}>AI 補水助理</Text>
              <TouchableOpacity onPress={() => setShowChat(false)}><Text style={{ fontSize: 24, color: MUTED }}>×</Text></TouchableOpacity>
            </View>
            <ScrollView ref={chatScrollRef} style={s.chatMsgs} contentContainerStyle={{ padding: 16, gap: 10 }} onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}>
              {messages.map((m, i) => (
                <View key={i} style={[s.bubble, m.role === 'user' ? s.bubbleUser : s.bubbleAI]}>
                  <Text style={[s.bubbleTxt, m.role === 'user' ? { color: '#fff' } : { color: TEXT }]}>{m.content}</Text>
                </View>
              ))}
              {loading && <View style={s.bubbleAI}><Text style={s.bubbleTxt}>思考中...</Text></View>}
            </ScrollView>
            <View style={[s.chatInputRow, { paddingBottom: insets.bottom + 10 }]}>
              <TextInput style={s.chatInput} value={input} onChangeText={setInput} placeholder="問我任何補水問題..." placeholderTextColor={MUTED} returnKeyType="send" onSubmitEditing={sendMessage} />
              <TouchableOpacity style={s.sendBtn} onPress={sendMessage} activeOpacity={0.8}><Text style={s.sendBtnTxt}>送出</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

//style
const s = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: '#f0f7f2' },
  inner:    { padding: 16, paddingTop: 35, paddingBottom: 32, gap: 14 },
  head:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headRight:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  title:    { fontSize: 22, fontWeight: '900', color: '#1a2a1e' },
  gardenBtn:   { backgroundColor: '#ffffff', borderRadius: 10, paddingVertical: 7, paddingHorizontal: 12},
  gardenBtnTxt:{ fontSize: 11, fontWeight: '900', color: '#31a8d6' },

  plantCard:    { backgroundColor: CARD, borderRadius: 24, padding: 18, position: 'relative', overflow: 'hidden' },
  plantCardBg:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#f0fff4', borderRadius: 24 },
  plantCardTitle: { fontSize: 11, fontWeight: '900', color: '#8aaa90', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 14 },
  stagesRow:{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 },
  stage:    { alignItems: 'center', gap: 5, flex: 1 },
  stageDot: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  stageDotTxt: { fontSize: 9, fontWeight: '900', color: '#fff' },
  stageDay: { fontSize: 9, fontWeight: '800', color: '#8aaa90' },
  progInfo: { backgroundColor: '#f0fff4', borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  daysLeft: { alignItems: 'center', minWidth: 48 },
  daysLeftTxt: { fontSize: 13, fontWeight: '900', color: TEXT },
  daysLeftNum: { fontSize: 22, fontWeight: '900', color: TEXT, lineHeight: 24 },
  daysLeftSub: { fontSize: 10, color: '#8aaa90', fontWeight: '700', textAlign: 'center' },
  progTopG: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  progLblG: { fontSize: 12, fontWeight: '800', color: TEXT },
  progValG: { fontSize: 12, fontWeight: '800', color: GREEN },
  progBarG: { height: 9, backgroundColor: '#d0e8d4', borderRadius: 99, overflow: 'hidden' },
  progFillG: { height: '100%', backgroundColor: GREEN, borderRadius: 99 },

  histCard: { backgroundColor: CARD, borderRadius: 18, padding: 14 },
  histHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  histTitle: { fontSize: 13, fontWeight: '900', color: TEXT },
  weekBtn:   { borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12, borderWidth: 1.5 },
  weekBtnUp:   { backgroundColor: '#dcfce7', borderColor: '#86efac' },
  weekBtnDown: { backgroundColor: '#fee2e2', borderColor: '#fca5a5' },
  weekBtnTxt:  { fontSize: 12, fontWeight: '900' },
  histRow:  { flexDirection: 'row', gap: 6 },
  histDay:  { flex: 1, alignItems: 'center', gap: 4 },
  histBarWrap: { width: '100%', height: 80, backgroundColor: '#e8f2ea', borderRadius: 99, overflow: 'hidden', justifyContent: 'flex-end' },
  histBarFill: { width: '100%', borderRadius: 99 },
  histDayLbl: { fontSize: 9, fontWeight: '800', color: '#8aaa90' },
  histMl:   { fontSize: 9, fontWeight: '900', color: TEXT },

  statsRow:   { flexDirection: 'row', gap: 12 },                                     
  statsCard:  { flex: 1, backgroundColor: CARD, borderRadius: 18, padding: 14 },
  statsTitle: { fontSize: 11, fontWeight: '900', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.6 },
  caffNum:   { fontSize: 30, fontWeight: '900', color: TEXT },
  caffLimit: { fontSize: 18, fontWeight: '700', color: MUTED },
  caffUnit:  { fontSize: 13, fontWeight: '700', color: MUTED },

  aiCard:   { backgroundColor: CARD, borderRadius: 20, padding: 16 },
  aiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  aiTitle:  { fontSize: 15, fontWeight: '900', color: TEXT },
  chatBtn:  { backgroundColor: BLUE, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20 },
  chatBtnTxt: { fontSize: 13, fontWeight: '900', color: '#fff' },
  aiText:   { fontSize: 13, color: '#4a6a84', lineHeight: 20 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  compareModal: { backgroundColor: CARD, borderRadius: 24, padding: 24, width: '100%', gap: 16 },
  compareModalTitle: { fontSize: 18, fontWeight: '900', color: TEXT, textAlign: 'center' },
  compareRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  compareCol:   { flex: 1, alignItems: 'center', gap: 4 },
  compareColLbl: { fontSize: 12, color: MUTED, fontWeight: '800' },
  compareColVal: { fontSize: 22, fontWeight: '900', color: TEXT },
  compareColUnit: { fontSize: 13, color: MUTED },
  compareArrow:  { width: 90, alignItems: 'center' },
  compareArrowTxt: { fontSize: 16, fontWeight: '900', textAlign: 'center' },
  compareDesc:   { fontSize: 13, color: '#4a6a84', textAlign: 'left', lineHeight: 20 },
  compareClose:  { backgroundColor: BLUE, paddingVertical: 13, borderRadius: 14, alignItems: 'center' },
  compareCloseTxt: { color: '#fff', fontWeight: '900', fontSize: 15 },

  chatOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  chatCard:    { backgroundColor: CARD, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '75%' },
  chatTopbar:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: BORDER },
  chatTitle:   { fontSize: 18, fontWeight: '900', color: TEXT },
  chatMsgs:    { flex: 1 },
  bubble:      { maxWidth: '80%', padding: 12, borderRadius: 16 },
  bubbleUser:  { alignSelf: 'flex-end', backgroundColor: BLUE, borderBottomRightRadius: 4 },
  bubbleAI:    { alignSelf: 'flex-start', backgroundColor: '#f0f5fa', borderBottomLeftRadius: 4 },
  bubbleTxt:   { fontSize: 14, lineHeight: 20 },
  chatInputRow: { flexDirection: 'row', gap: 10, paddingTop: 12, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: BORDER },
  chatInput:   { flex: 1, backgroundColor: '#f6fafd', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, fontSize: 15, color: TEXT, borderWidth: 1.5, borderColor: BORDER },
  sendBtn:     { backgroundColor: BLUE, borderRadius: 14, paddingHorizontal: 18, justifyContent: 'center' },
  sendBtnTxt:  { color: '#fff', fontWeight: '900', fontSize: 15 },
});
