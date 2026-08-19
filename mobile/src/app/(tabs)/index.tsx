import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  ActivityIndicator,
  FAB,
  Menu,
  Badge,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { useAuthStore } from '../../store/authStore';
import { useSyncStore } from '../../store/syncStore';
import { ApiService } from '../../services/api';
import type { Dashboard, Invoice } from '../../types';

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);
  const business = useAuthStore(s => s.business);
  const isOnline = useSyncStore(s => s.isOnline);
  const pendingSyncCount = useSyncStore(s => s.pendingSyncCount);

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [promoVisible, setPromoVisible] = useState(true);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [dashData, invData] = await Promise.all([
        ApiService.dashboard.getDashboard().catch(() => null),
        ApiService.invoice.getInvoices({ limit: 5, sort: 'createdAt', order: 'desc' }).catch(() => null),
      ]);
      if (dashData) setDashboard(dashData);
      if (invData?.content) setRecentInvoices(invData.content.slice(0, 5));
    } catch {
      // Silent catch
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
  }, [fetchData]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const userName = user?.name || 'User';
  const businessName = business?.name || 'My Business';

  const todaySales = dashboard?.todaySales ?? 0;
  const toCollect = dashboard?.outstandingAmount ?? 0;
  const toPay = (dashboard as any)?.toPay ?? 0;
  const monthlySales = dashboard?.monthlySales ?? 0;
  const lowStockCount = dashboard?.lowStockItems?.length ?? 0;

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }, styles.centerLoading]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 1. Header: compact single row with business switcher + offline sync badge + menu */}
      <View style={styles.header}>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <TouchableOpacity style={styles.businessSwitcher} onPress={() => setMenuVisible(true)}>
              <Icon name="store" size={18} color={Colors.primary} />
              <Text style={styles.businessName} numberOfLines={1}>{businessName}</Text>
              <Icon name="chevron-down" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          }
        >
          <Menu.Item onPress={() => { setMenuVisible(false); router.push('/business-profile'); }} title="Business Profile" leadingIcon="domain" />
          <Menu.Item onPress={() => { setMenuVisible(false); router.push('/my-account'); }} title="Account Settings" leadingIcon="cog" />
        </Menu>

        <View style={styles.headerRight}>
          {/* Offline Sync Pending Badge */}
          <TouchableOpacity style={styles.syncBadgeContainer} onPress={() => router.push('/more')}>
            <Icon
              name={isOnline ? 'cloud-check' : 'cloud-sync-outline'}
              size={20}
              color={isOnline ? (pendingSyncCount > 0 ? Colors.warning : Colors.success) : Colors.error}
            />
            {pendingSyncCount > 0 && (
              <Badge style={styles.syncBadge} size={16}>{pendingSyncCount}</Badge>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/notifications')}>
            <Icon name="bell-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Greeting */}
        <View style={styles.greetingRow}>
          <Text style={styles.greetingText}>{greeting}, <Text style={styles.userName}>{userName}</Text></Text>
        </View>

        {/* 3. Top 3 Stat Cards in 1 Row (bg/text pairs) */}
        <View style={styles.statCardsRow}>
          <View style={[styles.statCard, { backgroundColor: Colors.primaryLight, borderColor: Colors.primary + '20' }]}>
            <Text style={styles.statLabel}>Today's Sale</Text>
            <Text style={[styles.statValue, { color: Colors.primary }]}>{formatCurrency(todaySales)}</Text>
          </View>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: Colors.successLight, borderColor: Colors.successText + '20' }]}
            onPress={() => router.push('/customers')}
            activeOpacity={0.7}
          >
            <Text style={styles.statLabel}>To Collect</Text>
            <Text style={[styles.statValue, { color: Colors.successText }]}>{formatCurrency(toCollect)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: Colors.errorLight, borderColor: Colors.error + '20' }]}
            onPress={() => router.push('/suppliers')}
            activeOpacity={0.7}
          >
            <Text style={styles.statLabel}>To Pay</Text>
            <Text style={[styles.statValue, { color: Colors.error }]}>{formatCurrency(toPay)}</Text>
          </TouchableOpacity>
        </View>



        {/* 5. Quick Actions: pastel tinted circles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickGrid}>
            {[
              { label: 'Purchase', icon: 'truck-delivery-outline', color: Colors.warning, bg: Colors.warningLight, action: () => router.push('/purchase') },
              { label: 'Receive', icon: 'cash-arrow-right', color: Colors.success, bg: Colors.mintLight, action: () => router.push('/add-payment') },
              { label: 'Pay', icon: 'cash-arrow-left', color: Colors.error, bg: Colors.roseLight, action: () => router.push('/add-entry') },
              { label: 'Add Item', icon: 'package-variant-plus', color: '#4F46E5', bg: Colors.indigoLight, action: () => router.push('/inventory') },
              { label: 'Add Party', icon: 'account-plus-outline', color: Colors.secondary, bg: Colors.violetLight, action: () => router.push('/add-party') },
            ].map((act, i) => (
              <TouchableOpacity key={i} style={styles.quickItem} onPress={act.action} activeOpacity={0.7}>
                <View style={[styles.quickIconCircle, { backgroundColor: act.bg }]}>
                  <Icon name={act.icon} size={22} color={act.color} />
                </View>
                <Text style={styles.quickItemLabel}>{act.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 6. "This Month" 2x2 Stat Grid */}
        <Card style={styles.monthCard}>
          <View style={styles.monthHeader}>
            <Text style={styles.sectionTitle}>This Month</Text>
            <TouchableOpacity onPress={() => router.push('/reports')}>
              <Text style={styles.viewReportText}>Report →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.grid2x2}>
            <View style={styles.gridCell}>
              <Text style={styles.gridCellLabel}>Sales</Text>
              <Text style={[styles.gridCellValue, { color: Colors.success }]}>{formatCurrency(monthlySales)}</Text>
            </View>
            <View style={[styles.gridCell, styles.cellBorderLeft]}>
              <Text style={styles.gridCellLabel}>Transactions</Text>
              <Text style={styles.gridCellValue}>{recentInvoices.length}</Text>
            </View>
            <View style={[styles.gridCell, styles.cellBorderTop]}>
              <Text style={styles.gridCellLabel}>Due Invoices</Text>
              <Text style={[styles.gridCellValue, { color: Colors.error }]}>
                {recentInvoices.filter(i => i.paymentStatus !== 'PAID').length}
              </Text>
            </View>
            <View style={[styles.gridCell, styles.cellBorderTop, styles.cellBorderLeft]}>
              <Text style={styles.gridCellLabel}>Low Stock</Text>
              <Text style={[styles.gridCellValue, { color: Colors.warning }]}>{lowStockCount}</Text>
            </View>
          </View>
        </Card>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Invoices</Text>
            <TouchableOpacity onPress={() => router.push('/invoices')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentInvoices.length > 0 ? (
            recentInvoices.map(inv => {
              const partyName = inv.party?.name || 'Customer';
              return (
                <TouchableOpacity key={inv.id} style={styles.txnCard} onPress={() => router.push('/invoices')} activeOpacity={0.7}>
                  <View style={styles.txnLeft}>
                    <View style={[styles.txnAvatar, { backgroundColor: Colors.primaryLight }]}>
                      <Text style={styles.avatarChar}>{partyName.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.txnMeta}>
                      <Text style={styles.txnParty} numberOfLines={1}>{partyName}</Text>
                      <Text style={styles.txnSub}>#{inv.invoiceNo} · {formatDate(inv.date)}</Text>
                    </View>
                  </View>
                  <View style={styles.txnRight}>
                    <Text style={styles.txnGrandTotal}>{formatCurrency(inv.grandTotal ?? 0)}</Text>
                    <Text style={[styles.txnStatusBadge, { color: inv.paymentStatus === 'PAID' ? Colors.success : Colors.error }]}>
                      {inv.paymentStatus}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>No recent transactions</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 7. Floating FAB ("+ Create Invoice"): 56dp circular bottom-right */}
      <FAB
        icon="plus"
        label="Invoice"
        style={[styles.fab, { bottom: insets.bottom + 70 }]}
        color="#FFFFFF"
        onPress={() => router.push('/billing')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerLoading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  businessSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: '65%',
  },
  businessName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  syncBadgeContainer: {
    position: 'relative',
    padding: 4,
  },
  syncBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: Colors.error,
  },
  iconBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  greetingRow: {
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  greetingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statCardsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  promoStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bannerBg,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    marginBottom: Spacing.md,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(110,231,200,0.2)',
  },
  promoText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  promoCta: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.bannerAccent,
  },
  promoClose: {
    padding: 2,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  viewReportText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  quickItem: {
    width: '18%',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  quickIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  quickItemLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  monthCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  grid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  gridCell: {
    width: '50%',
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  cellBorderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: Colors.divider,
  },
  cellBorderTop: {
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  gridCellLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  gridCellValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  txnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  txnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  txnAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarChar: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  txnMeta: {
    flex: 1,
  },
  txnParty: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  txnSub: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  txnRight: {
    alignItems: 'flex-end',
  },
  txnGrandTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  txnStatusBadge: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  emptyCard: {
    padding: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
  },
  fab: {
    position: 'absolute',
    right: 16,
    backgroundColor: Colors.primary,
  },
});
