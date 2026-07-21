import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, FlatList, TouchableOpacity, Text } from 'react-native';
import { TextInput, Button, SegmentedButtons, HelperText, Searchbar, Chip, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/theme';
import { calculateGst } from '../../utils/gst';
import { formatCurrency } from '../../utils/formatting';
import { validateRequired } from '../../utils/validation';
import type { Invoice, InvoiceItem, Party, PaymentMode, DiscountType } from '../../types';

interface InvoiceFormProps {
  onSubmit: (data: Partial<Invoice> & { items: Partial<InvoiceItem>[] }) => void;
  onSaveDraft?: () => void;
  onShare?: () => void;
  isLoading?: boolean;
  parties?: Party[];
}

interface LineItem {
  itemId: string;
  itemName: string;
  sku: string;
  hsnCode: string;
  quantity: number;
  rate: number;
  unit: string;
  discountPercent: number;
  discountAmount: number;
  gstRate: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  amount: number;
}

const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'BANK', label: 'Bank' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'ONLINE', label: 'Online' },
];

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  onSubmit,
  onSaveDraft,
  onShare,
  isLoading = false,
  parties = [],
}) => {
  const [partySearch, setPartySearch] = useState('');
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [showPartyPicker, setShowPartyPicker] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [discountType, setDiscountType] = useState<DiscountType>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('0');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredParties = parties.filter(p =>
    p.name.toLowerCase().includes(partySearch.toLowerCase()) ||
    p.phone.includes(partySearch)
  );

  const recalculateItem = useCallback((item: LineItem): LineItem => {
    const qty = item.quantity || 0;
    const rate = item.rate || 0;
    const grossAmount = qty * rate;
    const discAmt = item.discountPercent > 0 ? (grossAmount * item.discountPercent) / 100 : 0;
    const taxableAmount = grossAmount - discAmt;
    const tax = calculateGst(taxableAmount, item.gstRate, false);
    return {
      ...item,
      discountAmount: discAmt,
      taxableAmount,
      cgst: tax.cgst,
      sgst: tax.sgst,
      igst: tax.igst,
      amount: taxableAmount + tax.totalTax,
    };
  }, []);

  const addLineItem = () => {
    const newItem: LineItem = {
      itemId: '',
      itemName: '',
      sku: '',
      hsnCode: '',
      quantity: 1,
      rate: 0,
      unit: 'Pcs',
      discountPercent: 0,
      discountAmount: 0,
      gstRate: 18,
      taxableAmount: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      amount: 0,
    };
    setLineItems([...lineItems, recalculateItem(newItem)]);
  };

  const updateLineItem = (index: number, updates: Partial<LineItem>) => {
    const items = [...lineItems];
    items[index] = recalculateItem({ ...items[index], ...updates });
    setLineItems(items);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const lineTotalAfterDiscount = lineItems.reduce((sum, item) => sum + (item.taxableAmount ?? 0), 0);
  const discountAmount = discountType === 'PERCENTAGE'
    ? (lineTotalAfterDiscount * parseFloat(discountValue || '0')) / 100
    : parseFloat(discountValue || '0');
  const taxableAmount = Math.max(0, lineTotalAfterDiscount - discountAmount);
  const cgstTotal = lineItems.reduce((sum, item) => sum + item.cgst, 0);
  const sgstTotal = lineItems.reduce((sum, item) => sum + item.sgst, 0);
  const igstTotal = lineItems.reduce((sum, item) => sum + item.igst, 0);
  const taxAmount = cgstTotal + sgstTotal + igstTotal;
  const grandTotal = taxableAmount + taxAmount;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!selectedParty) newErrors.party = 'Please select a party';
    if (lineItems.length === 0) newErrors.items = 'Add at least one item';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const invoiceData = {
      partyId: selectedParty!.id,
      subtotal: lineTotalAfterDiscount,
      discountType,
      discountValue: parseFloat(discountValue),
      discountAmount,
      taxableAmount,
      cgstTotal,
      sgstTotal,
      igstTotal,
      taxAmount,
      total: grandTotal,
      grandTotal,
      paymentMode,
      notes: notes.trim() || undefined,
      items: lineItems.map(item => ({
        itemId: item.itemId,
        itemName: item.itemName,
        sku: item.sku,
        hsnCode: item.hsnCode,
        quantity: item.quantity,
        rate: item.rate,
        unit: item.unit,
        discountPercent: item.discountPercent,
        discountAmount: item.discountAmount,
        taxableAmount: item.taxableAmount,
        gstRate: item.gstRate,
        cgst: item.cgst,
        sgst: item.sgst,
        igst: item.igst,
        amount: item.amount,
      })),
    } as any;
    onSubmit(invoiceData);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {!selectedParty ? (
        <View style={styles.partySection}>
          <Text style={styles.sectionTitle}>Select Party</Text>
          <Searchbar
            placeholder="Search party by name or phone..."
            onChangeText={setPartySearch}
            value={partySearch}
            style={styles.searchBar}
          />
          <FlatList
            data={filteredParties}
            keyExtractor={(item) => item.id}
            style={styles.partyList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.partyItem}
                onPress={() => {
                  setSelectedParty(item);
                  setShowPartyPicker(false);
                }}
              >
                <View style={styles.partyInfo}>
                  <Text style={styles.partyName}>{item.name}</Text>
                  <Text style={styles.partyPhone}>{item.phone}</Text>
                </View>
                <Icon name="chevron-right" size={24} color={Colors.textDisabled} />
              </TouchableOpacity>
            )}
          />
          {errors.party && <HelperText type="error">{errors.party}</HelperText>}
        </View>
      ) : (
        <View style={styles.selectedParty}>
          <View style={styles.partyInfo}>
            <Text style={styles.sectionTitle}>{selectedParty.name}</Text>
            <Text style={styles.partyPhone}>{selectedParty.phone}</Text>
          </View>
          <Button
            mode="text"
            onPress={() => setSelectedParty(null)}
            textColor={Colors.secondary}
            compact
          >
            Change
          </Button>
        </View>
      )}

      <Divider style={styles.divider} />

      <View style={styles.itemsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Items</Text>
          <Button
            mode="contained-tonal"
            onPress={addLineItem}
            buttonColor={Colors.primaryLight}
            textColor={Colors.textLight}
            compact
            icon="plus"
          >
            Add Item
          </Button>
        </View>

        {lineItems.map((item, index) => (
          <View key={index} style={styles.lineItem}>
            <View style={styles.lineItemHeader}>
              <Text style={styles.lineItemNumber}>Item {index + 1}</Text>
              <TouchableOpacity onPress={() => removeLineItem(index)}>
                <Icon name="delete-outline" size={20} color={Colors.error} />
              </TouchableOpacity>
            </View>
            <TextInput
              label="Item Name"
              value={item.itemName}
              onChangeText={(v) => updateLineItem(index, { itemName: v })}
              mode="outlined"
              style={styles.itemInput}
            />
            <View style={styles.row}>
              <TextInput
                label="Qty"
                value={String(item.quantity)}
                onChangeText={(v) => updateLineItem(index, { quantity: parseFloat(v) || 0 })}
                mode="outlined"
                keyboardType="numeric"
                style={[styles.itemInput, styles.halfInput]}
              />
              <TextInput
                label="Rate"
                value={String(item.rate)}
                onChangeText={(v) => updateLineItem(index, { rate: parseFloat(v) || 0 })}
                mode="outlined"
                keyboardType="numeric"
                style={[styles.itemInput, styles.halfInput]}
              />
            </View>
            <View style={styles.row}>
              <TextInput
                label="Disc %"
                value={String(item.discountPercent)}
                onChangeText={(v) => updateLineItem(index, { discountPercent: parseFloat(v) || 0 })}
                mode="outlined"
                keyboardType="numeric"
                style={[styles.itemInput, styles.thirdInput]}
              />
              <TextInput
                label="GST %"
                value={String(item.gstRate)}
                onChangeText={(v) => updateLineItem(index, { gstRate: parseFloat(v) || 0 })}
                mode="outlined"
                keyboardType="numeric"
                style={[styles.itemInput, styles.thirdInput]}
              />
              <View style={[styles.amountBox, styles.thirdInput]}>
                <Text style={styles.amountLabel}>Amount</Text>
                <Text style={styles.amountValue}>{formatCurrency(item.amount)}</Text>
              </View>
            </View>
          </View>
        ))}
        {errors.items && <HelperText type="error">{errors.items}</HelperText>}
      </View>

      <Divider style={styles.divider} />

      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>{formatCurrency(lineTotalAfterDiscount)}</Text>
        </View>

        <View style={styles.discountRow}>
          <Text style={styles.totalLabel}>Discount</Text>
          <View style={styles.discountInput}>
            <SegmentedButtons
              value={discountType}
              onValueChange={(v) => setDiscountType(v as DiscountType)}
              buttons={[
                { value: 'PERCENTAGE', label: '%' },
                { value: 'FIXED', label: '₹' },
              ]}
              style={styles.discountType}
            />
            <TextInput
              value={discountValue}
              onChangeText={setDiscountValue}
              mode="outlined"
              keyboardType="numeric"
              style={styles.discountValue}
            />
          </View>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Taxable Amount</Text>
          <Text style={styles.totalValue}>{formatCurrency(taxableAmount)}</Text>
        </View>

        {cgstTotal > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>CGST</Text>
            <Text style={styles.totalValue}>{formatCurrency(cgstTotal)}</Text>
          </View>
        )}
        {sgstTotal > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>SGST</Text>
            <Text style={styles.totalValue}>{formatCurrency(sgstTotal)}</Text>
          </View>
        )}
        {igstTotal > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>IGST</Text>
            <Text style={styles.totalValue}>{formatCurrency(igstTotal)}</Text>
          </View>
        )}

        <View style={[styles.totalRow, styles.grandTotalRow]}>
          <Text style={styles.grandTotalLabel}>Grand Total</Text>
          <Text style={styles.grandTotalValue}>{formatCurrency(grandTotal)}</Text>
        </View>
      </View>

      <Divider style={styles.divider} />

      <Text style={styles.sectionTitle}>Payment Mode</Text>
      <SegmentedButtons
        value={paymentMode}
        onValueChange={(v) => setPaymentMode(v as PaymentMode)}
        buttons={PAYMENT_MODES.map(({ value, label }) => ({ value, label }))}
        style={styles.paymentSegment}
      />

      <TextInput
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.input}
      />

      <View style={styles.actionButtons}>
        {onSaveDraft && (
          <Button
            mode="outlined"
            onPress={onSaveDraft}
            style={styles.actionButton}
            textColor={Colors.textSecondary}
            icon="content-save-outline"
          >
            Save Draft
          </Button>
        )}
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.actionButton}
          buttonColor={Colors.primary}
          loading={isLoading}
          disabled={isLoading}
          icon="check"
        >
          Create Invoice
        </Button>
      </View>

      {onShare && (
        <Button
          mode="contained-tonal"
          onPress={onShare}
          style={styles.shareButton}
          buttonColor={Colors.successLight}
          textColor={Colors.success}
          icon="whatsapp"
        >
          Share via WhatsApp
        </Button>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  searchBar: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
  },
  partySection: {
    marginBottom: Spacing.lg,
  },
  partyList: {
    maxHeight: 200,
  },
  partyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
    ...Shadows.sm,
  },
  partyInfo: {
    flex: 1,
  },
  partyName: {
    ...Typography.body1,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  partyPhone: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  selectedParty: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.successLight,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  divider: {
    marginVertical: Spacing.lg,
  },
  itemsSection: {
    marginBottom: Spacing.lg,
  },
  lineItem: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  lineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  lineItemNumber: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  itemInput: {
    marginBottom: Spacing.xs,
    backgroundColor: Colors.surface,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  thirdInput: {
    flex: 1,
  },
  amountBox: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.infoLight,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  amountLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  amountValue: {
    ...Typography.body2,
    fontWeight: '700',
    color: Colors.info,
  },
  totalsSection: {
    marginBottom: Spacing.lg,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  totalLabel: {
    ...Typography.body2,
    color: Colors.textSecondary,
  },
  totalValue: {
    ...Typography.body2,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  discountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  discountType: {
    width: 100,
  },
  discountValue: {
    width: 80,
    backgroundColor: Colors.surface,
  },
  grandTotalRow: {
    paddingVertical: Spacing.md,
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
    marginTop: Spacing.sm,
  },
  grandTotalLabel: {
    ...Typography.h3,
    color: Colors.primary,
  },
  grandTotalValue: {
    ...Typography.h3,
    color: Colors.primary,
  },
  paymentSegment: {
    marginBottom: Spacing.lg,
  },
  input: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  actionButton: {
    flex: 1,
    borderRadius: BorderRadius.md,
  },
  shareButton: {
    marginBottom: Spacing.xxxl,
    borderRadius: BorderRadius.md,
  },
});
