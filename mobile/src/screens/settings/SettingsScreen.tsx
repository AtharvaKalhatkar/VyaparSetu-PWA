import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Button, Card, Switch, Divider, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/theme';
import { useSyncStore } from '../../store/syncStore';
import { Config } from '../../constants/config';

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

interface SettingsItem {
  icon: string;
  label: string;
  value?: string;
  type: 'navigation' | 'toggle' | 'info';
  isEnabled?: boolean;
  onToggle?: (val: boolean) => void;
  onPress?: () => void;
  color?: string;
}

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { isOnline, pendingSyncCount, lastSyncedAt, isSyncing } = useSyncStore();
  const [useBiometric, setUseBiometric] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const businessSections: SettingsSection[] = [
    {
      title: 'Business',
      items: [
        { icon: 'store', label: 'Business Profile', type: 'navigation', onPress: () => {} },
        { icon: 'file-document', label: 'GSTIN Settings', value: 'Update GST details', type: 'navigation', onPress: () => {} },
        { icon: 'map-marker', label: 'Address', type: 'navigation', onPress: () => {} },
        { icon: 'image', label: 'Business Logo', type: 'navigation', onPress: () => {} },
      ],
    },
    {
      title: 'Invoice',
      items: [
        { icon: 'file-document-outline', label: 'Invoice Prefix', value: 'INV-', type: 'navigation', onPress: () => {} },
        { icon: 'file-table', label: 'Invoice Template', value: 'Standard', type: 'navigation', onPress: () => {} },
        { icon: 'text', label: 'Default Terms', type: 'navigation', onPress: () => {} },
        { icon: 'printer', label: 'Printer Settings', type: 'navigation', onPress: () => {} },
      ],
    },
    {
      title: 'User',
      items: [
        { icon: 'account', label: 'Profile', value: 'Admin User', type: 'navigation', onPress: () => {} },
        { icon: 'lock', label: 'Change Password', type: 'navigation', onPress: () => {} },
        { icon: 'translate', label: 'Language', value: 'English', type: 'navigation', onPress: () => {} },
        { icon: 'fingerprint', label: 'Biometric Login', type: 'toggle', isEnabled: useBiometric, onToggle: setUseBiometric },
      ],
    },
    {
      title: 'Notifications',
      items: [
        { icon: 'bell', label: 'Push Notifications', type: 'toggle', isEnabled: notifications, onToggle: setNotifications },
        { icon: 'message', label: 'SMS Alerts', type: 'toggle', isEnabled: false, onToggle: () => {} },
        { icon: 'email', label: 'Email Reports', type: 'toggle', isEnabled: false, onToggle: () => {} },
      ],
    },
    {
      title: 'Data',
      items: [
        { icon: 'backup-restore', label: 'Backup', type: 'navigation', onPress: () => {} },
        { icon: 'restore', label: 'Restore', type: 'navigation', onPress: () => {} },
        { icon: 'database', label: 'Clear Local Data', type: 'navigation', color: Colors.error, onPress: () => Alert.alert('Clear Data', 'This will clear all local data. Continue?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Clear', style: 'destructive' }]) },
      ],
    },
  ];

  const handleForceSync = () => {
    Alert.alert('Force Sync', 'Starting forced synchronization...');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card style={styles.syncCard}>
          <View style={styles.syncRow}>
            <View style={[styles.syncIndicator, { backgroundColor: isOnline ? Colors.success : Colors.error }]} />
            <View style={styles.syncInfo}>
              <Text style={styles.syncTitle}>{isOnline ? 'Online' : 'Offline'}</Text>
              <Text style={styles.syncSubtitle}>
                {isSyncing ? 'Syncing...' : pendingSyncCount > 0 ? `${pendingSyncCount} pending` : 'All synced'}
                {lastSyncedAt ? ` | Last: ${new Date(lastSyncedAt).toLocaleTimeString()}` : ''}
              </Text>
            </View>
            <Button
              mode="contained-tonal"
              buttonColor={Colors.primaryLight}
              textColor={Colors.textLight}
              compact
              loading={isSyncing}
              onPress={handleForceSync}
            >
              Sync
            </Button>
          </View>
        </Card>

        {businessSections.map((section, sIdx) => (
          <View key={sIdx} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Card style={styles.sectionCard}>
              {section.items.map((item, iIdx) => (
                <React.Fragment key={iIdx}>
                  {iIdx > 0 && <Divider />}
                  <TouchableOpacity
                    style={styles.settingsItem}
                    onPress={item.type === 'toggle' ? undefined : item.onPress}
                    disabled={item.type === 'toggle'}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name={item.icon}
                      size={22}
                      color={item.color || Colors.primary}
                      style={styles.itemIcon}
                    />
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemLabel, item.color ? { color: item.color } : null]}>{item.label}</Text>
                      {item.value && <Text style={styles.itemValue}>{item.value}</Text>}
                    </View>
                    {item.type === 'toggle' ? (
                      <Switch
                        value={item.isEnabled}
                        onValueChange={item.onToggle}
                        color={Colors.primary}
                      />
                    ) : (
                      <Icon name="chevron-right" size={20} color={Colors.textDisabled} />
                    )}
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </Card>
          </View>
        ))}

        <View style={styles.aboutSection}>
          <Text style={styles.appName}>{Config.APP_NAME}</Text>
          <Text style={styles.appVersion}>Version {Config.APP_VERSION}</Text>
          <Text style={styles.appCopy}>For Indian SMEs</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { ...Typography.h2, color: Colors.textPrimary },
  scrollContent: { paddingBottom: Spacing.xxxl },
  syncCard: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md, padding: Spacing.lg, borderRadius: BorderRadius.md, ...Shadows.sm },
  syncRow: { flexDirection: 'row', alignItems: 'center' },
  syncIndicator: { width: 12, height: 12, borderRadius: 6, marginRight: Spacing.md },
  syncInfo: { flex: 1 },
  syncTitle: { ...Typography.body1, fontWeight: '600', color: Colors.textPrimary },
  syncSubtitle: { ...Typography.caption, color: Colors.textSecondary },
  section: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  sectionTitle: { ...Typography.overline, color: Colors.textSecondary, marginBottom: Spacing.sm, marginLeft: Spacing.xs },
  sectionCard: { borderRadius: BorderRadius.md, ...Shadows.sm, overflow: 'hidden' },
  settingsItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, backgroundColor: Colors.surface },
  itemIcon: { marginRight: Spacing.lg },
  itemInfo: { flex: 1 },
  itemLabel: { ...Typography.body1, color: Colors.textPrimary },
  itemValue: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  aboutSection: { alignItems: 'center', paddingVertical: Spacing.xxl },
  appName: { ...Typography.h4, color: Colors.primary, fontWeight: '700' },
  appVersion: { ...Typography.caption, color: Colors.textDisabled, marginTop: Spacing.xs },
  appCopy: { ...Typography.caption, color: Colors.textDisabled, marginTop: Spacing.xxs },
});
