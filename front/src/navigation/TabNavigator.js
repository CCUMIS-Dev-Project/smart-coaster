import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; // Expo 內建的圖示庫
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';


import ReportScreen from '../screens/ReportScreen'; 
import ProfileScreen from '../screens/ProfileScreen';
import MainScreen from '../screens/MainScreen.js';
import SettingScreen from '../screens/SettingScreen.js';
import ReminderSettingScreen from '../screens/ReminderSettingScreen.js';
import { colors } from '../constants/theme';
import { useApp } from '../context/AppContext';
import GardenScreen  from '../screens/GardenScreen';

const Tab = createBottomTabNavigator();
const BLUE = colors.blue;
const MUTED = colors.muted;

// 藍色房子
function HouseIcon({ color }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V10.5Z"
        fill={color}
      />
    </Svg>
  );
}

// 第五天花朵
function FlowerIcon({ color }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Ellipse cx="12" cy="6.5" rx="2.8" ry="4.5" fill={color} opacity={0.9} />
      <Ellipse cx="12" cy="6.5" rx="2.8" ry="4.5" transform="rotate(60 12 12)" fill={color} opacity={0.85} />
      <Ellipse cx="12" cy="6.5" rx="2.8" ry="4.5" transform="rotate(120 12 12)" fill={color} opacity={0.9} />
      <Ellipse cx="12" cy="6.5" rx="2.8" ry="4.5" transform="rotate(180 12 12)" fill={color} opacity={0.85} />
      <Ellipse cx="12" cy="6.5" rx="2.8" ry="4.5" transform="rotate(240 12 12)" fill={color} opacity={0.9} />
      <Ellipse cx="12" cy="6.5" rx="2.8" ry="4.5" transform="rotate(300 12 12)" fill={color} opacity={0.85} />
      <Circle cx="12" cy="12" r="3.5" fill="#ffd040" />
      <Circle cx="12" cy="12" r="2" fill="#f5b800" />
    </Svg>
  );
}

// 使用者選的杯子圖片
function CupIcon({ focused }) {
  const { profile } = useApp();
  if (profile?.selectedCup?.image) {
    return (
      <Image
        source={profile.selectedCup.image}
        style={{ width: 26, height: 26, opacity: focused ? 1 : 0.35 }}
        resizeMode="contain"
      />
    );
  }
  // fallback
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d="M6 2h12l1 6H5L6 2z" fill={focused ? BLUE : MUTED} />
      <Path d="M5 8h14v12a2 2 0 01-2 2H7a2 2 0 01-2-2V8z" fill={focused ? BLUE : MUTED} opacity={0.8} />
    </Svg>
  );
}

function TabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.tabBar, { paddingBottom: insets.bottom + 10 }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const iconColor = focused ? BLUE : MUTED;

        // 決定每個分頁要顯示什麼圖示與文字
        let IconComponent;
        let label;

        switch (route.name) {
            case '主頁':
            label = '主頁';
            IconComponent = <HouseIcon color={iconColor} />;
            break;
            // case '週報':
            // label = '週報';
            // IconComponent = <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={iconColor} />;
            // break;
            // case '提醒設定':
            // label = '提醒';
            // IconComponent = <Ionicons name={focused ? 'time' : 'time-outline'} size={24} color={iconColor} />;
            // break;
            // case '設定':
            // label = '設定';
            // IconComponent = <Ionicons name={focused ? 'settings-sharp' : 'settings-outline'} size={22} color={iconColor} />;
            // break;
            case '個人':
            label = '個人';
            IconComponent = <CupIcon focused={focused} />;
            break;
            case '花園':
            label = '花園';
            IconComponent = <FlowerIcon focused={focused} />;
            break;
            default:
            label = route.name;
            IconComponent = <Ionicons name="help-circle" size={24} color={iconColor} />;
        }

        return (
            <TouchableOpacity
            key={route.key}
            style={s.tabItem}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.7}
            >
            <View style={{ height: 26, justifyContent: 'center' }}>
                {IconComponent}
            </View>
            <Text style={[s.tabLabel, focused && s.tabLabelActive]}>
                {label}
            </Text>
            {focused && <View style={s.tabDot} />}
            </TouchableOpacity>
        );
      })}
    </View>
  );
}

const MainTabNavigator = () => {
    return(

        <Tab.Navigator
        initialRouteName="主頁"
        tabBar={props => <TabBar {...props} />}
        screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name="主頁" component={MainScreen}/> 
            {/* <Tab.Screen name="週報" component={ReportScreen} /> */}
            <Tab.Screen name="花園" component={GardenScreen} />
            {/* <Tab.Screen name="提醒設定" component={ReminderSettingScreen} /> */}
            <Tab.Screen name="個人" component={ProfileScreen} />
            {/* <Tab.Screen name="設定" component={SettingScreen} />  */}
        </Tab.Navigator>

    );
};

const s = StyleSheet.create({
  tabBar:        { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#c0cdd8', paddingTop: 10 },
  tabItem:       { flex: 1, alignItems: 'center', gap: 3, position: 'relative' },
  tabLabel:      { fontSize: 11, fontWeight: '800', color: MUTED },
  tabLabelActive:{ color: BLUE },
  tabDot:        { width: 5, height: 5, borderRadius: 3, backgroundColor: BLUE, position: 'absolute', bottom: -6 },
});

export default MainTabNavigator;