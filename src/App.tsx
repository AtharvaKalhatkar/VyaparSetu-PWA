import React, { useState, useRef } from 'react'
import { Colors, Spacing } from './theme'
import { useAuth } from './store/auth'
import { seedData } from './utils/seed'
import { Header, TabBar, Drawer, PAGE_TITLES } from './pages/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { ToastProvider } from './utils/smooth'
import { Ledger } from './pages/Ledger'
import { Billing } from './pages/Billing'
import { Inventory } from './pages/Inventory'
import { InvoicesPage } from './pages/InvoicesPage'
import { Customers } from './pages/Customers'
import { Suppliers } from './pages/Suppliers'
import { Expenses } from './pages/Expenses'
import { EmployeesPage } from './pages/EmployeesPage'
import { Crm } from './pages/Crm'
import { Reports } from './pages/Reports'
import { AddParty } from './pages/AddParty'
import { AddPayment } from './pages/AddPayment'
import { AddEntry } from './pages/AddEntry'
import { AddItem } from './pages/AddItem'
import { Settings } from './pages/Settings'
import { PartyLedger } from './pages/PartyLedger'
import { UnitsPage } from './pages/UnitsPage'
import { InvoiceSettings } from './pages/InvoiceSettings'
import { InvoiceView } from './pages/InvoiceView'
import { StockAdjustment } from './pages/StockAdjustment'
import { StockSummary } from './pages/StockSummary'
import { BackupRestore } from './pages/BackupRestore'
import { FixedAssets } from './pages/FixedAssets'
import { PosBilling } from './pages/PosBilling'
import { Warehouses } from './pages/Warehouses'
import { StockTransfer } from './pages/StockTransfer'
import { AuditLog } from './pages/AuditLog'
import { CustomFields } from './pages/CustomFields'
import { PriceListsPage } from './pages/PriceListsPage'
import { BusinessProfile } from './pages/BusinessProfile'
import { SmartPurchase } from './pages/SmartPurchase'
import { OrdersPage } from './pages/OrdersPage'
import { EstimatesPage } from './pages/EstimatesPage'
import { ReturnsPage } from './pages/ReturnsPage'
import { ChallanPage } from './pages/ChallanPage'
import { DayBook } from './pages/DayBook'
import { ProfitLoss } from './pages/ProfitLoss'
import { BalanceSheet } from './pages/BalanceSheet'
import { GstReports } from './pages/GstReports'
import { BankAccounts } from './pages/BankAccounts'
import { DataExport } from './pages/DataExport'
import { BarcodePrint } from './pages/BarcodePrint'
import { AddPaymentOut } from './pages/AddPaymentOut'
import { OnlineStore } from './pages/OnlineStore'
import { SubscriptionsPage } from './pages/SubscriptionsPage'
import { ManufacturingPage } from './pages/ManufacturingPage'
import { DeliveriesPage } from './pages/DeliveriesPage'
import { RemindersPage } from './pages/RemindersPage'
import { ReceiptScanPage } from './pages/ReceiptScanPage'
import { PurchaseHome } from './pages/PurchaseHome'
import { Gstr2Matching } from './pages/Gstr2Matching'
import { TdsTcs } from './pages/TdsTcs'
import { StockTake } from './pages/StockTake'
import { DebitCreditNotes } from './pages/DebitCreditNotes'
import { VerticalProvider } from './context/VerticalContext'
import { CompanySwitcher } from './utils/CompanySwitcher'
import { migrateLegacyData, ensureCompany, byCompanyId, getActiveCompanyId } from './utils/company'
import { useKeyboardShortcuts } from './utils/useKeyboardShortcuts'

migrateLegacyData()
ensureCompany()
seedData()

const DM_KEY = 'vs_darkMode'
function getDarkMode(): boolean {
  try { return localStorage.getItem(DM_KEY) === 'true' }
  catch { return false }
}
function setDarkMode(v: boolean) {
  try { if (v) localStorage.setItem(DM_KEY, 'true'); else localStorage.removeItem(DM_KEY) }
  catch {}
}

const TAB_PAGES = ['dashboard', 'ledger', 'billing', 'inventory']

