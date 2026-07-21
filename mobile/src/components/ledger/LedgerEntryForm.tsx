import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, SegmentedButtons, HelperText, Text, useTheme } from 'react-native-paper';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { validateRequired, validateAmount } from '../../utils/validation';
import type { LedgerEntry, PaymentMode, LedgerEntryType } from '../../types';

interface LedgerEntryFormProps {
  initialValues?: Partial<LedgerEntry>;
  onSubmit: (data: Partial<LedgerEntry>) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK', label: 'Bank' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'OTHER', label: 'Other' },
];

const ENTRY_TYPES: { value: LedgerEntryType; label: string }[] = [
  { value: 'PAYMENT', label: 'Payment' },
  { value: 'RECEIPT', label: 'Receipt' },
  { value: 'ADJUSTMENT', label: 'Adjust' },
];

export const LedgerEntryForm: React.FC<LedgerEntryFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [amount, setAmount] = useState(String(initialValues?.amount || ''));
  const [entryType, setEntryType] = useState<LedgerEntryType>(initialValues?.type || 'PAYMENT');
  const [mode, setMode] = useState<PaymentMode>(initialValues?.mode || 'CASH');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [reference, setReference] = useState(initialValues?.reference || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const amountCheck = validateAmount(parseFloat(amount));
    if (!amountCheck.valid) newErrors.amount = amountCheck.message!;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      amount: parseFloat(amount),
      type: entryType,
      mode,
      description: description.trim(),
      reference: reference.trim() || undefined,
      balanceType: entryType === 'RECEIPT' ? 'CREDIT' : 'DEBIT',
    });
  };

  const isReceipt = entryType === 'RECEIPT';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <SegmentedButtons
        value={entryType}
        onValueChange={(val) => setEntryType(val as LedgerEntryType)}
        buttons={ENTRY_TYPES.map(({ value, label }) => ({ value, label }))}
        style={styles.segment}
      />

      <TextInput
        label={`Amount (${isReceipt ? 'Received' : 'Paid'}) *`}
        value={amount}
        onChangeText={setAmount}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
        error={!!errors.amount}
        left={<TextInput.Affix text="₹" />}
      />
      {errors.amount && <HelperText type="error">{errors.amount}</HelperText>}

      <View style={styles.amountIndicator}>
        <View style={[styles.badge, isReceipt ? styles.creditBadge : styles.debitBadge]}>
          <HelperText type="info" style={styles.badgeText}>
            {isReceipt ? 'CREDIT (You Receive)' : 'DEBIT (You Pay)'}
          </HelperText>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Payment Mode</Text>
      <SegmentedButtons
        value={mode}
        onValueChange={(val) => setMode(val as PaymentMode)}
        buttons={PAYMENT_MODES.map(({ value, label }) => ({ value, label }))}
        style={styles.modeSegment}
      />

      <TextInput
        label="Description / Notes"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.input}
      />

      <TextInput
        label="Reference No. (Optional)"
        value={reference}
        onChangeText={setReference}
        mode="outlined"
        style={styles.input}
      />

      <View style={styles.buttons}>
        {onCancel && (
          <Button
            mode="outlined"
            onPress={onCancel}
            style={styles.button}
            textColor={Colors.textSecondary}
          >
            Cancel
          </Button>
        )}
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.button}
          buttonColor={Colors.primary}
          loading={isLoading}
          disabled={isLoading}
        >
          Save Entry
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  input: {
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  segment: {
    marginVertical: Spacing.lg,
  },
  modeSegment: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  amountIndicator: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  badge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
  },
  creditBadge: {
    backgroundColor: Colors.successLight,
  },
  debitBadge: {
    backgroundColor: Colors.errorLight,
  },
  badgeText: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xxxl,
  },
  button: {
    flex: 1,
    borderRadius: BorderRadius.md,
  },
});
