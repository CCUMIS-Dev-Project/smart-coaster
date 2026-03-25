// src/screens/GardenScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Modal, TextInput, Animated, Dimensions
} from 'react-native';
import Svg, { Rect, Circle, Path, Ellipse, G, Line, Polygon } from 'react-native-svg';
import { useApp } from '../context/AppContext';
import { colors } from '../constants/theme';

const BLUE = colors.blue, TEXT = colors.text, MUTED = colors.muted;
const BORDER = colors.border, CARD = colors.card;
const GREEN = '#5ecb6b';
const { width: SW, height: SH } = Dimensions.get('window');

const GROQ_API_KEY = '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';

// ── 花語資料 ─────────────────────────────────────────────
const FLOWER_DATA = [
  {
    name: '向日葵',
    language: '崇拜與忠誠',
    desc: '向日葵永遠朝向太陽，象徵對光明的追求與對摯愛的忠貞不渝。',
  },
  {
    name: '玫瑰',
    language: '熱烈的愛',
    desc: '深紅玫瑰是愛情最古老的符號，代表深沉、熾熱且無畏的愛意。',
  },
  {
    name: '櫻花',
    language: '生命之美',
    desc: '短暫而燦爛的花期提醒我們珍惜當下，感受每一個稍縱即逝的美好瞬間。',
  },
  {
    name: '鬱金香',
    language: '完美的愛',
    desc: '鬱金香高雅挺立，象徵高貴的愛情與對完美伴侶的深切渴望。',
  },
  {
    name: '薰衣草',
    language: '等待與寧靜',
    desc: '薰衣草的紫色香氣令人心靜，代表在寧靜中等待，以及對愛人的思念。',
  },
  {
    name: '雛菊',
    language: '純真與希望',
    desc: '雛菊潔白無瑕，象徵純真的心靈與對未來充滿希望的輕盈心境。',
  },
  {
    name: '水仙',
    language: '自尊與重生',
    desc: '水仙在嚴冬後第一個綻放，象徵自我尊重、新的開始與內心的重生。',
  },
  {
    name: '彩虹花',
    language: '多彩與奇蹟',
    desc: '如彩虹般絢爛，象徵生命中每一種色彩都是奇蹟，擁抱所有的可能性。',
  },
];

// ── 八種寫實 SVG 花朵 ─────────────────────────────────────

// 向日葵：多層花瓣 + 種子紋
function Flower1({ size = 40, colored }) {
  const c = colored;
  const pc = c ? '#F5A623' : '#ccc';
  const pc2 = c ? '#E8941A' : '#bbb';
  const cc = c ? '#4A2500' : '#aaa';
  const cc2 = c ? '#3A1A00' : '#999';
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      {[0,20,40,60,80,100,120,140,160,180,200,220,240,260,280,300,320,340].map((a,i) => (
        <Ellipse key={i} cx="40" cy="14" rx="4" ry="10"
          fill={i%2===0 ? pc : pc2}
          transform={`rotate(${a} 40 40)`} />
      ))}
      {[10,30,50,70,90,110,130,150,170,190,210,230,250,270,290,310,330,350].map((a,i) => (
        <Ellipse key={`b${i}`} cx="40" cy="20" rx="3" ry="7"
          fill={pc2} opacity={0.7}
          transform={`rotate(${a} 40 40)`} />
      ))}
      <Circle cx="40" cy="40" r="16" fill={cc} />
      <Circle cx="40" cy="40" r="13" fill={cc2} />
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((a,i)=>{
        const r=8, rad=a*Math.PI/180;
        return <Circle key={`s${i}`} cx={40+r*Math.cos(rad)} cy={40+r*Math.sin(rad)} r="1.8" fill={c?'#6B3800':'#bbb'} />;
      })}
      {[15,45,75,105,135,165,195,225,255,285,315,345].map((a,i)=>{
        const r=5, rad=a*Math.PI/180;
        return <Circle key={`s2${i}`} cx={40+r*Math.cos(rad)} cy={40+r*Math.sin(rad)} r="1.2" fill={c?'#5A2E00':'#aaa'} />;
      })}
    </Svg>
  );
}

// 玫瑰：層疊螺旋花瓣
function Flower2({ size = 40, colored }) {
  const c = colored;
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      {/* 外層花瓣 */}
      <Path d="M40 10 C28 10 16 22 18 36 C20 48 30 54 40 56 C50 54 60 48 62 36 C64 22 52 10 40 10Z"
        fill={c?'#C0392B':'#ddd'} />
      <Path d="M22 20 C14 28 14 42 22 50 C28 44 30 32 28 22Z"
        fill={c?'#E74C3C':'#ccc'} />
      <Path d="M58 20 C66 28 66 42 58 50 C52 44 50 32 52 22Z"
        fill={c?'#E74C3C':'#ccc'} />
      {/* 中層花瓣 */}
      <Path d="M40 16 C32 16 24 26 26 38 C28 46 34 50 40 51 C46 50 52 46 54 38 C56 26 48 16 40 16Z"
        fill={c?'#E74C3C':'#ddd'} />
      <Path d="M28 24 C22 30 22 42 28 48 C32 44 34 34 32 26Z"
        fill={c?'#EC7063':'#ccc'} />
      <Path d="M52 24 C58 30 58 42 52 48 C48 44 46 34 48 26Z"
        fill={c?'#EC7063':'#ccc'} />
      {/* 內層花瓣 */}
      <Path d="M40 22 C34 22 28 30 30 40 C32 46 36 49 40 49 C44 49 48 46 50 40 C52 30 46 22 40 22Z"
        fill={c?'#EC7063':'#ddd'} />
      {/* 花芯 */}
      <Path d="M40 28 C36 28 33 32 34 38 C35 42 38 44 40 44 C42 44 45 42 46 38 C47 32 44 28 40 28Z"
        fill={c?'#F1948A':'#eee'} />
      <Circle cx="40" cy="38" r="4" fill={c?'#FDEBD0':'#f5f5f5'} />
    </Svg>
  );
}

