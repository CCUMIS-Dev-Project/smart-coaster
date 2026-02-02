import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const formatTime = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const HistoryItem = ({ item }) => {
  const getChangeColor = () => {
    if (item.change < 0) return '#e74c3c';
    if (item.change > 0) return '#27ae60';
    return '#95a5a6';
  };

  return (
    <View style={styles.historyItem}>
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{formatTime(item.timestamp)}</Text>
      </View>
      <View style={styles.volumeInfo}>
        <Text style={styles.volumeText}>{item.volume} ml</Text>
        {item.change !== 0 && (
          <Text style={[styles.changeText, { color: getChangeColor() }]}>
            {item.change > 0 ? '+' : ''}{item.change} ml
          </Text>
        )}
      </View>
    </View>
  );
};

const VolumeHistory = ({ history }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Readings</Text>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <HistoryItem item={item} />}
        scrollEnabled={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No readings yet</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  timeContainer: {
    flex: 1,
  },
  timeText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  volumeInfo: {
    alignItems: 'flex-end',
  },
  volumeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
  },
  changeText: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#95a5a6',
    paddingVertical: 20,
  },
});

export default VolumeHistory;
