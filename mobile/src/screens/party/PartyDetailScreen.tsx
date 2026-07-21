import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button, Card, Divider, Chip, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/theme';
import { formatCurrency, formatPhone, formatDate, formatGstin } from '../../utils/formatting';
import type { Party, LedgerEntry, PartyBalance } from '../../types';

const MOCK_PARTY: Party = {
  id: '1', businessId: 'b1', name: 'Sharma General Store', phone: '9876543210',
  email: 'sharma@example.com', gstin: '27ABCDE1234F1Z5', type: 'CUSTOMER',
  creditLimit: 50000, creditDays: 30, openingBalance: 25000, balanceType: 'DEBIT',
  isActive: true, tags: ['wholesale', 'regular'],
  address: { line1: '123, Main Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', country: 'India' },
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};

const MOCK_ENTRIES: LedgerEntry[] = [
  { id: 'e1', businessId: 'b1', partyId: '1', type: 'SALE', amount: 15000, balanceType: 'DEBIT', mode: 'CASH', reference: 'INV-001', description: 'Sale of electronics', date: '2026-07-01', runningBalance: 40000, createdBy: 'u1', createdAt: '', updatedAt: '' },
  { id: 'e2', businessId: 'b1', partyId: '1', type: 'RECEIPT', amount: 10000, balanceType: 'CREDIT', mode: 'UPI', reference: 'PAY-001', description: 'Payment received', date: '2026-07-05', runningBalance: 30000, createdBy: 'u1', createdAt: '', updatedAt: '' },
  { id: 'e3', businessId: 'b1', partyId: '1', type: 'PURCHASE', amount: 5000, balanceType: 'DEBIT', mode: 'BANK', reference: 'PUR-001', description: 'Stock purchase', date: '2026-07-10', runningBalance: 35000, createdBy: 'u1', createdAt: '', updatedAt: '' },
];

