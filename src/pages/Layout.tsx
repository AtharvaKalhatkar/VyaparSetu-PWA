import { useVertical } from '../context/VerticalContext'
import { Colors, Spacing, BorderRadius, Shadows } from '../theme'
import { Icons } from '../utils/Icons'
import { useAuth } from '../store/auth'
import { DB } from '../utils/storage'
import { formatCurrency } from '../utils/formatting'

export const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard', ledger: 'Ledger', billing: 'Billing',
  inventory: 'Inventory', reports: 'Reports', customers: 'Customers',
  suppliers: 'Suppliers', expenses: 'Expenses', employees: 'Employees',
  crm: 'CRM', settings: 'Settings', invoices: 'Invoices',
  'add-party': 'Add Party',   'add-payment': 'Record Payment',
  'add-payment-out': 'Make Payment',
  'add-entry': 'Add Entry', 'add-item': 'Add Item', more: 'More', 'party-ledger': 'Party Ledger',
  'units': 'Units', 'invoice-settings': 'Invoice Settings', 'invoice-view': 'Invoice',
  'stock-adjustment': 'Stock Adjustment', 'stock-summary': 'Stock Summary', 'business-profile': 'Business Profile',
  'backup-restore': 'Backup & Restore', 'fixed-assets': 'Fixed Assets', 'pos-billing': 'POS Billing',
  'warehouses': 'Warehouses', 'stock-transfer': 'Stock Transfer', 'audit-log': 'Audit Trail',
  'custom-fields': 'Custom Fields', 'price-lists': 'Price Lists',
  'smart-purchase': 'Smart Purchase',
  orders: 'Orders', estimates: 'Estimates', returns: 'Returns',
  challans: 'Load Sheet', daybook: 'Day Book', profitloss: 'P&L',
  'gst-reports': 'GST Reports', 'balance-sheet': 'Balance Sheet', 'bank-accounts': 'Bank & Cash',
  'data-export': 'Import / Export',
  'barcode-print': 'Print Barcode',
  subscriptions: 'Subscriptions', manufacturing: 'Manufacturing',
  deliveries: 'Deliveries', reminders: 'Payment Reminders',
  'receipt-scan': 'Receipt Scan',
  'online-store': 'Online Store',
  'purchase': 'New Purchase',
  'gstr2': 'GSTR-2 Matching',
  'tds-tcs': 'TDS / TCS',
  'stock-take': 'Stock Take',
  'debit-credit-notes': 'Debit & Credit Notes',
  companies: 'Manage Companies',
}

const TAB_ITEMS = [
  { key: 'dashboard', label: 'Home', icon: Icons.Home },
  { key: 'inventory', label: 'Items', icon: Icons.Inventory },
  { key: 'billing', label: 'Sale', icon: Icons.Billing },
  { key: 'ledger', label: 'Parties', icon: Icons.People },
  { key: 'more', label: 'More', icon: Icons.More },
]

