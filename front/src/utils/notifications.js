import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'water-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: '飲水提醒',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4AABDD',
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// 取消舊排程 → 建新排程 → 回傳下次觸發的 timestamp (ms)
// 即使通知排程失敗（例如未授權），仍回傳 timestamp 以維持倒數顯示
export async function scheduleWaterReminder(intervalMinutes) {
  const ts = Date.now() + intervalMinutes * 60 * 1000;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💧 該喝水了！',
        body: '已經好一陣子沒喝水了，趕快補充水分吧！',
      },
      trigger: Platform.OS === 'android'
        ? { seconds: intervalMinutes * 60, channelId: CHANNEL_ID }
        : { seconds: intervalMinutes * 60 },
    });
  } catch (e) {
    console.warn('[Notifications] 排程失敗（可能未授權）:', e);
  }
  return ts;
}

export async function cancelWaterReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}