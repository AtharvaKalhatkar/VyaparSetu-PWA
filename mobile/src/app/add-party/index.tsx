import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Colors, Spacing } from '../../constants/theme';
import { PartyForm } from '../../components/party/PartyForm';
import { ApiService } from '../../services/api';
import type { Party } from '../../types';

export default function AddPartyScreen() {
  const router = useRouter();

  const handleSubmit = async (data: Partial<Party>) => {
    try {
      await ApiService.party.createParty(data);
      router.back();
    } catch {}
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <Stack.Screen options={{ title: 'Add Party', headerShown: false }} />
      <PartyForm onSubmit={handleSubmit} onCancel={() => router.back()} />
    </SafeAreaView>
  );
}
