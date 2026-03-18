// App.js
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AppProvider, useApp } from './src/context/AppContext';
import InitialSettingScreen from './src/screens/InitialSettingScreen';
import MainTabNavigator from './src/navigation/TabNavigator';

const Stack = createStackNavigator();

function RootNavigator() {
  const { isSetupDone } = useApp();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {!isSetupDone ? (
        <Stack.Screen name="Initial" component={InitialSettingScreen} />
      ) : (
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <RootNavigator />
      </NavigationContainer>
    </AppProvider>
  );
}
