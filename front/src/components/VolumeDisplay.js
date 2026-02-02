import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const VolumeDisplay = ({ currentVolume, change }) => {
  const getChangeColor = () => {
    if (change < 0) return '#e74c3c'; // Red for consumption
    if (change > 0) return '#27ae60'; // Green for refill
    return '#95a5a6'; // Gray for no change
  };

  const getChangeText = () => {
    if (change === 0) return 'No change';
    if (change > 0) return `+${change} ml (refilled)`;
    return `${change} ml (consumed)`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Current Volume</Text>
      <View style={styles.volumeContainer}>
        <Text style={styles.volumeValue}>{currentVolume}</Text>
        <Text style={styles.volumeUnit}>ml</Text>
      </View>
      <View style={[styles.changeContainer, { backgroundColor: getChangeColor() + '20' }]}>
        <Text style={[styles.changeText, { color: getChangeColor() }]}>
          {getChangeText()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 12,
  },
  volumeValue: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  volumeUnit: {
    fontSize: 24,
    color: '#7f8c8d',
    marginLeft: 8,
    fontWeight: '500',
  },
  changeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changeText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VolumeDisplay;
