import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import MainTabNavigator from './src/navigation/MainTabNavigator';

export default function App() {
  return (
    <NavigationContainer theme={DefaultTheme}>
      <StatusBar style="dark" />
      <MainTabNavigator />
    </NavigationContainer>
  );
}
