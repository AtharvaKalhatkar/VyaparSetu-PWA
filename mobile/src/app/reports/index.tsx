import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Text, Card } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { BarChart } from 'react-native-chart-kit';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatting';
import { ApiService } from '../../services/api';

const screenWidth = Dimensions.get('window').width;

const REPORT_TYPES = [
  { key: 'sales', label: 'Sales Report', icon: 'chart-line', color: Colors.primary },
  { key: 'purchase', label: 'Purchase Report', icon: 'truck', color: Colors.info },
  { key: 'outstanding', label: 'Outstanding', icon: 'account-clock', color: Colors.error },
  { key: 'stock', label: 'Stock Report', icon: 'package-variant', color: Colors.warning },
  { key: 'gst', label: 'GST Report', icon: 'file-document', color: Colors.success },
];

export default function ReportsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    ApiService.report.getSalesReport({ period: 'weekly' })
      .then(data => {
        if (data?.dailySales?.length) setSalesData(data.dailySales.slice(0, 7).map(d => d.amount || 0));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Stack.Screen options={{ title: 'Reports', headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Icon name="arrow-left" size={24} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Reports</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Weekly Sales</Text>
          {loading ? <ActivityIndicator size="small" color={Colors.primary} style={{ margin: 40 }} /> : (
            <BarChart data={{ labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], datasets: [{ data: salesData }] }}
              width={screenWidth - 64} height={180}               yAxisLabel="₹" yAxisSuffix="" chartConfig={{
                backgroundColor: Colors.surface, backgroundGradientFrom: Colors.surface, backgroundGradientTo: Colors.surface,
                decimalPlaces: 0, color: () => Colors.primary, labelColor: () => Colors.textSecondary,
                barPercentage: 0.6, propsForBackgroundLines: { strokeDasharray: '3 3', stroke: Colors.divider },
              }} style={{ borderRadius: BorderRadius.md }} fromZero />
          )}
        </Card>

        <Text style={styles.sectionTitle}>Reports</Text>
        <View style={styles.grid}>
          {REPORT_TYPES.map((rpt) => (
            <TouchableOpacity key={rpt.key} style={styles.reportCard} activeOpacity={0.7}>
              <View style={[styles.reportIcon, { backgroundColor: rpt.color + '20' }]}>
                <Icon name={rpt.icon} size={28} color={rpt.color} />
              </View>
              <Text style={styles.reportLabel}>{rpt.label}</Text>
              <Icon name="chevron-right" size={18} color={Colors.textDisabled} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  scroll: { padding: Spacing.lg },
  chartCard: { padding: Spacing.lg, borderRadius: BorderRadius.md, marginBottom: Spacing.lg, ...Shadows.sm },
  chartTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  grid: { gap: Spacing.sm },
  reportCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.lg, ...Shadows.sm },
  reportIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  reportLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
});
