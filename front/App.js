import React, { useEffect } from 'react';
import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// 引入 API 服務 (請確保路徑正確)
import apiService from './src/services/api';
import InitialSettingScreen from './src/screens/InitialSettingScreen';
import MainTabNavigator from './src/navigation/TabNavigator';

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
    <NavigationContainer>
      <StatusBar style="auto" />
      
      <Stack.Navigator 
        initialRouteName="Initial" // 設定啟動時的第一個頁面
        screenOptions={{ headerShown: false }}
      >
        {/* 初始設定頁面 */}
        <Stack.Screen name="Initial" component={InitialSettingScreen} />
        
        {/* 主要的分頁導覽 (包含主頁、報告、個人) */}
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
