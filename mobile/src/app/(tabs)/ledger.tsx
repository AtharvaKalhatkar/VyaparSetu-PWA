import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Searchbar, FAB, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/theme';
import { EmptyState } from '../../components/common/EmptyState';
import { OfflineBanner } from '../../components/common/OfflineBanner';
import { formatCurrency, formatPhone } from '../../utils/formatting';
import { ApiService } from '../../services/api';
import type { PartyBalance } from '../../types';

export default function LedgerScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [parties, setParties] = useState<PartyBalance[]>([]);

  const fetchParties = useCallback(async () => {
    try {
      const data = await ApiService.ledger.getOutstanding().catch(() => null);
      if (data) setParties(data as unknown as PartyBalance[]);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchParties(); }, []);

  const filteredParties = parties.filter(p => {
    const name = p.partyName || '';
    const phone = p.phone || '';
    return name.toLowerCase().includes(search.toLowerCase()) ||
      phone.includes(search);
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchParties();
  }, [fetchParties]);

  const totalOutstanding = filteredParties.reduce((sum, p) => sum + p.outstandingAmount, 0);

  const getOutstandingColor = (balanceType: string) => {
    return balanceType === 'DEBIT' ? Colors.error : Colors.success;
  };

  const getOutstandingLabel = (balanceType: string) => {
    return balanceType === 'DEBIT' ? 'To Collect' : 'To Pay';
  };

  const renderParty = ({ item }: { item: PartyBalance }) => {
    return (
      <TouchableOpacity style={styles.partyCard} activeOpacity={0.7}>
        <View style={styles.cardLeft}>
          <View style={[styles.avatar, { backgroundColor: Colors.primaryLight + '20' }]}>
            <Text style={[styles.avatarText, { color: Colors.primary }]}>
              {(item.partyName || 'P').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.partyName}>{item.partyName || 'Party'}</Text>
            <Text style={styles.partyPhone}>{formatPhone(item.phone || '')}</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.outstandingAmount, { color: getOutstandingColor(item.balanceType) }]}>
            {formatCurrency(item.outstandingAmount)}
          </Text>
          <View style={[styles.outstandingBadge, { backgroundColor: getOutstandingColor(item.balanceType) + '20' }]}>
            <Text style={[styles.outstandingLabel, { color: getOutstandingColor(item.balanceType) }]}>
              {getOutstandingLabel(item.balanceType)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <OfflineBanner />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ledger / Udhari</Text>
        <View style={styles.headerRight}>
          <Text style={styles.headerTotal}>{formatCurrency(totalOutstanding)}</Text>
          <Text style={styles.headerTotalLabel}>Total Outstanding</Text>
        </View>
      </View>

      <Searchbar
        placeholder="Search parties..."
        onChangeText={setSearch}
        value={search}
        style={styles.searchBar}
      />

      <FlatList
        data={filteredParties}
        renderItem={renderParty}
        keyExtractor={(item) => item.partyId}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="book-outline"
            title="No ledger entries"
            message={search ? 'Try a different search' : 'Parties will appear here'}
            actionLabel="Add Party"
            onAction={() => router.push('/add-party')}
          />
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        color={Colors.textLight}
        onPress={() => router.push('/add-entry')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { ...Typography.h2, color: Colors.textPrimary },
  headerRight: { alignItems: 'flex-end' },
  headerTotal: { ...Typography.h3, fontWeight: '700', color: Colors.primary },
  headerTotalLabel: { ...Typography.overline, color: Colors.textSecondary },
  filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm, gap: Spacing.sm },
  filterChip: { backgroundColor: Colors.surface },
  chipText: { color: Colors.textSecondary },
  activeChipText: { color: Colors.primary, fontWeight: '600' },
  searchBar: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.md },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 80 },
  partyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.sm, ...Shadows.sm },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  avatarText: { ...Typography.h4, fontWeight: '700' },
  cardInfo: { flex: 1 },
  partyName: { ...Typography.body1, fontWeight: '600', color: Colors.textPrimary },
  partyPhone: { ...Typography.caption, color: Colors.textSecondary },
  cardRight: { alignItems: 'flex-end' },
  outstandingAmount: { ...Typography.h4, fontWeight: '700' },
  outstandingBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.xs, marginTop: Spacing.xxs },
  outstandingLabel: { fontSize: 10, fontWeight: '700' },
  fab: { position: 'absolute', right: Spacing.lg, bottom: Spacing.lg, backgroundColor: Colors.primary, borderRadius: BorderRadius.round },
});
