import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('female'); // 'male' or 'female'
    const [weight, setWeight] = useState('');
    const [activityLevel, setActivityLevel] = useState('sedentary');
    const [targetAmount, setTargetAmount] = useState(2000);

    // 活動量選項
    const activityMap = {
        sedentary: { label: '久坐', multiplier: 1.0 },
        light: { label: '輕度', multiplier: 1.1 },
        moderate: { label: '中度', multiplier: 1.2 },
        high: { label: '高強度', multiplier: 1.3 },
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const savedAge = await AsyncStorage.getItem('user_age');
            const savedGender = await AsyncStorage.getItem('user_gender');
            const savedWeight = await AsyncStorage.getItem('user_weight');
            const savedActivity = await AsyncStorage.getItem('user_activity');
            const savedTarget = await AsyncStorage.getItem('user_target');

            if (savedAge) setAge(savedAge);
            if (savedGender) setGender(savedGender);
            if (savedWeight) setWeight(savedWeight);
            if (savedActivity) setActivityLevel(savedActivity);
            if (savedTarget) setTargetAmount(parseInt(savedTarget, 10));
        } catch (e) {
            console.error('Failed to load settings', e);
        }
    };

    const calculateTarget = () => {
        const w = parseFloat(weight);
        const a = parseInt(age, 10);

        if (isNaN(w) || w <= 0) {
            Alert.alert('提示', '請輸入有效的體重');
            return;
        }

        // 基本公式
        // 年齡 > 65，乘數可能較低 (例如 30ml)，年輕人約 35ml
        let baseMultiplier = 35;
        if (!isNaN(a) && a > 65) {
            baseMultiplier = 30;
        } else if (gender === 'male') {
            baseMultiplier = 35;
        } else {
            baseMultiplier = 33; // 女性稍作微調
        }

        let calculatedTarget = w * baseMultiplier;

        // 根據活動量加成
        calculatedTarget *= activityMap[activityLevel].multiplier;

        const finalTarget = Math.round(calculatedTarget / 50) * 50; // 取 50 的倍數
        setTargetAmount(finalTarget);
        saveSettings(finalTarget);

        Alert.alert('儲存成功', `您的建議每日飲水量為：${finalTarget} ml`);
    };

    const saveSettings = async (calculatedTarget) => {
        try {
            await AsyncStorage.setItem('user_age', age);
            await AsyncStorage.setItem('user_gender', gender);
            await AsyncStorage.setItem('user_weight', weight);
            await AsyncStorage.setItem('user_activity', activityLevel);
            await AsyncStorage.setItem('user_target', calculatedTarget.toString());
        } catch (e) {
            console.error('Failed to save settings', e);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.headerTitle}>個人設定</Text>
                    <Text style={styles.headerSubtitle}>這些資料將幫助我們為您精算飲水建議</Text>

                    <View style={styles.card}>
                        {/* 年齡 */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>年齡</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={age}
                                onChangeText={setAge}
                                placeholder="例如：25"
                                placeholderTextColor="#666"
                            />
                        </View>

                        {/* 體重 */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>體重 (kg)</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={weight}
                                onChangeText={setWeight}
                                placeholder="例如：60"
                                placeholderTextColor="#666"
                            />
                        </View>

                        {/* 性別選擇器 (簡易版) */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>性別</Text>
                            <View style={styles.row}>
                                <TouchableOpacity
                                    style={[styles.selectorBtn, gender === 'female' && styles.selectorActive]}
                                    onPress={() => setGender('female')}
                                >
                                    <Text style={[styles.selectorText, gender === 'female' && styles.selectorTextActive]}>女性</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.selectorBtn, gender === 'male' && styles.selectorActive]}
                                    onPress={() => setGender('male')}
                                >
                                    <Text style={[styles.selectorText, gender === 'male' && styles.selectorTextActive]}>男性</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* 活動量選擇器 */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>活動量</Text>
                            <View style={styles.rowWrap}>
                                {Object.keys(activityMap).map(key => (
                                    <TouchableOpacity
                                        key={key}
                                        style={[styles.selectorBtn, styles.activityBtn, activityLevel === key && styles.selectorActive]}
                                        onPress={() => setActivityLevel(key)}
                                    >
                                        <Text style={[styles.selectorText, activityLevel === key && styles.selectorTextActive]}>
                                            {activityMap[key].label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>

                    <View style={styles.targetCard}>
                        <Text style={styles.targetLabel}>建議目標飲水量</Text>
                        <Text style={styles.targetValue}>{targetAmount} <Text style={styles.targetUnit}>ml</Text></Text>
                    </View>

                    <TouchableOpacity style={styles.saveButton} onPress={calculateTarget}>
                        <Text style={styles.saveButtonText}>計算並儲存</Text>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    scrollContent: {
        padding: 20,
        paddingTop: 40,
        paddingBottom: 60,
    },
    headerTitle: {
        color: '#333333',
        fontSize: 32,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: '#FF9800',
        fontSize: 14,
        marginTop: 5,
        marginBottom: 30,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 2,
    },
    targetCard: {
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        borderColor: '#FF9800',
        borderWidth: 1,
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        marginBottom: 30,
    },
    targetLabel: {
        color: '#FF9800',
        fontSize: 16,
        marginBottom: 8,
    },
    targetValue: {
        color: '#333333',
        fontSize: 36,
        fontWeight: 'bold',
    },
    targetUnit: {
        fontSize: 18,
        color: '#333333',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        color: '#333333',
        fontSize: 16,
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#F0F0F0',
        color: '#333333',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    rowWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    selectorBtn: {
        backgroundColor: '#F0F0F0',
        paddingVertical: 12,
        borderRadius: 12,
        flex: 1,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    activityBtn: {
        flex: 0,
        minWidth: '45%',
        marginHorizontal: 0,
        marginVertical: 4,
    },
    selectorActive: {
        backgroundColor: '#FF9800',
    },
    selectorText: {
        color: '#666666',
        fontSize: 16,
        fontWeight: 'bold',
    },
    selectorTextActive: {
        color: '#FFFFFF',
    },
    saveButton: {
        backgroundColor: '#FF9800',
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: '#FF9800',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
