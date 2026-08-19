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
  const scopedPrefix = `vs_${id}_`
  const keysToRemove: string[] = []
  for (let i = 0; i < ls().length; i++) {
    const key = ls().key(i)
    if (key?.startsWith(scopedPrefix)) keysToRemove.push(key)
  }
  keysToRemove.forEach(k => ls().removeItem(k))
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

export function migrateLegacyLocalData() {
  if (ls().getItem('vs_legacy_migrated_v4') === 'true') return
  try {
    const legacyKeys = [
      'parties', 'items', 'invoices', 'ledger', 'expenses', 'employees', 'crm',
      'units', 'settings', 'bizProfile', 'stockAdj', 'bankAccounts', 'bankTxns',
      'subscriptions', 'productions', 'deliveries', 'reminders', 'fixedAssets',
      'auditLogs', 'warehouses', 'customFields', 'stockTransfers', 'priceLists',
      'brands', 'tdsTcsEntries', 'debitCreditNotes', 'eway_bills', 'seeded',
    ]

    const targetCompanyId = getActiveCompanyId() || 'default'
    legacyKeys.forEach(key => {
      const legacyKey = `vs_${key}`
      const scopedKey = `vs_${targetCompanyId}_${key}`
      const legacyValue = ls().getItem(legacyKey)
      if (legacyValue !== null && ls().getItem(scopedKey) === null) {
        ls().setItem(scopedKey, legacyValue)
      }
    })

    if (listCompanies().length === 0) {
      const profileRaw = ls().getItem('vs_bizProfile')
      const profile = profileRaw ? JSON.parse(profileRaw) : null
      saveCompany({
        ...getDefaultCompany(),
        id: targetCompanyId,
        name: profile?.businessName || 'My Business',
        businessName: profile?.businessName || 'My Business',
        ownerName: profile?.ownerName || '',
        phone: profile?.phone || '',
        email: profile?.email || '',
        address: profile?.address || '',
        gstin: profile?.gstin || '',
        pan: profile?.pan || '',
        bankName: profile?.bankName || '',
        bankAccount: profile?.bankAccount || '',
        bankIfsc: profile?.bankIfsc || '',
        signature: profile?.signature || '',
      })
      setActiveCompanyId(targetCompanyId)
    }

    ls().setItem('vs_legacy_migrated_v4', 'true')
  } catch (e) {
    console.error('Legacy migration error', e)
  }
}

export function migrateLegacyData() {
  migrateLegacyLocalData()
}