export const PartyDetailScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const party = MOCK_PARTY;
  const entries = MOCK_ENTRIES;
  const isDebit = party.balanceType === 'DEBIT';

  const getEntryIcon = (type: string) => {
    switch (type) {
      case 'SALE': return 'cart-outline';
      case 'PURCHASE': return 'truck-outline';
      case 'RECEIPT': return 'cash-check';
      case 'PAYMENT': return 'cash-minus';
      default: return 'swap-horizontal';
    }
  };

  const getEntryColor = (type: string) => {
    switch (type) {
      case 'RECEIPT': return Colors.success;
      case 'PAYMENT': return Colors.error;
      default: return Colors.info;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{party.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.partyName}>{party.name}</Text>
          <Text style={styles.partyPhone}>{formatPhone(party.phone)}</Text>
          {party.gstin && <Text style={styles.partyGstin}>{formatGstin(party.gstin)}</Text>}
          <View style={styles.typeChipRow}>
            <Chip icon="store" style={styles.typeChip}>{party.type}</Chip>
            {party.tags.map((tag, i) => (
              <Chip key={i} style={styles.tagChip}>{tag}</Chip>
            ))}
          </View>
        </View>

        <View style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Outstanding</Text>
              <Text style={[styles.balanceAmount, { color: isDebit ? Colors.error : Colors.success }]}>
                {formatCurrency(party.openingBalance)}
              </Text>
              <Text style={styles.balanceSub}>{isDebit ? 'Party owes you' : 'You owe party'}</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Credit Limit</Text>
              <Text style={styles.balanceAmount}>{formatCurrency(party.creditLimit)}</Text>
              <Text style={styles.balanceSub}>{party.creditDays} days</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <Icon name="cart-plus" size={24} color={Colors.primary} />
            <Text style={styles.actionLabel}>New Sale</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <Icon name="cash-check" size={24} color={Colors.success} />
            <Text style={styles.actionLabel}>Receive Payment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <Icon name="cash-minus" size={24} color={Colors.error} />
            <Text style={styles.actionLabel}>Record Payment</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="book-outline" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Ledger Entries</Text>
            <Text style={styles.sectionCount}>{entries.length}</Text>
          </View>

          {entries.map((entry) => (
            <View key={entry.id} style={styles.entryCard}>
              <View style={styles.entryLeft}>
                <View style={[styles.entryIcon, { backgroundColor: getEntryColor(entry.type) + '20' }]}>
                  <Icon name={getEntryIcon(entry.type)} size={20} color={getEntryColor(entry.type)} />
                </View>
                <View style={styles.entryInfo}>
                  <Text style={styles.entryType}>{entry.type.replace(/_/g, ' ')}</Text>
                  <Text style={styles.entryDesc}>{entry.description}</Text>
                  <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                </View>
              </View>
              <View style={styles.entryRight}>
                <Text style={[styles.entryAmount, { color: entry.balanceType === 'DEBIT' ? Colors.error : Colors.success }]}>
                  {entry.balanceType === 'DEBIT' ? '-' : '+'}{formatCurrency(entry.amount)}
                </Text>
                <Text style={styles.entryRef}>{entry.reference}</Text>
              </View>
            </View>
          ))}
        </View>

        {party.address && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="map-marker-outline" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Address</Text>
            </View>
            <Text style={styles.addressText}>
              {party.address.line1}{party.address.line2 ? `, ${party.address.line2}` : ''}
              {'\n'}{party.address.city}, {party.address.state} - {party.address.pincode}
            </Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            buttonColor={Colors.primary}
            icon="pencil"
            style={styles.editButton}
            onPress={() => navigation.navigate('EditParty', { partyId: party.id })}
          >
            Edit Party
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: Spacing.xxxl },
  profileHeader: { alignItems: 'center', paddingVertical: Spacing.xxl, backgroundColor: Colors.surface, marginBottom: Spacing.md },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md, ...Shadows.md },
  avatarLargeText: { fontSize: 32, fontWeight: '700', color: Colors.textLight },
  partyName: { ...Typography.h2, color: Colors.textPrimary },
  partyPhone: { ...Typography.body2, color: Colors.textSecondary, marginTop: Spacing.xxs },
  partyGstin: { ...Typography.caption, color: Colors.textDisabled, marginTop: Spacing.xxs },
  typeChipRow: { flexDirection: 'row', marginTop: Spacing.md, gap: Spacing.xs },
  typeChip: { backgroundColor: Colors.infoLight },
  tagChip: { backgroundColor: Colors.surface },
  balanceCard: { backgroundColor: Colors.surface, marginHorizontal: Spacing.lg, borderRadius: BorderRadius.md, padding: Spacing.lg, ...Shadows.sm, marginBottom: Spacing.md },
  balanceRow: { flexDirection: 'row', alignItems: 'center' },
  balanceItem: { flex: 1, alignItems: 'center' },
  balanceDivider: { width: 1, height: 60, backgroundColor: Colors.divider, marginHorizontal: Spacing.lg },
  balanceLabel: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.xs },
  balanceAmount: { ...Typography.h3, fontWeight: '700' },
  balanceSub: { ...Typography.caption, color: Colors.textDisabled, marginTop: Spacing.xxs },
  quickActions: { flexDirection: 'row', marginHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md },
  actionBtn: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', ...Shadows.sm },
  actionLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center' },
  section: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary, marginLeft: Spacing.sm, flex: 1 },
  sectionCount: { ...Typography.caption, color: Colors.textSecondary },
  entryCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: Spacing.md, marginBottom: Spacing.xs, ...Shadows.sm },
  entryLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  entryIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  entryInfo: { flex: 1 },
  entryType: { ...Typography.body2, fontWeight: '600', color: Colors.textPrimary },
  entryDesc: { ...Typography.caption, color: Colors.textSecondary },
  entryDate: { ...Typography.overline, color: Colors.textDisabled },
  entryRight: { alignItems: 'flex-end' },
  entryAmount: { ...Typography.body1, fontWeight: '700' },
  entryRef: { ...Typography.caption, color: Colors.textDisabled },
  addressText: { ...Typography.body2, color: Colors.textSecondary, lineHeight: 20 },
  actionButtons: { marginHorizontal: Spacing.lg, marginTop: Spacing.md },
  editButton: { borderRadius: BorderRadius.md },
});
