import type { Party, Item, Invoice, LedgerEntry, Expense, Employee, CrmLead, Unit, InvoiceSettings, BusinessProfile, StockAdjustment, BankAccount, BankTransaction, Subscription, ProductionBatch, Delivery, ReminderLog, FixedAsset, AuditLog, Warehouse, CustomFieldDef, StockTransfer, PriceListDef } from '../types'
import { getActiveCompanyId } from './company'

function scopeKey(key: string): string {
  const cid = getActiveCompanyId()
  return cid ? `vs_${cid}_${key}` : `vs_${key}`
}

function get<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(scopeKey(key)); return r ? JSON.parse(r) : fallback }
  catch (e) { console.error('Storage read error for', key, e); return fallback }
}
function set<T>(key: string, val: T) {
  try { localStorage.setItem(scopeKey(key), JSON.stringify(val)) }
  catch (e) { console.error('Storage write error for', key, e) }
}

export const DB = {
  parties: {
    list: () => get<Party[]>('parties', []),
    save: (p: Party) => { const all = DB.parties.list().filter(x => x.id !== p.id); all.push(p); set('parties', all); return p },
    byId: (id: string) => DB.parties.list().find(p => p.id === id),
    delete: (id: string) => set('parties', DB.parties.list().filter(p => p.id !== id)),
  },
  items: {
    list: () => get<Item[]>('items', []),
    save: (i: Item) => { const all = DB.items.list().filter(x => x.id !== i.id); all.push(i); set('items', all); return i },
    byId: (id: string) => DB.items.list().find(i => i.id === id),
    delete: (id: string) => set('items', DB.items.list().filter(i => i.id !== id)),
  },
  invoices: {
    list: () => get<Invoice[]>('invoices', []),
    save: (inv: Invoice) => { const all = DB.invoices.list().filter(x => x.id !== inv.id); all.push(inv); set('invoices', all); return inv },
    byId: (id: string) => DB.invoices.list().find(i => i.id === id),
    delete: (id: string) => set('invoices', DB.invoices.list().filter(i => i.id !== id)),
  },
  ledger: {
    list: () => get<LedgerEntry[]>('ledger', []),
    save: (e: LedgerEntry) => { const all = DB.ledger.list().filter(x => x.id !== e.id); all.push(e); set('ledger', all); return e },
    delete: (id: string) => set('ledger', DB.ledger.list().filter(e => e.id !== id)),
    forParty: (partyId: string) => DB.ledger.list().filter(e => e.partyId === partyId).sort((a, b) => a.date.localeCompare(b.date)),
  },
  expenses: {
    list: () => get<Expense[]>('expenses', []),
    save: (e: Expense) => { const all = DB.expenses.list().filter(x => x.id !== e.id); all.push(e); set('expenses', all); return e },
    byId: (id: string) => DB.expenses.list().find(e => e.id === id),
    delete: (id: string) => set('expenses', DB.expenses.list().filter(e => e.id !== id)),
  },
  employees: {
    list: () => get<Employee[]>('employees', []),
    save: (e: Employee) => { const all = DB.employees.list().filter(x => x.id !== e.id); all.push(e); set('employees', all); return e },
    byId: (id: string) => DB.employees.list().find(e => e.id === id),
    delete: (id: string) => set('employees', DB.employees.list().filter(e => e.id !== id)),
  },
  crm: {
    list: () => get<CrmLead[]>('crm', []),
    save: (l: CrmLead) => { const all = DB.crm.list().filter(x => x.id !== l.id); all.push(l); set('crm', all); return l },
    byId: (id: string) => DB.crm.list().find(l => l.id === id),
    delete: (id: string) => set('crm', DB.crm.list().filter(l => l.id !== id)),
  },
  units: {
    list: () => get<Unit[]>('units', []),
    save: (u: Unit) => { const all = DB.units.list().filter(x => x.id !== u.id); all.push(u); set('units', all); return u },
    byId: (id: string) => DB.units.list().find(u => u.id === id),
    delete: (id: string) => set('units', DB.units.list().filter(u => u.id !== id)),
  },
  settings: {
    get: () => get<InvoiceSettings>('settings', { prefix: 'INV', template: 'STANDARD', defaultTerms: 'Payment due in 30 days', enableGst: true, themeColor: '#1B5E20', showLogo: true, showBank: true, showSignature: true, paperSize: 'A4', currency: 'INR', currencySymbol: '₹', roundOff: false, lateFeePercent: 0 }),
    save: (s: InvoiceSettings) => { set('settings', s); return s },
  },
  businessProfile: {
    get: () => get<BusinessProfile>('bizProfile', { businessName: '', ownerName: '', phone: '', email: '', address: '', gstin: '', pan: '', bankName: '', bankAccount: '', bankIfsc: '', signature: '' }),
    save: (p: BusinessProfile) => { set('bizProfile', p); return p },
  },
  stockAdjustments: {
    list: () => get<StockAdjustment[]>('stockAdj', []),
    save: (a: StockAdjustment) => { const all = DB.stockAdjustments.list().filter(x => x.id !== a.id); all.push(a); set('stockAdj', all); return a },
    delete: (id: string) => set('stockAdj', DB.stockAdjustments.list().filter(a => a.id !== id)),
  },
  bankAccounts: {
    list: () => get<BankAccount[]>('bankAccounts', [
      { id: 'b1', name: 'Cash in Hand', type: 'CASH', balance: 25000, isDefault: true, isActive: true },
      { id: 'b2', name: 'SBI Current', type: 'BANK', accountNo: '1234567890', ifsc: 'SBIN001234', holderName: 'Business', balance: 150000, isDefault: false, isActive: true },
    ]),
    save: (a: BankAccount) => { const all = DB.bankAccounts.list().filter(x => x.id !== a.id); all.push(a); set('bankAccounts', all); return a },
    byId: (id: string) => DB.bankAccounts.list().find(a => a.id === id),
    delete: (id: string) => set('bankAccounts', DB.bankAccounts.list().filter(a => a.id !== id)),
  },
  bankTransactions: {
    list: () => get<BankTransaction[]>('bankTxns', []),
    save: (t: BankTransaction) => { const all = DB.bankTransactions.list().filter(x => x.id !== t.id); all.push(t); set('bankTxns', all); return t },
    forAccount: (id: string) => DB.bankTransactions.list().filter(t => t.accountId === id).sort((a, b) => b.date.localeCompare(a.date)),
  },
  subscriptions: {
    list: () => get<Subscription[]>('subscriptions', []),
    save: (s: Subscription) => { const all = DB.subscriptions.list().filter(x => x.id !== s.id); all.push(s); set('subscriptions', all); return s },
    byId: (id: string) => DB.subscriptions.list().find(s => s.id === id),
    delete: (id: string) => set('subscriptions', DB.subscriptions.list().filter(s => s.id !== id)),
  },
  productions: {
    list: () => get<ProductionBatch[]>('productions', []),
    save: (p: ProductionBatch) => { const all = DB.productions.list().filter(x => x.id !== p.id); all.push(p); set('productions', all); return p },
    byId: (id: string) => DB.productions.list().find(p => p.id === id),
    delete: (id: string) => set('productions', DB.productions.list().filter(p => p.id !== id)),
  },
  deliveries: {
    list: () => get<Delivery[]>('deliveries', []),
    save: (d: Delivery) => { const all = DB.deliveries.list().filter(x => x.id !== d.id); all.push(d); set('deliveries', all); return d },
    byId: (id: string) => DB.deliveries.list().find(d => d.id === id),
    delete: (id: string) => set('deliveries', DB.deliveries.list().filter(d => d.id !== id)),
  },
  reminders: {
    list: () => get<ReminderLog[]>('reminders', []),
    save: (r: ReminderLog) => { const all = DB.reminders.list().filter(x => x.id !== r.id); all.push(r); set('reminders', all); return r },
    delete: (id: string) => set('reminders', DB.reminders.list().filter(r => r.id !== id)),
  },
  fixedAssets: {
    list: () => get<FixedAsset[]>('fixedAssets', []),
    save: (a: FixedAsset) => { const all = DB.fixedAssets.list().filter(x => x.id !== a.id); all.push(a); set('fixedAssets', all); return a },
    byId: (id: string) => DB.fixedAssets.list().find(a => a.id === id),
    delete: (id: string) => set('fixedAssets', DB.fixedAssets.list().filter(a => a.id !== id)),
  },
  auditLogs: {
    list: () => get<AuditLog[]>('auditLogs', []),
    save: (l: AuditLog) => { const all = DB.auditLogs.list().filter(x => x.id !== l.id); all.push(l); set('auditLogs', all); return l },
  },
  warehouses: {
    list: () => get<Warehouse[]>('warehouses', []),
    save: (w: Warehouse) => { const all = DB.warehouses.list().filter(x => x.id !== w.id); all.push(w); set('warehouses', all); return w },
    byId: (id: string) => DB.warehouses.list().find(w => w.id === id),
    delete: (id: string) => set('warehouses', DB.warehouses.list().filter(w => w.id !== id)),
  },
  customFields: {
    list: () => get<CustomFieldDef[]>('customFields', []),
    save: (c: CustomFieldDef) => { const all = DB.customFields.list().filter(x => x.id !== c.id); all.push(c); set('customFields', all); return c },
    delete: (id: string) => set('customFields', DB.customFields.list().filter(c => c.id !== id)),
    forEntity: (entity: string) => DB.customFields.list().filter(c => c.entity === entity && c.isActive),
  },
  stockTransfers: {
    list: () => get<StockTransfer[]>('stockTransfers', []),
    save: (t: StockTransfer) => { const all = DB.stockTransfers.list().filter(x => x.id !== t.id); all.push(t); set('stockTransfers', all); return t },
    delete: (id: string) => set('stockTransfers', DB.stockTransfers.list().filter(t => t.id !== id)),
  },
  priceLists: {
    list: () => get<PriceListDef[]>('priceLists', [
      { id: 'default', name: 'Default', isDefault: true },
    ]),
    save: (p: PriceListDef) => { const all = DB.priceLists.list().filter(x => x.id !== p.id); all.push(p); set('priceLists', all); return p },
    byId: (id: string) => DB.priceLists.list().find(p => p.id === id),
    delete: (id: string) => set('priceLists', DB.priceLists.list().filter(p => p.id !== id)),
  },
}
