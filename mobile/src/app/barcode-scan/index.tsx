import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { ApiService } from '../../services/api';

export default function BarcodeScanScreen() {
  const router = useRouter();
  const [barcode, setBarcode] = useState('');
  const [scanning, setScanning] = useState(false);

  const handleLookup = async () => {
    if (!barcode.trim()) return;
    setScanning(true);
    try {
      const item = await ApiService.item.getByBarcode(barcode.trim());
      Alert.alert('Item Found', `${item.name}\nSKU: ${item.sku}\nPrice: ₹${item.sellingPrice}`);
    } catch {
      Alert.alert('Not Found', `No item found with barcode: ${barcode}`);
    } finally { setScanning(false); }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Stack.Screen options={{ title: 'Scan Barcode', headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Icon name="arrow-left" size={24} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Barcode</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.scannerPlaceholder}>
        <Icon name="barcode-scan" size={80} color={Colors.textDisabled} />
        <Text style={styles.scannerHint}>Camera preview would appear here</Text>
      </View>
      <View style={styles.inputRow}>
        <TextInput placeholder="Or enter barcode manually" value={barcode} onChangeText={setBarcode} mode="outlined" style={styles.input} onSubmitEditing={handleLookup} />
        <Button mode="contained" style={styles.lookupBtn} onPress={handleLookup} loading={scanning}>Lookup</Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  scannerPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', marginHorizontal: Spacing.lg, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.divider, margin: Spacing.lg },
  scannerHint: { fontSize: 14, color: Colors.textDisabled, marginTop: Spacing.md },
  inputRow: { flexDirection: 'row', padding: Spacing.lg, gap: Spacing.sm },
  input: { flex: 1, backgroundColor: Colors.surface },
  lookupBtn: { justifyContent: 'center', borderRadius: BorderRadius.md },
});
