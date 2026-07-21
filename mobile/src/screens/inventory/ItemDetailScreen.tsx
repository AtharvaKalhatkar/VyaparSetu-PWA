import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, Divider, Chip, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/theme';
import { formatCurrency, formatDate } from '../../utils/formatting';
import type { Item, StockMovement } from '../../types';

const MOCK_ITEM: Item = {
  id: 'i1', businessId: 'b1', name: 'Premium Basmati Rice', sku: 'RICE-001',
  barcode: '8901234567890', hsnCode: '1006', sellingPrice: 85, purchasePrice: 72, mrp: 90,
  gstRate: 5, taxPreference: 'TAXABLE', isActive: true, isService: false,
  isBatchTracked: false, isSerialTracked: false, minStockLevel: 50, maxStockLevel: 500,
  description: 'High quality premium basmati rice from Punjab. Aged for 1 year.',
  createdAt: '2026-01-15', updatedAt: '2026-06-20',
  unitId: 'u1', currentStock: 600,
  category: { id: 'c1', businessId: 'b1', name: 'Food Grains', isActive: true },
  unit: { id: 'u1', businessId: 'b1', name: 'Kilogram', shortName: 'kg', isActive: true },
};

const MOCK_MOVEMENTS: StockMovement[] = [
  { id: 'm1', businessId: 'b1', itemId: 'i1', warehouseId: 'w1', type: 'PURCHASE', quantity: 500, beforeQuantity: 200, afterQuantity: 700, reference: 'PUR-001', createdBy: 'u1', createdAt: '2026-06-20' },
  { id: 'm2', businessId: 'b1', itemId: 'i1', warehouseId: 'w1', type: 'SALE', quantity: -50, beforeQuantity: 700, afterQuantity: 650, reference: 'INV-001', createdBy: 'u1', createdAt: '2026-06-22' },
  { id: 'm3', businessId: 'b1', itemId: 'i1', warehouseId: 'w1', type: 'SALE', quantity: -30, beforeQuantity: 650, afterQuantity: 620, reference: 'INV-002', createdBy: 'u1', createdAt: '2026-06-25' },
  { id: 'm4', businessId: 'b1', itemId: 'i1', warehouseId: 'w1', type: 'ADJUSTMENT', quantity: -20, beforeQuantity: 620, afterQuantity: 600, reference: 'ADJ-001', notes: 'Damaged stock', createdBy: 'u1', createdAt: '2026-06-28' },
];

const MOCK_WAREHOUSE_STOCK = [
  { warehouse: 'Main Store', quantity: 450 },
  { warehouse: 'Warehouse B', quantity: 150 },
];

