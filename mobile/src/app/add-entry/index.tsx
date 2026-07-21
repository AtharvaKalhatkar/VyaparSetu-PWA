import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, TextInput, Button, Menu, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatting';
import { ApiService } from '../../services/api';
import type { Party } from '../../types';

const EXPENSE_CATEGORIES = ['Office', 'Travel', 'Utilities', 'Salary', 'Marketing', 'Rent', 'Maintenance', 'Other'];

export default function AddEntryScreen() {
  const router = useRouter();
  const { type: initialType } = useLocalSearchParams<{ type: string }>();
  const [entryType, setEntryType] = useState(initialType === 'expense' ? 'EXPENSE' : 'INCOME');
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [category, setCategory] = useState('Other');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [showPartyPicker, setShowPartyPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    ApiService.party.getParties({ limit: 100 }).then(d => setParties(d?.content || [])).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) { Alert.alert('Error', 'Enter a valid amount'); return; }
    setSubmitting(true);
    try {
      await ApiService.transaction.createTransaction({
        type: entryType,
        amount: parseFloat(amount),
        category,
        description,
        partyId: selectedParty?.id,
        date: new Date().toISOString(),
      });
      router.back();
    } catch { Alert.alert('Error', 'Failed to record entry'); } finally { setSubmitting(false); }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Stack.Screen options={{ title: 'Add Entry', headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Icon name="close" size={24} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Add Entry</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.typeToggle}>
          <SegmentedButtons value={entryType} onValueChange={setEntryType} buttons={[{ value: 'INCOME', label: 'Income' }, { value: 'EXPENSE', label: 'Expense' }]} />
        </View>

        {entryType === 'EXPENSE' && (
          <>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryGrid}>
              {EXPENSE_CATEGORIES.map(c => (
                <TouchableOpacity key={c} style={[styles.catBtn, category === c && styles.catBtnActive]} onPress={() => setCategory(c)}>
                  <Text style={[styles.catText, category === c && styles.catTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Text style={styles.label}>Party (optional)</Text>
        <Menu visible={showPartyPicker} onDismiss={() => setShowPartyPicker(false)} anchor={
          <TouchableOpacity style={styles.picker} onPress={() => setShowPartyPicker(true)}>
            <Text style={[styles.pickerText, !selectedParty && { color: Colors.textDisabled }]}>{selectedParty?.name || 'Select party'}</Text>
            <Icon name="chevron-down" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        }>
          {parties.map(p => <Menu.Item key={p.id} onPress={() => { setSelectedParty(p); setShowPartyPicker(false); }} title={p.name} />)}
        </Menu>

        <TextInput label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" mode="outlined" style={styles.input} left={<TextInput.Affix text="₹" />} />
        <TextInput label="Description" value={description} onChangeText={setDescription} mode="outlined" multiline numberOfLines={3} style={styles.input} />

        <Button mode="contained" style={styles.submitBtn} contentStyle={styles.submitContent}
          color={entryType === 'INCOME' ? Colors.success : Colors.accent}
          loading={submitting} disabled={submitting || !amount} onPress={handleSubmit}>
          {submitting ? 'Saving...' : `Add ${entryType === 'INCOME' ? 'Income' : 'Expense'}`}
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
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  catBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  catBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  catText: { fontSize: 13, color: Colors.textSecondary },
  catTextActive: { color: Colors.textLight, fontWeight: '600' },
  picker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.divider, marginBottom: Spacing.sm },
  pickerText: { fontSize: 15, color: Colors.textPrimary },
  input: { backgroundColor: Colors.surface, marginBottom: Spacing.sm },
  submitBtn: { marginTop: Spacing.lg, borderRadius: BorderRadius.md },
  submitContent: { paddingVertical: Spacing.sm },
});
