import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  TouchableWithoutFeedback 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const SettingScreen = ({ visible, onClose, onOpenReminder }) => {
  const navigation = useNavigation();

  // 處理導覽至個人資料
  const handleGoToProfile = () => {
    navigation.navigate('個人'); // 跳轉至 TabNavigator 中的個人頁面
  };

  const handleClose = () => {
    navigation.navigate('主頁'); 
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              {/* 標頭區塊 */}
              <View style={styles.header}>
                <Text style={styles.title}>設定</Text>
                <TouchableOpacity onPress={handleClose}>
                  <Ionicons name="close" size={24} color="#999" />
                </TouchableOpacity>
              </View>

              {/* 選單列表 */}
              <View style={styles.menuList}>
                {/* 提醒設定 */}
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => {
                    onClose();
                    onOpenReminder(); // 觸發父元件開啟 ReminderSettingScreen
                  }}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons name="notifications-outline" size={22} color="#3498db" />
                    <Text style={styles.menuText}>提醒設定</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#CCC" />
                </TouchableOpacity>

                {/* 個人資料 */}
                <TouchableOpacity style={styles.menuItem} onPress={handleGoToProfile}>
                  <View style={styles.menuItemLeft}>
                    <Ionicons name="person-outline" size={22} color="#3498db" />
                    <Text style={styles.menuText}>個人資料</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#CCC" />
                </TouchableOpacity>

                {/* 關於我們 */}
                <TouchableOpacity style={styles.menuItem}>
                  <View style={styles.menuItemLeft}>
                    <Ionicons name="information-circle-outline" size={22} color="#3498db" />
                    <Text style={styles.menuText}>關於我們</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#CCC" />
                </TouchableOpacity>

                {/* 登出 */}
                <TouchableOpacity style={[styles.menuItem, styles.lastItem]}>
                  <View style={styles.menuItemLeft}>
                    <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
                    <Text style={[styles.menuText, { color: '#FF3B30' }]}>登出</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // 背景變暗效果
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 25,
    width: '100%',
    maxWidth: 350,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  menuList: {
    marginTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  lastItem: {
    borderBottomWidth: 0,
    marginTop: 10,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    color: '#444',
    marginLeft: 15,
    fontWeight: '500',
  },
});

export default SettingScreen;