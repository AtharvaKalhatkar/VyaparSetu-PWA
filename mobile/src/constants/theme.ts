export const Colors = {
  // Brand & Primary Actions
  primary: '#0D9488',          // Header, active nav icon, links
  primaryLight: '#DFF7F0',     // Light mint tint
  primaryDark: '#0F3D3A',      // Dark teal header/banner background

  // Secondary CTA & Accent
  secondary: '#7C3AED',        // Secondary CTA (primary buttons like "New sale")
  secondaryLight: '#EDE9FE',   // Pastel violet chip
  accent: '#7C3AED',           // Accent violet
  accentLight: '#EDE9FE',      // Accent light violet tint

  // Success / FAB
  success: '#059669',          // FAB & success green
  successLight: '#E4F8E1',     // "To collect" bg tint
  successText: '#4CA82F',      // "To collect" text

  // Error / Expense / To Pay
  error: '#E1416B',            // Expense / To pay red
  errorLight: '#FFE9EE',       // "To pay" bg tint

  // Warning / Low Stock
  warning: '#D97706',          // Warning / Low stock amber
  warningLight: '#FEF3C7',     // Pastel amber chip

  // Promo Banner
  bannerBg: '#0F3D3A',         // Dark teal background
  bannerAccent: '#6EE7C8',     // Mint accent icon

  // Info & Status Badges
  info: '#0D9488',            // Info teal
  infoLight: '#DFF7F0',       // Info light mint tint

  // Pastel Action Chips
  roseLight: '#FFE4E6',
  indigoLight: '#E0E7FF',
  violetLight: '#EDE9FE',
  mintLight: '#D1FAE5',

  // Layout & Backgrounds
  background: '#F4FBF8',       // Soft mint page background
  surface: '#FFFFFF',          // Crisp white card surface
  textPrimary: '#111827',      // Primary body text
  textSecondary: '#6B7280',    // Secondary body text
  textDisabled: '#9CA3AF',     // Inactive nav icon / disabled text
  textLight: '#FFFFFF',

  // Borders & Dividers
  border: '#E5E7EB',          // 0.5-1px light card border
  divider: '#F3F4F6',
  overlay: 'rgba(15, 61, 58, 0.5)',
  statusBar: '#0D9488',
};

export const DarkColors = {
  primary: '#4CAF50',
  primaryLight: '#81C784',
  primaryDark: '#1B5E20',
  secondary: '#FFB74D',
  secondaryLight: '#FFE0B2',
  accent: '#42A5F5',
  accentLight: '#90CAF9',
  background: '#121212',
  surface: '#1E1E1E',
  error: '#EF5350',
  errorLight: '#FFCDD2',
  success: '#66BB6A',
  successLight: '#C8E6C9',
  warning: '#FFA726',
  warningLight: '#FFE0B2',
  info: '#42A5F5',
  infoLight: '#BBDEFB',
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textLight: '#FFFFFF',
  textDisabled: '#616161',
  border: '#333333',
  divider: '#2C2C2C',
  overlay: 'rgba(0,0,0,0.7)',
  statusBar: '#000000',
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  h2: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  h4: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body1: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  body2: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  overline: { fontSize: 10, fontWeight: '500' as const, letterSpacing: 1.5 },
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};
