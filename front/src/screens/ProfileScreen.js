// src/screens/ProfileScreen.js
// 原本：靜態顯示個人資料 + 編輯按鈕
// 現在：Ripple 風格的個人資料頁，保留所有欄位、整合到 SettingScreen 的「個人資料」入口
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const BLUE = '#5ab4f5', TEXT = '#1a2a3a', MUTED = '#8aaac0', BORDER = '#e2eaf2';

// 保留原本的 userData 結構
const userData = {
  name: '小寶杯',
  gender: '不願透漏',
  birthday: '2026 / 03 / 10',
  height: '170 cm',
  weight: '65 kg',
  // 新增 Ripple 相關欄位
  goal: '2100 ml',
  cup: '馬克杯 400ml',
  activity: '輕度活動',
};

export default function ProfileScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backTxt}>←</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>個人資料</Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={{ fontSize: 52 }}>☕</Text>
          </View>
          <Text style={styles.userName}>{userData.name}</Text>
          <Text style={styles.userTag}>健康飲水者 💧</Text>
        </View>

        {/* Info groups */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>基本資料</Text>
          <InfoRow label="姓名"     value={userData.name}     icon="👤" />
          <InfoRow label="性別"     value={userData.gender}   icon="🚻" />
          <InfoRow label="出生年月日" value={userData.birthday} icon="📅" />
          <InfoRow label="身高"     value={userData.height}   icon="📏" />
          <InfoRow label="體重"     value={userData.weight}   icon="⚖️" />
        </View>

        <View style={styles.group}>
          <Text style={styles.groupTitle}>飲水設定</Text>
          <InfoRow label="每日目標" value={userData.goal}     icon="🎯" />
          <InfoRow label="水杯夥伴" value={userData.cup}      icon="☕" />
          <InfoRow label="活動量"   value={userData.activity} icon="🏃" />
        </View>

        {/* Edit button（保留原本功能，navigate 到 InitialSettingScreen） */}
        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('Initial')} activeOpacity={0.85}>
          <Text style={styles.editBtnTxt}>編輯個人資料</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, icon }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f7fc' },
  inner: { padding: 20, paddingTop: 56, paddingBottom: 32, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  backTxt: { fontSize: 18 },
  pageTitle: { fontSize: 22, fontWeight: '900', color: TEXT },

  avatarSection: { alignItems: 'center', gap: 6, paddingVertical: 8 },
  avatarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#eaf6ff', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: BLUE },
  userName: { fontSize: 22, fontWeight: '900', color: TEXT },
  userTag: { fontSize: 13, color: BLUE, fontWeight: '700' },

  group: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  groupTitle: { fontSize: 11, fontWeight: '900', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#f0f5fa', gap: 12 },
  rowIcon: { fontSize: 18, width: 26, textAlign: 'center' },
  rowLabel: { flex: 1, fontSize: 15, color: '#6b8da8', fontWeight: '600' },
  rowValue: { fontSize: 15, fontWeight: '800', color: TEXT },

  editBtn: { backgroundColor: BLUE, paddingVertical: 17, borderRadius: 16, alignItems: 'center', shadowColor: BLUE, shadowOpacity: 0.38, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
  editBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
