import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, SegmentedButtons, HelperText, useTheme } from 'react-native-paper';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { validatePhone, validateEmail, validateGstin, validatePincode, validateRequired } from '../../utils/validation';
import type { Party, PartyType } from '../../types';

interface PartyFormProps {
  initialValues?: Partial<Party>;
  onSubmit: (data: Partial<Party>) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const PartyForm: React.FC<PartyFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [name, setName] = useState(initialValues?.name || '');
  const [phone, setPhone] = useState(initialValues?.phone || '');
  const [email, setEmail] = useState(initialValues?.email || '');
  const [gstin, setGstin] = useState(initialValues?.gstin || '');
  const [type, setType] = useState<PartyType>(initialValues?.type || 'CUSTOMER');
  const [creditLimit, setCreditLimit] = useState(String(initialValues?.creditLimit || 0));
  const [creditDays, setCreditDays] = useState(String(initialValues?.creditDays || 0));
  const [addressLine1, setAddressLine1] = useState(initialValues?.address?.line1 || '');
  const [addressLine2, setAddressLine2] = useState(initialValues?.address?.line2 || '');
  const [city, setCity] = useState(initialValues?.address?.city || '');
  const [state, setState] = useState(initialValues?.address?.state || '');
  const [pincode, setPincode] = useState(initialValues?.address?.pincode || '');
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
    if (gstin) {
      const gstinCheck = validateGstin(gstin);
      if (!gstinCheck.valid) newErrors.gstin = gstinCheck.message!;
    }
    if (pincode) {
      const pincodeCheck = validatePincode(pincode);
      if (!pincodeCheck.valid) newErrors.pincode = pincodeCheck.message!;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      gstin: gstin.trim().toUpperCase() || undefined,
      type,
      creditLimit: parseFloat(creditLimit) || 0,
      creditDays: parseInt(creditDays) || 0,
      address: {
        line1: addressLine1.trim(),
        line2: addressLine2.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        country: 'India',
      },
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TextInput
        label="Party Name *"
        value={name}
        onChangeText={setName}
        mode="outlined"
        style={styles.input}
        error={!!errors.name}
      />
      {errors.name && <HelperText type="error">{errors.name}</HelperText>}

      <TextInput
        label="Phone Number *"
        value={phone}
        onChangeText={setPhone}
        mode="outlined"
        keyboardType="phone-pad"
        style={styles.input}
        error={!!errors.phone}
      />
      {errors.phone && <HelperText type="error">{errors.phone}</HelperText>}

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        error={!!errors.email}
      />
      {errors.email && <HelperText type="error">{errors.email}</HelperText>}

      <TextInput
        label="GSTIN"
        value={gstin}
        onChangeText={setGstin}
        mode="outlined"
        autoCapitalize="characters"
        style={styles.input}
        error={!!errors.gstin}
      />
      {errors.gstin && <HelperText type="error">{errors.gstin}</HelperText>}

      <SegmentedButtons
        value={type}
        onValueChange={(val) => setType(val as PartyType)}
        buttons={[
          { value: 'CUSTOMER', label: 'Customer' },
          { value: 'SUPPLIER', label: 'Supplier' },
          { value: 'BOTH', label: 'Both' },
        ]}
        style={styles.segment}
      />

      <View style={styles.row}>
        <TextInput
          label="Credit Limit (₹)"
          value={creditLimit}
          onChangeText={setCreditLimit}
          mode="outlined"
          keyboardType="numeric"
          style={[styles.input, styles.halfInput]}
        />
        <TextInput
          label="Credit Days"
          value={creditDays}
          onChangeText={setCreditDays}
          mode="outlined"
          keyboardType="numeric"
          style={[styles.input, styles.halfInput]}
        />
      </View>

      <TextInput
        label="Address Line 1"
        value={addressLine1}
        onChangeText={setAddressLine1}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Address Line 2"
        value={addressLine2}
        onChangeText={setAddressLine2}
        mode="outlined"
        style={styles.input}
      />

      <View style={styles.row}>
        <TextInput
          label="City"
          value={city}
          onChangeText={setCity}
          mode="outlined"
          style={[styles.input, styles.halfInput]}
        />
        <TextInput
          label="State"
          value={state}
          onChangeText={setState}
          mode="outlined"
          style={[styles.input, styles.halfInput]}
        />
      </View>

      <TextInput
        label="Pincode"
        value={pincode}
        onChangeText={setPincode}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
        error={!!errors.pincode}
      />
      {errors.pincode && <HelperText type="error">{errors.pincode}</HelperText>}

      <View style={styles.buttons}>
        {onCancel && (
          <Button
            mode="outlined"
            onPress={onCancel}
            style={styles.button}
            textColor={Colors.textSecondary}
          >
            Cancel
          </Button>
        )}
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.button}
          buttonColor={Colors.primary}
          loading={isLoading}
          disabled={isLoading}
        >
          {initialValues ? 'Update' : 'Save'} Party
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  input: {
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  segment: {
    marginVertical: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xxxl,
  },
  button: {
    flex: 1,
    borderRadius: BorderRadius.md,
  },
});
