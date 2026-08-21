export const Colors = {
  // Brand
  primary: '#0D9488',          // Teal 600 - primary actions, active nav, links
  primaryHover: '#0F766E',     // Teal 700
  primaryLight: '#CCFBF1',     // Teal 100 - selected chips, subtle bg
  primarySurface: '#F0FDFA',   // Teal 50 - card tint on hover
  primaryDark: '#0F766E',
  onPrimary: '#FFFFFF',

  // Neutrals
  background: '#F8FAFC',       // Slate 50 - app background
  surface: '#FFFFFF',          // Cards, sheets, modals
  surfaceVariant: '#F1F5F9',   // Slate 100
  border: '#E2E8F0',           // Slate 200
  borderStrong: '#CBD5E1',     // Slate 300
  textPrimary: '#0F172A',      // Slate 900
  textSecondary: '#64748B',    // Slate 500
  textMuted: '#94A3B8',        // Slate 400
  textLight: '#FFFFFF',
  textDisabled: '#94A3B8',
  divider: '#F1F5F9',
  overlay: 'rgba(15, 23, 42, 0.4)',
  skelton: '#E2E8F0',

  // Semantic
  success: '#16A34A',          // Green 600 - paid, in stock, profit
  successBg: '#F0FDF4',
  successLight: '#F0FDF4',
  warning: '#D97706',          // Amber 600 - partial, low stock, expiry
  warningBg: '#FFFBEB',
  warningLight: '#FFFBEB',
  danger: '#DC2626',           // Red 600 - unpaid, out of stock, overdue
  dangerBg: '#FEF2F2',
  error: '#DC2626',
  errorLight: '#FEF2F2',
  info: '#2563EB',             // Blue 600 - informational badges
  infoBg: '#EFF6FF',
  infoLight: '#EFF6FF',
  secondary: '#7C3AED',
  secondaryLight: '#EDE9FE',
  accent: '#7C3AED',
}

export const Spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 48,
}

export const BorderRadius = {
  xs: 6, sm: 8, md: 12, lg: 16, xl: 24, round: 999,
}

export const Shadows = {
  xs: { boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)' },
  sm: { boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)' },
  md: { boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)' },
  lg: { boxShadow: '0 10px 24px rgba(15, 23, 42, 0.12)' },
  focus: { boxShadow: '0 0 0 3px rgba(13, 148, 136, 0.25)' },
}
