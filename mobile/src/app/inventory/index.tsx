import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Text, Searchbar, FAB } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/theme';
import { OfflineBanner } from '../../components/common/OfflineBanner';
import { EmptyState } from '../../components/common/EmptyState';
import { formatCurrency } from '../../utils/formatting';
import { ApiService } from '../../services/api';
import type { Item } from '../../types';

export default function InventoryScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const data = await ApiService.item.getItems({ limit: 100, sort: 'name', order: 'asc' });
      setItems(data?.content || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || (i.sku || '').toLowerCase().includes(search.toLowerCase()));

  const getStockColor = (item: Item) => {
    if (item.currentStock <= (item.minStockLevel || 0)) return Colors.error;
    if (item.currentStock <= (item.minStockLevel || 0) * 1.5) return Colors.warning;
    return Colors.success;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Stack.Screen options={{ title: 'Inventory', headerShown: false }} />
      <OfflineBanner />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Icon name="arrow-left" size={24} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Inventory</Text>
        <TouchableOpacity onPress={() => router.push('/barcode-scan')}><Icon name="barcode-scan" size={24} color={Colors.primary} /></TouchableOpacity>
      </View>

      <Searchbar placeholder="Search items..." value={search} onChangeText={setSearch} style={styles.searchBar} />

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList data={filtered} keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchItems(); }} colors={[Colors.primary]} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} activeOpacity={0.7}>
              <View style={styles.cardLeft}>
                <View style={[styles.stockDot, { backgroundColor: getStockColor(item) }]} />
                <View style={styles.cardInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemSku}>{item.sku || 'No SKU'} · {item.unit?.shortName || 'Pcs'}</Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.price}>{formatCurrency(item.sellingPrice)}</Text>
                <Text style={[styles.stock, { color: getStockColor(item) }]}>Stock: {item.currentStock}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<EmptyState icon="package-variant" title="No items" message={search ? 'Try a different search' : 'Add your first product'} actionLabel="Add Item" onAction={() => {}} />}
        />
      )}
      <FAB icon="plus" style={styles.fab} color={Colors.textLight} onPress={() => {}} />
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
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.sm, ...Shadows.sm },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stockDot: { width: 10, height: 10, borderRadius: 5, marginRight: Spacing.md },
  cardInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  itemSku: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  price: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  stock: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  fab: { position: 'absolute', right: Spacing.lg, bottom: Spacing.lg, backgroundColor: Colors.primary, borderRadius: 28 },
});
