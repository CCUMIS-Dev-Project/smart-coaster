import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen = () => {
  // 模擬使用者資料，未來可從 API 或 AsyncStorage 讀取
  const userData = {
    name: "小寶杯",
    gender: "不願透漏",
    birthday: "2026 / 03 / 10",
    height: "170 cm",
    weight: "65 kg"
  };

  const InfoRow = ({ label, value, icon }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon} size={20} color="#3498db" style={styles.rowIcon} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. 頭像區域 */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image 
              source={require('../assets/main_cup.png')} // 使用你的杯子圖片作為頭像
              style={styles.avatar}
              resizeMode="cover"
            />
            <TouchableOpacity style={styles.editAvatarBadge}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{userData.name}</Text>
          <Text style={styles.userTag}>健康飲水者</Text>
        </View>

        {/* 2. 基本資料列表 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本資料</Text>
          <View style={styles.card}>
            <InfoRow label="姓名" value={userData.name} icon="person-outline" />
            <InfoRow label="性別" value={userData.gender} icon="transgender-outline" />
            <InfoRow label="出生年月日" value={userData.birthday} icon="calendar-outline" />
            <InfoRow label="身高" value={userData.height} icon="resize-outline" />
            <InfoRow label="體重" value={userData.weight} icon="speedometer-outline" />
          </View>
        </View>

        {/* 3. 編輯按鈕 */}
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>編輯個人資料</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#E1F5FE',
  },
  editAvatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 5,
    backgroundColor: '#3498db',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  userTag: {
    fontSize: 14,
    color: '#3498db',
    marginTop: 5,
    fontWeight: '600',
  },
  section: {
    padding: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#444',
    paddingLeft: 5,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: {
    width: 30,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  editButton: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#3498db',
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
  },
  editButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;