// 櫻花：五片心形缺口花瓣
function Flower3({ size = 40, colored }) {
  const c = colored;
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      {[0,72,144,216,288].map((a,i)=>(
        <G key={i} transform={`rotate(${a} 40 40)`}>
          <Path d="M40 12 C34 8 24 12 24 20 C24 28 32 32 40 38 C48 32 56 28 56 20 C56 12 46 8 40 12Z"
            fill={c?'#FFB7C5':'#e0e0e0'} />
          <Path d="M40 12 C37 10 34 12 34 16 C34 20 37 22 40 24"
            fill="none" stroke={c?'#FF8FA3':'#ccc'} strokeWidth="1" />
        </G>
      ))}
      <Circle cx="40" cy="40" r="8" fill={c?'#FFF0F3':'#f0f0f0'} />
      {[0,60,120,180,240,300].map((a,i)=>{
        const rad=a*Math.PI/180;
        return <G key={`s${i}`}>
          <Line x1="40" y1="40" x2={40+9*Math.cos(rad)} y2={40+9*Math.sin(rad)}
            stroke={c?'#FF69B4':'#ccc'} strokeWidth="1" />
          <Circle cx={40+10*Math.cos(rad)} cy={40+10*Math.sin(rad)} r="2"
            fill={c?'#FFD700':'#ddd'} />
        </G>;
      })}
      <Circle cx="40" cy="40" r="4" fill={c?'#FFE4E8':'#eee'} />
    </Svg>
  );
}

// 鬱金香：真實杯形
function Flower4({ size = 40, colored }) {
  const c = colored;
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      {/* 莖 */}
      <Path d="M40 80 C40 70 38 60 40 50" stroke={c?'#2E8B57':'#bbb'} strokeWidth="3" fill="none" strokeLinecap="round"/>
      {/* 葉子 */}
      <Path d="M40 65 C30 58 22 50 26 44 C30 38 38 44 40 50"
        fill={c?'#3CB371':'#ccc'} />
      <Path d="M40 60 C50 53 58 45 54 39 C50 33 42 39 40 45"
        fill={c?'#2E8B57':'#bbb'} />
      {/* 花 - 左外瓣 */}
      <Path d="M24 44 C18 36 18 24 24 16 C28 10 34 12 36 20 C38 28 36 38 36 44Z"
        fill={c?'#E8001A':'#ddd'} />
      {/* 花 - 右外瓣 */}
      <Path d="M56 44 C62 36 62 24 56 16 C52 10 46 12 44 20 C42 28 44 38 44 44Z"
        fill={c?'#E8001A':'#ddd'} />
      {/* 花 - 中間瓣 */}
      <Path d="M32 46 C28 38 28 24 32 14 C34 8 38 8 40 14 C42 8 46 8 48 14 C52 24 52 38 48 46Z"
        fill={c?'#FF2233':'#eee'} />
      {/* 花內高光 */}
      <Path d="M36 42 C34 34 34 22 37 14" stroke={c?'#FF6677':'#e0e0e0'} strokeWidth="2" fill="none" strokeLinecap="round"/>
      <Path d="M44 42 C46 34 46 22 43 14" stroke={c?'#FF6677':'#e0e0e0'} strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* 花底 */}
      <Ellipse cx="40" cy="46" rx="12" ry="4" fill={c?'#CC0015':'#ccc'} />
    </Svg>
  );
}

// 薰衣草：穗狀小花叢
function Flower5({ size = 40, colored }) {
  const c = colored;
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      {/* 主莖 */}
      <Line x1="40" y1="78" x2="40" y2="20" stroke={c?'#556B2F':'#bbb'} strokeWidth="2.5" strokeLinecap="round"/>
      {/* 側枝 */}
      <Line x1="40" y1="55" x2="28" y2="44" stroke={c?'#556B2F':'#bbb'} strokeWidth="1.8" strokeLinecap="round"/>
      <Line x1="40" y1="50" x2="52" y2="39" stroke={c?'#556B2F':'#bbb'} strokeWidth="1.8" strokeLinecap="round"/>
      <Line x1="40" y1="44" x2="30" y2="34" stroke={c?'#556B2F':'#bbb'} strokeWidth="1.5" strokeLinecap="round"/>
      <Line x1="40" y1="40" x2="50" y2="30" stroke={c?'#556B2F':'#bbb'} strokeWidth="1.5" strokeLinecap="round"/>
      {/* 主穗花苞 */}
      {[20,25,30,35,40,45,50].map((y,i)=>(
        <G key={i}>
          <Ellipse cx={40+(i%2===0?-2:2)} cy={y} rx="4.5" ry="3"
            fill={c?'#7B68EE':'#ccc'} />
          <Ellipse cx={40+(i%2===0?-2:2)} cy={y-1} rx="3" ry="2"
            fill={c?'#9370DB':'#ddd'} />
        </G>
      ))}
      {/* 側枝花苞 */}
      {[[28,44],[52,39],[30,34],[50,30]].map(([x,y],i)=>(
        <G key={`s${i}`}>
          <Ellipse cx={x} cy={y} rx="4" ry="2.5" fill={c?'#7B68EE':'#ccc'} />
          <Ellipse cx={x} cy={y-1} rx="2.5" ry="1.8" fill={c?'#9370DB':'#ddd'} />
        </G>
      ))}
    </Svg>
  );
}

// 雛菊：細長白瓣
function Flower6({ size = 40, colored }) {
  const c = colored;
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      {/* 外層花瓣 */}
      {[0,18,36,54,72,90,108,126,144,162,180,198,216,234,252,270,288,306,324,342].map((a,i)=>(
        <Ellipse key={i} cx="40" cy="13" rx="3" ry="10"
          fill={c?'#FFFEF0':'#e8e8e8'}
          stroke={c?'#E8E0C0':'#d0d0d0'} strokeWidth="0.5"
          transform={`rotate(${a} 40 40)`} />
      ))}
      {/* 內層 */}
      {[9,27,45,63,81,99,117,135,153,171,189,207,225,243,261,279,297,315,333,351].map((a,i)=>(
        <Ellipse key={`b${i}`} cx="40" cy="18" rx="2" ry="7"
          fill={c?'#FFF8E0':'#e0e0e0'}
          transform={`rotate(${a} 40 40)`} opacity={0.8} />
      ))}
      {/* 花心 */}
      <Circle cx="40" cy="40" r="12" fill={c?'#F5C518':'#ccc'} />
      <Circle cx="40" cy="40" r="9" fill={c?'#E8B800':'#bbb'} />
      <Circle cx="40" cy="40" r="6" fill={c?'#D4A000':'#aaa'} />
      {/* 花粉點 */}
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((a,i)=>{
        const rad=a*Math.PI/180;
        return <Circle key={`p${i}`} cx={40+7*Math.cos(rad)} cy={40+7*Math.sin(rad)} r="1.2" fill={c?'#A07800':'#999'} />;
      })}
    </Svg>
  );
}

