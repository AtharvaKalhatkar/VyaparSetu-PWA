export function validateGstin(gstin: string): { valid: boolean; message?: string } {
  if (!gstin) return { valid: false, message: 'GSTIN is required' };
  const cleaned = gstin.trim().toUpperCase();
  if (cleaned.length !== 15) return { valid: false, message: 'GSTIN must be 15 characters' };
  const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!pattern.test(cleaned)) return { valid: false, message: 'Invalid GSTIN format' };
  const checkChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const codePoint = (ch: string): number => checkChars.indexOf(ch);
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const cp = codePoint(cleaned[i]);
    let factor = 2;
    if (i % 2 === 1) factor = 1;
    const product = cp * factor;
    const addend = Math.floor(product / 36) + (product % 36);
    sum += addend;
  }
  const remainder = sum % 36;
  const checkDigit = remainder === 0 ? 0 : 36 - remainder;
  const expectedCheck = checkChars[checkDigit];
  if (cleaned[14] !== expectedCheck) {
    return { valid: false, message: 'GSTIN checksum verification failed' };
  }
  return { valid: true };
}

export function validatePan(pan: string): { valid: boolean; message?: string } {
  if (!pan) return { valid: false, message: 'PAN is required' };
  const cleaned = pan.trim().toUpperCase();
  if (cleaned.length !== 10) return { valid: false, message: 'PAN must be 10 characters' };
  const pattern = /^[A-Z]{3}[ABCFGHLJPTK][A-Z][0-9]{4}[A-Z]$/;
  if (!pattern.test(cleaned)) return { valid: false, message: 'Invalid PAN format' };
  return { valid: true };
}

export function validatePhone(phone: string): { valid: boolean; message?: string } {
  if (!phone) return { valid: false, message: 'Phone number is required' };
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return { valid: true };
  if (cleaned.length === 11 && cleaned[0] === '0') return { valid: true, message: 'Consider removing leading 0' };
  if (cleaned.length === 12 && cleaned.startsWith('91')) return { valid: true };
  return { valid: false, message: 'Phone number must be 10 digits' };
}

export function validateEmail(email: string): { valid: boolean; message?: string } {
  if (!email) return { valid: false, message: 'Email is required' };
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!pattern.test(email.trim())) return { valid: false, message: 'Invalid email format' };
  return { valid: true };
}

export function validatePincode(pincode: string): { valid: boolean; message?: string } {
  if (!pincode) return { valid: false, message: 'Pincode is required' };
  const cleaned = pincode.trim();
  if (cleaned.length !== 6) return { valid: false, message: 'Pincode must be 6 digits' };
  if (!/^\d{6}$/.test(cleaned)) return { valid: false, message: 'Pincode must contain only digits' };
  return { valid: true };
}

export function validateAmount(amount: number): { valid: boolean; message?: string } {
  if (amount == null || isNaN(amount)) return { valid: false, message: 'Amount is required' };
  if (amount < 0) return { valid: false, message: 'Amount cannot be negative' };
  if (amount > 999999999) return { valid: false, message: 'Amount exceeds maximum limit' };
  const decimalPart = (amount.toString().split('.')[1] || '');
  if (decimalPart.length > 2) return { valid: false, message: 'Amount can have at most 2 decimal places' };
  return { valid: true };
}

export function validateRequired(value: string, fieldName: string): { valid: boolean; message?: string } {
  if (!value || !value.trim()) return { valid: false, message: `${fieldName} is required` };
  return { valid: true };
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password) return { valid: false, message: 'Password is required' };
  if (password.length < 6) return { valid: false, message: 'Password must be at least 6 characters' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password must contain an uppercase letter' };
  if (!/[a-z]/.test(password)) return { valid: false, message: 'Password must contain a lowercase letter' };
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must contain a number' };
  return { valid: true };
}
