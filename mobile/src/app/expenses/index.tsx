import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Text, Searchbar, FAB, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { OfflineBanner } from '../../components/common/OfflineBanner';
import { EmptyState } from '../../components/common/EmptyState';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { ApiService } from '../../services/api';
import type { Expense } from '../../types';

const CATEGORIES = ['All', 'Office', 'Travel', 'Utilities', 'Salary', 'Marketing', 'Other'];

export default function ExpensesScreen() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExpenses = useCallback(async () => {
    try {
      const data = await ApiService.expense.getExpenses({ limit: 100, sort: 'date', order: 'desc' });
      setExpenses(data?.content || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);
  const filtered = expenses.filter(e => (category === 'All' || e.category === category) && e.description?.toLowerCase().includes(search.toLowerCase()));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Stack.Screen options={{ title: 'Expenses', headerShown: false }} />
      <OfflineBanner />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Icon name="arrow-left" size={24} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Expenses</Text>
        <Text style={styles.total}>{formatCurrency(expenses.reduce((s, e) => s + e.amount, 0))}</Text>
      </View>
      <Searchbar placeholder="Search expenses..." value={search} onChangeText={setSearch} style={styles.searchBar} />
      <FlatList horizontal data={CATEGORIES} keyExtractor={c => c} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} renderItem={({ item }) => (
        <Chip selected={category === item} onPress={() => setCategory(item)} style={[styles.chip, category === item && styles.activeChip]} textStyle={category === item ? styles.activeChipText : styles.chipText}>{item}</Chip>
      )} />
      {loading ? <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View> : (
        <FlatList data={filtered} keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchExpenses(); }} colors={[Colors.primary]} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} activeOpacity={0.7}>
              <View style={styles.cardLeft}>
                <View style={styles.catIcon}><Icon name={item.category === 'Salary' ? 'cash' : item.category === 'Travel' ? 'car' : 'wallet'} size={22} color={Colors.textSecondary} /></View>
                <View><Text style={styles.desc}>{item.description || 'Expense'}</Text><Text style={styles.date}>{formatDate(item.date)}</Text></View>
              </View>
              <Text style={styles.amount}>-{formatCurrency(item.amount)}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<EmptyState icon="wallet-outline" title="No expenses" message={search || category !== 'All' ? 'Try a different filter' : 'Record your first expense'} actionLabel="Add Expense" onAction={() => router.push('/add-entry')} />}
        />
      )}
      <FAB icon="plus" style={styles.fab} color={Colors.textLight} onPress={() => router.push('/add-entry?type=expense')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  total: { fontSize: 16, fontWeight: '700', color: Colors.error },
  searchBar: { marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, backgroundColor: Colors.surface, borderRadius: BorderRadius.md },
  chips: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md, gap: Spacing.sm },
  chip: { backgroundColor: Colors.surface },
  activeChip: { backgroundColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontSize: 12 },
  activeChipText: { color: Colors.textLight, fontSize: 12 },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 80 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.sm, ...Shadows.sm },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  catIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  desc: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  date: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '700', color: Colors.error },
  fab: { position: 'absolute', right: Spacing.lg, bottom: Spacing.lg, backgroundColor: Colors.accent, borderRadius: 28 },
});
