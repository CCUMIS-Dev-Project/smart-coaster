import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StatusIndicator = ({ systemActive, isOnCoaster }) => {
  // 決定狀態顏色與文字
  let statusColor = '#95a5a6'; // Gray
  let statusText = 'Unknown';

  if (!systemActive) {
    statusColor = '#e74c3c'; // Red
    statusText = 'System Off';
  } else if (isOnCoaster) {
    statusColor = '#27ae60'; // Green
    statusText = 'Cup Placed';
  } else {
    statusColor = '#f39c12'; // Orange
    statusText = 'Coaster Empty';
  }

  return (
    <View style={styles.container}>
      <View style={[styles.indicator, { backgroundColor: statusColor }]} />
      <Text style={styles.statusText}>{statusText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  occupied: {
    backgroundColor: '#27ae60',
  },
  empty: {
    backgroundColor: '#95a5a6',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
  },
});

export default StatusIndicator;
