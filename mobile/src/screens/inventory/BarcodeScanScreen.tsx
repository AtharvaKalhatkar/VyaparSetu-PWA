import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Vibration, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Button, TextInput, Card } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/theme';
import type { Item } from '../../types';

const MOCK_SCAN_RESULT: Item = {
  id: 'i1', businessId: 'b1', name: 'Premium Basmati Rice', sku: 'RICE-001',
  barcode: '8901234567890', hsnCode: '1006', sellingPrice: 85, purchasePrice: 72, mrp: 90,
  gstRate: 5, taxPreference: 'TAXABLE', isActive: true, isService: false,
  isBatchTracked: false, isSerialTracked: false, minStockLevel: 50, maxStockLevel: 500,
  createdAt: '', updatedAt: '',
  unitId: 'u1', currentStock: 120,
  unit: { id: 'u1', businessId: 'b1', name: 'Kilogram', shortName: 'kg', isActive: true },
};

export const BarcodeScanScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState<Item | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarCodeScanned = useCallback(({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    Vibration.vibrate(200);
    const result = { ...MOCK_SCAN_RESULT, barcode: data };
    setScanResult(result);
  }, [scanned]);

  const handleManualLookup = () => {
    if (!manualBarcode.trim()) return;
    Vibration.vibrate(100);
    const result = { ...MOCK_SCAN_RESULT, barcode: manualBarcode.trim() };
    setScanResult(result);
  };

  const handleReset = () => {
    setScanned(false);
    setScanResult(null);
    setManualBarcode('');
  };

  const handleUseItem = () => {
    if (scanResult) {
      navigation.navigate('ItemDetail', { itemId: scanResult.id, barcode: scanResult.barcode });
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContent}>
          <Icon name="camera-off" size={64} color={Colors.textDisabled} />
          <Text style={styles.permissionText}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContent}>
          <Icon name="camera-off" size={64} color={Colors.error} />
          <Text style={styles.permissionText}>Camera permission is required to scan barcodes</Text>
          <Button mode="contained" onPress={requestPermission} style={styles.permissionButton}>
            Grant Permission
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="close" size={28} color={Colors.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Barcode</Text>
        <TouchableOpacity onPress={() => setShowManual(!showManual)}>
          <Icon name="keyboard-outline" size={28} color={Colors.textLight} />
        </TouchableOpacity>
      </View>

      {!scanResult ? (
        <>
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['ean13', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e', 'itf14', 'qr'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            >
              <View style={styles.scanOverlay}>
                <View style={styles.scanFrame} />
                <Text style={styles.scanHint}>Align barcode within the frame</Text>
              </View>
            </CameraView>
          </View>

          {showManual && (
            <View style={styles.manualSection}>
              <TextInput
                label="Enter barcode manually"
                value={manualBarcode}
                onChangeText={setManualBarcode}
                mode="outlined"
                style={styles.manualInput}
                autoFocus
              />
              <Button
                mode="contained"
                onPress={handleManualLookup}
                buttonColor={Colors.primary}
                style={styles.manualButton}
              >
                Look Up
              </Button>
            </View>
          )}

          {scanned && (
            <TouchableOpacity style={styles.rescanButton} onPress={handleReset}>
              <Icon name="refresh" size={24} color={Colors.textLight} />
              <Text style={styles.rescanText}>Tap to Scan Again</Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <View style={styles.resultContainer}>
          <Card style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Icon name="check-circle" size={48} color={Colors.success} />
              <Text style={styles.resultTitle}>Item Found!</Text>
            </View>
            <View style={styles.resultBody}>
              <Text style={styles.resultName}>{scanResult.name}</Text>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>SKU</Text>
                <Text style={styles.resultValue}>{scanResult.sku}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Barcode</Text>
                <Text style={styles.resultValue}>{scanResult.barcode}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Price</Text>
                <Text style={styles.resultValue}>₹{scanResult.sellingPrice}/{scanResult.unit?.shortName}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Stock</Text>
                <Text style={styles.resultValue}>{scanResult.minStockLevel} {scanResult.unit?.shortName}</Text>
              </View>
            </View>
            <View style={styles.resultActions}>
              <Button mode="outlined" onPress={handleReset} style={styles.resultAction}>
                Scan Again
              </Button>
              <Button
                mode="contained"
                buttonColor={Colors.primary}
                onPress={handleUseItem}
                style={styles.resultAction}
              >
                View Item
              </Button>
            </View>
          </Card>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.primaryDark },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xxl, backgroundColor: Colors.background },
  permissionText: { ...Typography.body1, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.lg },
  permissionButton: { marginTop: Spacing.lg, borderRadius: BorderRadius.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.primaryDark },
  headerTitle: { ...Typography.h4, color: Colors.textLight },
  cameraContainer: { flex: 1, overflow: 'hidden' },
  camera: { flex: 1 },
  scanOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 250, height: 250, borderWidth: 2, borderColor: Colors.textLight, borderRadius: BorderRadius.lg, backgroundColor: 'transparent' },
  scanHint: { ...Typography.body2, color: Colors.textLight, marginTop: Spacing.lg, textAlign: 'center' },
  manualSection: { flexDirection: 'row', padding: Spacing.lg, backgroundColor: Colors.surface, alignItems: 'center', gap: Spacing.md },
  manualInput: { flex: 1, backgroundColor: Colors.surface },
  manualButton: { borderRadius: BorderRadius.md, height: 56 },
  rescanButton: { position: 'absolute', bottom: 80, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.overlay, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md, borderRadius: BorderRadius.round },
  rescanText: { ...Typography.body2, color: Colors.textLight, marginLeft: Spacing.sm },
  resultContainer: { flex: 1, justifyContent: 'center', padding: Spacing.lg, backgroundColor: Colors.background },
  resultCard: { borderRadius: BorderRadius.lg, ...Shadows.lg },
  resultHeader: { alignItems: 'center', paddingVertical: Spacing.xxl, backgroundColor: Colors.successLight, borderTopLeftRadius: BorderRadius.lg, borderTopRightRadius: BorderRadius.lg },
  resultTitle: { ...Typography.h3, color: Colors.success, marginTop: Spacing.md },
  resultBody: { padding: Spacing.lg },
  resultName: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.lg, textAlign: 'center' },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  resultLabel: { ...Typography.body2, color: Colors.textSecondary },
  resultValue: { ...Typography.body2, fontWeight: '600', color: Colors.textPrimary },
  resultActions: { flexDirection: 'row', padding: Spacing.lg, gap: Spacing.md },
  resultAction: { flex: 1, borderRadius: BorderRadius.md },
});
