import React from 'react';
import { StatusBar } from 'expo-status-bar';
import DashboardScreen from './src/screens/DashboardScreen';
import { NavigationContainer } from '@react-navigation/native';
import MainTabNavigator from './src/navigation/TabNavigator';

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <MainTabNavigator />
    </NavigationContainer>
  );
}
