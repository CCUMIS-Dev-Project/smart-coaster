import React, { useEffect } from 'react';
import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AppProvider, useApp } from './src/context/AppContext';

// 引入 API 服務 (請確保路徑正確)
import apiService from './src/services/api';

// 引入頁面元件
import InitialSettingScreen from './src/screens/InitialSettingScreen';
import MainTabNavigator from './src/navigation/TabNavigator';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

const Stack = createStackNavigator();

export default function App() {

  useEffect(() => {
    const testConnection = async () => {
      const result = await apiService.checkHealth();
      if (result.success) {
        console.log("✅ 成功連線到後端！回傳資料：", result.data);
      } else {
        console.error("❌ 連線失敗，請檢查 IP 或 Port：", result.error);
      }
    };
    testConnection();
  }, []);

  return (
    <AppProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        
        <Stack.Navigator 
          initialRouteName="MainTabs"  //* DEV: 開發時直接跳主頁，正式上線前改回 Login */
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />

          {/* 初始設定頁面 */}
          <Stack.Screen name="Initial" component={InitialSettingScreen} />
          
          {/* 主要的分頁導覽 (包含主頁、報告、個人) */}
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />

        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
    
  );
}
