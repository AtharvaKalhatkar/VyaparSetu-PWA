import { generateId } from './formatting'

export interface Company {
  id: string
  name: string
  businessName: string
  ownerName: string
  phone: string
  email: string
  address: string
  gstin: string
  pan: string
  bankName: string
  bankAccount: string
  bankIfsc: string
  signature: string
  createdAt: string
}

const COMPANIES_KEY = 'vs_companies'
const ACTIVE_KEY = 'vs_activeCompany'

function ls(): Storage {
  return localStorage
}

export function listCompanies(): Company[] {
  try {
    const r = ls().getItem(COMPANIES_KEY)
    return r ? JSON.parse(r) : []
  } catch {
    return []
  }
}

function saveCompanies(list: Company[]) {
  ls().setItem(COMPANIES_KEY, JSON.stringify(list))
}

export function saveCompany(c: Company): Company {
  const all = listCompanies().filter(x => x.id !== c.id)
  all.push(c)
  saveCompanies(all)
  return c
}

export function deleteCompany(id: string) {
  saveCompanies(listCompanies().filter(c => c.id !== id))
  if (getActiveCompanyId() === id) {
    const remaining = listCompanies()
    setActiveCompanyId(remaining.length > 0 ? remaining[0].id : null)
  }
}

export function byCompanyId(id: string): Company | undefined {
  return listCompanies().find(c => c.id === id)
}

export function getActiveCompanyId(): string | null {
  return ls().getItem(ACTIVE_KEY)
}

export function setActiveCompanyId(id: string | null) {
  if (id) ls().setItem(ACTIVE_KEY, id)
  else ls().removeItem(ACTIVE_KEY)
}

export function switchCompany(id: string | null) {
  setActiveCompanyId(id)
  window.location.reload()
}

export function getDefaultCompany(): Company {
  return {
    id: 'default',
    name: 'My Business',
    businessName: 'My Business',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    pan: '',
    bankName: '',
    bankAccount: '',
    bankIfsc: '',
    signature: '',
    createdAt: new Date().toISOString(),
  }
}

export function ensureCompany(): Company {
  let companies = listCompanies()
  if (companies.length === 0) {
    const def = getDefaultCompany()
    saveCompany(def)
    companies = [def]
  }
  const active = getActiveCompanyId()
  const found = active ? companies.find(c => c.id === active) : null
  if (!found) {
    setActiveCompanyId(companies[0].id)
    return companies[0]
  }
  return found
}

export function migrateLegacyData() {
  const companies = listCompanies()
  if (companies.length > 1) return
  const companyId = companies[0]?.id || 'default'
  const prefix = 'vs_'
  const targetPrefix = `vs_${companyId}_`
  const keys = ['parties', 'items', 'invoices', 'ledger', 'expenses', 'employees', 'crm', 'units', 'settings', 'bizProfile', 'stockAdj', 'bankAccounts', 'bankTxns', 'subscriptions', 'productions', 'deliveries', 'reminders', 'dashboardWidgets', 'lastBackup']
  let migrated = false
  for (const key of keys) {
    const legacy = ls().getItem(prefix + key)
    if (legacy) {
      const target = ls().getItem(targetPrefix + key)
      if (!target) {
        ls().setItem(targetPrefix + key, legacy)
      }
      migrated = true
    }
  }
  if (migrated && companies.length === 0) {
    saveCompany(getDefaultCompany())
    setActiveCompanyId('default')
  }
}