export default function App() {
  const { loggedIn, userName, login, logout } = useAuth()
  const [page, setPage] = useState('dashboard')
  const [history, setHistory] = useState<string[]>([])
  const [params, setParams] = useState<Record<string, string>>({})
  const [navDir, setNavDir] = useState<'forward' | 'back'>('forward')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showCompanySwitcher, setShowCompanySwitcher] = useState(false)
  const [darkMode, setDarkModeState] = useState(getDarkMode)
  const pageKey = useRef(0)

  const activeCompanyId = getActiveCompanyId()
  const activeCompany = activeCompanyId ? byCompanyId(activeCompanyId) : null

  const toggleDarkMode = (v: boolean) => { setDarkModeState(v); try { if (v) localStorage.setItem(DM_KEY, 'true'); else localStorage.removeItem(DM_KEY) } catch {} }

  const shortcuts = [
    { key: 'n', ctrl: true, label: 'New Invoice', action: () => navigate('billing') },
    { key: '/', ctrl: true, label: 'Search', action: () => { const s = document.querySelector<HTMLInputElement>('input[placeholder*="Search"]'); if (s) s.focus() } },
    { key: 'Escape', label: 'Go Back', action: () => { if (history.length > 0) goBack() } },
    { key: 'd', ctrl: true, label: 'Dashboard', action: () => navigate('dashboard') },
    { key: 'i', ctrl: true, label: 'Inventory', action: () => navigate('inventory') },
    { key: 'l', ctrl: true, label: 'Ledger', action: () => navigate('ledger') },
  ]
  const { helpOverlay: shortcutsHelp } = useKeyboardShortcuts(shortcuts)

  if (!loggedIn) return <Login onLogin={login} />

  const navigate = (p: string) => {
    const [route, qs] = p.split('?')
    if (!TAB_PAGES.includes(page) || !TAB_PAGES.includes(route)) setHistory(prev => [...prev, page])
    const pms: Record<string, string> = {}
    if (qs) qs.split('&').forEach(part => { const [k, v] = part.split('='); pms[k] = decodeURIComponent(v || '') })
    setParams(pms)
    setPage(route)
    setNavDir('forward')
    pageKey.current++
  }

  const goBack = () => {
    const [prev, ...rest] = history
    setHistory(rest)
    setPage(prev || 'dashboard')
    setNavDir('back')
    pageKey.current++
  }

  const isTab = TAB_PAGES.includes(page)
  const showBack = history.length > 0 && !isTab
  const title = PAGE_TITLES[page] || 'Vyapar Setu'

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard userName={userName} onNavigate={navigate} />
      case 'ledger': return <Ledger onNavigate={navigate} />
      case 'billing': return <Billing editId={params.editId} initialType={params.type as any} onBack={goBack} onNavigate={navigate} />
      case 'purchase': return <PurchaseHome onNavigate={navigate} />
      case 'inventory': return <Inventory onNavigate={navigate} />
      case 'reports': return <Reports onNavigate={navigate} />
      case 'customers': return <Customers onNavigate={navigate} />
      case 'suppliers': return <Suppliers onNavigate={navigate} />
      case 'expenses': return <Expenses onNavigate={navigate} />
      case 'employees': return <EmployeesPage onNavigate={navigate} />
      case 'crm': return <Crm />
      case 'invoices': return <InvoicesPage onNavigate={navigate} />
      case 'units': return <UnitsPage />
      case 'invoice-settings': return <InvoiceSettings />
      case 'stock-adjustment': return <StockAdjustment />
      case 'stock-summary': return <StockSummary />
      case 'backup-restore': return <BackupRestore />
      case 'fixed-assets': return <FixedAssets />
      case 'pos-billing': return <PosBilling onBack={goBack} />
      case 'warehouses': return <Warehouses onBack={goBack} />
      case 'stock-transfer': return <StockTransfer onBack={goBack} />
      case 'audit-log': return <AuditLog />
      case 'custom-fields': return <CustomFields onBack={goBack} />
      case 'price-lists': return <PriceListsPage onBack={goBack} />
      case 'business-profile': return <BusinessProfile onBack={goBack} onNavigate={navigate} />
      case 'smart-purchase': return <SmartPurchase />
      case 'orders': return <OrdersPage onNavigate={navigate} />
      case 'estimates': return <EstimatesPage onNavigate={navigate} />
      case 'returns': return <ReturnsPage onNavigate={navigate} sourceId={params.sourceId || ''} />
      case 'challans': return <ChallanPage onNavigate={navigate} />
      case 'daybook': return <DayBook onNavigate={navigate} />
      case 'profitloss': return <ProfitLoss onNavigate={navigate} />
      case 'gst-reports': return <GstReports onNavigate={navigate} />
      case 'balance-sheet': return <BalanceSheet />
      case 'bank-accounts': return <BankAccounts />
      case 'data-export': return <DataExport />
      case 'barcode-print': return <BarcodePrint onBack={goBack} />
      case 'invoice-view': return <InvoiceView invoiceId={params.id || ''} onNavigate={navigate} autoPrint={params.print === '1'} />
      case 'subscriptions': return <SubscriptionsPage onNavigate={navigate} />
      case 'manufacturing': return <ManufacturingPage onNavigate={navigate} />
      case 'deliveries': return <DeliveriesPage onNavigate={navigate} />
      case 'reminders': return <RemindersPage onNavigate={navigate} />
      case 'gstr2': return <Gstr2Matching />
      case 'tds-tcs': return <TdsTcs />
      case 'stock-take': return <StockTake />
      case 'debit-credit-notes': return <DebitCreditNotes />
      case 'receipt-scan': return <ReceiptScanPage onBack={goBack} />
      case 'online-store': return <OnlineStore />
      case 'add-party': return <AddParty editId={params.id} onBack={goBack} onNavigate={navigate} />
      case 'add-item': return <AddItem editId={params.id} onBack={goBack} onNavigate={navigate} onAddUnit={() => navigate('units')} />
      case 'add-payment': return <AddPayment onBack={goBack} onNavigate={navigate} invoiceId={params.id} />
      case 'add-payment-out': return <AddPaymentOut onBack={goBack} onNavigate={navigate} invoiceId={params.id} />
      case 'add-entry': return <AddEntry onBack={goBack} onNavigate={navigate} />
      case 'companies': return <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: Colors.textPrimary, marginBottom: Spacing.xs }}>Manage Companies</div>
        <p style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: Spacing.lg }}>Switch between companies or add a new one. Each company has its own data.</p>
        <CompanySwitcher open={true} onClose={() => navigate('settings')} onNavigate={navigate} />
      </div>
      case 'settings': return <Settings onNavigate={navigate} onLogout={() => { logout(); setPage('dashboard') }} isDarkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
      case 'party-ledger': return <PartyLedger partyId={params.partyId || ''} />
      default: return <Dashboard userName={userName} onNavigate={navigate} />
    }
  }

  return (
    <VerticalProvider>
    <ToastProvider>
    <div onClick={e => { const t = (e.target as HTMLElement).closest('[data-haptic]') as HTMLElement; if (t) try { navigator.vibrate?.(parseInt(t.dataset.haptic || '10') || 10) } catch {} }} style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: Colors.background }} className={darkMode ? 'vs-dark' : ''}>
      {page !== 'dashboard' && <Header title={title} onBack={showBack ? goBack : undefined}
        rightAction={activeCompany ? <button onClick={() => setShowCompanySwitcher(true)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, opacity: 0.9 }}>
          {activeCompany.name} <span style={{ fontSize: 8 }}>▼</span>
        </button> : undefined}
      />}
      <div key={pageKey.current} style={{
        flex: 1, overflow: 'auto',
        animation: navDir === 'forward' ? 'pageIn 0.3s ease-out' : 'pageOut 0.3s ease-out',
      }}>
        {renderPage()}
      </div>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onNavigate={navigate} userName={userName} onLogout={() => { logout(); setPage('dashboard'); setDrawerOpen(false) }}
        companyName={activeCompany?.name} onCompanySwitch={() => { setDrawerOpen(false); setShowCompanySwitcher(true) }}
      />
      <TabBar page={page} onNavigate={navigate} onMore={() => setDrawerOpen(true)} />
      <CompanySwitcher open={showCompanySwitcher} onClose={() => setShowCompanySwitcher(false)} />
      <style>{`
        @keyframes pageIn { from { opacity:0.5;transform:translateX(24px) } to { opacity:1;transform:translateX(0) } }
        @keyframes pageOut { from { opacity:0.5;transform:translateX(-24px) } to { opacity:1;transform:translateX(0) } }
        .vs-dark { filter: invert(0.9) hue-rotate(180deg); }
        .vs-dark img, .vs-dark video, .vs-dark [class*="avatar"], .vs-dark [style*="background-image"] { filter: invert(1) hue-rotate(-180deg); }
        @media print {
          .no-print { display: none !important; }
          body { background: white; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      {shortcutsHelp}
    </div>
    </ToastProvider>
    </VerticalProvider>
  )
}