const MENU_SECTIONS = [
  {
    label: 'Transactions', items: [
      { key: 'purchase', label: 'Purchase', icon: Icons.Truck, color: Colors.warning },
      { key: 'invoices', label: 'Invoices', icon: Icons.Invoice, color: Colors.accent },
      { key: 'orders', label: 'Orders', icon: Icons.Cart, color: '#2563EB' },
      { key: 'estimates', label: 'Estimates', icon: Icons.Edit, color: '#7C3AED' },
      { key: 'returns', label: 'Returns', icon: Icons.Refresh, color: '#DC2626' },
      { key: 'challans', label: 'Load Sheet', icon: Icons.Truck, color: '#D97706' },
      { key: 'subscriptions', label: 'Subscriptions', icon: Icons.Refresh, color: '#059669' },
      { key: 'debit-credit-notes', label: 'Debit & Credit Notes', icon: Icons.Edit, color: '#DC2626' },
    ]
  },
  {
    label: 'Business', items: [
      { key: 'customers', label: 'Customers', icon: Icons.People, color: Colors.accent },
      { key: 'suppliers', label: 'Suppliers', icon: Icons.Truck, color: Colors.warning },
      { key: 'expenses', label: 'Expenses', icon: Icons.Expense, color: Colors.error },
      { key: 'employees', label: 'Employees', icon: Icons.Employee, color: '#7C3AED' },
      { key: 'crm', label: 'CRM', icon: Icons.Star, color: '#EC4899' },
    ]
  },
  {
    label: 'Reports', items: [
      { key: 'reports', label: 'Reports', icon: Icons.Reports, color: Colors.primary },
      { key: 'stock-summary', label: 'Stock Summary', icon: Icons.Reports, color: Colors.primary },
      { key: 'fixed-assets', label: 'Fixed Assets', icon: Icons.Building, color: '#7C3AED' },
      { key: 'audit-log', label: 'Audit Trail', icon: Icons.Book, color: '#059669' },
      { key: 'daybook', label: 'Day Book', icon: Icons.Book, color: '#059669' },
      { key: 'profitloss', label: 'P&L', icon: Icons.Trending, color: '#2563EB' },
      { key: 'gst-reports', label: 'GST Reports', icon: Icons.Document, color: '#7C3AED' },
      { key: 'bank-accounts', label: 'Bank & Cash', icon: Icons.Bank, color: '#059669' },
      { key: 'balance-sheet', label: 'Balance Sheet', icon: Icons.Book, color: Colors.primary },
      { key: 'gstr2', label: 'GSTR-2 Matching', icon: Icons.Document, color: '#7C3AED' },
      { key: 'tds-tcs', label: 'TDS / TCS', icon: Icons.Money, color: '#DC2626' },
    ]
  },
  {
    label: 'Operations', items: [
      { key: 'manufacturing', label: 'Manufacturing', icon: Icons.Transfer, color: '#7C3AED' },
      { key: 'stock-adjustment', label: 'Stock Adjustment', icon: Icons.Transfer, color: Colors.success },
      { key: 'stock-transfer', label: 'Stock Transfer', icon: Icons.Transfer, color: Colors.accent },
      { key: 'stock-take', label: 'Stock Take', icon: Icons.Transfer, color: Colors.error },
      { key: 'warehouses', label: 'Warehouses', icon: Icons.Building, color: Colors.primary },
      { key: 'deliveries', label: 'Deliveries', icon: Icons.Truck, color: '#D97706' },
    ]
  },
  {
    label: 'Tools', items: [
      { key: 'smart-purchase', label: 'Smart Purchase (OCR)', icon: Icons.Barcode, color: Colors.primary },
      { key: 'receipt-scan', label: 'Receipt Scan', icon: Icons.Barcode, color: Colors.accent },
      { key: 'online-store', label: 'Online Store', icon: Icons.Star, color: '#EC4899' },
      { key: 'units', label: 'Units', icon: Icons.Unit, color: '#7C3AED' },
      { key: 'barcode-print', label: 'Print Barcode', icon: Icons.Barcode, color: Colors.primary },
      { key: 'pos-billing', label: 'POS Billing', icon: Icons.Billing, color: Colors.success },
      { key: 'price-lists', label: 'Price Lists', icon: Icons.Money, color: Colors.accent },
      { key: 'custom-fields', label: 'Custom Fields', icon: Icons.Add, color: '#7C3AED' },
      { key: 'backup-restore', label: 'Backup & Restore', icon: Icons.Download, color: Colors.primary },
      { key: 'reminders', label: 'Payment Reminders', icon: Icons.Bell, color: '#EC4899' },
      { key: 'data-export', label: 'Import / Export', icon: Icons.Download, color: '#DC2626' },
    ]
  },
  {
    label: 'Settings', items: [
      { key: 'business-profile', label: 'Business Profile', icon: Icons.Building, color: Colors.primaryDark },
      { key: 'invoice-settings', label: 'Invoice Settings', icon: Icons.Settings, color: Colors.primary },
      { key: 'settings', label: 'App Settings', icon: Icons.Settings, color: Colors.textSecondary },
    ]
  },
]

