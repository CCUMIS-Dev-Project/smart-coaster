import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { CustomInput, COLORS } from '../components/CustomInput';
import apiService from '../services/api';
import { FontAwesome } from '@expo/vector-icons';

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
//   const [verificationCode, setVerificationCode] = useState('');
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);

  const handleRegister = async () => {
    // 1. 基礎驗證
    if (!username || !password || !confirmPassword) {
      Alert.alert('提示', '請填寫所有欄位');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('提示', '兩次輸入的密碼不一致');
      return;
    }

    if (!isTermsAccepted) {
      Alert.alert('提示', '請閱讀並同意服務條款');
      return;
    }

    // 2. 準備註冊資料
    const userData = {
      username: username,
      password: password,
    };

    // 3. 呼叫 API
    const result = await apiService.register(userData);

    if (result.success) {
      Alert.alert('註冊成功', '接下來請完成初始設定', [
        { 
          text: '開始設定', 
          onPress: () => navigation.replace('Login') // 註冊成功後導向設定頁面
        }
      ]);
    } else {
      Alert.alert('註冊失敗', result.error);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* 上方插圖
        <View style={styles.imageContainer}>
          <Image 
            source={require('../../assets/login_illustration.png')} 
            style={styles.image}
            resizeMode="contain"
          />
        </View> */}

        {/* 標題 */}
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
          <CustomInput 
            iconName="check-circle" 
            placeholder="確認密碼" 
            secureTextEntry={true}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          {/* <CustomInput 
            iconName="envelope" 
            placeholder="Verification Code" 
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="numeric"
          /> */}

          {/* 服務條款勾選 */}
          <TouchableOpacity 
            style={styles.termsContainer} 
            onPress={() => setIsTermsAccepted(!isTermsAccepted)}
          >
            <View style={[styles.checkbox, isTermsAccepted && styles.checkboxActive]}>
              {isTermsAccepted && <FontAwesome name="check" size={12} color="#FFF" />}
            </View>
            <Text style={styles.termsText}>我已閱讀並同意服務條款</Text>
          </TouchableOpacity>
        </View>

        {/* 按鈕區域 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.signInButton} 
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.signInText}>登入</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerText}>註冊</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF8ED',
  },
  scrollContainer: {
    paddingHorizontal: 30,
    paddingVertical: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    height: 100,
    justifyContent: 'center',
    marginBottom: 15,
  },
  image: {
    height: 80,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primaryBlue, // 使用專案主題藍
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.primaryBlue,
  },
  formContainer: {
    width: '100%',
    marginBottom: 20,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: COLORS.primaryBlue,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: COLORS.primaryBlue,
  },
  termsText: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  signInButton: {
    justifyContent: 'center',
    paddingVertical: 12,
  },
  signInText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: COLORS.primaryBlue,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  registerText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default RegisterScreen;