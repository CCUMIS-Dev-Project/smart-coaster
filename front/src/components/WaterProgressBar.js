import React, { useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import Svg, { Circle, Defs, ClipPath, Rect, Path, G } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedProps,
    withRepeat,
    withTiming,
    Easing,
    interpolate,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const SIZE = width * 0.7; // 螢幕寬度的 70%
const STROKE_WIDTH = 10;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CENTER = SIZE / 2;

const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function WaterProgressBar({ currentAmount, targetAmount }) {
    const progress = Math.min(Math.max(currentAmount / targetAmount, 0), 1); // 0 to 1

    // 水波紋動畫值 (0 到 1 循環)，用來推動 path 的 x 軸
    const waveAnim = useSharedValue(0);

    useEffect(() => {
        waveAnim.value = withRepeat(
            withTiming(1, { duration: 2000, easing: Easing.linear }),
            -1, // 無限循環
            false
        );
    }, []);

    const animatedProps = useAnimatedProps(() => {
        // 根據進度計算水位高度 (Y 軸)，progress 0 對應底部 (SIZE)，1 對應頂部 (0)
        const waterLevelY = interpolate(progress, [0, 1], [SIZE, 0]);

        // 產生一個會移動的波浪 Path 
        // 波長設為 SIZE，振幅設為 10
        const A = 12; // 振幅
        const W = SIZE; // 波長

        // x 軸平移量
        const shift = interpolate(waveAnim.value, [0, 1], [0, W]);

        const path = `
      M 0 ${waterLevelY}
      Q ${W / 4 - shift} ${waterLevelY - A}, ${W / 2 - shift} ${waterLevelY}
      T ${W - shift} ${waterLevelY}
      T ${W * 1.5 - shift} ${waterLevelY}
      T ${W * 2 - shift} ${waterLevelY}
      L ${SIZE} ${SIZE}
      L 0 ${SIZE}
      Z
    `;
        return { d: path };
    });

    return (
        <View style={styles.container}>
            <Svg width={SIZE} height={SIZE}>
                <Defs>
                    {/* 剪除區塊，讓水只在圓形內 */}
                    <ClipPath id="circleClip">
                        <Circle cx={CENTER} cy={CENTER} r={RADIUS} />
                    </ClipPath>
                </Defs>

                {/* 外圓框 */}
                <Circle
                    cx={CENTER}
                    cy={CENTER}
                    r={RADIUS}
                    stroke="#333333"
                    strokeWidth={STROKE_WIDTH}
                    fill="none"
                />

                {/* 裡面的水波紋 */}
                <G clipPath="url(#circleClip)">
                    {/* 背景填充一個深一點的水色 */}
                    <Rect x="0" y={SIZE - (SIZE * progress)} width={SIZE} height={SIZE} fill="#006699" opacity={0.3} />

                    <AnimatedPath
                        animatedProps={animatedProps}
                        fill="#00FA9A"
                        opacity={0.8}
                    />
                </G>
            </Svg>

            {/* 中心的文字覆蓋 */}
            <View style={styles.textContainer}>
                <Text style={styles.percentageText}>{Math.round(progress * 100)}%</Text>
                <Text style={styles.amountText}>{currentAmount} / {targetAmount} ml</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        width: SIZE,
        height: SIZE,
    },
    textContainer: {
        position: 'absolute',
        alignItems: 'center',
    },
    percentageText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    amountText: {
        fontSize: 16,
        color: '#DDDDDD',
        marginTop: 5,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
});
