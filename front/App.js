import React, { useEffect } from 'react';
import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import apiService from './src/services/api';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AppProvider, useApp } from './src/context/AppContext';

import InitialSettingScreen from './src/screens/InitialSettingScreen';
import MainTabNavigator from './src/navigation/TabNavigator';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

const Stack = createStackNavigator();

function AppNavigator() {
  const { token, isAuthLoading } = useApp();

  if (isAuthLoading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Initial" component={InitialSettingScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

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
        <AppNavigator />
      </NavigationContainer>
    </AppProvider>
  );
}
