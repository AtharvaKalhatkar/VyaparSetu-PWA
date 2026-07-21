import { Config } from '../constants/config';

export function formatCurrency(amount: number): string {
  if (amount == null || isNaN(amount)) return `${Config.CURRENCY_SYMBOL}0.00`;
  const formatter = new Intl.NumberFormat(Config.CURRENCY_LOCALE, {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
}

export function formatNumber(value: number): string {
  if (value == null || isNaN(value)) return '0';
  return new Intl.NumberFormat(Config.CURRENCY_LOCALE).format(value);
}

function parseLocalDate(date: string | Date): Date {
  if (date instanceof Date) return date;
  if (!date) return new Date();
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(date);
}

export function formatDate(date: string | Date, format: 'DD-MM-YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' = 'DD-MM-YYYY'): string {
  if (!date) return '';
  const d = parseLocalDate(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  switch (format) {
    case 'DD/MM/YYYY': return `${day}/${month}/${year}`;
    case 'YYYY-MM-DD': return `${year}-${month}-${day}`;
    default: return `${day}-${month}-${year}`;
  }
}

export function formatDateTime(date: string | Date): string {
  if (!date) return '';
  const d = parseLocalDate(date);
  return `${formatDate(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatPhone(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

export function formatGstin(gstin: string): string {
  if (!gstin) return '';
  const g = gstin.toUpperCase();
  if (g.length === 15) {
    return `${g.slice(0, 2)}-${g.slice(2, 5)}-${g.slice(5, 10)}-${g.slice(10, 12)}-${g.slice(12)}`;
  }
  return g;
}

export function formatPercentage(value: number): string {
  if (value == null || isNaN(value)) return '0%';
  return `${value.toFixed(2)}%`;
}

export function formatPincode(pincode: string): string {
  if (!pincode) return '';
  return pincode.replace(/(\d{3})(\d{3})/, '$1 $2');
}

export function maskPhone(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length >= 6) {
    return `${cleaned.slice(0, 2)}*****${cleaned.slice(-3)}`;
  }
  return phone;
}

export function maskEmail(email: string): string {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const maskedLocal = local.length > 2
    ? `${local[0]}${'*'.repeat(Math.min(local.length - 2, 4))}${local[local.length - 1]}`
    : `${local[0]}*`;
  return `${maskedLocal}@${domain}`;
}

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertBelowThousand(n: number): string {
  if (n === 0) return '';
  let result = '';
  if (n >= 100) {
    result += `${ones[Math.floor(n / 100)]} Hundred `;
    n %= 100;
  }
  if (n >= 20) {
    result += `${tens[Math.floor(n / 10)]} `;
    n %= 10;
  }
  if (n > 0) {
    result += `${ones[n]} `;
  }
  return result.trim();
}

export function numberToWords(amount: number): string {
  if (amount === 0) return 'Zero';
  const isNegative = amount < 0;
  let num = Math.abs(Math.round(amount * 100) / 100);
  const paise = Math.round((num - Math.floor(num)) * 100);
  num = Math.floor(num);

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = Math.floor(num / 100);
  num %= 100;

  let words = '';
  if (crore > 0) words += `${convertBelowThousand(crore)} Crore `;
  if (lakh > 0) words += `${convertBelowThousand(lakh)} Lakh `;
  if (thousand > 0) words += `${convertBelowThousand(thousand)} Thousand `;
  if (hundred > 0) words += `${convertBelowThousand(hundred)} Hundred `;
  if (num > 0) words += convertBelowThousand(num);

  if (paise > 0) {
    words += `and ${convertBelowThousand(paise)} Paise`;
  }

  words += ' Only';
  if (isNegative) words = `Minus ${words}`;
  return words.trim();
}
