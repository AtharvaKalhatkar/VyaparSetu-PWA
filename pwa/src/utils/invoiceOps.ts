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
 * Convert quantity in any secondary/alternative unit to base stock quantity.
 * Accurately handles both:
 * - Sub-unit sales (e.g. selling 5 Kg out of a 20 Kg Bag -> 5 / 20 = 0.25 Bags deducted)
 * - Multi-pack sales (e.g. selling 2 Boxes of 12 Pcs -> 2 * 12 = 24 Pcs deducted)
 * - Automatic capacity extraction from item names like "Mahadhan 20 Kg Bag"
 */
export function toBaseQty(item: Item, quantity: number, unit: string): number {
  const safeQty = typeof quantity === 'number' && !isNaN(quantity) ? quantity : parseFloat(String(quantity || 0)) || 0
  if (!unit || !item || !item.unit) return safeQty

  const normUnit = unit.trim().toLowerCase()
  const normBaseUnit = item.unit.trim().toLowerCase()

  // 1. If line unit matches item base unit exactly (e.g. Bag === Bag or Kg === Kg)
  if (normUnit === normBaseUnit) return safeQty

  // 2. Look up secondary unit in item.units array
  const secondary = item.units?.find(u =>
    (u.unitName && u.unitName.trim().toLowerCase() === normUnit) ||
    (u.unitId && u.unitId.trim().toLowerCase() === normUnit)
  )

  if (secondary && typeof secondary.conversionRate === 'number' && secondary.conversionRate > 0) {
    const rate = secondary.conversionRate

    // Check if base unit is a container/package (Bag, Box, Packet, Carton, Tin, Bucket, Drum, etc.)
    // and secondary unit is a sub-unit (Kg, Gm, Gram, Ltr, Ml, Pcs, Ft, Meter, etc.)
    const isBaseContainer = /bag|box|pack|carton|tin|bucket|drum|case|sac|barrel|doz|set/i.test(normBaseUnit)
    const isSecondarySubUnit = /kg|gm|gram|g|ltr|liter|litre|ml|pcs|pc|piece|mtr|meter|ft|inch/i.test(normUnit)

    if (rate < 1) {
      // Direct fractional rate (e.g., 1 Kg = 0.05 Bags)
      return safeQty * rate
    } else if (rate > 1) {
      if (isBaseContainer && isSecondarySubUnit) {
        // Rate defines sub-units per container (e.g., 20 Kg in 1 Bag)
        // Selling 5 Kg of a 20 Kg Bag -> 5 / 20 = 0.25 Bags deducted
        return safeQty / rate
      } else {
        // Rate defines base-units per multi-pack (e.g., 12 Pcs in 1 Box)
        // Selling 2 Boxes of 12 Pcs -> 2 * 12 = 24 Pcs deducted
        return safeQty * rate
      }
    }
  }

  // 3. Smart fallback: Extract capacity from item name or unit (e.g. "Mahadhan 20 Kg Bag" or "50 Kg Sac")
  const weightMatch = item.name.match(/(\d+(?:\.\d+)?)\s*(kg|gm|gram|g|ltr|ml|pcs)/i) ||
                      item.unit.match(/(\d+(?:\.\d+)?)\s*(kg|gm|gram|g|ltr|ml|pcs)/i)

  if (weightMatch) {
    const capacityPerBag = parseFloat(weightMatch[1])
    const capacityUnit = weightMatch[2].toLowerCase()

    if (capacityPerBag > 0 && normUnit.includes(capacityUnit)) {
      // Selling in sub-unit (e.g. 5 Kg out of a 20 Kg Bag -> 5 / 20 = 0.25 Bags deducted)
      return safeQty / capacityPerBag
    }
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
  // ONLY SALE and PURCHASE affect physical inventory!
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
    // Standard invoices: reverse stock (sale -> add back, purchase -> subtract)
    applyStockChanges(stockItems, inv.type, true)
    
    // Remove original ledger entry matching invoice number
    const partyEntries = DB.ledger.forParty(inv.partyId)
    const originalEntry = partyEntries.find(e => e.reference === inv.invoiceNo)
    if (originalEntry) {
      DB.ledger.delete(originalEntry.id)
    }
  } else if (inv.docType === 'SALE_RETURN') {
    // Deleting a Sale Return (which had added stock back) -> subtract stock back out
    applyStockChanges(stockItems, 'SALE', false)
  } else if (inv.docType === 'PURCHASE_RETURN') {
    // Deleting a Purchase Return (which had subtracted stock) -> add stock back
    applyStockChanges(stockItems, 'PURCHASE', false)
  }

  DB.invoices.delete(invoiceId)
  return true
}
