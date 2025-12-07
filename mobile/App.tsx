import React from 'react';
import {SafeAreaView, Text, View, StyleSheet} from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text style={styles.title}>Akorfa Mobile (Expo)</Text>
        <Text style={styles.subtitle}>Shared scoring and assessment flows will be integrated here.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f9fafb', padding: 16},
  title: {fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8},
  subtitle: {fontSize: 14, color: '#6b7280'}
});
