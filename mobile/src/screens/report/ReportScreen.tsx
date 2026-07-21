import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Text, Button, Card, SegmentedButtons, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-chart-kit';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/theme';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { EmptyState } from '../../components/common/EmptyState';

const screenWidth = Dimensions.get('window').width;

interface ReportType {
  key: string;
  label: string;
  icon: string;
  color: string;
}

const REPORT_TYPES: ReportType[] = [
  { key: 'sales', label: 'Sales', icon: 'chart-line', color: Colors.primary },
  { key: 'purchase', label: 'Purchase', icon: 'truck', color: Colors.secondary },
  { key: 'outstanding', label: 'Outstanding', icon: 'cash-multiple', color: Colors.error },
  { key: 'stock', label: 'Stock', icon: 'package-variant', color: Colors.info },
  { key: 'gst', label: 'GST', icon: 'file-document', color: Colors.warning },
  { key: 'pnl', label: 'P&L', icon: 'trending-up', color: Colors.success },
];

const MOCK_SALES_DATA = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [{ data: [45000, 62000, 38000, 71000, 55000, 89000, 43000] }],
};

export const ReportScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [selectedReport, setSelectedReport] = useState<string>('sales');
  const [dateRange, setDateRange] = useState<'7' | '30' | '90' | '365'>('7');

  const currentReport = REPORT_TYPES.find(r => r.key === selectedReport);

  const handleExport = () => {
    Alert.alert('Export', 'Choose export format', [
      { text: 'PDF', onPress: () => Alert.alert('Exporting PDF...') },
      { text: 'Excel', onPress: () => Alert.alert('Exporting Excel...') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleShare = () => {
    Alert.alert('Share', 'Sharing report...');
  };

  const getReportContent = () => {
    switch (selectedReport) {
      case 'sales':
        return (
          <>
            <Card style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Sales</Text>
                  <Text style={styles.summaryValue}>₹3,63,000</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Invoices</Text>
                  <Text style={styles.summaryValue}>47</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Avg. Value</Text>
                  <Text style={styles.summaryValue}>₹7,723</Text>
                </View>
              </View>
            </Card>
            <Card style={styles.chartCard}>
              <Text style={styles.chartTitle}>Sales Trend</Text>
              <BarChart
                data={MOCK_SALES_DATA}
                width={screenWidth - 64}
                height={220}
                yAxisLabel="₹"
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: Colors.surface,
                  backgroundGradientFrom: Colors.surface,
                  backgroundGradientTo: Colors.surface,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(27, 94, 32, ${opacity})`,
                  labelColor: () => Colors.textSecondary,
                  propsForBackgroundLines: { strokeDasharray: '3 3', stroke: Colors.divider },
                  barPercentage: 0.6,
                }}
                style={styles.chart}
                fromZero
              />
            </Card>
            <Card style={styles.detailsCard}>
              <Text style={styles.chartTitle}>Top Products</Text>
              {[
                { name: 'Basmati Rice', qty: 250, amount: 21250 },
                { name: 'Sunflower Oil', qty: 120, amount: 22200 },
                { name: 'LED Bulbs', qty: 85, amount: 10200 },
              ].map((product, i) => (
                <View key={i} style={styles.productRow}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productQty}>{product.qty} units</Text>
                  <Text style={styles.productAmount}>{formatCurrency(product.amount)}</Text>
                </View>
              ))}
            </Card>
          </>
        );
      case 'outstanding':
        return (
          <Card style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Outstanding</Text>
                <Text style={[styles.summaryValue, { color: Colors.error }]}>₹1,25,000</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Overdue</Text>
                <Text style={[styles.summaryValue, { color: Colors.error }]}>₹45,000</Text>
              </View>
            </View>
          </Card>
        );
      case 'gst':
        return (
          <Card style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Output GST</Text>
                <Text style={styles.summaryValue}>₹32,400</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Input GST</Text>
                <Text style={styles.summaryValue}>₹18,200</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Net Payable</Text>
                <Text style={[styles.summaryValue, { color: Colors.error }]}>₹14,200</Text>
              </View>
            </View>
          </Card>
        );
      default:
        return (
          <EmptyState
            icon="chart-bar"
            title="Report data"
            message="Select a date range to view report"
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleExport}>
            <Icon name="export-variant" size={24} color={Colors.primary} style={styles.headerIcon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare}>
            <Icon name="share-variant" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.reportGrid}>
        {REPORT_TYPES.map(report => (
          <TouchableOpacity
            key={report.key}
            style={[
              styles.reportItem,
              selectedReport === report.key && { backgroundColor: report.color + '15', borderColor: report.color },
            ]}
            onPress={() => setSelectedReport(report.key)}
            activeOpacity={0.7}
          >
            <View style={[styles.reportIcon, { backgroundColor: report.color + '20' }]}>
              <Icon name={report.icon} size={24} color={report.color} />
            </View>
            <Text style={[styles.reportLabel, selectedReport === report.key && { color: report.color }]}>
              {report.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SegmentedButtons
        value={dateRange}
        onValueChange={(v) => setDateRange(v as '7' | '30' | '90' | '365')}
        buttons={[
          { value: '7', label: '7 Days' },
          { value: '30', label: '30 Days' },
          { value: '90', label: '90 Days' },
          { value: '365', label: '1 Year' },
        ]}
        style={styles.dateRange}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {getReportContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { ...Typography.h2, color: Colors.textPrimary },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headerIcon: { marginRight: Spacing.lg },
  reportGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md },
  reportItem: { width: (screenWidth - 56) / 3, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 2, borderColor: 'transparent', ...Shadows.sm },
  reportIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  reportLabel: { ...Typography.caption, fontWeight: '600', color: Colors.textSecondary, textAlign: 'center' },
  dateRange: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  summaryCard: { marginBottom: Spacing.md, borderRadius: BorderRadius.md, ...Shadows.sm },
  summaryRow: { flexDirection: 'row', padding: Spacing.lg },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 50, backgroundColor: Colors.divider, marginHorizontal: Spacing.md },
  summaryLabel: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.xs },
  summaryValue: { ...Typography.h4, fontWeight: '700', color: Colors.textPrimary },
  chartCard: { marginBottom: Spacing.md, padding: Spacing.lg, borderRadius: BorderRadius.md, ...Shadows.sm },
  chartTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.md },
  chart: { borderRadius: BorderRadius.md },
  detailsCard: { marginBottom: Spacing.md, padding: Spacing.lg, borderRadius: BorderRadius.md, ...Shadows.sm },
  productRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  productName: { ...Typography.body2, color: Colors.textPrimary, flex: 1 },
  productQty: { ...Typography.caption, color: Colors.textSecondary, marginHorizontal: Spacing.md },
  productAmount: { ...Typography.body2, fontWeight: '600', color: Colors.textPrimary },
});
