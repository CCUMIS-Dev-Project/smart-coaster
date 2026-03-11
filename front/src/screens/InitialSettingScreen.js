import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const InitialSettingScreen = () => {
  const navigation = useNavigation();
  
  // 狀態管理
  const [name, setName] = useState('');
  const [gender, setGender] = useState('男'); // 預設值
  const [birthday, setBirthday] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  const handleStart = () => {
    // 簡單驗證
    if (!name || !height || !weight) {
      alert("請填寫完整的資料以利計算飲水目標！");
      return;
    }

    // TODO: 這裡可以實作計算飲水目標逻辑 (例如：體重 x 30ml)
    // TODO: 儲存資料到 AsyncStorage 或後端 API
    
    console.log("初始設定完成：", { name, gender, birthday, height, weight });
    
    // 跳轉至主頁面 (導覽器名稱需與 App.js 一致)
    navigation.replace('MainTabs'); 
  };

  const InputField = ({ label, value, onChangeText, placeholder, keyboardType = 'default', icon }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <Ionicons name={icon} size={20} color="#3498db" style={styles.icon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
          placeholderTextColor="#CCC"
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 標題與歡迎語 */}
          <View style={styles.header}>
            <Text style={styles.title}>歡迎使用智慧杯墊</Text>
            <Text style={styles.subtitle}>請填寫基本資料，讓我們為您量身打造飲水計畫</Text>
          </View>

          {/* 頭像區域 */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              <Image 
                source={require('../assets/main_cup.png')} // 使用指定的杯子圖片
                style={styles.avatar}
              />
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={16} color="#FFF" />
              </View>
            </View>
          </View>

          {/* 表單內容 */}
          <View style={styles.form}>
            <InputField 
              label="姓名" 
              value={name} 
              onChangeText={setName} 
              placeholder="請輸入您的姓名" 
              icon="person-outline" 
            />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>性別</Text>
              <View style={styles.genderRow}>
                {['男', '女', '其他'].map((item) => (
                  <TouchableOpacity 
                    key={item}
                    style={[styles.genderOption, gender === item && styles.genderActive]}
                    onPress={() => setGender(item)}
                  >
                    <Text style={[styles.genderText, gender === item && styles.genderTextActive]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <InputField 
              label="出生年月日" 
              value={birthday} 
              onChangeText={setBirthday} 
              placeholder="YYYY / MM / DD" 
              icon="calendar-outline" 
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <InputField 
                  label="身高 (cm)" 
                  value={height} 
                  onChangeText={setHeight} 
                  placeholder="170" 
                  keyboardType="numeric" 
                  icon="resize-outline"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <InputField 
                  label="體重 (kg)" 
                  value={weight} 
                  onChangeText={setWeight} 
                  placeholder="60" 
                  keyboardType="numeric" 
                  icon="speedometer-outline"
                />
              </View>
            </View>
          </View>

          {/* 開始按鈕 */}
          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>開始健康飲水生活</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 10 }} />
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollContent: {
    padding: 30,
    paddingBottom: 50,
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F8FF',
    borderWidth: 3,
    borderColor: '#3498db',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3498db',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  form: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 55,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderOption: {
    flex: 1,
    height: 50,
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  genderActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  genderText: {
    fontSize: 15,
    color: '#666',
  },
  genderTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
  },
  startButton: {
    backgroundColor: '#3498db',
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default InitialSettingScreen;