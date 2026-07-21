import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Card, ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/theme';
import { OfflineBanner } from '../../components/common/OfflineBanner';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { useAuthStore } from '../../store/authStore';
import { useSyncStore } from '../../store/syncStore';
import { ApiService } from '../../services/api';
import type { Dashboard, Invoice } from '../../types';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const isOnline = useSyncStore(s => s.isOnline);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
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
      // Silent fail - data stays as is
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
  }, [fetchData]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const userName = user?.name || 'User';

  const todaySales = dashboard?.todaySales ?? 0;
  const outstanding = dashboard?.outstandingAmount ?? 0;
  const monthlySales = dashboard?.monthlySales ?? 0;

  const trendData = (dashboard?.salesTrend || []).slice(-7);
  const chartData = {
    labels: trendData.map(d => { const date = new Date(d.date); return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()]; }),
    datasets: [{ data: trendData.length > 0 ? trendData.map(d => d.amount) : [0, 0, 0, 0, 0, 0, 0], color: () => Colors.primary, strokeWidth: 2 }],
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {!isOnline && (
          <View style={styles.offlineCard}>
            <Icon name="wifi-off" size={20} color={Colors.warning} />
            <Text style={styles.offlineText}>You are offline. Data may be outdated.</Text>
          </View>
        )}

        <Text style={styles.greeting}>{greeting},</Text>
        <Text style={styles.userName}>{userName}</Text>

        <View style={styles.widgetsRow}>
          {[
            { label: "Today's Sales", value: todaySales, icon: 'cash-multiple', color: Colors.primary, bgColor: Colors.primaryLight + '20' },
            { label: 'Outstanding', value: outstanding, icon: 'account-clock', color: Colors.error, bgColor: Colors.errorLight },
            { label: 'Monthly Sales', value: monthlySales, icon: 'chart-line', color: Colors.info, bgColor: Colors.infoLight },
          ].map((widget, index) => (
            <TouchableOpacity key={index} style={styles.widget} activeOpacity={0.7}>
              <View style={[styles.widgetIcon, { backgroundColor: widget.bgColor }]}>
                <Icon name={widget.icon} size={24} color={widget.color} />
              </View>
              <Text style={styles.widgetValue}>{formatCurrency(widget.value)}</Text>
              <Text style={styles.widgetLabel}>{widget.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Card style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Sales Trend</Text>
          <LineChart
            data={chartData}
            width={screenWidth - 64}
            height={180}
            yAxisLabel="₹"
            chartConfig={{
              backgroundColor: Colors.surface,
              backgroundGradientFrom: Colors.surface,
              backgroundGradientTo: Colors.surface,
              decimalPlaces: 0,
              color: () => Colors.primary,
              labelColor: () => Colors.textSecondary,
              propsForDots: { r: '4', strokeWidth: '2', stroke: Colors.primaryLight },
              propsForBackgroundLines: { strokeDasharray: '3 3', stroke: Colors.divider },
            }}
            style={styles.chart}
            bezier
            fromZero
          />
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={() => router.push('/billing')}>
              <View style={[styles.actionIcon, { backgroundColor: Colors.primary + '20' }]}>
                <Icon name="cart-plus" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.actionLabel}>New Sale</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={() => router.push('/add-party')}>
              <View style={[styles.actionIcon, { backgroundColor: Colors.successLight }]}>
                <Icon name="account-plus" size={24} color={Colors.success} />
              </View>
              <Text style={styles.actionLabel}>Add Party</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={() => router.push('/add-payment')}>
              <View style={[styles.actionIcon, { backgroundColor: Colors.warningLight }]}>
                <Icon name="cash-plus" size={24} color={Colors.warning} />
              </View>
              <Text style={styles.actionLabel}>Add Payment</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => router.push('/invoices')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentInvoices.length > 0 ? recentInvoices.map((inv) => (
            <TouchableOpacity key={inv.id} style={styles.txnCard} activeOpacity={0.7}>
              <View style={styles.txnLeft}>
                <View style={[styles.txnIndicator, {
                  backgroundColor: inv.paymentStatus === 'PAID' ? Colors.successLight : Colors.errorLight
                }]}>
                  <Icon name="cart-outline" size={18}
                    color={inv.paymentStatus === 'PAID' ? Colors.success : Colors.error} />
                </View>
                <View style={styles.txnInfo}>
                  <Text style={styles.txnParty}>Invoice #{inv.invoiceNo}</Text>
                  <Text style={styles.txnDate}>{formatDate(inv.date)}</Text>
                </View>
              </View>
              <View style={styles.txnRight}>
                <Text style={[styles.txnAmount, { color: Colors.success }]}>
                  +{formatCurrency(inv.grandTotal ?? 0)}
                </Text>
                <Text style={styles.txnStatus}>{inv.paymentStatus}</Text>
              </View>
            </TouchableOpacity>
          )) : (
            <View style={{ padding: Spacing.lg, alignItems: 'center' }}>
              <Text style={{ color: Colors.textSecondary }}>No recent transactions</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Low Stock Alerts</Text>
            <TouchableOpacity onPress={() => router.push('/inventory')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {dashboard?.lowStockItems && dashboard.lowStockItems.length > 0 ? dashboard.lowStockItems.map((item) => (
            <View key={item.id} style={styles.stockCard}>
              <View style={styles.stockInfo}>
                <Text style={styles.stockName}>{item.name}</Text>
                <Text style={styles.stockDetail}>Stock: {item.currentStock} | Min: {item.minStockLevel}</Text>
              </View>
              <View style={[styles.stockBadge, { backgroundColor: Colors.errorLight }]}>
                <Text style={[styles.stockBadgeText, { color: Colors.error }]}>Low</Text>
              </View>
            </View>
          )) : (
            <View style={{ padding: Spacing.lg, alignItems: 'center' }}>
              <Text style={{ color: Colors.textSecondary }}>All items in stock</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl, paddingTop: Spacing.md },
  offlineCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.warningLight, padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.md, gap: Spacing.sm },
  offlineText: { ...Typography.body2, color: Colors.warning, flex: 1 },
  greeting: { ...Typography.body1, color: Colors.textSecondary },
  userName: { ...Typography.h2, color: Colors.textPrimary, marginBottom: Spacing.lg },
  widgetsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  widget: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', ...Shadows.sm },
  widgetIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  widgetValue: { ...Typography.body1, fontWeight: '700', color: Colors.textPrimary, fontSize: 15 },
  widgetLabel: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', marginTop: 2 },
  chartCard: { padding: Spacing.lg, borderRadius: BorderRadius.md, marginBottom: Spacing.md, ...Shadows.sm },
  chart: { borderRadius: BorderRadius.md, marginTop: Spacing.sm },
  section: { marginBottom: Spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.sm },
  viewAll: { ...Typography.body2, color: Colors.primary, fontWeight: '600' },
  quickActions: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: { flex: 1, alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.lg, ...Shadows.sm },
  actionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  actionLabel: { ...Typography.caption, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
  txnCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: Spacing.md, marginBottom: Spacing.xs, ...Shadows.sm },
  txnLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  txnIndicator: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  txnInfo: { flex: 1 },
  txnParty: { ...Typography.body2, fontWeight: '600', color: Colors.textPrimary },
  txnDate: { ...Typography.overline, color: Colors.textDisabled },
  txnRight: { alignItems: 'flex-end' },
  txnAmount: { ...Typography.body1, fontWeight: '700' },
  txnStatus: { ...Typography.overline, color: Colors.textDisabled },
  stockCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: Spacing.md, marginBottom: Spacing.xs, ...Shadows.sm },
  stockInfo: { flex: 1 },
  stockName: { ...Typography.body2, fontWeight: '600', color: Colors.textPrimary },
  stockDetail: { ...Typography.caption, color: Colors.textSecondary },
  stockBadge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.round },
  stockBadgeText: { fontSize: 11, fontWeight: '700' },
});
