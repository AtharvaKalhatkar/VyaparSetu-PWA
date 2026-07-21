import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Text, Button, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/theme';
import { OfflineBanner } from '../../components/common/OfflineBanner';
import { InvoiceForm } from '../../components/invoice/InvoiceForm';
import { ApiService } from '../../services/api';
import type { Invoice, InvoiceItem, Party } from '../../types';

export default function BillingScreen() {
  const [invoiceType, setInvoiceType] = useState<'SALE' | 'PURCHASE'>('SALE');
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiService.party.getParties({ limit: 100, type: invoiceType === 'SALE' ? 'CUSTOMER' : 'SUPPLIER' })
      .then(data => setParties(data?.content || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [invoiceType]);

  const handleSubmit = async (data: Partial<Invoice> & { items: Partial<InvoiceItem>[] }) => {
    try {
      const result = await ApiService.invoice.createInvoice({ ...data, type: invoiceType } as any);
      Alert.alert('Success', `Invoice #${result.invoiceNo} created successfully`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create invoice');
    }
  };

  const handleSaveDraft = async () => {
    Alert.alert('Info', 'Draft saving enabled on submit');
  };

  const handleShare = () => {
    Alert.alert('Share', 'Share invoice via WhatsApp or other apps');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <OfflineBanner />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Invoice</Text>
        </View>

        <SegmentedButtons
          value={invoiceType}
          onValueChange={(v) => setInvoiceType(v as 'SALE' | 'PURCHASE')}
          buttons={[
            { value: 'SALE', label: 'Sale Invoice', icon: 'cart-outline' },
            { value: 'PURCHASE', label: 'Purchase Invoice', icon: 'truck-outline' },
          ]}
          style={styles.typeSelector}
        />

        <InvoiceForm
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
          onShare={handleShare}
          parties={parties}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: Spacing.xxxl },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  headerTitle: { ...Typography.h2, color: Colors.textPrimary },
  typeSelector: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
});
