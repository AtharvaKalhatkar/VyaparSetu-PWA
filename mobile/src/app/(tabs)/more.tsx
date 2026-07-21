import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useSyncStore } from '../../store/syncStore';

interface MenuItem {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
  badge?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export default function MoreScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { isOnline, pendingSyncCount, lastSyncedAt } = useSyncStore();

  const menuSections: MenuSection[] = [
    {
      title: 'Business',
      items: [
        { icon: 'package-variant', label: 'Inventory', color: Colors.primary, onPress: () => router.push('/inventory'),
          badge: 'Items, Stock' },
        { icon: 'file-chart', label: 'Reports', color: Colors.info, onPress: () => router.push('/reports'),
          badge: 'Sales, GST, Stock' },
        { icon: 'account-group', label: 'Customers', color: Colors.success, onPress: () => router.push('/customers'),
          badge: 'Full list' },
        { icon: 'truck', label: 'Suppliers', color: Colors.secondary, onPress: () => router.push('/suppliers'),
          badge: 'Full list' },
      ],
    },
    {
      title: 'Management',
      items: [
        { icon: 'cash-minus', label: 'Expenses', color: Colors.error, onPress: () => router.push('/expenses') },
        { icon: 'badge-account', label: 'Employees', color: Colors.accent, onPress: () => router.push('/employees') },
        { icon: 'account-star', label: 'CRM', color: Colors.accent, onPress: () => router.push('/crm'),
          badge: 'Leads, Follow-ups' },
      ],
    },
    {
      title: 'Settings',
      items: [
        { icon: 'cog-outline', label: 'Settings', color: Colors.textSecondary, onPress: () => router.push('/settings') },
        { icon: 'backup-restore', label: 'Backup & Restore', color: Colors.warning, onPress: () => {} },
      ],
    },
  ];

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card style={styles.syncCard}>
          <View style={styles.syncRow}>
            <View style={[styles.syncDot, { backgroundColor: isOnline ? Colors.success : Colors.error }]} />
            <View style={styles.syncInfo}>
              <Text style={styles.syncTitle}>{isOnline ? 'Online' : 'Offline'}</Text>
              <Text style={styles.syncSub}>
                {pendingSyncCount > 0 ? `${pendingSyncCount} pending changes` : 'All synced'}
                {lastSyncedAt ? ` • ${new Date(lastSyncedAt).toLocaleTimeString()}` : ''}
              </Text>
            </View>
            <Icon name="sync" size={24} color={Colors.primary} />
          </View>
        </Card>

        {menuSections.map((section, sIdx) => (
          <View key={sIdx} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Card style={styles.sectionCard}>
              {section.items.map((item, iIdx) => (
                <React.Fragment key={iIdx}>
                  {iIdx > 0 && <Divider />}
                  <TouchableOpacity style={styles.menuItem} onPress={item.onPress} activeOpacity={0.7}>
                    <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                      <Icon name={item.icon} size={22} color={item.color} />
                    </View>
                    <View style={styles.menuInfo}>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                      {item.badge && <Text style={styles.menuBadge}>{item.badge}</Text>}
                    </View>
                    <Icon name="chevron-right" size={20} color={Colors.textDisabled} />
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </Card>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutCard} onPress={handleLogout} activeOpacity={0.7}>
          <Icon name="logout" size={22} color={Colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.versionRow}>
          <Text style={styles.versionText}>Vyapar Setu v2.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: Spacing.xxxl },
  syncCard: { marginHorizontal: Spacing.lg, marginTop: Spacing.md, marginBottom: Spacing.md, padding: Spacing.lg, borderRadius: BorderRadius.md, ...Shadows.sm },
  syncRow: { flexDirection: 'row', alignItems: 'center' },
  syncDot: { width: 10, height: 10, borderRadius: 5, marginRight: Spacing.md },
  syncInfo: { flex: 1 },
  syncTitle: { ...Typography.body1, fontWeight: '600', color: Colors.textPrimary },
  syncSub: { ...Typography.caption, color: Colors.textSecondary },
  section: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  sectionTitle: { ...Typography.overline, color: Colors.textSecondary, marginBottom: Spacing.sm, marginLeft: Spacing.xs },
  sectionCard: { borderRadius: BorderRadius.md, ...Shadows.sm, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, backgroundColor: Colors.surface },
  menuIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.lg },
  menuInfo: { flex: 1 },
  menuLabel: { ...Typography.body1, color: Colors.textPrimary, fontWeight: '500' },
  menuBadge: { ...Typography.overline, color: Colors.textDisabled },
  logoutCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: Spacing.lg, padding: Spacing.lg, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, gap: Spacing.sm, ...Shadows.sm },
  logoutText: { ...Typography.body1, fontWeight: '600', color: Colors.error },
  versionRow: { alignItems: 'center', paddingVertical: Spacing.lg },
  versionText: { ...Typography.caption, color: Colors.textDisabled },
});
