import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { CustomInput, COLORS } from '../components/CustomInput';
import { FontAwesome } from '@expo/vector-icons';

const showAlert = (title, message) => {
  if (typeof window !== 'undefined') {
    window.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = () => {
    if (!username || !password || !confirmPassword) {
      setErrorMsg('請填寫所有欄位');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('兩次輸入的密碼不一致');
      return;
    }
    if (!isTermsAccepted) {
      setErrorMsg('請閱讀並同意服務條款');
      return;
    }
    setErrorMsg('');
    // 不在此呼叫 API，帶著帳密進入初始設定，最後統一送出
    navigation.replace('Initial', { username, password });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
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

          {/* 服務條款勾選 + 錯誤訊息同行 */}
          <View style={styles.termsRow}>
            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setIsTermsAccepted(!isTermsAccepted)}
            >
              <View style={[styles.checkbox, isTermsAccepted && styles.checkboxActive]}>
                {isTermsAccepted && <FontAwesome name="check" size={12} color="#FFF" />}
              </View>
              <Text style={styles.termsText}>我已閱讀並同意服務條款</Text>
            </TouchableOpacity>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
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
    backgroundColor: 'white',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 30,
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
    color: '#5ab4f5', 
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 13,
    color: '#6b8da8',
    textAlign: 'center',
    marginBottom: 24,
  },
  formContainer: {
    width: '100%',
    marginBottom: 20,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 20,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  errorText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 8,
    minHeight: 18,
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
    backgroundColor: '#5ab4f5', 
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