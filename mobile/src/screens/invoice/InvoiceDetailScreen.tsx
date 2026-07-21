import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, Divider, Chip, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/theme';
import { formatCurrency, formatDate, numberToWords } from '../../utils/formatting';
import type { Invoice, InvoiceItem } from '../../types';

const MOCK_INVOICE: Invoice = {
  id: 'inv1', businessId: 'b1', invoiceNo: 'INV-2026-0001', partyId: 'p1', type: 'SALE', status: 'CONFIRMED',
  items: [
    { id: 'ii1', invoiceId: 'inv1', itemId: 'i1', itemName: 'Premium Basmati Rice', sku: 'RICE-001', hsnCode: '1006', quantity: 50, rate: 85, unit: 'kg', discountPercent: 0, discountAmount: 0, taxableAmount: 4250, gstRate: 5, cgst: 106.25, sgst: 106.25, igst: 0, amount: 4462.50 },
    { id: 'ii2', invoiceId: 'inv1', itemId: 'i2', itemName: 'Fortune Sunflower Oil', sku: 'OIL-001', hsnCode: '1512', quantity: 10, rate: 185, unit: 'L', discountPercent: 5, discountAmount: 92.50, taxableAmount: 1757.50, gstRate: 5, cgst: 43.94, sgst: 43.94, igst: 0, amount: 1845.38 },
  ],
  subtotal: 6100, discountType: 'PERCENTAGE', discountValue: 0, discountAmount: 0,
  taxableAmount: 6007.50, cgstTotal: 150.19, sgstTotal: 150.19, igstTotal: 0, taxAmount: 300.38, total: 6307.88, roundOff: -0.12, grandTotal: 6308,
  paymentMode: 'CASH', paymentStatus: 'PAID', paidAmount: 6308, dueAmount: 0,
  notes: 'Deliver before 10 AM', terms: 'Payment due within 30 days',
  isIrnGenerated: false,
  date: '2026-07-01', createdBy: 'u1', createdAt: '', updatedAt: '',
  party: { id: 'p1', businessId: 'b1', name: 'Sharma General Store', phone: '9876543210', type: 'CUSTOMER', creditLimit: 50000, creditDays: 30, openingBalance: 25000, balanceType: 'DEBIT', isActive: true, tags: [], address: { line1: '123, Main Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', country: 'India' }, createdAt: '', updatedAt: '' },
};

