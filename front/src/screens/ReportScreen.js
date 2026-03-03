import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function ReportScreen() {
    // 假資料：每日飲水量 (ml) - 折線圖
    const lineChartData = {
        labels: ['一', '二', '三', '四', '五', '六', '日'],
        datasets: [
            {
                data: [1200, 1800, 1500, 2200, 1900, 2400, 2100],
                color: (opacity = 1) => `rgba(41, 182, 246, ${opacity})`, // 水藍色線條
                strokeWidth: 3,
            },
        ],
    };

    // 假資料：每日喝水頻率 (次數) - 長條圖
    const barChartData = {
        labels: ['一', '二', '三', '四', '五', '六', '日'],
        datasets: [
            {
                data: [4, 6, 5, 8, 7, 10, 8],
            },
        ],
    };

    const chartConfig = {
        backgroundColor: '#FFFFFF',
        backgroundGradientFrom: '#FFFFFF',
        backgroundGradientTo: '#FFFFFF',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`, // 橘色網格與文字
        labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`, // 深色標籤
        style: {
            borderRadius: 16,
        },
        propsForDots: {
            r: '5',
            strokeWidth: '2',
            stroke: '#FF9800',
        },
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.header}>
                    <Text style={styles.headerTitle}>數據報表</Text>
                    <Text style={styles.headerSubtitle}>每週飲水趨勢分析</Text>
                </View>

                {/* AI 洞察分析卡片 */}
                <View style={[styles.card, styles.insightCard]}>
                    <View style={styles.insightHeader}>
                        <Ionicons name="bulb" size={24} color="#FF9800" />
                        <Text style={styles.insightTitle}>本週分析洞察</Text>
                    </View>
                    <Text style={styles.insightText}>
                        您屬於「<Text style={styles.highlightText}>下午盲區型</Text>」飲水者。數據顯示您在下午 2 點到 5 點間幾乎沒有喝水紀錄，建議在這個時段將杯墊的提醒頻率調高，以保持最佳水分狀態喔！
                    </Text>
                </View>

                {/* 達標概況卡片 */}
                <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>本週達標率</Text>
                        <Text style={styles.statValue}>71<Text style={styles.statUnit}>%</Text></Text>
                        <Text style={styles.statCompare}>↑ 12% (較上週)</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>提醒成功率</Text>
                        <Text style={styles.statValue}>85<Text style={styles.statUnit}>%</Text></Text>
                        <Text style={styles.statCompare}>杯墊提醒後飲水</Text>
                    </View>
                </View>

                {/* 折線圖：每日飲水量 */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>每日飲水量 (ml)</Text>
                    <LineChart
                        data={lineChartData}
                        width={width - 40} // 減去 padding
                        height={220}
                        yAxisSuffix=""
                        chartConfig={chartConfig}
                        bezier
                        style={styles.chartStyle}
                    />
                </View>

                {/* 長條圖：喝水次數 */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>每日補水頻率 (次數)</Text>
                    <BarChart
                        data={barChartData}
                        width={width - 40}
                        height={220}
                        yAxisSuffix=""
                        chartConfig={{
                            ...chartConfig,
                            color: (opacity = 1) => `rgba(41, 182, 246, ${opacity})`, // 水藍色長條
                        }}
                        style={styles.chartStyle}
                        withInnerLines={false}
                        showBarTops={false}
                    />
                </View>

            </ScrollView>
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
        paddingBottom: 40,
    },
    header: {
        marginBottom: 20,
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
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 15,
        marginBottom: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 2,
    },
    insightCard: {
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        borderColor: '#FF9800',
        borderWidth: 1,
        alignItems: 'flex-start',
        padding: 20,
    },
    insightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    insightTitle: {
        color: '#FF9800',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    insightText: {
        color: '#333333',
        fontSize: 15,
        lineHeight: 24,
    },
    highlightText: {
        color: '#29b6f6',
        fontWeight: 'bold',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statBox: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 15,
        width: '48%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 2,
    },
    statLabel: {
        color: '#666666',
        fontSize: 14,
        marginBottom: 5,
    },
    statValue: {
        color: '#333333',
        fontSize: 28,
        fontWeight: 'bold',
    },
    statUnit: {
        fontSize: 14,
        color: '#666666',
    },
    statCompare: {
        color: '#29b6f6',
        fontSize: 12,
        marginTop: 5,
    },
    cardTitle: {
        color: '#333333',
        fontSize: 16,
        fontWeight: 'bold',
        alignSelf: 'flex-start',
        marginBottom: 15,
    },
    chartStyle: {
        marginVertical: 8,
        borderRadius: 16,
    },
});
