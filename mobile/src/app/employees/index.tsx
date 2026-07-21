import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Text, Searchbar, FAB } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { OfflineBanner } from '../../components/common/OfflineBanner';
import { EmptyState } from '../../components/common/EmptyState';
import { formatPhone } from '../../utils/formatting';
import { ApiService } from '../../services/api';
import type { Employee } from '../../types';

export default function EmployeesScreen() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEmployees = useCallback(async () => {
    try {
      const data = await ApiService.employee.getEmployees({ limit: 100, sort: 'name', order: 'asc' });
      setEmployees(data?.content || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);
  const filtered = employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || (e.phone || '').includes(search));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Stack.Screen options={{ title: 'Employees', headerShown: false }} />
      <OfflineBanner />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Icon name="arrow-left" size={24} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Employees</Text>
        <Text style={styles.count}>{employees.length} total</Text>
      </View>
      <Searchbar placeholder="Search employees..." value={search} onChangeText={setSearch} style={styles.searchBar} />
      {loading ? <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View> : (
        <FlatList data={filtered} keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEmployees(); }} colors={[Colors.primary]} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} activeOpacity={0.7}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text></View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.role}>{item.role || 'Employee'} · {formatPhone(item.phone || '')}</Text>
              </View>
              <View style={styles.salaryView}>
                <Text style={styles.salary}>₹{item.salary?.toLocaleString() || '0'}</Text>
                <Text style={styles.salaryLabel}>/mo</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<EmptyState icon="account-tie" title="No employees" message={search ? 'Try a different search' : 'Add your first employee'} actionLabel="Add Employee" onAction={() => router.push('/add-party?type=employee')} />}
        />
      )}
      <FAB icon="plus" style={styles.fab} color={Colors.textLight} onPress={() => router.push('/add-party?type=employee')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  count: { fontSize: 13, color: Colors.textSecondary },
  searchBar: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.md },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 80 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.sm, ...Shadows.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.info + '20', justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  avatarText: { fontSize: 18, fontWeight: '700', color: Colors.info },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  role: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  salaryView: { alignItems: 'flex-end' },
  salary: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  salaryLabel: { fontSize: 10, color: Colors.textSecondary },
  fab: { position: 'absolute', right: Spacing.lg, bottom: Spacing.lg, backgroundColor: Colors.primary, borderRadius: 28 },
});
