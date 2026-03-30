import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

// 定義主題色
const COLORS = {
  primaryBlue: '#00C0E8',
  textDark: '#333333',
  textGrey: '#888888',
  borderGrey: '#CCCCCC',
};

const CustomInput = ({ iconName, iconType = 'FontAwesome', placeholder, secureTextEntry, value, onChangeText, keyboardType = 'default' }) => {
  
  // 根據 iconType 選擇圖示庫
  const IconComponent = iconType === 'MaterialCommunityIcons' ? MaterialCommunityIcons : FontAwesome;

  return (
    <View style={styles.inputContainer}>
      <IconComponent name={iconName} size={20} color={COLORS.textGrey} style={styles.icon} />
      <TextInput
        style={styles.textInput}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textGrey}
        secureTextEntry={secureTextEntry}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGrey,
    marginBottom: 25,
    paddingBottom: 5,
    width: '100%',
  },
  icon: {
    marginRight: 10,
    width: 25, // 固定寬度讓輸入框對齊
    textAlign: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textDark,
    paddingVertical: 5,
  },
});

export { CustomInput, COLORS };