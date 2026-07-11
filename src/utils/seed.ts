import { DB } from './storage'
import { generateId } from './formatting'
import type { Party, Item, Invoice, LedgerEntry, Expense, Employee, CrmLead, Unit } from '../types'

export function seedData() {
  if (localStorage.getItem('vs_seeded')) return
  localStorage.setItem('vs_seeded', 'true')

  const parties: Party[] = [
    { id: 'p1', name: 'Rajesh Traders', phone: '9876543210', type: 'CUSTOMER', openingBalance: 0, balanceType: 'DEBIT', creditLimit: 50000, creditDays: 30, isActive: true, createdAt: '2026-01-15' },
    { id: 'p2', name: 'Priya Enterprises', phone: '9876543211', email: 'priya@email.com', type: 'CUSTOMER', openingBalance: 2500, balanceType: 'DEBIT', creditLimit: 100000, creditDays: 45, isActive: true, createdAt: '2026-02-20' },
    { id: 'p3', name: 'Amar Steel Works', phone: '9876543212', type: 'SUPPLIER', openingBalance: 0, balanceType: 'CREDIT', creditLimit: 200000, creditDays: 30, isActive: true, createdAt: '2026-01-10' },
    { id: 'p4', name: 'Sita General Store', phone: '9876543213', type: 'CUSTOMER', openingBalance: 1200, balanceType: 'DEBIT', creditLimit: 25000, creditDays: 15, isActive: true, createdAt: '2026-03-05' },
    { id: 'p5', name: 'Vikram Pharma', phone: '9876543214', gstin: '29AABCU9603R1ZX', type: 'SUPPLIER', openingBalance: 0, balanceType: 'CREDIT', creditLimit: 150000, creditDays: 60, isActive: true, createdAt: '2026-02-01' },
  ]
  parties.forEach(p => DB.parties.save(p))

  const items: Item[] = [
    { id: 'i1', name: 'Cement (50kg)', sku: 'CMT-001', unit: 'Bag', sellingPrice: 380, purchasePrice: 350, gstRate: 18, currentStock: 150, minStockLevel: 20, isActive: true },
    { id: 'i2', name: 'Steel Rod 12mm', sku: 'STL-012', unit: 'Kg', sellingPrice: 75, purchasePrice: 68, gstRate: 18, currentStock: 500, minStockLevel: 100, isActive: true },
    { id: 'i3', name: 'Red Brick', sku: 'BRK-001', unit: 'Pcs', sellingPrice: 8, purchasePrice: 6, gstRate: 5, currentStock: 5000, minStockLevel: 1000, isActive: true },
    { id: 'i4', name: 'White Paint 20L', sku: 'PNT-020', unit: 'Can', sellingPrice: 2400, purchasePrice: 2100, gstRate: 18, currentStock: 25, minStockLevel: 10, isActive: true },
    { id: 'i5', name: 'PVC Pipe 2"', sku: 'PVC-002', unit: 'Meter', sellingPrice: 45, purchasePrice: 38, gstRate: 12, currentStock: 200, minStockLevel: 50, isActive: true },
  ]
  items.forEach(i => DB.items.save(i))

  const invoices: Invoice[] = [
    { id: 'inv1', invoiceNo: 'INV-001', partyId: 'p1', partyName: 'Rajesh Traders', type: 'SALE', docType: 'SALE', items: [{ itemId: 'i1', itemName: 'Cement (50kg)', sku: 'CMT-001', quantity: 10, rate: 380, unit: 'Bag', discountPercent: 0, discountAmount: 0, gstRate: 18, amount: 3800 }, { itemId: 'i3', itemName: 'Red Brick', sku: 'BRK-001', quantity: 500, rate: 8, unit: 'Pcs', discountPercent: 0, discountAmount: 0, gstRate: 5, amount: 4000 }], subtotal: 7800, discountAmount: 0, taxAmount: 884, grandTotal: 8684, paymentStatus: 'PAID', paidAmount: 8684, dueAmount: 0, date: '2026-06-01' },
    { id: 'inv2', invoiceNo: 'INV-002', partyId: 'p2', partyName: 'Priya Enterprises', type: 'SALE', docType: 'SALE', items: [{ itemId: 'i2', itemName: 'Steel Rod 12mm', sku: 'STL-012', quantity: 100, rate: 75, unit: 'Kg', discountPercent: 5, discountAmount: 375, gstRate: 18, amount: 7125 }], subtotal: 7500, discountAmount: 375, taxAmount: 1282.5, grandTotal: 8407.5, paymentStatus: 'PENDING', paidAmount: 0, dueAmount: 8407.5, date: '2026-06-15' },
    { id: 'inv3', invoiceNo: 'INV-003', partyId: 'p4', partyName: 'Sita General Store', type: 'SALE', docType: 'SALE', items: [{ itemId: 'i4', itemName: 'White Paint 20L', sku: 'PNT-020', quantity: 2, rate: 2400, unit: 'Can', discountPercent: 0, discountAmount: 0, gstRate: 18, amount: 4800 }], subtotal: 4800, discountAmount: 0, taxAmount: 864, grandTotal: 5664, paymentStatus: 'PARTIAL', paidAmount: 2000, dueAmount: 3664, date: '2026-06-20' },
  ]
  invoices.forEach(inv => DB.invoices.save(inv))

  const entries: LedgerEntry[] = [
    { id: 'l1', partyId: 'p1', partyName: 'Rajesh Traders', type: 'SALE', amount: 8684, mode: 'CASH', reference: 'INV-001', description: 'Sale invoice', date: '2026-06-01', runningBalance: 8684 },
    { id: 'l2', partyId: 'p1', partyName: 'Rajesh Traders', type: 'RECEIPT', amount: 8684, mode: 'CASH', reference: 'RC-001', description: 'Payment received', date: '2026-06-02', runningBalance: 0 },
    { id: 'l3', partyId: 'p2', partyName: 'Priya Enterprises', type: 'SALE', amount: 8407.5, mode: 'CREDIT', reference: 'INV-002', description: 'Sale invoice', date: '2026-06-15', runningBalance: 8407.5 },
    { id: 'l4', partyId: 'p4', partyName: 'Sita General Store', type: 'SALE', amount: 5664, mode: 'CREDIT', reference: 'INV-003', description: 'Sale invoice', date: '2026-06-20', runningBalance: 5664 },
    { id: 'l5', partyId: 'p4', partyName: 'Sita General Store', type: 'RECEIPT', amount: 2000, mode: 'UPI', reference: 'RC-002', description: 'Partial payment', date: '2026-06-22', runningBalance: 3664 },
  ]
  entries.forEach(e => DB.ledger.save(e))

  const expenses: Expense[] = [
    { id: 'e1', category: 'Office', amount: 5000, description: 'Office rent', date: '2026-06-05', paymentMode: 'BANK' },
    { id: 'e2', category: 'Utilities', amount: 1200, description: 'Electricity bill', date: '2026-06-08', paymentMode: 'UPI' },
    { id: 'e3', category: 'Travel', amount: 850, description: 'Client visit fare', date: '2026-06-12', paymentMode: 'CASH' },
  ]
  expenses.forEach(e => DB.expenses.save(e))

  const employees: Employee[] = [
    { id: 'emp1', name: 'Amit Sharma', phone: '9988776655', role: 'SALES', salary: 45000, joiningDate: '2025-01-10', isActive: true },
    { id: 'emp2', name: 'Neha Gupta', phone: '8877665544', email: 'neha@email.com', role: 'VIEWER', salary: 35000, joiningDate: '2025-03-15', isActive: true },
  ]
  employees.forEach(e => DB.employees.save(e))

  const leads: CrmLead[] = [
    { id: 'c1', name: 'Sunil Constructions', phone: '7766554433', source: 'REFERRAL', status: 'QUALIFIED', estimatedValue: 500000, notes: 'Interested in bulk cement', createdAt: '2026-06-10' },
    { id: 'c2', name: 'Green Builders', phone: '6655443322', source: 'WEBSITE', status: 'CONTACTED', estimatedValue: 200000, createdAt: '2026-06-18' },
  ]
  leads.forEach(l => DB.crm.save(l))

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

  DB.settings.save({ prefix: 'INV', template: 'STANDARD', defaultTerms: 'Payment due in 30 days', enableGst: true, themeColor: '#1B5E20', showLogo: true, showBank: true, showSignature: true, paperSize: 'A4', currency: 'INR', currencySymbol: '₹', roundOff: false, lateFeePercent: 0 })

  DB.businessProfile.save({
    businessName: 'Vyapar Setu', ownerName: 'Your Name', phone: '9876543210',
    email: 'hello@vyaparsetu.com', address: '123, Business Street,\nCity - 123456',
    gstin: '29ABCDE1234F1Z5', pan: 'ABCDE1234F',
    bankName: 'State Bank of India', bankAccount: '1234567890123456', bankIfsc: 'SBIN0001234',
    signature: '',
  })

  const itemsWithBarcode = [
    { id: 'i6', name: 'Barcode Item A', sku: 'BAR-001', barcode: '8901234567890', unit: 'Pcs', sellingPrice: 99, purchasePrice: 75, gstRate: 12, currentStock: 100, minStockLevel: 10, isActive: true },
    { id: 'i7', name: 'Barcode Item B', sku: 'BAR-002', barcode: '8909876543210', unit: 'Box', sellingPrice: 249, purchasePrice: 200, gstRate: 18, currentStock: 50, minStockLevel: 5, isActive: true },
  ]
  itemsWithBarcode.forEach(i => DB.items.save(i))

  const stockAdj = [
    { id: 'sa1', itemId: 'i5', itemName: 'PVC Pipe 2"', type: 'ADD' as const, quantity: 100, reason: 'New purchase', date: '2026-07-01' },
    { id: 'sa2', itemId: 'i4', itemName: 'White Paint 20L', type: 'REMOVE' as const, quantity: 3, reason: 'Damaged in storage', date: '2026-07-02' },
  ]
  stockAdj.forEach(a => DB.stockAdjustments.save(a))
}
