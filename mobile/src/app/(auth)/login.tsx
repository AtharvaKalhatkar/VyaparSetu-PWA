import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { ApiService } from '../../services/api';
import { Config } from '../../constants/config';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!username.trim()) { setError('Please enter phone or email'); return; }
    if (!password.trim()) { setError('Please enter password'); return; }
    setError('');
    setIsLoading(true);
    try {
      const response = await ApiService.auth.login({
        username: username.trim(),
        password: password,
      });
      if (response.user && response.business && response.accessToken && response.refreshToken) {
        await login(response.user, response.business, response.accessToken, response.refreshToken);
        router.replace('/(tabs)');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>VS</Text>
            </View>
            <Text style={styles.appName}>{Config.APP_NAME}</Text>
            <Text style={styles.tagline}>Business Management for Indian SMEs</Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formTitle}>Login to your account</Text>

            <TextInput
              label="Phone or Email"
              value={username}
              onChangeText={(v) => { setUsername(v); setError(''); }}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              left={<TextInput.Icon icon="account-outline" />}
              style={styles.input}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={(v) => { setPassword(v); setError(''); }}
              mode="outlined"
              secureTextEntry={!showPassword}
              left={<TextInput.Icon icon="lock-outline" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              style={styles.input}
            />

            {error ? (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={16} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <Button
              mode="contained"
              onPress={handleLogin}
              style={styles.loginButton}
              contentStyle={styles.loginButtonContent}
              buttonColor={Colors.primary}
              loading={isLoading}
              disabled={isLoading}
            >
              Login
            </Button>

            <TouchableOpacity
              style={styles.sendOtp}
              onPress={() => router.push('/(auth)/register')}
            >
              <Text style={styles.sendOtpText}>Send OTP to login</Text>
            </TouchableOpacity>

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.registerLink}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.xxxl },
  logoSection: { alignItems: 'center', marginBottom: Spacing.huge },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md, ...Shadows.lg },
  logoText: { fontSize: 32, fontWeight: '700', color: Colors.textLight, letterSpacing: 2 },
  appName: { ...Typography.h2, color: Colors.primary, fontWeight: '700' },
  tagline: { ...Typography.body2, color: Colors.textSecondary, marginTop: Spacing.xs },
  formSection: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.xxl, ...Shadows.md },
  formTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.lg },
  input: { marginBottom: Spacing.md, backgroundColor: Colors.surface },
  errorContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  errorText: { ...Typography.body2, color: Colors.error, marginLeft: Spacing.sm },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: Spacing.lg },
  forgotPasswordText: { ...Typography.body2, color: Colors.primary, fontWeight: '600' },
  loginButton: { borderRadius: BorderRadius.md, marginBottom: Spacing.md },
  loginButtonContent: { paddingVertical: 6 },
  sendOtp: { alignItems: 'center', paddingVertical: Spacing.md },
  sendOtpText: { ...Typography.body2, color: Colors.accent, fontWeight: '600' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  registerText: { ...Typography.body2, color: Colors.textSecondary },
  registerLink: { ...Typography.body2, color: Colors.primary, fontWeight: '700' },
});
