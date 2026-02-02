import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StatusIndicator = ({ status }) => {
  const isOccupied = status === 'occupied';

  return (
    <View style={styles.container}>
      <View style={[styles.indicator, isOccupied ? styles.occupied : styles.empty]} />
      <Text style={styles.statusText}>
        {isOccupied ? 'Cup Placed' : 'Coaster Empty'}
      </Text>
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
