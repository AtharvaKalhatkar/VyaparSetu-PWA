import { DB } from './storage'
import { generateId } from './formatting'
import type { Item } from '../types'

/**
 * Calculate the correct running balance for a party from all their ledger entries.
 * SALE / PURCHASE → increases balance (they owe us / we owe them)
 * RECEIPT → decreases balance (they paid us)
 * PAYMENT → decreases balance (we paid them)
 */
export function calcPartyBalance(partyId: string): number {
  const entries = DB.ledger.forParty(partyId)
  return entries.reduce((bal, e) => {
    if (e.type === 'SALE') return bal + e.amount
    if (e.type === 'PURCHASE') return bal - e.amount
    if (e.type === 'RECEIPT') return bal - e.amount
    if (e.type === 'PAYMENT') return bal + e.amount
    return bal
  }, 0)
}

/**
 * Convert quantity in any secondary unit to base stock quantity.
 * Handles case-insensitivity, whitespace trimming, and NaN guards.
 */
export function toBaseQty(item: Item, quantity: number, unit: string): number {
  const safeQty = typeof quantity === 'number' && !isNaN(quantity) ? quantity : parseFloat(String(quantity || 0)) || 0
  if (!unit || !item || !item.unit) return safeQty
  
  const normUnit = unit.trim().toLowerCase()
  const normBaseUnit = item.unit.trim().toLowerCase()
  
  if (normUnit === normBaseUnit) return safeQty
  
  const secondary = item.units?.find(u => 
    (u.unitName && u.unitName.trim().toLowerCase() === normUnit) || 
    (u.unitId && u.unitId.trim().toLowerCase() === normUnit)
  )
  
  if (secondary && typeof secondary.conversionRate === 'number' && secondary.conversionRate > 0) {
    return safeQty * secondary.conversionRate
  }
  
  return safeQty
}

/**
 * Apply stock changes for invoice items.
 * For SALE: deduct stock. For PURCHASE: add stock.
 * Uses a batched approach to avoid stale-read bugs.
 */
export function applyStockChanges(
  invoiceItems: { itemId: string; quantity: number; unit: string }[],
  type: string,
  reverse: boolean = false
) {
  // ONLY SALE and PURCHASE (and their returns) affect physical inventory!
  // Estimates, Orders, Quotes, Challans DO NOT affect stock.
  if (type !== 'SALE' && type !== 'PURCHASE') return

  const itemsList = DB.items.list()
  const itemMap = new Map<string, Item>(
    itemsList.map(i => [i.id, { ...i }])
  )

  invoiceItems.forEach(line => {
    const item = itemMap.get(line.itemId)
    if (!item) return
    const baseQty = toBaseQty(item, line.quantity, line.unit)
    const current = typeof item.currentStock === 'number' && !isNaN(item.currentStock) ? item.currentStock : parseFloat(String(item.currentStock || 0)) || 0

    if (type === 'PURCHASE') {
      // Purchase adds stock. Reverse (cancel/delete purchase) subtracts stock.
      item.currentStock = reverse ? current - baseQty : current + baseQty
    } else if (type === 'SALE') {
      // Sale subtracts stock. Reverse (cancel/delete sale) adds stock back.
      item.currentStock = reverse ? current + baseQty : current - baseQty
    }
    itemMap.set(line.itemId, item)
  })

  itemMap.forEach(item => DB.items.save(item))
}

/**
 * Create a ledger entry with correct running balance calculation.
 */
export function createLedgerEntry(
  partyId: string,
  partyName: string,
  entryType: 'SALE' | 'PURCHASE' | 'RECEIPT' | 'PAYMENT',
  amount: number,
  mode: string,
  reference: string,
  description: string,
  date: string
) {
  const currentBalance = calcPartyBalance(partyId)
  let newBalance = currentBalance

  if (entryType === 'SALE') newBalance += amount
  else if (entryType === 'PURCHASE') newBalance -= amount
  else if (entryType === 'RECEIPT') newBalance -= amount
  else if (entryType === 'PAYMENT') newBalance += amount

  DB.ledger.save({
    id: generateId(),
    partyId,
    partyName,
    type: entryType,
    amount,
    mode,
    reference,
    description,
    date,
    runningBalance: newBalance,
  })
}

/**
 * Safely delete an invoice: reverses stock and removes original ledger entry.
 */
export function deleteInvoiceWithReversal(invoiceId: string) {
  const inv = DB.invoices.byId(invoiceId)
  if (!inv) return false

  const stockItems = inv.items.map(i => ({
    itemId: i.itemId, quantity: i.quantity, unit: i.unit,
  }))

  if (inv.docType === 'SALE' || inv.docType === 'PURCHASE') {
    // Standard invoices: reverse stock (sale → add back, purchase → subtract)
    applyStockChanges(stockItems, inv.type, true)
    
    // Remove original ledger entry matching invoice number
    const partyEntries = DB.ledger.forParty(inv.partyId)
    const originalEntry = partyEntries.find(e => e.reference === inv.invoiceNo)
    if (originalEntry) {
      DB.ledger.delete(originalEntry.id)
    }
  } else if (inv.docType === 'SALE_RETURN') {
    // Deleting a Sale Return (which had added stock back) → subtract stock back out
    applyStockChanges(stockItems, 'SALE', false)
  } else if (inv.docType === 'PURCHASE_RETURN') {
    // Deleting a Purchase Return (which had subtracted stock) → add stock back
    applyStockChanges(stockItems, 'PURCHASE', false)
  }

  DB.invoices.delete(invoiceId)
  return true
}
