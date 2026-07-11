import { DB } from './storage'
import { generateId, todayISO } from './formatting'
import type { Invoice, Item } from '../types'

/**
 * Calculate the correct running balance for a party from all their ledger entries.
 * SALE / PURCHASE → increases balance (they owe us / we owe them)
 * RECEIPT → decreases balance (they paid us)
 * PAYMENT → decreases balance (we paid them)
 */
export function calcPartyBalance(partyId: string): number {
  const entries = DB.ledger.forParty(partyId)
  return entries.reduce((bal, e) => {
    if (e.type === 'SALE') return bal + e.amount      // customer owes us more
    if (e.type === 'PURCHASE') return bal - e.amount   // we owe supplier more (negative = payable)
    if (e.type === 'RECEIPT') return bal - e.amount     // customer paid us
    if (e.type === 'PAYMENT') return bal + e.amount     // we paid supplier
    return bal
  }, 0)
}

/**
 * Apply stock changes for invoice items.
 * For SALE: deduct stock. For PURCHASE: add stock.
 * Uses a batched approach to avoid stale-read bugs.
 */
export function applyStockChanges(
  invoiceItems: { itemId: string; quantity: number; unit: string }[],
  type: 'SALE' | 'PURCHASE',
  reverse: boolean = false
) {
  const itemMap = new Map<string, Item>(
    DB.items.list().map(i => [i.id, { ...i }])
  )

  invoiceItems.forEach(line => {
    const item = itemMap.get(line.itemId)
    if (!item) return
    const conv = item.units?.find(u => u.unitName === line.unit)?.conversionRate || 1
    const baseQty = line.unit === item.unit ? line.quantity : line.quantity * conv

    if (type === 'PURCHASE') {
      item.currentStock = reverse
        ? item.currentStock - baseQty
        : item.currentStock + baseQty
    } else {
      const delta = reverse ? baseQty : -baseQty
      item.currentStock = Math.max(0, item.currentStock + delta)
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
 * Safely delete an invoice: reverses stock and creates a reversal ledger entry.
 * Only reverses stock for actual SALE/PURCHASE invoices (not orders, estimates, challans, or returns).
 */
export function deleteInvoiceWithReversal(invoiceId: string) {
  const inv = DB.invoices.byId(invoiceId)
  if (!inv) return false

  const stockItems = inv.items.map(i => ({
    itemId: i.itemId, quantity: i.quantity, unit: i.unit,
  }))

  if (inv.docType === 'SALE' || inv.docType === 'PURCHASE') {
    // Standard invoices: reverse stock (sale → add back, purchase → subtract)
    applyStockChanges(stockItems, inv.type as 'SALE' | 'PURCHASE', true)
    createLedgerEntry(
      inv.partyId, inv.partyName,
      inv.type === 'PURCHASE' ? 'PAYMENT' : 'RECEIPT',
      inv.grandTotal, 'ADJUSTMENT', inv.invoiceNo,
      `Invoice ${inv.invoiceNo} deleted (reversal)`, todayISO()
    )
  } else if (inv.docType === 'SALE_RETURN' || inv.docType === 'PURCHASE_RETURN') {
    // Returns: undo the return by applying the FORWARD operation
    // SALE_RETURN added stock → undo with SALE forward (deduct)
    // PURCHASE_RETURN subtracted stock → undo with PURCHASE forward (add)
    applyStockChanges(stockItems, inv.type as 'SALE' | 'PURCHASE', false)
  }
  // Orders (SALE_ORDER/PURCHASE_ORDER), estimates (ESTIMATE), challans (CHALLAN):
  // don't modify stock, so no reversal needed

  DB.invoices.delete(invoiceId)
  return true
}