// 水仙：喇叭花冠 + 六片瓣
function Flower7({ size = 40, colored }) {
  const c = colored;
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      {/* 六片外瓣 */}
      {[0,60,120,180,240,300].map((a,i)=>(
        <Ellipse key={i} cx="40" cy="12" rx="6" ry="14"
          fill={c?'#FFFACD':'#e8e8e8'}
          stroke={c?'#E8E000':'#ccc'} strokeWidth="0.5"
          transform={`rotate(${a} 40 40)`} />
      ))}
      {/* 喇叭花冠外緣 */}
      <Circle cx="40" cy="40" r="14" fill={c?'#FF8C00':'#ccc'} />
      <Circle cx="40" cy="40" r="12" fill={c?'#FF7700':'#bbb'} />
      {/* 喇叭花冠內 */}
      <Circle cx="40" cy="40" r="10" fill={c?'#FF6600':'#aaa'} />
      {/* 花冠皺褶 */}
      {[0,40,80,120,160,200,240,280,320].map((a,i)=>{
        const rad=a*Math.PI/180;
        const r1=10, r2=13;
        return <Line key={i}
          x1={40+r1*Math.cos(rad)} y1={40+r1*Math.sin(rad)}
          x2={40+r2*Math.cos(rad)} y2={40+r2*Math.sin(rad)}
          stroke={c?'#FF4500':'#999'} strokeWidth="1.5" />;
      })}
      {/* 花蕊 */}
      <Circle cx="40" cy="40" r="5" fill={c?'#FFD700':'#eee'} />
      {[0,72,144,216,288].map((a,i)=>{
        const rad=a*Math.PI/180;
        return <G key={`st${i}`}>
          <Line x1="40" y1="40" x2={40+6*Math.cos(rad)} y2={40+6*Math.sin(rad)}
            stroke={c?'#8B6914':'#ccc'} strokeWidth="1" />
          <Circle cx={40+7*Math.cos(rad)} cy={40+7*Math.sin(rad)} r="1.5"
            fill={c?'#DAA520':'#ddd'} />
        </G>;
      })}
    </Svg>
  );
}

// 彩虹花（虹之玉/鳶尾花風格）：多色分層花瓣
function Flower8({ size = 40, colored }) {
  const c = colored;
  const cols = c
    ? ['#FF4444','#FF8C00','#FFD700','#4CAF50','#2196F3','#9C27B0','#FF69B4']
    : new Array(7).fill('#ddd');
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      {/* 下垂大花瓣（鳶尾下瓣 style）*/}
      {cols.map((col,i)=>{
        const a = i*(360/7);
        return (
          <G key={i} transform={`rotate(${a} 40 40)`}>
            <Path d="M40 40 C34 32 28 20 34 10 C37 4 40 8 40 16 C40 8 43 4 46 10 C52 20 46 32 40 40Z"
              fill={col} opacity={c?0.92:1} />
            <Path d="M40 16 C38 12 36 10 36 14" stroke={c?'rgba(255,255,255,0.4)':'#e0e0e0'} strokeWidth="1" fill="none"/>
          </G>
        );
      })}
      {/* 中心 */}
      <Circle cx="40" cy="40" r="10" fill={c?'#FFFFFF':'#f0f0f0'} />
      <Circle cx="40" cy="40" r="7" fill={c?'#F8F8F8':'#e8e8e8'} />
      {cols.map((col,i)=>{
        const rad=(i*(360/7))*Math.PI/180;
        return <Circle key={`c${i}`} cx={40+5*Math.cos(rad)} cy={40+5*Math.sin(rad)} r="2"
          fill={c?col:'#ccc'} />;
      })}
      <Circle cx="40" cy="40" r="3" fill={c?'#FFD700':'#bbb'} />
    </Svg>
  );
}

const FLOWER_COMPONENTS = [Flower1,Flower2,Flower3,Flower4,Flower5,Flower6,Flower7,Flower8];
const FLOWERS_INIT = FLOWER_DATA.map((f,i)=>({ ...f, unlocked: i<2, isNew: i===1 }));

// ── 植物 SVG ────────────────────────────────────────────
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

