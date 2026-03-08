import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; // Expo 內建的圖示庫


import DashboardScreen from '../screens/DashboardScreen';
import ReportScreen from '../screens/ReportScreen'; 
import ProfileScreen from '../screens/ProfileScreen';
import MainScreen from '../screens/MainScreen.js';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
    return(
        <Tab.Navigator
            screenOptions={({route}) => ({
                // 根據頁面名稱自動切換圖示
                tabBarIcon: ({ focused, color, size }) => {
                let iconName;
                if (route.name === '主頁') {
                    iconName = focused ? 'water' : 'water-outline';
                } else if (route.name === '報告') {
                    iconName = focused ? 'bar-chart' : 'bar-chart-outline';
                } else if (route.name === '個人') {
                    iconName = focused ? 'person' : 'person-outline';
                }
                return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#3498db', // 設計圖中的主色調
                tabBarInactiveTintColor: 'gray',
                headerShown: false, // 隱藏頂部標題列，如果你想用自己設計的 Header
            })}
        >
            <Tab.Screen name="主頁" component={MainScreen}/> 
            <Tab.Screen name="報告" component={ReportScreen} />
            <Tab.Screen name="個人" component={ProfileScreen} /> 
        </Tab.Navigator>
    );
};

export default MainTabNavigator;