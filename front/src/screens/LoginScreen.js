import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { CustomInput, COLORS } from '../components/CustomInput';
import apiService from '../services/api'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('提示', '請輸入帳號與密碼');
      return;
    }

    // 呼叫 API 串接
    const result = await apiService.login(username, password);
    
    if (result.success) {
      // 1. 儲存 Token
      await AsyncStorage.setItem('userToken', result.data.access_token);
      await AsyncStorage.setItem('userId', result.data.user_id.toString());
      
      Alert.alert('成功', '登入成功！');
      // 2. 導向初始設定頁面頁面 (InitialSettingScreen)
      navigation.replace('Initial'); 
    } else {
      Alert.alert('登入失敗', result.error);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        {/* 上方插圖區域
        <View style={styles.imageContainer}>
          {/* 請替換成你實際的圖片路徑 */}
          {/* <Image 
            source={require('../../assets/login_illustration.png')} 
            style={styles.image}
            resizeMode="contain"
          />
        </View> */}

        {/* 標題區域 */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>歡迎來到DayDay補給站</Text>
          <Text style={styles.subtitle}>飲水大小事，DayDay補給站與你作伴。</Text>
        </View>

        {/* 輸入區域 */}
        <View style={styles.formContainer}>
          <CustomInput 
            iconName="user" 
            placeholder="輸入使用者名稱" 
            value={username}
            onChangeText={setUsername}
          />
          <CustomInput 
            iconName="lock" 
            placeholder="輸入密碼" 
            secureTextEntry={true}
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/* 按鈕區域 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.signUpButton} 
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.signUpText}>註冊</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginText}>登入</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF8ED', // 設計圖的背景色
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    height: 150,
    justifyContent: 'center',
    marginBottom: 20,
  },
  image: {
    height: 120,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primaryBlue,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.primaryBlue,
  },
  formContainer: {
    width: '100%',
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  signUpButton: {
    justifyContent: 'center',
    paddingVertical: 12,
  },
  signUpText: {
    fontSize: 16,
    color: COLORS.primaryBlue,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: COLORS.primaryBlue,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25, // 圓角按鈕
    elevation: 3, // Android 陰影
    shadowColor: '#000', // iOS 陰影
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  loginText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default LoginScreen;