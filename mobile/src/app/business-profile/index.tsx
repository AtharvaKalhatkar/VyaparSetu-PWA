import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

export default function BusinessProfileScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ title: 'Business Profile', headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Icon name="arrow-left" size={24} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.title}>Business Profile</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.placeholder}>
        <Icon name="store-outline" size={64} color={Colors.textDisabled} />
        <Text style={styles.hint}>Coming soon</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  hint: { fontSize: 16, color: Colors.textDisabled },
});
