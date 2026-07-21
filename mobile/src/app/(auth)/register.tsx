import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons, HelperText, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../constants/theme';
import { validatePhone, validateEmail, validatePassword, validateRequired } from '../../utils/validation';
import { useAuthStore } from '../../store/authStore';
import { ApiService } from '../../services/api';

const BUSINESS_TYPES = [
  { value: 'RETAIL', label: 'Retail' },
  { value: 'WHOLESALE', label: 'Wholesale' },
  { value: 'MANUFACTURING', label: 'Manufacturing' },
  { value: 'SERVICE', label: 'Service' },
  { value: 'OTHER', label: 'Other' },
];

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('RETAIL');
  const [gstin, setGstin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const nameCheck = validateRequired(name, 'Name');
    if (!nameCheck.valid) newErrors.name = nameCheck.message!;
    const phoneCheck = validatePhone(phone);
    if (!phoneCheck.valid) newErrors.phone = phoneCheck.message!;
    if (email) {
      const emailCheck = validateEmail(email);
      if (!emailCheck.valid) newErrors.email = emailCheck.message!;
    }
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) newErrors.password = passwordCheck.message!;
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    const businessCheck = validateRequired(businessName, 'Business name');
    if (!businessCheck.valid) newErrors.businessName = businessCheck.message!;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const response = await ApiService.auth.register({
        name,
        phone,
        email: email || undefined,
        password,
        businessName,
        businessType: businessType as any,
        gstin: gstin || undefined,
      });
      if (response.user && response.business && response.accessToken && response.refreshToken) {
        await login(response.user, response.business, response.accessToken, response.refreshToken);
        router.replace('/(tabs)');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      setErrors({ form: err.message || 'Registration failed' });
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
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>Register your business</Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <TextInput
              label="Full Name *"
              value={name}
              onChangeText={(v) => { setName(v); setErrors({}); }}
              mode="outlined"
              left={<TextInput.Icon icon="account-outline" />}
              style={styles.input}
              error={!!errors.name}
            />
            {errors.name && <HelperText type="error">{errors.name}</HelperText>}

            <TextInput
              label="Phone Number *"
              value={phone}
              onChangeText={(v) => { setPhone(v); setErrors({}); }}
              mode="outlined"
              keyboardType="phone-pad"
              left={<TextInput.Icon icon="phone-outline" />}
              style={styles.input}
              error={!!errors.phone}
            />
            {errors.phone && <HelperText type="error">{errors.phone}</HelperText>}

            <TextInput
              label="Email"
              value={email}
              onChangeText={(v) => { setEmail(v); setErrors({}); }}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              left={<TextInput.Icon icon="email-outline" />}
              style={styles.input}
              error={!!errors.email}
            />
            {errors.email && <HelperText type="error">{errors.email}</HelperText>}

            <TextInput
              label="Password *"
              value={password}
              onChangeText={(v) => { setPassword(v); setErrors({}); }}
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
              error={!!errors.password}
            />
            {errors.password && <HelperText type="error">{errors.password}</HelperText>}

            <TextInput
              label="Confirm Password *"
              value={confirmPassword}
              onChangeText={(v) => { setConfirmPassword(v); setErrors({}); }}
              mode="outlined"
              secureTextEntry={!showPassword}
              left={<TextInput.Icon icon="lock-outline" />}
              style={styles.input}
              error={!!errors.confirmPassword}
            />
            {errors.confirmPassword && <HelperText type="error">{errors.confirmPassword}</HelperText>}

            <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Business Information</Text>

            <TextInput
              label="Business Name *"
              value={businessName}
              onChangeText={(v) => { setBusinessName(v); setErrors({}); }}
              mode="outlined"
              left={<TextInput.Icon icon="store-outline" />}
              style={styles.input}
              error={!!errors.businessName}
            />
            {errors.businessName && <HelperText type="error">{errors.businessName}</HelperText>}

            <Text style={styles.fieldLabel}>Business Type</Text>
            <SegmentedButtons
              value={businessType}
              onValueChange={setBusinessType}
              buttons={BUSINESS_TYPES}
              style={styles.segment}
            />

            <TextInput
              label="GSTIN (Optional)"
              value={gstin}
              onChangeText={setGstin}
              mode="outlined"
              autoCapitalize="characters"
              left={<TextInput.Icon icon="file-document-outline" />}
              style={styles.input}
            />

            {errors.form && (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={16} color={Colors.error} />
                <Text style={styles.errorText}>{errors.form}</Text>
              </View>
            )}

            <Button
              mode="contained"
              onPress={handleRegister}
              style={styles.registerButton}
              contentStyle={styles.registerButtonContent}
              buttonColor={Colors.primary}
              loading={isLoading}
              disabled={isLoading}
            >
              Register
            </Button>

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.loginLink}>Login</Text>
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
  scrollContent: { paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.xxl },
  header: { marginBottom: Spacing.xxl },
  headerTitle: { ...Typography.h2, color: Colors.textPrimary },
  headerSubtitle: { ...Typography.body2, color: Colors.textSecondary, marginTop: Spacing.xs },
  formSection: { marginBottom: Spacing.xxl },
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.md },
  fieldLabel: { ...Typography.body2, color: Colors.textPrimary, marginBottom: Spacing.sm, fontWeight: '500' },
  input: { marginBottom: Spacing.xs, backgroundColor: Colors.surface },
  segment: { marginBottom: Spacing.md },
  errorContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  errorText: { ...Typography.body2, color: Colors.error, marginLeft: Spacing.sm },
  registerButton: { borderRadius: BorderRadius.md, marginTop: Spacing.md },
  registerButtonContent: { paddingVertical: 6 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  loginText: { ...Typography.body2, color: Colors.textSecondary },
  loginLink: { ...Typography.body2, color: Colors.primary, fontWeight: '700' },
});