export const InvoiceDetailScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const invoice = MOCK_INVOICE;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return Colors.success;
      case 'CONFIRMED': return Colors.info;
      case 'DRAFT': return Colors.warning;
      case 'CANCELLED': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  const handleShare = () => {
    Alert.alert('Share', 'Share PDF via WhatsApp or other apps');
  };

  const handlePrint = () => {
    Alert.alert('Print', 'Sending to printer...');
  };

  const handleCancel = () => {
    Alert.alert('Cancel Invoice', 'Are you sure you want to cancel this invoice?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', style: 'destructive', onPress: () => {} },
    ]);
  };

  const handleDuplicate = () => {
    Alert.alert('Duplicate', 'Creating a copy of this invoice');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.invoiceHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.invoiceNo}>{invoice.invoiceNo}</Text>
            <Text style={styles.invoiceDate}>{formatDate(invoice.date)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invoice.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(invoice.status) }]}>{invoice.status}</Text>
          </View>
        </View>

        <View style={styles.partySection}>
          <Text style={styles.sectionLabel}>Bill To</Text>
          <Text style={styles.partyName}>{invoice.party?.name}</Text>
          <Text style={styles.partyDetail}>{invoice.party?.address?.line1}</Text>
          <Text style={styles.partyDetail}>{invoice.party?.address?.city}, {invoice.party?.address?.state} - {invoice.party?.address?.pincode}</Text>
          <Text style={styles.partyDetail}>GSTIN: {invoice.party?.gstin || 'N/A'}</Text>
          <Text style={styles.partyDetail}>Phone: {invoice.party?.phone}</Text>
        </View>

        <View style={styles.itemsSection}>
          <View style={styles.itemsHeader}>
            <Text style={[styles.colItem, { flex: 3 }]}>Item</Text>
            <Text style={styles.colItem}>Qty</Text>
            <Text style={styles.colItem}>Rate</Text>
            <Text style={[styles.colItem, { flex: 2, textAlign: 'right' }]}>Amount</Text>
          </View>
          <Divider />
          {invoice.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={[styles.itemName, { flex: 3 }]}>{item.itemName}</Text>
              <Text style={styles.itemQty}>{item.quantity} {item.unit}</Text>
              <Text style={styles.itemRate}>{formatCurrency(item.rate)}</Text>
              <Text style={[styles.itemAmount, { flex: 2, textAlign: 'right' }]}>{formatCurrency(item.amount)}</Text>
            </View>
          ))}
        </View>

        <Card style={styles.totalsCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          {invoice.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={[styles.totalValue, { color: Colors.error }]}>-{formatCurrency(invoice.discountAmount)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Taxable Amount</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.taxableAmount)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>CGST</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.cgstTotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>SGST</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.sgstTotal)}</Text>
          </View>
          {invoice.igstTotal > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>IGST</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.igstTotal)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Tax</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.taxAmount)}</Text>
          </View>
          {invoice.roundOff !== 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Round Off</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.roundOff)}</Text>
            </View>
          )}
          <Divider />
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(invoice.grandTotal)}</Text>
          </View>
        </Card>

        <View style={styles.amountWords}>
          <Icon name="text" size={16} color={Colors.primary} />
          <Text style={styles.amountWordsText}>{numberToWords(invoice.grandTotal)}</Text>
        </View>

        <View style={styles.paymentInfo}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment Mode</Text>
            <Chip icon={invoice.paymentMode === 'CASH' ? 'cash' : 'bank'} style={styles.paymentChip}>{invoice.paymentMode}</Chip>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment Status</Text>
            <Text style={[styles.paymentValue, { color: getStatusColor(invoice.paymentStatus) }]}>{invoice.paymentStatus}</Text>
          </View>
          {invoice.dueAmount > 0 && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Due Amount</Text>
              <Text style={[styles.paymentValue, { color: Colors.error }]}>{formatCurrency(invoice.dueAmount)}</Text>
            </View>
          )}
        </View>

        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {invoice.terms && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionLabel}>Terms</Text>
            <Text style={styles.notesText}>{invoice.terms}</Text>
          </View>
        )}

        {invoice.irn && (
          <View style={styles.irnSection}>
            <Text style={styles.sectionLabel}>IRN</Text>
            <Text style={styles.irnText}>{invoice.irn}</Text>
          </View>
        )}

        <View style={styles.actionBar}>
          <Button
            mode="contained"
            buttonColor={Colors.success}
            icon="share-variant"
            style={styles.actionBtn}
            onPress={handleShare}
          >
            Share
          </Button>
          <Button
            mode="outlined"
            icon="printer"
            style={styles.actionBtn}
            onPress={handlePrint}
            textColor={Colors.primary}
          >
            Print
          </Button>
          <Button
            mode="outlined"
            icon="cancel"
            style={styles.actionBtn}
            onPress={handleCancel}
            textColor={Colors.error}
          >
            Cancel
          </Button>
          <Button
            mode="outlined"
            icon="content-copy"
            style={styles.actionBtn}
            onPress={handleDuplicate}
            textColor={Colors.textSecondary}
          >
            Copy
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.huge },
  invoiceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  headerLeft: {},
  invoiceNo: { ...Typography.h2, color: Colors.textPrimary },
  invoiceDate: { ...Typography.body2, color: Colors.textSecondary, marginTop: Spacing.xxs },
  statusBadge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.round },
  statusText: { ...Typography.caption, fontWeight: '700' },
  partySection: { marginBottom: Spacing.lg, padding: Spacing.lg, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, ...Shadows.sm },
  sectionLabel: { ...Typography.overline, color: Colors.textSecondary, marginBottom: Spacing.sm },
  partyName: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.xs },
  partyDetail: { ...Typography.body2, color: Colors.textSecondary, lineHeight: 20 },
  itemsSection: { marginBottom: Spacing.lg, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, ...Shadows.sm },
  itemsHeader: { flexDirection: 'row', paddingVertical: Spacing.sm },
  colItem: { fontSize: 11, fontWeight: '700', color: Colors.textDisabled, flex: 1, textAlign: 'center' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  itemName: { ...Typography.body2, fontWeight: '500', color: Colors.textPrimary, flex: 1 },
  itemQty: { ...Typography.caption, color: Colors.textSecondary, flex: 1, textAlign: 'center' },
  itemRate: { ...Typography.caption, color: Colors.textSecondary, flex: 1, textAlign: 'center' },
  itemAmount: { ...Typography.body2, fontWeight: '600', color: Colors.textPrimary, flex: 1, textAlign: 'right' },
  totalsCard: { marginBottom: Spacing.lg, borderRadius: BorderRadius.md, ...Shadows.sm },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  totalLabel: { ...Typography.body2, color: Colors.textSecondary },
  totalValue: { ...Typography.body2, fontWeight: '600', color: Colors.textPrimary },
  grandTotalRow: { paddingVertical: Spacing.md },
  grandTotalLabel: { ...Typography.h3, color: Colors.primary },
  grandTotalValue: { ...Typography.h3, color: Colors.primary },
  amountWords: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg, padding: Spacing.md, backgroundColor: Colors.infoLight, borderRadius: BorderRadius.md },
  amountWordsText: { ...Typography.body2, color: Colors.info, flex: 1, fontStyle: 'italic' },
  paymentInfo: { marginBottom: Spacing.lg, padding: Spacing.lg, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, ...Shadows.sm },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  paymentLabel: { ...Typography.body2, color: Colors.textSecondary },
  paymentChip: { backgroundColor: Colors.infoLight },
  paymentValue: { ...Typography.body1, fontWeight: '600' },
  notesSection: { marginBottom: Spacing.lg, padding: Spacing.lg, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, ...Shadows.sm },
  notesText: { ...Typography.body2, color: Colors.textPrimary, lineHeight: 20 },
  irnSection: { marginBottom: Spacing.lg, padding: Spacing.lg, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, ...Shadows.sm },
  irnText: { ...Typography.caption, color: Colors.textSecondary },
  actionBar: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  actionBtn: { flex: 1, minWidth: 140, borderRadius: BorderRadius.md },
});
