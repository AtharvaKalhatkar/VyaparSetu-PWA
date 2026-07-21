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

const MOCK_ITEMS: Item[] = [
  { id: 'i1', businessId: 'b1', name: 'Premium Basmati Rice', sku: 'RICE-001', barcode: '8901234567890', hsnCode: '1006', sellingPrice: 85, purchasePrice: 72, mrp: 90, gstRate: 5, taxPreference: 'TAXABLE', isActive: true, isService: false, isBatchTracked: false, isSerialTracked: false, minStockLevel: 50, maxStockLevel: 500, createdAt: '', updatedAt: '', unitId: 'u1', currentStock: 120, category: { id: 'c1', businessId: 'b1', name: 'Food Grains', isActive: true }, unit: { id: 'u1', businessId: 'b1', name: 'Kilogram', shortName: 'kg', isActive: true } },
  { id: 'i2', businessId: 'b1', name: 'Fortune Sunflower Oil', sku: 'OIL-001', barcode: '8901234567891', hsnCode: '1512', sellingPrice: 185, purchasePrice: 165, mrp: 195, gstRate: 5, taxPreference: 'TAXABLE', isActive: true, isService: false, isBatchTracked: true, isSerialTracked: false, minStockLevel: 20, maxStockLevel: 200, createdAt: '', updatedAt: '', unitId: 'u1', currentStock: 45, category: { id: 'c2', businessId: 'b1', name: 'Edible Oils', isActive: true }, unit: { id: 'u1', businessId: 'b1', name: 'Liter', shortName: 'L', isActive: true } },
  { id: 'i3', businessId: 'b1', name: 'LED Bulb 12W', sku: 'ELEC-001', barcode: '8901234567892', hsnCode: '8542', sellingPrice: 120, purchasePrice: 85, mrp: 150, gstRate: 18, taxPreference: 'TAXABLE', isActive: true, isService: false, isBatchTracked: false, isSerialTracked: false, minStockLevel: 30, maxStockLevel: 300, createdAt: '', updatedAt: '', unitId: 'u2', currentStock: 15, category: { id: 'c3', businessId: 'b1', name: 'Electronics', isActive: true }, unit: { id: 'u2', businessId: 'b1', name: 'Piece', shortName: 'Pcs', isActive: true } },
  { id: 'i4', businessId: 'b1', name: 'Copy Notebook 200 Pages', sku: 'STA-001', barcode: '8901234567893', hsnCode: '4820', sellingPrice: 45, purchasePrice: 32, mrp: 55, gstRate: 12, taxPreference: 'TAXABLE', isActive: true, isService: false, isBatchTracked: false, isSerialTracked: false, minStockLevel: 100, maxStockLevel: 1000, createdAt: '', updatedAt: '', unitId: 'u2', currentStock: 340, category: { id: 'c4', businessId: 'b1', name: 'Stationery', isActive: true }, unit: { id: 'u2', businessId: 'b1', name: 'Piece', shortName: 'Pcs', isActive: true } },
  { id: 'i5', businessId: 'b1', name: 'Tata Salt 1kg', sku: 'GROC-001', barcode: '8901234567894', hsnCode: '2501', sellingPrice: 22, purchasePrice: 18, mrp: 25, gstRate: 0, taxPreference: 'EXEMPT', isActive: true, isService: false, isBatchTracked: false, isSerialTracked: false, minStockLevel: 100, maxStockLevel: 500, createdAt: '', updatedAt: '', unitId: 'u1', currentStock: 90, category: { id: 'c5', businessId: 'b1', name: 'Grocery', isActive: true }, unit: { id: 'u1', businessId: 'b1', name: 'Kilogram', shortName: 'kg', isActive: true } },
];

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
            <Text style={styles.stockQty}>{item.minStockLevel} {item.unit?.shortName}</Text>
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
