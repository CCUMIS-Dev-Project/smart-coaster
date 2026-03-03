import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/DashboardScreen'; // 暫時延用 DashboardScreen 作為主畫面
import ReportScreen from '../screens/ReportScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
    return (
        <Tab.Navigator
            initialRouteName="Home"
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#FFFFFF', // 淺色背景
                    borderTopWidth: 0,
                    elevation: 10,
                    shadowOpacity: 0.3,
                    height: 60,
                    paddingBottom: 10,
                },
                tabBarActiveTintColor: '#FF9800', // 活躍時為橘色
                tabBarInactiveTintColor: '#888888',
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Report') {
                        iconName = focused ? 'bar-chart' : 'bar-chart-outline';
                    } else if (route.name === 'Home') {
                        iconName = focused ? 'water' : 'water-outline';
                    } else if (route.name === 'Settings') {
                        iconName = focused ? 'settings' : 'settings-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen
                name="Report"
                component={ReportScreen}
                options={{ title: '報表' }}
            />
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{ title: '喝水' }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ title: '設定' }}
            />
        </Tab.Navigator>
    );
}
