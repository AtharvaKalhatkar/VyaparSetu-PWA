import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';

const SETTINGS_ITEMS = [
  { icon: 'store', label: 'Business Profile', route: '/business-profile' },
  { icon: 'account', label: 'My Account', route: '/my-account' },
  { icon: 'printer', label: 'Print Settings', route: '/print-settings' },
  { icon: 'palette', label: 'Theme', route: '/theme' },
  { icon: 'bell', label: 'Notifications', route: '/notifications' },
  { icon: 'database', label: 'Backup & Restore', route: '/backup' },
  { icon: 'information', label: 'About', route: '/about' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => { logout(); router.replace('/login'); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Stack.Screen options={{ title: 'Settings', headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Icon name="arrow-left" size={24} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.section}>
          {SETTINGS_ITEMS.map((item, i) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => router.push(item.route)}>
                <Icon name={item.icon} size={22} color={Colors.textSecondary} />
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Icon name="chevron-right" size={20} color={Colors.textDisabled} />
              </TouchableOpacity>
              {i < SETTINGS_ITEMS.length - 1 && <Divider style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={handleLogout}>
            <Icon name="logout" size={22} color={Colors.error} />
            <Text style={[styles.rowLabel, { color: Colors.error }]}>Logout</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Vyapar Setu v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  scroll: { padding: Spacing.lg },
  section: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, marginBottom: Spacing.lg, ...Shadows.sm, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg },
  rowLabel: { flex: 1, fontSize: 15, color: Colors.textPrimary, marginLeft: Spacing.md },
  divider: { marginLeft: 58 },
  version: { textAlign: 'center', fontSize: 12, color: Colors.textDisabled, marginTop: Spacing.md },
});
