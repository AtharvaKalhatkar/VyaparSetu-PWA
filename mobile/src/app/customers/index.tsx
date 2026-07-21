import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Text, Searchbar, FAB } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/theme';
import { OfflineBanner } from '../../components/common/OfflineBanner';
import { EmptyState } from '../../components/common/EmptyState';
import { formatCurrency, formatPhone } from '../../utils/formatting';
import { ApiService } from '../../services/api';
import type { Party } from '../../types';

export default function CustomersScreen() {
  const router = useRouter();
  const [parties, setParties] = useState<Party[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchParties = useCallback(async () => {
    try {
      const data = await ApiService.party.getParties({ limit: 100, type: 'CUSTOMER', sort: 'name', order: 'asc' });
      setParties(data?.content || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchParties(); }, [fetchParties]);

  const filtered = parties.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.phone || '').includes(search));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Stack.Screen options={{ title: 'Customers', headerShown: false }} />
      <OfflineBanner />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Icon name="arrow-left" size={24} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Customers</Text>
        <TouchableOpacity onPress={() => router.push('/add-party')}><Icon name="account-plus" size={24} color={Colors.primary} /></TouchableOpacity>
      </View>
      <Searchbar placeholder="Search customers..." value={search} onChangeText={setSearch} style={styles.searchBar} />
      {loading ? <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View> : (
        <FlatList data={filtered} keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchParties(); }} colors={[Colors.primary]} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} activeOpacity={0.7}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text></View>
              <View style={styles.info}><Text style={styles.name}>{item.name}</Text><Text style={styles.phone}>{formatPhone(item.phone || '')}</Text></View>
              <Icon name="chevron-right" size={20} color={Colors.textDisabled} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={<EmptyState icon="account-group" title="No customers" message={search ? 'Try a different search' : 'Add your first customer'} actionLabel="Add Customer" onAction={() => router.push('/add-party')} />}
        />
      )}
      <FAB icon="plus" style={styles.fab} color={Colors.textLight} onPress={() => router.push('/add-party')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  searchBar: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.md },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 80 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.sm, ...Shadows.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryLight + '20', justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  avatarText: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  phone: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  fab: { position: 'absolute', right: Spacing.lg, bottom: Spacing.lg, backgroundColor: Colors.primary, borderRadius: 28 },
});