export function TabBar({ page, onNavigate, onMore }: { page: string; onNavigate: (p: string) => void; onMore?: () => void }) {
  return (
    <div className="no-print" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      display: 'flex', backgroundColor: '#FFFFFF',
      borderTop: '1px solid #E5E7EB', zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom, 4px)',
      boxShadow: '0 -2px 10px rgba(0,0,0,0.06)',
    }}>
      {TAB_ITEMS.map(t => {
        const active = page === t.key
        return (
          <button key={t.key} onClick={() => t.key === 'more' ? onMore?.() : onNavigate(t.key)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '8px 0 6px', border: 'none', background: 'none', cursor: 'pointer', gap: 2,
            color: active ? '#2B5DC2' : '#9CA3AF',
            transition: 'color 0.15s',
          }}>
            <t.icon size={active ? 24 : 22} />
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function Drawer({ open, onClose, onNavigate, userName, onLogout, companyName, onCompanySwitch }: { open: boolean; onClose: () => void; onNavigate: (p: string) => void; userName: string; onLogout: () => void; companyName?: string; onCompanySwitch?: () => void }) {
  const config = useVertical()
  const invoices = DB.invoices.list()
  const todaySales = invoices.filter(i => i.date === new Date().toISOString().split('T')[0]).reduce((s, i) => s + i.grandTotal, 0)
  const outstanding = invoices.filter(i => i.paymentStatus !== 'PAID').reduce((s, i) => s + i.dueAmount, 0)

  return (
    <>
      {open && <div className="no-print" onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 300, animation: 'drFadeIn 0.2s' }} />}
      <div className="no-print" style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 'min(320px, 80vw)',
        backgroundColor: Colors.surface, zIndex: 301, overflow: 'auto',
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: open ? '4px 0 20px rgba(0,0,0,0.15)' : 'none',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '20px 16px', background: `linear-gradient(135deg, ${Colors.primary}, ${Colors.primaryDark})`, color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff' }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{userName}</div>
            </div>
            <button onClick={onClose} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 20, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Icons.Close size={18} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: BorderRadius.sm, padding: '8px 10px' }}>
              <div style={{ fontSize: 10, opacity: 0.7 }}>Today's Sale</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{formatCurrency(todaySales)}</div>
            </div>
            <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: BorderRadius.sm, padding: '8px 10px' }}>
              <div style={{ fontSize: 10, opacity: 0.7 }}>Outstanding</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{formatCurrency(outstanding)}</div>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 0' }}>
          {MENU_SECTIONS.map(section => {
            const items = section.items.filter(i => config.enabledModules.includes(i.key))
            if (items.length === 0) return null
            return (
              <div key={section.label} style={{ marginBottom: 8 }}>
                <div style={{ padding: '4px 16px', fontSize: 10, fontWeight: 700, color: Colors.textDisabled, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>{section.label}</div>
                {items.map(item => (
                  <button key={item.key} onClick={() => { onNavigate(item.key); onClose() }} style={{
                    display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 16px',
                    border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: Colors.textPrimary, textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = Colors.surfaceVariant}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: item.color + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <item.icon size={16} color={item.color} />
                    </div>
                    <span style={{ flex: 1, fontWeight: 500 }}>{item.label}</span>
                  </button>
                ))}
              </div>
            )
          })}
        </div>
        {companyName && <div style={{ padding: '8px 16px', borderTop: `1px solid ${Colors.divider}` }}>
          <button onClick={onCompanySwitch} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: Colors.textSecondary, borderRadius: BorderRadius.sm }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = Colors.surfaceVariant}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <Icons.Building size={16} /> <span style={{ flex: 1, fontWeight: 500 }}>{companyName}</span> <span style={{ fontSize: 16 }}>›</span>
          </button>
        </div>}
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${Colors.divider}` }}>
          <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: Colors.error, borderRadius: BorderRadius.sm }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = Colors.errorLight}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <Icons.Delete size={18} /> Logout
          </button>
        </div>
      </div>
      <style>{`@keyframes drFadeIn { from { opacity:0 } to { opacity:1 } }`}</style>
    </>
  )
}

export function MoreMenu({ onNavigate }: { onNavigate: (p: string) => void }) {
  const config = useVertical()
  const allItems = MENU_SECTIONS.flatMap(s => s.items).filter(i => config.enabledModules.includes(i.key))
  return (
    <div style={{ padding: Spacing.lg }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: Colors.textPrimary, marginBottom: Spacing.lg }}>All Menu</div>
      {allItems.map(item => (
        <button key={item.key} onClick={() => onNavigate(item.key)} style={{
          display: 'flex', alignItems: 'center', gap: Spacing.md, width: '100%', padding: '14px 16px',
          backgroundColor: Colors.surface, border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.md,
          marginBottom: Spacing.sm, cursor: 'pointer', fontSize: 14, color: Colors.textPrimary, textAlign: 'left',
        }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: item.color + '12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <item.icon size={20} color={item.color} />
          </div>
          <span style={{ flex: 1, fontWeight: 500 }}>{item.label}</span>
          <span style={{ color: Colors.textDisabled, fontSize: 18 }}>›</span>
        </button>
      ))}
    </div>
  )
}

export function Header({ title, onBack, rightAction }: { title: string; onBack?: () => void; rightAction?: React.ReactNode }) {
  return (
    <div className="no-print" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 16px',
      background: `linear-gradient(135deg, #2B5DC2 0%, #1E4BA8 100%)`,
      position: 'sticky', top: 0,
      minHeight: 56, zIndex: 50,
      boxShadow: '0 2px 8px rgba(43,93,194,0.25)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm }}>
        {onBack && <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center' }}><Icons.Back size={22} /></button>}
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.3px' }}>{title}</h1>
      </div>
      {rightAction && <div style={{ color: '#fff' }}>{rightAction}</div>}
    </div>
  )
}
