// src/navigation/TabNavigator.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import GardenScreen  from '../screens/GardenScreen';
import MainScreen    from '../screens/MainScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../constants/theme';

const Tab = createBottomTabNavigator();
const BLUE = colors.blue, MUTED = colors.muted, BORDER = colors.border;

function TabBar({ state, descriptors, navigation }) {
  const tabs = [
    { name: '花園', icon: '🌸' },
    { name: '主頁', icon: '🏠' },
    { name: '個人', icon: '👤' },
  ];

  return (
    <View style={s.tabBar}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const tab = tabs[index];
        return (
          <TouchableOpacity
            key={route.key}
            style={s.tabItem}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.75}
          >
            <Text style={[s.tabIcon, focused && s.tabIconActive]}>{tab.icon}</Text>
            <Text style={[s.tabLabel, focused && s.tabLabelActive]}>{tab.name}</Text>
            {focused && <View style={s.tabDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="主頁"
      tabBar={props => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="花園" component={GardenScreen} />
      <Tab.Screen name="主頁" component={MainScreen} />
      <Tab.Screen name="個人" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const s = StyleSheet.create({
  tabBar:   { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: BORDER, paddingBottom: 24, paddingTop: 10 },
  tabItem:  { flex: 1, alignItems: 'center', gap: 3, position: 'relative' },
  tabIcon:  { fontSize: 22, opacity: 0.4 },
  tabIconActive: { opacity: 1 },
  tabLabel: { fontSize: 11, fontWeight: '800', color: MUTED },
  tabLabelActive: { color: BLUE },
  tabDot:   { width: 5, height: 5, borderRadius: 3, backgroundColor: BLUE, position: 'absolute', bottom: -6 },
});
