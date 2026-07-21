import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/theme';
import { ApiService } from '../../services/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    if (!identifier.trim()) { setError('Please enter phone or email'); return; }
    setError('');
    setIsLoading(true);
    try {
      await ApiService.auth.sendOtp({
        phone: identifier.includes('@') ? undefined : identifier.trim(),
        email: identifier.includes('@') ? identifier.trim() : undefined,
      });
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) { setError('Please enter OTP'); return; }
    setError('');
    setStep('reset');
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim() || newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError('');
    setIsLoading(true);
    try {
      await ApiService.auth.verifyOtp({ phone: identifier.includes('@') ? '' : identifier.trim(), otp: otp.trim() });
      router.replace('/(auth)/login');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Reset Password</Text>
            <Text style={styles.headerSubtitle}>
              {step === 'email' ? 'Enter your email or phone to receive OTP' :
               step === 'otp' ? 'Enter the OTP sent to your device' :
               'Enter your new password'}
            </Text>
          </View>

          {step === 'email' && (
            <View style={styles.formSection}>
              <TextInput label="Phone or Email" value={identifier} onChangeText={(v) => { setIdentifier(v); setError(''); }}
                mode="outlined" keyboardType="email-address" autoCapitalize="none"
                left={<TextInput.Icon icon="account-outline" />} style={styles.input} />
              {error ? <View style={styles.errorContainer}><Icon name="alert-circle" size={16} color={Colors.error} /><Text style={styles.errorText}>{error}</Text></View> : null}
              <Button mode="contained" onPress={handleSendOtp} style={styles.button}
                buttonColor={Colors.primary} loading={isLoading} disabled={isLoading}>Send OTP</Button>
            </View>
          )}

          {step === 'otp' && (
            <View style={styles.formSection}>
              <TextInput label="Enter OTP" value={otp} onChangeText={(v) => { setOtp(v); setError(''); }}
                mode="outlined" keyboardType="number-pad" maxLength={6}
                left={<TextInput.Icon icon="lock-outline" />} style={styles.input} />
              {error ? <View style={styles.errorContainer}><Icon name="alert-circle" size={16} color={Colors.error} /><Text style={styles.errorText}>{error}</Text></View> : null}
              <Button mode="contained" onPress={handleVerifyOtp} style={styles.button}
                buttonColor={Colors.primary}>Verify OTP</Button>
            </View>
          )}

          {step === 'reset' && (
            <View style={styles.formSection}>
              <TextInput label="New Password" value={newPassword} onChangeText={(v) => { setNewPassword(v); setError(''); }}
                mode="outlined" secureTextEntry left={<TextInput.Icon icon="lock-outline" />} style={styles.input} />
              {error ? <View style={styles.errorContainer}><Icon name="alert-circle" size={16} color={Colors.error} /><Text style={styles.errorText}>{error}</Text></View> : null}
              <Button mode="contained" onPress={handleResetPassword} style={styles.button}
                buttonColor={Colors.primary} loading={isLoading} disabled={isLoading}>Reset Password</Button>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  keyboardView: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.xxl },
  backButton: { marginBottom: Spacing.lg },
  header: { marginBottom: Spacing.xxl },
  headerTitle: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  headerSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: Spacing.xs },
  formSection: { marginBottom: Spacing.xxl },
  input: { marginBottom: Spacing.md, backgroundColor: Colors.surface },
  errorContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  errorText: { fontSize: 14, color: Colors.error, marginLeft: Spacing.sm },
  button: { borderRadius: 8, marginTop: Spacing.md },
});