// ── 全螢幕花園場景 ────────────────────────────────────────
function GardenScene({ flowers, onFlowerPress, onClose }) {
  const unlockedFlowers = flowers.filter(f => f.unlocked);
  const stemHeights = [90, 110, 80, 100, 95, 115, 85, 105];

  return (
    <View style={gs.container}>
      {/* 天空 */}
      <View style={gs.sky}>
        {/* 太陽 */}
        <View style={gs.sun} />
        {/* 雲朵 */}
        <View style={[gs.cloud, {top:40, left:40, width:80, height:28}]} />
        <View style={[gs.cloud, {top:30, left:80, width:50, height:18}]} />
        <View style={[gs.cloud, {top:60, right:50, width:70, height:24}]} />
        <View style={[gs.cloud, {top:50, right:30, width:40, height:16}]} />
        {/* 標題列 */}
        <View style={gs.titleBar}>
          <Text style={gs.titleTxt}>我的花園</Text>
          <TouchableOpacity onPress={onClose} style={gs.closeBtn}>
            <Text style={gs.closeTxt}>×</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 花朵區域 */}
      <View style={gs.flowerArea}>
        {flowers.map((f, i) => {
          const FlowerComp = FLOWER_COMPONENTS[i];
          const stemH = stemHeights[i % stemHeights.length];
          const isUnlocked = f.unlocked;
          return (
            <TouchableOpacity
              key={f.name}
              style={[gs.flowerItem, { height: stemH + 60 }]}
              onPress={() => onFlowerPress(f, i)}
              activeOpacity={0.8}
            >
              <View style={{ opacity: isUnlocked ? 1 : 0.25 }}>
                <FlowerComp size={isUnlocked ? 44 : 36} colored={isUnlocked} />
              </View>
              {/* 莖 */}
              <View style={[gs.stem, { height: stemH, opacity: isUnlocked ? 1 : 0.3 }]} />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 草地 */}
      <View style={gs.grassWrap}>
        {Array.from({length:30}).map((_,i)=>(
          <View key={i} style={[gs.grassBlade, {
            left: `${(i/30)*100}%`,
            height: 12 + (i%4)*5,
            transform:[{rotate:`${-20 + (i%5)*10}deg`}]
          }]} />
        ))}
      </View>

      {/* 地面 */}
      <View style={gs.ground} />
    </View>
  );
}

// ── 解鎖動畫元件 ─────────────────────────────────────────
function UnlockAnimation({ flower, index, onClose }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacAnim  = useRef(new Animated.Value(0)).current;
  const petalAnims = useRef(Array.from({length:12}, ()=>new Animated.Value(0))).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue:1, tension:60, friction:6, useNativeDriver:true }),
        Animated.timing(opacAnim, { toValue:1, duration:300, useNativeDriver:true }),
      ]),
      Animated.stagger(50, petalAnims.map(a =>
        Animated.timing(a, { toValue:1, duration:400, useNativeDriver:true })
      )),
    ]).start();
  }, []);

  const FlowerComp = FLOWER_COMPONENTS[index];

  return (
    <View style={ua.overlay}>
      {/* 飄落花瓣 */}
      {petalAnims.map((a, i) => {
        const x = (i/12)*SW - 20;
        const translateY = a.interpolate({ inputRange:[0,1], outputRange:[-20, SH*0.5] });
        const opacity    = a.interpolate({ inputRange:[0,0.7,1], outputRange:[0,1,0] });
        return (
          <Animated.View key={i} style={[ua.petal, { left:x, transform:[{translateY}], opacity }]}>
            <Svg width={14} height={14} viewBox="0 0 20 20">
              <Ellipse cx="10" cy="10" rx="5" ry="8" fill={['#FF8FA3','#FFB7C5','#FFD700','#9370DB','#7EC860'][i%5]} />
            </Svg>
          </Animated.View>
        );
      })}

      <Animated.View style={[ua.card, { transform:[{scale:scaleAnim}], opacity:opacAnim }]}>
        <Text style={ua.newTxt}>新花朵解鎖</Text>
        <Text style={ua.nameTxt}>{flower.name}</Text>
        <View style={ua.flowerBig}>
          <FlowerComp size={80} colored />
        </View>
        <View style={ua.langBox}>
          <Text style={ua.langTitle}>花語</Text>
          <Text style={ua.langWord}>{flower.language}</Text>
        </View>
        <Text style={ua.descTxt}>{flower.desc}</Text>
        <TouchableOpacity style={ua.gardenBtn} onPress={onClose} activeOpacity={0.85}>
          <Text style={ua.gardenBtnTxt}>插入花園欣賞</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ── 花語彈窗 ─────────────────────────────────────────────
function FlowerInfoModal({ flower, index, onClose }) {
  const FlowerComp = FLOWER_COMPONENTS[index];
  return (
    <View style={fi.overlay}>
      <TouchableOpacity style={fi.bg} activeOpacity={1} onPress={onClose} />
      <View style={fi.card}>
        <View style={fi.flowerRow}>
          <FlowerComp size={64} colored={flower.unlocked} />
          <View style={{ flex:1 }}>
            <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:4 }}>
              <Text style={fi.name}>{flower.name}</Text>
              <View style={[fi.badge, flower.unlocked ? fi.badgeOn : fi.badgeOff]}>
                <Text style={[fi.badgeTxt, { color: flower.unlocked?'#16a34a':'#9ca3af' }]}>
                  {flower.unlocked ? '已解鎖' : '未解鎖'}
                </Text>
              </View>
            </View>
            <Text style={fi.langLabel}>花語</Text>
            <Text style={fi.lang}>{flower.language}</Text>
          </View>
        </View>
        <View style={fi.divider} />
        <Text style={fi.desc}>{flower.desc}</Text>
        {!flower.unlocked && (
          <View style={fi.lockHint}>
            <Text style={fi.lockHintTxt}>連續達標 5 天即可解鎖這朵花</Text>
          </View>
        )}
        <TouchableOpacity style={fi.closeBtn} onPress={onClose} activeOpacity={0.85}>
          <Text style={fi.closeBtnTxt}>關閉</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── 主畫面 ───────────────────────────────────────────────
export default function GardenScreen() {
  const { weekData, goalMl, totalMl } = useApp();

  const gardenDays   = ['done','done','done','today','empty'];
  const gardenStreak = 3;
  const [flowers, setFlowers] = useState(FLOWERS_INIT);

  const [showGarden,    setShowGarden]    = useState(false);
  const [showFlowerInfo,setShowFlowerInfo]= useState(false);
  const [showUnlock,    setShowUnlock]    = useState(false);
  const [selectedFlower,setSelectedFlower]= useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [showChat,  setShowChat]  = useState(false);
  const [messages,  setMessages]  = useState([
    { role:'assistant', content:'你好！我是你的補水 AI 助理，有任何補水問題都可以問我' }
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showWeekCompare, setShowWeekCompare] = useState(false);
  const chatScrollRef = useRef(null);

  const prevWeek = [1400,1600,1200,1800,1500,2000,1700];
  const thisWeekMl = weekData.map(d=>d.ml);
  const prevAvg = Math.round(prevWeek.reduce((a,b)=>a+b,0)/prevWeek.length);
  const thisAvg = Math.round(thisWeekMl.reduce((a,b)=>a+b,0)/thisWeekMl.length);
  const diffPct = prevAvg>0 ? Math.round(((thisAvg-prevAvg)/prevAvg)*100) : 0;
  const isUp    = diffPct>=0;
  const maxV    = Math.max(...weekData.map(d=>d.ml), goalMl, 100);
  const doneCount     = gardenDays.filter(d=>d==='done').length;
  const unlockedCount = flowers.filter(f=>f.unlocked).length;
  const todayPct      = Math.min(100, Math.round((totalMl/goalMl)*100));

  function handleFlowerPress(flower, index) {
    setSelectedFlower(flower);
    setSelectedIndex(index);
    setShowFlowerInfo(true);
  }

  function handleGardenFlowerPress(flower, index) {
    setSelectedFlower(flower);
    setSelectedIndex(index);
    setShowFlowerInfo(true);
  }

  // 模擬解鎖（測試用）
  function handleUnlockDemo() {
    const nextLocked = flowers.findIndex(f=>!f.unlocked);
    if(nextLocked === -1) return;
    setSelectedFlower(flowers[nextLocked]);
    setSelectedIndex(nextLocked);
    setShowUnlock(true);
    setFlowers(prev => prev.map((f,i) => i===nextLocked ? {...f, unlocked:true, isNew:true} : f));
  }

  async function sendMessage() {
    if(!input.trim()||loading) return;
    const userMsg = {role:'user', content:input.trim()};
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${GROQ_API_KEY}`},
        body: JSON.stringify({
          model:'llama3-8b-8192',
          messages:[
            {role:'system',content:'你是一個專業的補水健康助理，用繁體中文回答，保持簡短友善，每次回答不超過100字。'},
            ...newMsgs,
          ],
          max_tokens:300,
        }),
      });
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || '抱歉，我現在無法回答。';
      setMessages(prev=>[...prev,{role:'assistant',content:reply}]);
    } catch {
      setMessages(prev=>[...prev,{role:'assistant',content:'連線失敗，請稍後再試。'}]);
    }
    setLoading(false);
  }

  const DAY_LABELS = ['第1天','第2天','第3天','第4天','第5天'];
  const DOT_COLOR  = {done:'#5ecb6b',today:BLUE,fail:'#f87171',empty:'#dde8de'};
  const DOT_LABEL  = {done:'✓',today:'▶',fail:'✕',empty:''};

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.head}>
        <View>
          <Text style={s.title}>我的花園</Text>
          <Text style={s.subtitle}>連續5天達成目標飲水量，就可以綻放一朵花！</Text>
        </View>
        <TouchableOpacity style={s.gardenEntryBtn} onPress={() => setShowGarden(true)} activeOpacity={0.85}>
  <Svg width={44} height={44} viewBox="0 0 80 80">
    {[0,60,120,180,240,300].map((a,i)=>(
      <Ellipse key={i} cx="40" cy="16" rx="7" ry="13"
        fill={i%2===0?'#ff9ab8':'#ffb4cc'}
        transform={`rotate(${a} 40 40)`} />
    ))}
    <Circle cx="40" cy="40" r="12" fill="#ffe066" />
    <Circle cx="40" cy="40" r="8" fill="#ffd040" />
  </Svg>
  <Text style={s.gardenEntryTxt}>花園</Text>
</TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.inner} showsVerticalScrollIndicator={false}>

        {/* 本週成長進度 */}
        <View style={s.plantCard}>
          <View style={s.plantCardBg}/>
          <Text style={s.plantCardTitle}>本週成長進度</Text>
          <View style={s.stagesRow}>
            {gardenDays.map((status,i)=>{
              const colored = status==='done'||status==='today';
              return(
                <View key={i} style={s.stage}>
                  <PlantSVG stage={i+1} colored={colored}/>
                  <View style={[s.stageDot,{backgroundColor:DOT_COLOR[status]||'#dde8de'}]}>
                    <Text style={s.stageDotTxt}>{DOT_LABEL[status]}</Text>
                  </View>
                  <Text style={s.stageDay}>{DAY_LABELS[i]}</Text>
                </View>
              );
            })}
          </View>
          <View style={s.progInfo}>
            <View style={s.daysLeft}>
              {doneCount>=5
                ? <Text style={s.daysLeftTxt}>開花了！</Text>
                : <><Text style={s.daysLeftNum}>{5-doneCount}</Text><Text style={s.daysLeftSub}>天後開花</Text></>
              }
            </View>
            <View style={{flex:1}}>
              <View style={s.progTopG}>
                <Text style={s.progLblG}>今日水量</Text>
                <Text style={s.progValG}>{totalMl}/{goalMl}ml</Text>
              </View>
              <View style={s.progBarG}>
                <View style={[s.progFillG,{width:`${todayPct}%`}]}/>
              </View>
            </View>
          </View>
        </View>

        {/* 本週每日記錄 */}
        <View style={s.histCard}>
        <View style={s.histHeader}>
  <Text style={s.histTitle}>本週每日記錄</Text>
  <View style={{flexDirection:'row', gap:8, alignItems:'center'}}>
    <View style={s.streakBadge}>
      <Text style={s.streakLbl}>已連續達標{gardenStreak}天！</Text>
    </View>
    <TouchableOpacity style={[s.weekBtn,isUp?s.weekBtnUp:s.weekBtnDown]}
      onPress={()=>setShowWeekCompare(true)} activeOpacity={0.8}>
      <Text style={[s.weekBtnTxt,isUp?{color:'#16a34a'}:{color:'#dc2626'}]}>
        {isUp?'↑':'↓'} {Math.abs(diffPct)}% vs 上週
      </Text>
    </TouchableOpacity>
  </View>
</View>
          <View style={s.histRow}>
            {weekData.map((d,i)=>{
              const barH=Math.round((d.ml/maxV)*80);
              const hit=d.ml>=goalMl;
              return(
                <View key={d.day} style={s.histDay}>
                  <View style={{width:20,height:20}}>
                    {hit ? <Flower3 size={20} colored /> : <PlantSVG stage={d.ml>goalMl*0.5?2:1} colored={d.ml>0} />}
                  </View>
                  <View style={s.histBarWrap}>
                    <View style={[s.histBarFill,{height:Math.max(barH,3),backgroundColor:hit?GREEN:'#f87171'}]}/>
                  </View>
                  <Text style={s.histDayLbl}>{d.day}</Text>
                  <Text style={s.histMl}>{d.ml>=1000?`${(d.ml/1000).toFixed(1)}k`:d.ml||'-'}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* AI 改善建議 */}
        <View style={s.aiCard}>
          <View style={s.aiHeader}>
            <Text style={s.aiTitle}>AI 改善建議</Text>
            <TouchableOpacity style={s.chatBtn} onPress={()=>setShowChat(true)} activeOpacity={0.8}>
              <Text style={s.chatBtnTxt}>對話</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.aiText}>
            {isUp
              ? `你這週的補水表現進步了！平均 ${thisAvg}ml，比上週提升 ${Math.abs(diffPct)}%。`
              : `這週補水量比上週減少了 ${Math.abs(diffPct)}%，平均 ${thisAvg}ml。`
            }
            {thisAvg<goalMl
              ? `每天再多補充約 ${goalMl-thisAvg}ml 就能達標！建議在下午 2 點設個提醒。`
              : `持續保持，你已經連續 ${gardenStreak} 天達標了！`
            }
          </Text>
        </View>

        {/* 花朵收藏 */}
        <View style={s.collCard}>
          <View style={s.collHeader}>
            <Text style={s.collTitle}>花朵收藏</Text>
            <Text style={s.collCount}>已收集 {unlockedCount} / {flowers.length}</Text>
          </View>
          <View style={s.flowerGrid}>
            {flowers.map((f,i)=>{
              const FlowerComp = FLOWER_COMPONENTS[i];
              const isNext = !f.unlocked && i===flowers.findIndex(x=>!x.unlocked);
              return(
                <TouchableOpacity key={f.name}
                  style={[s.flowerSlot, f.unlocked?s.flowerUnlocked:s.flowerLocked]}
                  onPress={()=>handleFlowerPress(f,i)} activeOpacity={0.8}>
                  {f.isNew && <View style={s.newBadge}><Text style={s.newBadgeTxt}>NEW</Text></View>}
                  <FlowerComp size={34} colored={f.unlocked}/>
                  <Text style={f.unlocked?s.flowerName:s.flowerLockTxt}>
                    {f.unlocked ? f.name : isNext ? `再${5-doneCount}天` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{height:20}}/>
      </ScrollView>

      {/* 全螢幕花園 Modal */}
      <Modal visible={showGarden} animationType="slide">
        <GardenScene
          flowers={flowers}
          onFlowerPress={handleGardenFlowerPress}
          onClose={()=>setShowGarden(false)}
        />
        {/* 花語彈窗（在花園內） */}
        {showFlowerInfo && selectedFlower && (
          <FlowerInfoModal
            flower={selectedFlower}
            index={selectedIndex}
            onClose={()=>setShowFlowerInfo(false)}
          />
        )}
      </Modal>

      {/* 花語彈窗（在收藏格點） */}
      {showFlowerInfo && !showGarden && selectedFlower && (
        <Modal visible transparent animationType="fade">
          <FlowerInfoModal
            flower={selectedFlower}
            index={selectedIndex}
            onClose={()=>setShowFlowerInfo(false)}
          />
        </Modal>
      )}

      {/* 解鎖動畫 */}
      {showUnlock && selectedFlower && (
        <Modal visible transparent animationType="fade">
          <UnlockAnimation
            flower={selectedFlower}
            index={selectedIndex}
            onClose={()=>{ setShowUnlock(false); setShowGarden(true); }}
          />
        </Modal>
      )}

      {/* 週比較 Modal */}
      <Modal visible={showWeekCompare} transparent animationType="fade">
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={()=>setShowWeekCompare(false)}>
          <View style={s.compareModal}>
            <Text style={s.compareModalTitle}>週平均比較</Text>
            <View style={s.compareRow}>
              <View style={s.compareCol}>
                <Text style={s.compareColLbl}>上週平均</Text>
                <Text style={s.compareColVal}>{prevAvg}<Text style={s.compareColUnit}>ml</Text></Text>
              </View>
              <View style={s.compareArrow}>
                <Text style={[s.compareArrowTxt,isUp?{color:'#16a34a'}:{color:'#dc2626'}]}>
                  {isUp?'↑':'↓'}{Math.abs(diffPct)}%
                </Text>
              </View>
              <View style={s.compareCol}>
                <Text style={s.compareColLbl}>本週平均</Text>
                <Text style={[s.compareColVal,{color:isUp?'#16a34a':'#dc2626'}]}>
                  {thisAvg}<Text style={s.compareColUnit}>ml</Text>
                </Text>
              </View>
            </View>
            <Text style={s.compareDesc}>
              {isUp
                ? `你本週每天平均多喝了 ${thisAvg-prevAvg}ml，進步很多！`
                : `你本週每天平均少喝了 ${prevAvg-thisAvg}ml，下週加油！`
              }
            </Text>
            <TouchableOpacity style={s.compareClose} onPress={()=>setShowWeekCompare(false)}>
              <Text style={s.compareCloseTxt}>關閉</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Chatbot Modal */}
      <Modal visible={showChat} transparent animationType="slide">
        <View style={s.chatOverlay}>
          <View style={s.chatCard}>
            <View style={s.chatTopbar}>
              <Text style={s.chatTitle}>AI 補水助理</Text>
              <TouchableOpacity onPress={()=>setShowChat(false)}>
                <Text style={{fontSize:24,color:MUTED}}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView ref={chatScrollRef} style={s.chatMsgs}
              contentContainerStyle={{padding:16,gap:10}}
              onContentSizeChange={()=>chatScrollRef.current?.scrollToEnd({animated:true})}>
              {messages.map((m,i)=>(
                <View key={i} style={[s.bubble,m.role==='user'?s.bubbleUser:s.bubbleAI]}>
                  <Text style={[s.bubbleTxt,m.role==='user'?{color:'#fff'}:{color:TEXT}]}>{m.content}</Text>
                </View>
              ))}
              {loading && <View style={s.bubbleAI}><Text style={s.bubbleTxt}>思考中...</Text></View>}
            </ScrollView>
            <View style={s.chatInputRow}>
              <TextInput style={s.chatInput} value={input} onChangeText={setInput}
                placeholder="問我任何補水問題..." placeholderTextColor={MUTED}
                returnKeyType="send" onSubmitEditing={sendMessage}/>
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

// ── Styles ───────────────────────────────────────────────
const gs = StyleSheet.create({
  container:  { flex:1, backgroundColor:'#87CEEB' },
  sky:        { flex:1, position:'relative' },
  sun:        { position:'absolute', top:60, right:40, width:50, height:50, borderRadius:25, backgroundColor:'#FFD700' },
  cloud:      { position:'absolute', backgroundColor:'#fff', borderRadius:20, opacity:0.88 },
  titleBar:   { position:'absolute', top:50, left:0, right:0, flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:20 },
  titleTxt:   { fontSize:20, fontWeight:'900', color:'#fff' },
  closeBtn:   { width:36, height:36, borderRadius:18, backgroundColor:'rgba(0,0,0,0.2)', alignItems:'center', justifyContent:'center' },
  closeTxt:   { fontSize:22, color:'#fff', lineHeight:28 },
  flowerArea: { flexDirection:'row', justifyContent:'space-around', alignItems:'flex-end', paddingHorizontal:8, paddingBottom:0 },
  flowerItem: { alignItems:'center', justifyContent:'flex-end' },
  stem:       { width:4, backgroundColor:'#4a8c3f', borderRadius:2 },
  grassWrap:  { height:24, backgroundColor:'#5DBB4A', flexDirection:'row', overflow:'hidden', position:'relative' },
  grassBlade: { position:'absolute', bottom:0, width:3, backgroundColor:'#4CAF50', borderRadius:2 },
  ground:     { height:50, backgroundColor:'#6B4423' },
});

const ua = StyleSheet.create({
  overlay:  { flex:1, backgroundColor:'rgba(0,0,0,0.7)', alignItems:'center', justifyContent:'center', padding:32 },
  petal:    { position:'absolute', top:0 },
  card:     { backgroundColor:'#fff', borderRadius:28, padding:28, width:'100%', alignItems:'center', gap:12 },
  newTxt:   { fontSize:12, fontWeight:'800', color:'#9ca3af', textTransform:'uppercase', letterSpacing:1 },
  nameTxt:  { fontSize:26, fontWeight:'900', color:'#1a2a1e' },
  flowerBig:{ width:100, height:100, alignItems:'center', justifyContent:'center' },
  langBox:  { backgroundColor:'#f0fff4', borderRadius:14, paddingVertical:8, paddingHorizontal:16, alignItems:'center' },
  langTitle:{ fontSize:11, fontWeight:'800', color:'#8aaa90' },
  langWord: { fontSize:16, fontWeight:'900', color:'#16a34a' },
  descTxt:  { fontSize:13, color:'#4a6a84', textAlign:'center', lineHeight:20 },
  gardenBtn:{ backgroundColor:'#5ab4f5', paddingVertical:14, paddingHorizontal:32, borderRadius:16, marginTop:4 },
  gardenBtnTxt:{ color:'#fff', fontSize:15, fontWeight:'900' },
});

const fi = StyleSheet.create({
  overlay:  { flex:1, justifyContent:'flex-end' },
  bg:       { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(0,0,0,0.5)' },
  card:     { backgroundColor:'#fff', borderTopLeftRadius:28, borderTopRightRadius:28, padding:24, paddingBottom:40, gap:14 },
  flowerRow:{ flexDirection:'row', alignItems:'center', gap:16 },
  name:     { fontSize:20, fontWeight:'900', color:'#1a2a1e' },
  badge:    { paddingVertical:3, paddingHorizontal:10, borderRadius:20 },
  badgeOn:  { backgroundColor:'#dcfce7' },
  badgeOff: { backgroundColor:'#f3f4f6' },
  badgeTxt: { fontSize:11, fontWeight:'700' },
  langLabel:{ fontSize:11, color:'#8aaa90', fontWeight:'800' },
  lang:     { fontSize:15, fontWeight:'900', color:'#16a34a' },
  divider:  { height:1, backgroundColor:'#f0f5f0' },
  desc:     { fontSize:14, color:'#4a6a84', lineHeight:22 },
  lockHint: { backgroundColor:'#fef9e7', borderRadius:12, padding:12 },
  lockHintTxt:{ fontSize:13, color:'#b7791f', textAlign:'center' },
  closeBtn: { backgroundColor:'#5ab4f5', paddingVertical:14, borderRadius:16, alignItems:'center' },
  closeBtnTxt:{ color:'#fff', fontSize:15, fontWeight:'900' },
});

const s = StyleSheet.create({
  safe:     { flex:1, backgroundColor:'#f0f7f2' },
  head:     { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', paddingHorizontal:20, paddingTop:56, paddingBottom:12 },
  title:    { fontSize:22, fontWeight:'900', color:'#1a2a1e' },
  subtitle: { fontSize:12, color:'#8aaa90', marginTop:3 },
  gardenEntryBtn:{ alignItems:'center', gap:2 },
  gardenEntryTxt:{ fontSize:11, fontWeight:'900', color:'#2d6a27' },
  streakBadge: { borderRadius:20, paddingVertical:5, paddingHorizontal:12, borderWidth:1.5, backgroundColor:'#fff3e0', borderColor:'#ff9a3c' },
streakNum:   { fontSize:12, fontWeight:'900', color:'#e65c00' },
streakLbl:   { fontSize:10, fontWeight:'800', color:'#e65c00' },
  inner:    { padding:16, paddingBottom:32, gap:14 },
  plantCard:    { backgroundColor:CARD, borderRadius:24, padding:18, position:'relative', overflow:'hidden' },
  plantCardBg:  { position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'#f0fff4', borderRadius:24 },
  plantCardTitle:{ fontSize:11, fontWeight:'900', color:'#8aaa90', textTransform:'uppercase', letterSpacing:0.7, marginBottom:14 },
  stagesRow:{ flexDirection:'row', alignItems:'flex-end', justifyContent:'space-between', marginBottom:14 },
  stage:    { alignItems:'center', gap:5, flex:1 },
  stageDot: { width:18, height:18, borderRadius:9, alignItems:'center', justifyContent:'center' },
  stageDotTxt:{ fontSize:9, fontWeight:'900', color:'#fff' },
  stageDay: { fontSize:9, fontWeight:'800', color:'#8aaa90' },
  progInfo: { backgroundColor:'#f0fff4', borderRadius:14, padding:12, flexDirection:'row', alignItems:'center', gap:12 },
  daysLeft: { alignItems:'center', minWidth:48 },
  daysLeftTxt:{ fontSize:13, fontWeight:'900', color:TEXT },
  daysLeftNum:{ fontSize:22, fontWeight:'900', color:TEXT, lineHeight:24 },
  daysLeftSub:{ fontSize:10, color:'#8aaa90', fontWeight:'700', textAlign:'center' },
  progTopG: { flexDirection:'row', justifyContent:'space-between', marginBottom:5 },
  progLblG: { fontSize:12, fontWeight:'800', color:TEXT },
  progValG: { fontSize:12, fontWeight:'800', color:GREEN },
  progBarG: { height:9, backgroundColor:'#d0e8d4', borderRadius:99, overflow:'hidden' },
  progFillG:{ height:'100%', backgroundColor:GREEN, borderRadius:99 },
  histCard: { backgroundColor:CARD, borderRadius:18, padding:14 },
  histHeader:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  histTitle:{ fontSize:13, fontWeight:'900', color:TEXT },
  weekBtn:  { borderRadius:20, paddingVertical:5, paddingHorizontal:12, borderWidth:1.5 },
  weekBtnUp:{ backgroundColor:'#dcfce7', borderColor:'#86efac' },
  weekBtnDown:{ backgroundColor:'#fee2e2', borderColor:'#fca5a5' },
  weekBtnTxt:{ fontSize:12, fontWeight:'900' },
  histRow:  { flexDirection:'row', gap:6 },
  histDay:  { flex:1, alignItems:'center', gap:4 },
  histBarWrap:{ width:'100%', height:80, backgroundColor:'#e8f2ea', borderRadius:99, overflow:'hidden', justifyContent:'flex-end' },
  histBarFill:{ width:'100%', borderRadius:99 },
  histDayLbl:{ fontSize:9, fontWeight:'800', color:'#8aaa90' },
  histMl:   { fontSize:9, fontWeight:'900', color:TEXT },
  aiCard:   { backgroundColor:CARD, borderRadius:20, padding:16 },
  aiHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  aiTitle:  { fontSize:15, fontWeight:'900', color:TEXT },
  chatBtn:  { backgroundColor:BLUE, paddingVertical:6, paddingHorizontal:16, borderRadius:20 },
  chatBtnTxt:{ fontSize:13, fontWeight:'900', color:'#fff' },
  aiText:   { fontSize:13, color:'#4a6a84', lineHeight:20 },
  collCard: { backgroundColor:CARD, borderRadius:22, padding:16 },
  collHeader:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  collTitle:{ fontSize:15, fontWeight:'900', color:TEXT },
  collCount:{ fontSize:12, fontWeight:'800', color:GREEN },
  flowerGrid:{ flexDirection:'row', flexWrap:'wrap', gap:8 },
  flowerSlot:{ width:'22%', aspectRatio:1, borderRadius:16, alignItems:'center', justifyContent:'center', gap:3, position:'relative' },
  flowerUnlocked:{ backgroundColor:'#f8fff8', borderWidth:2, borderColor:'#b8e8c0' },
  flowerLocked:  { backgroundColor:'#f4f4f4', borderWidth:2, borderColor:'#e8e8e8' },
  flowerName:    { fontSize:8, fontWeight:'800', color:'#6a8a6e', textAlign:'center' },
  flowerLockTxt: { fontSize:8, fontWeight:'800', color:'#b0b0b0' },
  newBadge:    { position:'absolute', top:3, right:3, backgroundColor:'#ff6b35', borderRadius:5, paddingVertical:2, paddingHorizontal:3 },
  newBadgeTxt: { fontSize:7, fontWeight:'900', color:'#fff' },
  modalOverlay:{ flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', alignItems:'center', padding:32 },
  compareModal:{ backgroundColor:CARD, borderRadius:24, padding:24, width:'100%', gap:16 },
  compareModalTitle:{ fontSize:18, fontWeight:'900', color:TEXT, textAlign:'center' },
  compareRow:  { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  compareCol:  { flex:1, alignItems:'center', gap:4 },
  compareColLbl:{ fontSize:12, color:MUTED, fontWeight:'800' },
  compareColVal:{ fontSize:28, fontWeight:'900', color:TEXT },
  compareColUnit:{ fontSize:14, color:MUTED },
  compareArrow:{ paddingHorizontal:12 },
  compareArrowTxt:{ fontSize:22, fontWeight:'900' },
  compareDesc: { fontSize:13, color:'#4a6a84', textAlign:'center', lineHeight:20 },
  compareClose:{ backgroundColor:BLUE, paddingVertical:13, borderRadius:14, alignItems:'center' },
  compareCloseTxt:{ color:'#fff', fontWeight:'900', fontSize:15 },
  chatOverlay:{ flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  chatCard:   { backgroundColor:CARD, borderTopLeftRadius:24, borderTopRightRadius:24, height:'75%' },
  chatTopbar: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:20, borderBottomWidth:1, borderBottomColor:BORDER },
  chatTitle:  { fontSize:18, fontWeight:'900', color:TEXT },
  chatMsgs:   { flex:1 },
  bubble:     { maxWidth:'80%', padding:12, borderRadius:16 },
  bubbleUser: { alignSelf:'flex-end', backgroundColor:BLUE, borderBottomRightRadius:4 },
  bubbleAI:   { alignSelf:'flex-start', backgroundColor:'#f0f5fa', borderBottomLeftRadius:4 },
  bubbleTxt:  { fontSize:14, lineHeight:20 },
  chatInputRow:{ flexDirection:'row', gap:10, padding:16, borderTopWidth:1, borderTopColor:BORDER },
  chatInput:  { flex:1, backgroundColor:'#f6fafd', borderRadius:14, paddingVertical:12, paddingHorizontal:16, fontSize:15, color:TEXT, borderWidth:1.5, borderColor:BORDER },
  sendBtn:    { backgroundColor:BLUE, borderRadius:14, paddingHorizontal:18, justifyContent:'center' },
  sendBtnTxt: { color:'#fff', fontWeight:'900', fontSize:15 },
});