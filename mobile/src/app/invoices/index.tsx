import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Text, Searchbar, Menu, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/theme';
import { OfflineBanner } from '../../components/common/OfflineBanner';
import { EmptyState } from '../../components/common/EmptyState';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { ApiService } from '../../services/api';
import type { Invoice } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  PAID: Colors.success, DRAFT: Colors.warning, CONFIRMED: Colors.info,
  CANCELLED: Colors.error, PARTIALLY_PAID: Colors.accent, PENDING: Colors.textSecondary, OVERDUE: Colors.error,
};

export default function InvoiceListScreen() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterMenu, setFilterMenu] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchInvoices = useCallback(async () => {
    try {
      const params: Record<string, unknown> = { limit: 50, sort: 'createdAt', order: 'desc' };
      if (statusFilter) params.status = statusFilter;
      const data = await ApiService.invoice.getInvoices(params);
      setInvoices(data?.content || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [statusFilter]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const filtered = invoices.filter(inv =>
    inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
    inv.party?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Stack.Screen options={{ title: 'Invoices', headerShown: false }} />
      <OfflineBanner />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Icon name="arrow-left" size={24} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Invoices</Text>
        <TouchableOpacity onPress={() => router.push('/billing')}><Icon name="plus" size={24} color={Colors.primary} /></TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <Searchbar placeholder="Search invoices..." value={search} onChangeText={setSearch} style={styles.searchBar} />
        <Menu visible={!!filterMenu} onDismiss={() => setFilterMenu('')} anchor={<TouchableOpacity style={styles.filterBtn} onPress={() => setFilterMenu('open')}><Icon name="filter-variant" size={22} color={Colors.textSecondary} /></TouchableOpacity>}>
          <Menu.Item onPress={() => { setStatusFilter(''); setFilterMenu(''); }} title="All" />
          <Divider />
          <Menu.Item onPress={() => { setStatusFilter('PAID'); setFilterMenu(''); }} title="Paid" />
          <Menu.Item onPress={() => { setStatusFilter('DRAFT'); setFilterMenu(''); }} title="Draft" />
          <Menu.Item onPress={() => { setStatusFilter('OVERDUE'); setFilterMenu(''); }} title="Overdue" />
          <Menu.Item onPress={() => { setStatusFilter('CANCELLED'); setFilterMenu(''); }} title="Cancelled" />
        </Menu>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList data={filtered} keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchInvoices(); }} colors={[Colors.primary]} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} activeOpacity={0.7}>
              <View style={styles.cardTop}>
                <Text style={styles.invoiceNo}>#{item.invoiceNo}</Text>
                <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.paymentStatus] || Colors.textSecondary) + '20' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[item.paymentStatus] || Colors.textSecondary }]}>{item.paymentStatus}</Text>
                </View>
              </View>
              <Text style={styles.partyName}>{item.party?.name || 'Party'}</Text>
              <View style={styles.cardBottom}>
                <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                <Text style={styles.amount}>{formatCurrency(item.grandTotal)}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<EmptyState icon="file-document-outline" title="No invoices" message={search ? 'Try a different search' : 'Create your first invoice'} actionLabel="New Invoice" onAction={() => router.push('/billing')} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, marginBottom: Spacing.md, gap: Spacing.sm },
  searchBar: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md },
  filterBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.sm, ...Shadows.sm },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  invoiceNo: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.xs },
  statusText: { fontSize: 11, fontWeight: '700' },
  partyName: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.sm },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { fontSize: 12, color: Colors.textDisabled },
  amount: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
});