export const ItemDetailScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const item = MOCK_ITEM;
  const movements = MOCK_MOVEMENTS;
  const totalStock = MOCK_WAREHOUSE_STOCK.reduce((sum, w) => sum + w.quantity, 0);

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'PURCHASE': return Colors.success;
      case 'SALE': return Colors.error;
      case 'ADJUSTMENT': return Colors.warning;
      case 'TRANSFER_IN': return Colors.info;
      case 'TRANSFER_OUT': return Colors.secondary;
      default: return Colors.textSecondary;
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'PURCHASE': return 'truck-plus';
      case 'SALE': return 'cart-minus';
      case 'ADJUSTMENT': return 'tune';
      case 'TRANSFER_IN': return 'transfer';
      case 'TRANSFER_OUT': return 'transfer';
      default: return 'swap-horizontal';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageSection}>
          <View style={styles.imagePlaceholder}>
            <Icon name="package-variant" size={48} color={Colors.primaryLight} />
          </View>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={styles.badgeRow}>
            <Chip icon="barcode" style={styles.badge}>{item.sku}</Chip>
            {item.barcode && <Chip icon="barcode-scan" style={styles.badge}>{item.barcode}</Chip>}
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: Colors.successLight }]}>
            <Text style={[styles.statValue, { color: Colors.success }]}>{totalStock}</Text>
            <Text style={styles.statLabel}>Total Stock</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.infoLight }]}>
            <Text style={[styles.statValue, { color: Colors.info }]}>{formatCurrency(item.sellingPrice)}</Text>
            <Text style={styles.statLabel}>Selling Price</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.warningLight }]}>
            <Text style={[styles.statValue, { color: Colors.warning }]}>{formatCurrency(item.purchasePrice)}</Text>
            <Text style={styles.statLabel}>Purchase Price</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Item Details</Text>
          <Card style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{item.category?.name || 'N/A'}</Text>
            </View>
            <Divider />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>HSN Code</Text>
              <Text style={styles.detailValue}>{item.hsnCode || 'N/A'}</Text>
            </View>
            <Divider />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Unit</Text>
              <Text style={styles.detailValue}>{item.unit?.shortName || 'N/A'}</Text>
            </View>
            <Divider />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>GST Rate</Text>
              <Text style={styles.detailValue}>{item.gstRate}%</Text>
            </View>
            <Divider />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>MRP</Text>
              <Text style={styles.detailValue}>{formatCurrency(item.mrp)}</Text>
            </View>
            <Divider />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Min Stock</Text>
              <Text style={styles.detailValue}>{item.minStockLevel} {item.unit?.shortName}</Text>
            </View>
            <Divider />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Max Stock</Text>
              <Text style={styles.detailValue}>{item.maxStockLevel} {item.unit?.shortName}</Text>
            </View>
            {item.description && (
              <>
                <Divider />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={[styles.detailValue, { flex: 2 }]}>{item.description}</Text>
                </View>
              </>
            )}
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stock by Warehouse</Text>
          {MOCK_WAREHOUSE_STOCK.map((ws, i) => (
            <View key={i} style={styles.warehouseRow}>
              <Text style={styles.warehouseName}>{ws.warehouse}</Text>
              <View style={styles.stockBar}>
                <View style={[styles.stockFill, { width: `${(ws.quantity / totalStock) * 100}%` }]} />
              </View>
              <Text style={styles.warehouseQty}>{ws.quantity} {item.unit?.shortName}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stock Movement History</Text>
          {movements.map(movement => (
            <View key={movement.id} style={styles.movementCard}>
              <View style={[styles.movementIcon, { backgroundColor: getMovementColor(movement.type) + '20' }]}>
                <Icon name={getMovementIcon(movement.type)} size={20} color={getMovementColor(movement.type)} />
              </View>
              <View style={styles.movementInfo}>
                <Text style={styles.movementType}>{movement.type.replace(/_/g, ' ')}</Text>
                <Text style={styles.movementRef}>{movement.reference}</Text>
                <Text style={styles.movementDate}>{formatDate(movement.createdAt)}</Text>
              </View>
              <View style={styles.movementQty}>
                <Text style={[styles.movementQtyText, { color: movement.quantity > 0 ? Colors.success : Colors.error }]}>
                  {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                </Text>
                <Text style={styles.movementAfter}>{movement.afterQuantity}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            buttonColor={Colors.primary}
            icon="pencil"
            style={styles.editButton}
            onPress={() => navigation.navigate('EditItem', { itemId: item.id })}
          >
            Edit Item
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: Spacing.xxxl },
  imageSection: { alignItems: 'center', paddingVertical: Spacing.xxl, backgroundColor: Colors.surface, marginBottom: Spacing.md },
  imagePlaceholder: { width: 100, height: 100, borderRadius: BorderRadius.lg, backgroundColor: Colors.primaryLight + '20', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  itemName: { ...Typography.h2, color: Colors.textPrimary, textAlign: 'center', paddingHorizontal: Spacing.lg },
  badgeRow: { flexDirection: 'row', marginTop: Spacing.sm, gap: Spacing.xs },
  badge: { backgroundColor: Colors.infoLight },
  statsRow: { flexDirection: 'row', marginHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md },
  statCard: { flex: 1, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center' },
  statValue: { ...Typography.h4, fontWeight: '700' },
  statLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.xxs },
  section: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.md },
  detailsCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, ...Shadows.sm },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.md },
  detailLabel: { ...Typography.body2, color: Colors.textSecondary, flex: 1 },
  detailValue: { ...Typography.body2, fontWeight: '600', color: Colors.textPrimary, flex: 1, textAlign: 'right' },
  warehouseRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  warehouseName: { ...Typography.body2, color: Colors.textPrimary, width: 100 },
  stockBar: { flex: 1, height: 8, backgroundColor: Colors.divider, borderRadius: 4, marginHorizontal: Spacing.md, overflow: 'hidden' },
  stockFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  warehouseQty: { ...Typography.body2, fontWeight: '600', color: Colors.textPrimary, width: 80, textAlign: 'right' },
  movementCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: Spacing.md, marginBottom: Spacing.xs, ...Shadows.sm },
  movementIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  movementInfo: { flex: 1 },
  movementType: { ...Typography.body2, fontWeight: '600', color: Colors.textPrimary },
  movementRef: { ...Typography.caption, color: Colors.textSecondary },
  movementDate: { ...Typography.overline, color: Colors.textDisabled },
  movementQty: { alignItems: 'flex-end' },
  movementQtyText: { ...Typography.body1, fontWeight: '700' },
  movementAfter: { ...Typography.caption, color: Colors.textDisabled },
  actionButtons: { marginHorizontal: Spacing.lg },
  editButton: { borderRadius: BorderRadius.md },
});
