import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Text, Searchbar, FAB } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { OfflineBanner } from '../../components/common/OfflineBanner';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDate } from '../../utils/formatting';
import { ApiService } from '../../services/api';
import type { CrmLead } from '../../types';

export default function CRMScreen() {
  const router = useRouter();
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      const data = await ApiService.crm.getLeads({ limit: 100, sort: 'createdAt', order: 'desc' });
      setLeads(data?.content || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  const filtered = leads.filter(l => l.name?.toLowerCase().includes(search.toLowerCase()) || l.phone?.includes(search));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return Colors.info;
      case 'CONTACTED': return Colors.warning;
      case 'QUALIFIED': return Colors.primary;
      case 'NEGOTIATION': return Colors.accent;
      case 'WON': return Colors.success;
      case 'LOST': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Stack.Screen options={{ title: 'CRM', headerShown: false }} />
      <OfflineBanner />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Icon name="arrow-left" size={24} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>CRM</Text>
        <TouchableOpacity><Icon name="chart-pie" size={24} color={Colors.primary} /></TouchableOpacity>
      </View>
      <Searchbar placeholder="Search leads..." value={search} onChangeText={setSearch} style={styles.searchBar} />
      {loading ? <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View> : (
        <FlatList data={filtered} keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLeads(); }} colors={[Colors.primary]} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} activeOpacity={0.7}>
              <View style={styles.cardTop}>
                <Text style={styles.leadName}>{item.name}</Text>
                <View style={[styles.stageBadge, { backgroundColor: getStatusColor(item.status || 'NEW') + '20' }]}>
                  <Text style={[styles.stageText, { color: getStatusColor(item.status || 'NEW') }]}>{item.status || 'NEW'}</Text>
                </View>
              </View>
              <Text style={styles.leadPhone}>{item.phone}</Text>
              <Text style={styles.leadDate}>{formatDate(item.createdAt)}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<EmptyState icon="account-supervisor" title="No leads" message={search ? 'Try a different search' : 'Start building your pipeline'} actionLabel="Add Lead" onAction={() => router.push('/add-party')} />}
        />
      )}
      <FAB icon="plus" style={styles.fab} color={Colors.textLight} onPress={() => router.push('/add-party?type=lead')} />
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
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.sm, ...Shadows.sm },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  leadName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  stageBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.xs },
  stageText: { fontSize: 10, fontWeight: '700' },
  leadPhone: { fontSize: 13, color: Colors.textSecondary, marginBottom: 2 },
  leadDate: { fontSize: 11, color: Colors.textDisabled },
  fab: { position: 'absolute', right: Spacing.lg, bottom: Spacing.lg, backgroundColor: Colors.primary, borderRadius: 28 },
});
