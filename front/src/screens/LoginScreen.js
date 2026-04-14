import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Animated, Image, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomInput, COLORS } from '../components/CustomInput';
import apiService from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '../context/AppContext';

function RippleRing({ delay }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 2600, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const scale   = anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] });
  const opacity = anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.5, 0] });
  return <Animated.View style={[s.rippleRing, { transform: [{ scale }], opacity }]} />;
}

const LoginScreen = ({ navigation }) => {
  const { setToken } = useApp();
  const { height: winH } = useWindowDimensions();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const bobAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, { toValue: -10, duration: 1400, useNativeDriver: true }),
        Animated.timing(bobAnim, { toValue: 0,   duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleLogin = async () => {
    setLoginError('');
    if (!username || !password) {
      setLoginError('請輸入帳號與密碼');
      return;
    }

    const result = await apiService.login(username, password);

    if (result.success) {
      await AsyncStorage.setItem('userToken', result.data.access_token);
      await AsyncStorage.setItem('userId', result.data.user_id.toString());
      setToken(result.data.access_token);
    } else {
      setLoginError('帳號或密碼錯誤，請再試一次');
    }
  };

  return (
    <SafeAreaView style={s.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[s.container, { minHeight: winH }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 上方 1/3：logo + 水杯 */}
          <View style={s.topSection}>
            <Text style={s.logoTxt}>Day Day補給站</Text>
            <View style={s.rippleWrap}>
              <RippleRing delay={0} />
              <RippleRing delay={800} />
              <RippleRing delay={1600} />
              <Animated.Image
                source={require('../assets/cup_main.png')}
                style={[s.cupImg, { transform: [{ translateY: bobAnim }] }]}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* 下方 2/3：標題 + 輸入 + 按鈕 */}
          <View style={s.bottomSection}>
            <Text style={s.headline}>歡迎來到DayDay補給站</Text>
            <Text style={s.subTxt}>飲水大小事，DayDay補給站與你作伴。</Text>

            <View style={s.formWrap}>
              <CustomInput
                iconName="user"
                placeholder="輸入使用者名稱"
                value={username}
                onChangeText={v => { setUsername(v); setLoginError(''); }}
              />
              <CustomInput
                iconName="lock"
                placeholder="輸入密碼"
                secureTextEntry={true}
                value={password}
                onChangeText={v => { setPassword(v); setLoginError(''); }}
              />
              <Text style={s.errorTxt}>{loginError}</Text>
            </View>

            <TouchableOpacity style={s.btn} onPress={handleLogin} activeOpacity={0.85}>
              <Text style={s.btnTxt}>登入</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.75}>
              <Text style={s.registerLink}>還沒有帳號？<Text style={s.registerLinkBold}>註冊</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#e8f5fe',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#e8f5fe',
    paddingHorizontal: 32,
    paddingTop: 50,
    paddingBottom: 20,
  },
  topSection: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomSection: {
    flex: 2,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  logoTxt: {
    fontSize: 20,
    fontWeight: '900',
    color: '#3a90d4',
    alignSelf: 'flex-start',
    marginBottom: 0,
  },
  rippleWrap: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rippleRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: '#5ab4f5',
  },
  cupImg: {
    width: 90,
    height: 90,
  },
  headline: {
    fontSize: 26,
    fontWeight: '900',
    color: '#5ab4f5',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 6,
  },
  subTxt: {
    fontSize: 13,
    color: '#6b8da8',
    textAlign: 'center',
    marginBottom: 24,
  },
  formWrap: {
    width: '100%',
    marginBottom: 6,
  },
  errorTxt: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'right',
    minHeight: 18,
  },
  btn: {
    backgroundColor: '#5ab4f5',
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    shadowColor: '#3a90d4',
    shadowOpacity: 0.38,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  btnTxt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  registerLink: {
    fontSize: 14,
    color: '#6b8da8',
  },
  registerLinkBold: {
    color: '#3a90d4',
    fontWeight: '900',
  },
});

export default LoginScreen;
