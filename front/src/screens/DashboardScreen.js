import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import VolumeDisplay from '../components/VolumeDisplay';
import VolumeHistory from '../components/VolumeHistory';
import StatusIndicator from '../components/StatusIndicator';
import {
  getSensorData,
  subscribeSensorData,
  startMockUpdates,
  stopMockUpdates,
  getMockHistory,
} from '../services/mockSensorData';

const DashboardScreen = () => {
  const [sensorData, setSensorData] = useState(getSensorData());
  const [history, setHistory] = useState(getMockHistory(10));
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Subscribe to sensor updates
    const unsubscribe = subscribeSensorData((data) => {
      setSensorData(data);
      // Add to history
      setHistory((prev) => {
        const newEntry = {
          id: Date.now().toString(),
          volume: data.currentVolume,
          change: data.change,
          timestamp: data.timestamp,
          status: data.status,
        };
        return [newEntry, ...prev.slice(0, 9)]; // Keep last 10 entries
      });
    });

    // Start mock data simulation
    startMockUpdates(3000); // Update every 3 seconds

    return () => {
      unsubscribe();
      stopMockUpdates();
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setHistory(getMockHistory(10));
      setRefreshing(false);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Smart Coaster</Text>
        <Text style={styles.headerSubtitle}>Hydration Tracker</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <StatusIndicator status={sensorData.status} />

        <VolumeDisplay
          currentVolume={sensorData.currentVolume}
          change={sensorData.change}
        />

        <VolumeHistory history={history} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    backgroundColor: '#3498db',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 32,
  },
});

export default DashboardScreen;
