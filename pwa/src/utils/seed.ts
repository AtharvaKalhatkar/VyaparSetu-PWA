import { DB, getStorageKey } from './storage'
import { byCompanyId, getActiveCompanyId } from './company'
import type { Unit } from '../types'

export function seedData() {
  const seededKey = getStorageKey('seeded')
  if (localStorage.getItem(seededKey)) return
  localStorage.setItem(seededKey, 'true')

  // Only seed standard measurement units for standard operation
  const units: Unit[] = [
    { id: 'u1', name: 'Piece', shortName: 'Pcs', isActive: true },
    { id: 'u2', name: 'Kilogram', shortName: 'Kg', isActive: true },
    { id: 'u3', name: 'Bag', shortName: 'Bag', isActive: true },
    { id: 'u4', name: 'Box', shortName: 'Box', isActive: true },
    { id: 'u5', name: 'Meter', shortName: 'Mtr', isActive: true },
    { id: 'u6', name: 'Litre', shortName: 'Ltr', isActive: true },
    { id: 'u7', name: 'Pair', shortName: 'Pr', isActive: true },
    { id: 'u8', name: 'Dozen', shortName: 'Dzn', isActive: true },
    { id: 'u9', name: 'Pack', shortName: 'Pk', isActive: true },
    { id: 'u10', name: 'Ton', shortName: 'Ton', isActive: true },
  ]
  units.forEach(u => DB.units.save(u))

  DB.settings.save({
    prefix: 'INV',
    template: 'STANDARD',
    defaultTerms: 'Payment due upon receipt',
    enableGst: true,
    themeColor: '#1B5E20',
    showLogo: false,
    showBank: true,
    showSignature: true,
    paperSize: 'A4',
    currency: 'INR',
    currencySymbol: '₹',
    roundOff: false,
    lateFeePercent: 0
  })

  const company = getActiveCompanyId() ? byCompanyId(getActiveCompanyId()!) : null
  DB.businessProfile.save({
    businessName: company?.businessName || company?.name || '',
    ownerName: company?.ownerName || '',
    phone: company?.phone || '',
    email: company?.email || '',
    address: company?.address || '',
    gstin: company?.gstin || '',
    pan: company?.pan || '',
    bankName: company?.bankName || '',
    bankAccount: company?.bankAccount || '',
    bankIfsc: company?.bankIfsc || '',
    signature: company?.signature || '',
  })
}

export function clearAllDummyData() {
  const keysToClear = [
    'vs_parties',
    'vs_items',
    'vs_invoices',
    'vs_ledger',
    'vs_expenses',
    'vs_employees',
    'vs_crm',
    'vs_bankTxns',
    'vs_stockAdjustments',
    'vs_seeded'
  ]
  keysToClear.forEach(k => localStorage.removeItem(k))
  seedData()
}
