import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Searchbar, FAB, Chip, Text, Menu, Divider, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/theme';
import { EmptyState } from '../../components/common/EmptyState';
import { OfflineBanner } from '../../components/common/OfflineBanner';
import { formatCurrency, formatPhone } from '../../utils/formatting';
import type { Party, PartyType } from '../../types';

const MOCK_PARTIES: Party[] = [
  { id: '1', businessId: 'b1', name: 'Sharma General Store', phone: '9876543210', email: 'sharma@example.com', type: 'CUSTOMER', creditLimit: 50000, creditDays: 30, openingBalance: 0, balanceType: 'DEBIT', isActive: true, tags: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '2', businessId: 'b1', name: 'Gupta Electronics', phone: '9988776655', email: 'gupta@example.com', type: 'CUSTOMER', creditLimit: 100000, creditDays: 45, openingBalance: 25000, balanceType: 'DEBIT', isActive: true, tags: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '3', businessId: 'b1', name: 'Verma Traders', phone: '9876501234', gstin: '27ABCDE1234F1Z5', type: 'SUPPLIER', creditLimit: 200000, creditDays: 60, openingBalance: 0, balanceType: 'CREDIT', isActive: true, tags: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '4', businessId: 'b1', name: 'Singh & Sons', phone: '9765432100', type: 'BOTH', creditLimit: 75000, creditDays: 30, openingBalance: 12000, balanceType: 'DEBIT', isActive: true, tags: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '5', businessId: 'b1', name: 'Patel Medical Store', phone: '9654321001', type: 'CUSTOMER', creditLimit: 30000, creditDays: 15, openingBalance: 0, balanceType: 'DEBIT', isActive: true, tags: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const PartyListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<PartyType | 'ALL'>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);

  const filteredParties = MOCK_PARTIES.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search);
    const matchesFilter = filter === 'ALL' || p.type === filter;
    return matchesSearch && matchesFilter;
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const handleLongPress = (party: Party) => {
    setSelectedParty(party);
    setMenuVisible(true);
  };

  const getOutstandingColor = (balanceType: string) => {
    return balanceType === 'DEBIT' ? Colors.error : Colors.success;
  };

  const renderPartyCard = ({ item }: { item: Party }) => (
    <TouchableOpacity
      style={styles.partyCard}
      onPress={() => navigation.navigate('PartyDetail', { partyId: item.id })}
      onLongPress={() => handleLongPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardLeft}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.partyName}>{item.name}</Text>
          <Text style={styles.partyPhone}>{formatPhone(item.phone)}</Text>
          {item.type === 'BOTH' && (
            <View style={styles.typeChip}>
              <Text style={styles.typeChipText}>Customer & Supplier</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={[styles.outstandingAmount, { color: getOutstandingColor(item.balanceType) }]}>
          {formatCurrency(item.openingBalance)}
        </Text>
        <Text style={styles.outstandingLabel}>
          {item.balanceType === 'DEBIT' ? 'To Receive' : 'To Pay'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <OfflineBanner />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Parties</Text>
        <Text style={styles.headerCount}>{filteredParties.length} parties</Text>
      </View>

      <View style={styles.filterRow}>
        {(['ALL', 'CUSTOMER', 'SUPPLIER'] as const).map((f) => (
          <Chip
            key={f}
            selected={filter === f}
            onPress={() => setFilter(f)}
            style={styles.filterChip}
            showSelectedCheck={false}
            textStyle={filter === f ? styles.activeChipText : styles.chipText}
          >
            {f === 'ALL' ? 'All' : f === 'CUSTOMER' ? 'Customers' : 'Suppliers'}
          </Chip>
        ))}
      </View>

      <Searchbar
        placeholder="Search parties..."
        onChangeText={setSearch}
        value={search}
        style={styles.searchBar}
        inputStyle={styles.searchInput}
      />

      <FlatList
        data={filteredParties}
        renderItem={renderPartyCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="account-group-outline"
            title="No parties found"
            message={search ? 'Try a different search term' : 'Add your first party to get started'}
            actionLabel="Add Party"
            onAction={() => navigation.navigate('AddParty')}
          />
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        color={Colors.textLight}
        onPress={() => navigation.navigate('AddParty')}
      />

      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={{ x: 0, y: 0 }}
        style={styles.menu}
      >
        <Menu.Item
          leadingIcon="eye-outline"
          onPress={() => {
            setMenuVisible(false);
            if (selectedParty) navigation.navigate('PartyDetail', { partyId: selectedParty.id });
          }}
          title="View Details"
        />
        <Menu.Item
          leadingIcon="pencil-outline"
          onPress={() => {
            setMenuVisible(false);
            if (selectedParty) navigation.navigate('EditParty', { partyId: selectedParty.id });
          }}
          title="Edit"
        />
        <Divider />
        <Menu.Item
          leadingIcon="delete-outline"
          onPress={() => {
            setMenuVisible(false);
            Alert.alert('Delete Party', 'Are you sure you want to delete this party?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => {} },
            ]);
          }}
          title="Delete"
          titleStyle={{ color: Colors.error }}
        />
      </Menu>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  headerCount: {
    ...Typography.body2,
    color: Colors.textSecondary,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  filterChip: {
    backgroundColor: Colors.surface,
  },
  chipText: {
    color: Colors.textSecondary,
  },
  activeChipText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  searchBar: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
  },
  searchInput: {
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 80,
  },
  partyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    ...Typography.h3,
    color: Colors.textLight,
    fontWeight: '700',
  },
  cardInfo: {
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
  typeChip: {
    backgroundColor: Colors.infoLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    alignSelf: 'flex-start',
    marginTop: Spacing.xxs,
  },
  typeChipText: {
    fontSize: 10,
    color: Colors.info,
    fontWeight: '500',
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  outstandingAmount: {
    ...Typography.h4,
    fontWeight: '700',
  },
  outstandingLabel: {
    ...Typography.caption,
    color: Colors.textDisabled,
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.round,
  },
  menu: {
    position: 'absolute',
    top: 200,
    right: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    ...Shadows.lg,
  },
});
