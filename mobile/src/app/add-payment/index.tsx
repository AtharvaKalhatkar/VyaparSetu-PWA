import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, Menu, ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatting';
import { ApiService } from '../../services/api';
import type { Party } from '../../types';

const PAYMENT_MODES = ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'OTHER'];

export default function AddPaymentScreen() {
  const router = useRouter();
  const { partyId } = useLocalSearchParams<{ partyId: string }>();
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [type, setType] = useState('RECEIVED');
  const [mode, setMode] = useState('CASH');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [showPartyPicker, setShowPartyPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    ApiService.party.getParties({ limit: 100 }).then(d => setParties(d?.content || [])).catch(() => {});
    if (partyId) {
      ApiService.party.getParty(partyId).then(p => setSelectedParty(p)).catch(() => {});
    }
  }, [partyId]);

  const handleSubmit = async () => {
    if (!selectedParty) { Alert.alert('Error', 'Please select a party'); return; }
    if (!amount || parseFloat(amount) <= 0) { Alert.alert('Error', 'Enter a valid amount'); return; }
    setSubmitting(true);
    try {
      await ApiService.payment.createPayment({
        partyId: selectedParty.id,
        amount: parseFloat(amount),
        type: type as 'RECEIVED' | 'PAID',
        mode,
        reference,
        notes,
        date: new Date().toISOString(),
      });
      router.back();
    } catch { Alert.alert('Error', 'Failed to record payment'); } finally { setSubmitting(false); }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Stack.Screen options={{ title: 'Record Payment', headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Icon name="close" size={24} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Record Payment</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.typeToggle}>
          <SegmentedButtons value={type} onValueChange={setType} buttons={[{ value: 'RECEIVED', label: 'Received' }, { value: 'PAID', label: 'Paid' }]} />
        </View>

        <Text style={styles.label}>Party</Text>
        <Menu visible={showPartyPicker} onDismiss={() => setShowPartyPicker(false)} anchor={
          <TouchableOpacity style={styles.picker} onPress={() => setShowPartyPicker(true)}>
            <Text style={[styles.pickerText, !selectedParty && { color: Colors.textDisabled }]}>{selectedParty?.name || 'Select party'}</Text>
            <Icon name="chevron-down" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        }>
          {parties.map(p => <Menu.Item key={p.id} onPress={() => { setSelectedParty(p); setShowPartyPicker(false); }} title={p.name} />)}
        </Menu>

        <TextInput label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" mode="outlined" style={styles.input} left={<TextInput.Affix text="₹" />} />

        <Text style={styles.label}>Payment Mode</Text>
        <View style={styles.modeGrid}>
          {PAYMENT_MODES.map(m => (
            <TouchableOpacity key={m} style={[styles.modeBtn, mode === m && styles.modeBtnActive]} onPress={() => setMode(m)}>
              <Icon name={m === 'CASH' ? 'cash' : m === 'UPI' ? 'cellphone' : m === 'BANK_TRANSFER' ? 'bank' : m === 'CHEQUE' ? 'book' : m === 'CARD' ? 'credit-card' : 'dots-horizontal'} size={20} color={mode === m ? Colors.textLight : Colors.textSecondary} />
              <Text style={[styles.modeLabel, mode === m && styles.modeLabelActive]}>{m === 'BANK_TRANSFER' ? 'Transfer' : m.charAt(0) + m.slice(1).toLowerCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput label="Reference (optional)" value={reference} onChangeText={setReference} mode="outlined" style={styles.input} />
        <TextInput label="Notes (optional)" value={notes} onChangeText={setNotes} mode="outlined" multiline numberOfLines={3} style={styles.input} />

        <Button mode="contained" style={styles.submitBtn} contentStyle={styles.submitContent} loading={submitting} disabled={submitting || !selectedParty || !amount} onPress={handleSubmit}>
          {submitting ? 'Recording...' : `Record ${type === 'RECEIVED' ? 'Receipt' : 'Payment'}`}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  scroll: { padding: Spacing.lg },
  typeToggle: { marginBottom: Spacing.lg },
  label: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.xs, marginTop: Spacing.md },
  picker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.divider },
  pickerText: { fontSize: 15, color: Colors.textPrimary },
  input: { backgroundColor: Colors.surface, marginBottom: Spacing.sm },
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  modeBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider, gap: Spacing.xs },
  modeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  modeLabel: { fontSize: 12, color: Colors.textSecondary },
  modeLabelActive: { color: Colors.textLight },
  submitBtn: { marginTop: Spacing.lg, borderRadius: BorderRadius.md },
  submitContent: { paddingVertical: Spacing.sm },
});
