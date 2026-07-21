import { Colors } from '../theme'
import { Icons } from '../utils/Icons'
import type { VerticalConfig } from './types'

const allModules = [
  'reports', 'customers', 'suppliers', 'expenses', 'employees', 'crm',
  'invoices', 'stock-adjustment', 'smart-purchase', 'units', 'business-profile',
  'invoice-settings', 'orders', 'estimates', 'returns', 'challans',
  'daybook', 'profitloss', 'gst-reports', 'bank-accounts', 'data-export', 'settings',
  'subscriptions', 'manufacturing', 'deliveries', 'reminders',
  'purchase', 'receipt-scan', 'stock-summary', 'fixed-assets', 'pos-billing',
  'warehouses', 'stock-transfer', 'audit-log', 'custom-fields', 'price-lists',
  'backup-restore', 'barcode-print', 'gstr2', 'tds-tcs', 'stock-take', 'debit-credit-notes',
]

const allDashboardWidgets = ['todaySales', 'outstanding', 'dueInvoices', 'lowStock', 'salesTrend', 'duePayments', 'recentInvoices', 'quickActions']

export const defaultConfig: VerticalConfig = {
  id: 'RETAIL',
  label: 'Retail Store',
  enabledModules: allModules,
  enableGst: true,
  itemFields: { batchExpiry: 'optional', warehouseRack: 'optional', brand: 'optional', mrp: 'optional' },
  partyFields: { gstin: 'optional', creditTerms: 'optional' },
  terms: {},
  defaultCategories: ['Raw Material', 'Finished Good', 'Consumable', 'Service', 'Accessory', 'Spare Part', 'Packaging'],
  defaultGstRate: 12,
  dashboardWidgets: allDashboardWidgets,
}