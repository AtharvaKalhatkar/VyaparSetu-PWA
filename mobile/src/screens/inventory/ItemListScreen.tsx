import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Searchbar, FAB, Chip, Text, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/theme';
import { EmptyState } from '../../components/common/EmptyState';
import { OfflineBanner } from '../../components/common/OfflineBanner';
import { formatCurrency } from '../../utils/formatting';
import type { Item } from '../../types';

const MOCK_ITEMS: Item[] = [];

export const ItemListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [...new Set(MOCK_ITEMS.map(item => item.category?.name).filter(Boolean))];

  const filteredItems = MOCK_ITEMS.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      (item.barcode && item.barcode.includes(search));
    const matchesCategory = !selectedCategory || item.category?.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const getStockStatus = (item: Item) => {
    const stock = item.currentStock ?? 0;
    const minLevel = item.minStockLevel ?? 0;
    if (minLevel > 0 && stock <= minLevel) return { label: 'Low', color: Colors.error };
    if (minLevel > 0 && stock <= minLevel * 1.5) return { label: 'Medium', color: Colors.warning };
    return { label: 'In Stock', color: Colors.success };
  };

  const renderItem = ({ item }: { item: Item }) => {
    const stock = getStockStatus(item);
    return (
      <TouchableOpacity
        style={styles.itemCard}
        onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.itemTop}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemSku}>SKU: {item.sku}</Text>
          </View>
          <View style={[styles.stockBadge, { backgroundColor: stock.color + '20' }]}>
            <Text style={[styles.stockText, { color: stock.color }]}>{stock.label}</Text>
          </View>
        </View>
        <View style={styles.itemBottom}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Selling</Text>
            <Text style={styles.sellingPrice}>{formatCurrency(item.sellingPrice)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Purchase</Text>
            <Text style={styles.purchasePrice}>{formatCurrency(item.purchasePrice)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Stock</Text>
            <Text style={styles.stockQty}>{item.currentStock ?? 0} {item.unit?.shortName}</Text>
          </View>
        </View>
        {item.barcode && (
          <View style={styles.barcodeRow}>
            <Icon name="barcode" size={14} color={Colors.textDisabled} />
            <Text style={styles.barcodeText}>{item.barcode}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <OfflineBanner />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory</Text>
        <TouchableOpacity onPress={() => navigation.navigate('BarcodeScan')}>
          <Icon name="barcode-scan" size={28} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <Searchbar
        placeholder="Search items by name, SKU or barcode..."
        onChangeText={setSearch}
        value={search}
        style={styles.searchBar}
        icon="barcode"
        onIconPress={() => navigation.navigate('BarcodeScan')}
      />

      <View style={styles.categoryRow}>
        <Chip
          selected={!selectedCategory}
          onPress={() => setSelectedCategory(null)}
          style={styles.categoryChip}
          showSelectedCheck={false}
        >
          All
        </Chip>
        {categories.map(cat => (
          <Chip
            key={cat}
            selected={selectedCategory === cat}
            onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat!)}
            style={styles.categoryChip}
            showSelectedCheck={false}
          >
            {cat}
          </Chip>
        ))}
      </View>

      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <EmptyState
            icon="package-variant-closed"
            title="No items found"
            message={search ? 'Try a different search' : 'Add your first item'}
            actionLabel="Add Item"
            onAction={() => navigation.navigate('AddItem')}
          />
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        color={Colors.textLight}
        onPress={() => navigation.navigate('AddItem')}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { ...Typography.h2, color: Colors.textPrimary },
  searchBar: { marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, backgroundColor: Colors.surface, borderRadius: BorderRadius.md },
  categoryRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, marginBottom: Spacing.md, gap: Spacing.xs },
  categoryChip: { backgroundColor: Colors.surface },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 80 },
  columnWrapper: { gap: Spacing.sm },
  itemCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadows.sm },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  itemInfo: { flex: 1, marginRight: Spacing.sm },
  itemName: { ...Typography.body2, fontWeight: '600', color: Colors.textPrimary },
  itemSku: { ...Typography.caption, color: Colors.textSecondary },
  stockBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.xs },
  stockText: { fontSize: 10, fontWeight: '600' },
  itemBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  priceRow: { alignItems: 'center' },
  priceLabel: { ...Typography.overline, color: Colors.textDisabled },
  sellingPrice: { ...Typography.body2, fontWeight: '700', color: Colors.primary },
  purchasePrice: { ...Typography.body2, fontWeight: '700', color: Colors.secondary },
  stockQty: { ...Typography.body2, fontWeight: '600', color: Colors.textPrimary },
  barcodeRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.divider },
  barcodeText: { ...Typography.overline, color: Colors.textDisabled, marginLeft: Spacing.xs },
  fab: { position: 'absolute', right: Spacing.lg, bottom: Spacing.lg, backgroundColor: Colors.primary, borderRadius: BorderRadius.round },
});
