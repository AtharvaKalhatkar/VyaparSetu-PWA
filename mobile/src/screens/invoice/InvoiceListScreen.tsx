import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Searchbar, FAB, Chip, Text, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/theme';
import { EmptyState } from '../../components/common/EmptyState';
import { OfflineBanner } from '../../components/common/OfflineBanner';
import { formatCurrency, formatDate } from '../../utils/formatting';
import type { Invoice, InvoiceStatus } from '../../types';

const MOCK_INVOICES: Invoice[] = [];

export const InvoiceListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<InvoiceStatus | 'ALL'>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const filteredInvoices = MOCK_INVOICES.filter(inv => {
    const matchesSearch = inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      inv.party?.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || inv.status === filter;
    return matchesSearch && matchesFilter;
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID': return Colors.success;
      case 'CONFIRMED': return Colors.info;
      case 'DRAFT': return Colors.warning;
      case 'CANCELLED': return Colors.error;
      case 'PARTIALLY_PAID': return Colors.secondary;
      default: return Colors.textSecondary;
    }
  };

  const getStatusBg = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID': return Colors.successLight;
      case 'CONFIRMED': return Colors.infoLight;
      case 'DRAFT': return Colors.warningLight;
      case 'CANCELLED': return Colors.errorLight;
      case 'PARTIALLY_PAID': return Colors.warningLight;
      default: return Colors.divider;
    }
  };

  const renderInvoice = ({ item }: { item: Invoice }) => (
    <TouchableOpacity
      style={styles.invoiceCard}
      onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.invoiceHeader}>
        <View style={styles.invoiceLeft}>
          <Text style={styles.invoiceNo}>{item.invoiceNo}</Text>
          <Text style={styles.invoiceParty}>{item.party?.name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.invoiceBody}>
        <View style={styles.invoiceDetail}>
          <Icon name="calendar-outline" size={14} color={Colors.textDisabled} />
          <Text style={styles.invoiceDetailText}>{formatDate(item.date)}</Text>
        </View>
        <View style={styles.invoiceDetail}>
          <Icon name={item.paymentMode === 'CASH' ? 'cash' : item.paymentMode === 'UPI' ? 'cellphone' : 'bank'} size={14} color={Colors.textDisabled} />
          <Text style={styles.invoiceDetailText}>{item.paymentMode}</Text>
        </View>
      </View>
      <View style={styles.invoiceFooter}>
        <Text style={styles.invoiceAmount}>{formatCurrency(item.grandTotal)}</Text>
        {item.dueAmount > 0 && (
          <Text style={styles.dueAmount}>Due: {formatCurrency(item.dueAmount)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <OfflineBanner />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Invoices</Text>
        <Text style={styles.headerCount}>{filteredInvoices.length}</Text>
      </View>

      <Searchbar
        placeholder="Search by invoice no. or party..."
        onChangeText={setSearch}
        value={search}
        style={styles.searchBar}
      />

      <View style={styles.filterRow}>
        {(['ALL', 'CONFIRMED', 'DRAFT', 'PAID', 'CANCELLED', 'PARTIALLY_PAID'] as const).map((f) => (
          <Chip
            key={f}
            selected={filter === f}
            onPress={() => setFilter(f)}
            style={styles.filterChip}
            showSelectedCheck={false}
            textStyle={filter === f ? styles.activeChipText : styles.chipText}
          >
            {f === 'PARTIALLY_PAID' ? 'Partial' : f.charAt(0) + f.slice(1).toLowerCase()}
          </Chip>
        ))}
      </View>

      <FlatList
        data={filteredInvoices}
        renderItem={renderInvoice}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="file-document-outline"
            title="No invoices found"
            message={search ? 'Try a different search' : 'Create your first invoice'}
            actionLabel="New Invoice"
            onAction={() => navigation.navigate('CreateInvoice')}
          />
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        color={Colors.textLight}
        onPress={() => navigation.navigate('CreateInvoice')}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { ...Typography.h2, color: Colors.textPrimary },
  headerCount: { ...Typography.body2, color: Colors.textSecondary },
  searchBar: { marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, backgroundColor: Colors.surface, borderRadius: BorderRadius.md },
  filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, marginBottom: Spacing.md, gap: Spacing.xs, flexWrap: 'wrap' },
  filterChip: { backgroundColor: Colors.surface, marginBottom: Spacing.xs },
  chipText: { color: Colors.textSecondary, fontSize: 11 },
  activeChipText: { color: Colors.primary, fontWeight: '600', fontSize: 11 },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 80 },
  invoiceCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.sm, ...Shadows.sm },
  invoiceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  invoiceLeft: { flex: 1 },
  invoiceNo: { ...Typography.body1, fontWeight: '700', color: Colors.textPrimary },
  invoiceParty: { ...Typography.body2, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xxs, borderRadius: BorderRadius.round },
  statusText: { fontSize: 11, fontWeight: '700' },
  invoiceBody: { flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.sm },
  invoiceDetail: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  invoiceDetailText: { ...Typography.caption, color: Colors.textDisabled },
  invoiceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.divider },
  invoiceAmount: { ...Typography.h4, fontWeight: '700', color: Colors.primary },
  dueAmount: { ...Typography.caption, color: Colors.error, fontWeight: '600' },
  fab: { position: 'absolute', right: Spacing.lg, bottom: Spacing.lg, backgroundColor: Colors.primary, borderRadius: BorderRadius.round },
});
