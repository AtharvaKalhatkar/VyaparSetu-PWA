import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, generateId, todayISO, nextInvoiceNo } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { useToast } from '../utils/smooth'
import { applyStockChanges, createLedgerEntry } from '../utils/invoiceOps'
import { printThermalInvoice } from '../utils/thermalPrinter'
import type { Item } from '../types'

const COMMON_UNITS = ['Pcs', 'Pack', 'Box', 'Outer', 'Carton', 'Kg', 'Gm', 'Ltr', 'Ml', 'Meter', 'Set', 'Bottle']

interface CartItem {
  itemId: string
  name: string
  qty: number
  rate: number
  unit: string
  gst: number
  barcode?: string
}

export function PosBilling({ onBack }: { onBack?: () => void }) {
  const { toast } = useToast()
  const [items, setItems] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [partyId, setPartyId] = useState('')
  const [showParty, setShowParty] = useState(false)
  const [showItems, setShowItems] = useState(false)
  const [saved, setSaved] = useState(false)
  const [lastInvoice, setLastInvoice] = useState<any>(null)

  // Payment Options
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD' | 'SPLIT'>('CASH')
  const [cashReceived, setCashReceived] = useState('')
  const [autoPrintThermal, setAutoPrintThermal] = useState(true)

  const searchRef = useRef<HTMLInputElement>(null)
  const barcodeRef = useRef<HTMLInputElement>(null)

  // Memoize static data fetches to avoid re-parsing localStorage on every single keypress
  const allItems = useMemo(() => DB.items.list().filter(i => i.isActive), [saved])
  const parties = useMemo(() => DB.parties.list().filter(p => p.type === 'CUSTOMER' || p.type === 'BOTH'), [saved])
  const itemsMap = useMemo(() => new Map(allItems.map(i => [i.id, i])), [allItems])
  const party = useMemo(() => parties.find(p => p.id === partyId), [parties, partyId])
  const settings = useMemo(() => DB.settings.get(), [])

  const { subtotal, tax, grandTotal } = useMemo(() => {
    const sub = items.reduce((s, i) => s + i.qty * i.rate, 0)
    const taxAmt = settings.enableGst ? items.reduce((s, i) => s + i.qty * i.rate * i.gst / 100, 0) : 0
    return { subtotal: sub, tax: taxAmt, grandTotal: sub + taxAmt }
  }, [items, settings.enableGst])

  const cashReturn = useMemo(() => {
    const r = parseFloat(cashReceived) || 0
    return Math.max(0, r - grandTotal)
  }, [cashReceived, grandTotal])

  const filteredItems = useMemo(() => {
    if (!search.trim()) return allItems.slice(0, 25)
    const q = search.toLowerCase().trim()
    return allItems.filter(i =>
      i.name.toLowerCase().includes(q) ||
      (i.sku && i.sku.toLowerCase().includes(q)) ||
      (i.barcode && i.barcode.toLowerCase().includes(q))
    ).slice(0, 25)
  }, [search, allItems])

  useEffect(() => {
    if (showItems && searchRef.current) searchRef.current.focus()
  }, [showItems])

  // Fast Barcode Auto-Scan Addition
  const handleBarcodeSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!barcodeInput.trim()) return
    const code = barcodeInput.trim().toLowerCase()
    const matchedItem = allItems.find(i =>
      (i.barcode && i.barcode.toLowerCase() === code) ||
      (i.sku && i.sku.toLowerCase() === code) ||
      i.name.toLowerCase() === code
    )

    if (matchedItem) {
      addItem(matchedItem)
      setBarcodeInput('')
      toast(`✅ Added ${matchedItem.name} to cart`, 'success')
    } else {
      toast(`❌ Item not found for barcode: ${barcodeInput}`, 'error')
    }
  }, [barcodeInput, allItems, toast])

  const addItem = useCallback((item: Item) => {
    setItems(prev => {
      const existingIdx = prev.findIndex(i => i.itemId === item.id)
      if (existingIdx >= 0) {
        const next = [...prev]
        next[existingIdx] = { ...next[existingIdx], qty: next[existingIdx].qty + 1 }
        return next
      }
      return [...prev, {
        itemId: item.id,
        name: item.name,
        qty: 1,
        rate: item.sellingPrice,
        unit: item.unit || 'Pcs',
        gst: item.gstRate || 0,
        barcode: item.barcode,
      }]
    })
    setSearch('')
    setShowItems(false)
  }, [])

  const updateQty = (idx: number, delta: number) => {
    setItems(prev => prev.map((i, id) => id === idx ? { ...i, qty: Math.max(0, +(i.qty + delta).toFixed(3)) } : i).filter(i => i.qty > 0))
  }

  const updateUnit = (idx: number, newUnit: string) => {
    const cartItem = items[idx]
    const dbItem = allItems.find(a => a.id === cartItem.itemId)
    let newRate = cartItem.rate

    if (dbItem && dbItem.units) {
      const iu = dbItem.units.find(u => u.unitName === newUnit)
      if (iu && iu.sellingPrice) {
        newRate = iu.sellingPrice
      }
    }

    setItems(prev => prev.map((i, id) => id === idx ? { ...i, unit: newUnit, rate: newRate } : i))
  }

  const setQtyDirect = (idx: number, val: string) => {
    const n = parseFloat(val)
    if (isNaN(n) || n <= 0) return
    setItems(prev => prev.map((i, id) => id === idx ? { ...i, qty: +n.toFixed(3) } : i))
  }

  const handleSave = async () => {
    if (items.length === 0) return

    const invNo = nextInvoiceNo(DB.invoices.list().filter(i => i.docType === 'SALE').map(i => i.invoiceNo), 'POS')
    const inv = {
      id: generateId(),
      invoiceNo: invNo,
      partyId,
      partyName: party?.name || 'Walk-in Customer',
      type: 'SALE' as const,
      docType: 'SALE' as const,
      items: items.map(i => {
        const item = allItems.find(a => a.id === i.itemId)
        return {
          itemId: i.itemId,
          itemName: i.name,
          sku: item?.sku || '',
          quantity: i.qty,
          rate: i.rate,
          unit: i.unit,
          discountPercent: 0,
          discountAmount: 0,
          gstRate: i.gst,
          amount: i.qty * i.rate,
        }
      }),
      subtotal,
      discountAmount: 0,
      taxAmount: tax,
      grandTotal,
      paymentStatus: 'PAID' as const,
      paidAmount: grandTotal,
      dueAmount: 0,
      date: todayISO(),
      notes: `POS Sale (${paymentMode})`,
    }

    DB.invoices.save(inv)

    // Accurate stock deduction using item.unit per cart line
    applyStockChanges(
      items.map(i => ({
        itemId: i.itemId,
        quantity: i.qty,
        unit: i.unit,
      })),
      'SALE'
    )

    // Ledger Entry
    createLedgerEntry(
      inv.partyId,
      inv.partyName,
      'SALE',
      grandTotal,
      paymentMode,
      inv.invoiceNo,
      `POS Sale (${paymentMode})`,
      todayISO()
    )

    DB.auditLogs.save({
      id: generateId(),
      entity: 'INVOICE',
      entityId: inv.id,
      action: 'CREATE',
      user: 'Admin',
      timestamp: new Date().toISOString(),
      description: `POS sale #${inv.invoiceNo} (Total: ₹${grandTotal}, Mode: ${paymentMode})`,
    })

    setLastInvoice(inv)
    setSaved(true)
    toast(`✅ POS Invoice ${inv.invoiceNo} complete!`, 'success')

    // Auto-Print Thermal Receipt via Web Bluetooth if enabled
    if (autoPrintThermal) {
      try {
        await printThermalInvoice(inv, 58)
      } catch (err) {
        console.warn('Auto print failed or skipped', err)
      }
    }

    setTimeout(() => {
      setItems([])
      setPartyId('')
      setCashReceived('')
      setSaved(false)
    }, 2500)
  }

  if (saved) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Icons.Check size={64} color={Colors.success} />
          <div style={{ fontSize: 24, fontWeight: 800, color: Colors.success, marginTop: Spacing.md }}>POS Sale Complete!</div>
          <div style={{ fontSize: 14, color: Colors.textSecondary, marginTop: 4 }}>Invoice #{lastInvoice?.invoiceNo} · {formatCurrency(lastInvoice?.grandTotal || 0)}</div>
          {cashReturn > 0 && (
            <div style={{ marginTop: Spacing.md, padding: '10px 16px', backgroundColor: Colors.warningLight, borderRadius: BorderRadius.md, fontWeight: 800, fontSize: 18, color: Colors.warning }}>
              💵 Change to Return: {formatCurrency(cashReturn)}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: Spacing.sm, paddingBottom: 80, backgroundColor: Colors.background, minHeight: '100vh' }}>
      {/* Header & Barcode Fast Scanner */}
      <div style={{ display: 'flex', gap: Spacing.sm, marginBottom: Spacing.sm }}>
        {onBack && (
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: Colors.textSecondary, padding: 4, cursor: 'pointer' }}>
            <Icons.Back size={24} />
          </button>
        )}

        <div style={{ flex: 1, display: 'flex', gap: 6 }}>
          <div onClick={() => setShowParty(true)} style={{ flex: 1, padding: '8px 12px', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, border: `1px solid ${Colors.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: partyId ? Colors.textPrimary : Colors.textDisabled }}>{party ? party.name : 'Walk-in Customer'}</span>
            <span style={{ color: Colors.textDisabled, fontSize: 10 }}>▼</span>
          </div>

          <button onClick={() => setShowItems(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', backgroundColor: Colors.primary, color: '#fff', border: 'none', borderRadius: BorderRadius.md, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <Icons.Add size={18} /> Add Item
          </button>
        </div>
      </div>

      {/* Fast Barcode Scanner Form */}
      <form onSubmit={handleBarcodeSubmit} style={{ marginBottom: Spacing.sm }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: 10, display: 'flex', color: Colors.textDisabled }}>
            <Icons.Barcode size={18} />
          </span>
          <input
            ref={barcodeRef}
            value={barcodeInput}
            onChange={e => setBarcodeInput(e.target.value)}
            placeholder="⚡ Scan Barcode or type SKU & hit Enter to add item..."
            style={{ ...s.input, paddingLeft: 34, fontSize: 13, fontWeight: 600, borderColor: Colors.primary }}
          />
        </div>
      </form>

      {/* Cart List */}
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: Colors.textDisabled }}>
          <Icons.Billing size={64} style={{ marginBottom: Spacing.sm }} />
          <div style={{ fontSize: 16, fontWeight: 700 }}>POS Counter Ready</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Scan barcode or tap "Add Item" to start billing</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((item, idx) => {
            const dbItem = itemsMap.get(item.itemId)
            const availableUnits = Array.from(new Set([
              item.unit,
              dbItem?.unit || 'Pcs',
              ...(dbItem?.units?.map(u => u.unitName) || []),
              ...COMMON_UNITS,
            ])).filter(Boolean)

            return (
              <div key={idx} style={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: '10px 12px', border: `1px solid ${Colors.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: Colors.textPrimary }}>{item.name}</div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: Colors.primary }}>{formatCurrency(item.qty * item.rate)}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button onClick={() => updateQty(idx, -1)} style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${Colors.border}`, background: Colors.surfaceVariant, cursor: 'pointer', fontSize: 18, fontWeight: 700 }}>−</button>
                    <input inputMode="decimal" value={item.qty} onChange={e => setQtyDirect(idx, e.target.value)} style={{ width: 44, textAlign: 'center', fontSize: 14, fontWeight: 700, color: Colors.textPrimary, border: `1px solid ${Colors.border}`, borderRadius: 6, padding: '2px 4px' }} />
                    <button onClick={() => updateQty(idx, 1)} style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${Colors.border}`, background: Colors.surfaceVariant, cursor: 'pointer', fontSize: 18, fontWeight: 700 }}>+</button>
                  </div>

                  {/* Multi-Unit Selector */}
                  <select value={item.unit} onChange={e => updateUnit(idx, e.target.value)} style={{ ...s.select, width: 85, padding: '4px 6px', fontSize: 11, fontWeight: 600 }}>
                    {availableUnits.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>

                  <div style={{ marginLeft: 'auto', fontSize: 11, color: Colors.textDisabled }}>
                    ₹{item.rate} / {item.unit}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* POS Checkout & Payment Options */}
      {items.length > 0 && (
        <div style={{ ...s.card, marginTop: Spacing.md }}>
          <div style={s.spaceBetween}><span style={{ color: Colors.textSecondary }}>Subtotal</span><span style={{ fontWeight: 600 }}>{formatCurrency(subtotal)}</span></div>
          {tax > 0 && <div style={s.spaceBetween}><span style={{ color: Colors.textSecondary }}>GST Tax</span><span style={{ fontWeight: 600 }}>{formatCurrency(tax)}</span></div>}

          <div style={{ ...s.spaceBetween, fontSize: 20, fontWeight: 800, color: Colors.textPrimary, borderTop: `1px solid ${Colors.border}`, paddingTop: Spacing.sm, marginTop: Spacing.sm }}>
            <span>Grand Total</span><span>{formatCurrency(grandTotal)}</span>
          </div>

          {/* Payment Mode Selector */}
          <div style={{ marginTop: Spacing.md }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: Colors.textSecondary, textTransform: 'uppercase', marginBottom: 6 }}>Payment Method</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
              {(['CASH', 'UPI', 'CARD', 'SPLIT'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setPaymentMode(m)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: BorderRadius.sm,
                    border: `1.5px solid ${paymentMode === m ? Colors.primary : Colors.border}`,
                    backgroundColor: paymentMode === m ? Colors.primaryLight : Colors.surface,
                    color: paymentMode === m ? Colors.primary : Colors.textSecondary,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {m === 'CASH' ? '💵 Cash' : m === 'UPI' ? '📱 UPI' : m === 'CARD' ? '💳 Card' : '🔄 Split'}
                </button>
              ))}
            </div>
          </div>

          {/* Cash Received & Change Return Calculator */}
          {paymentMode === 'CASH' && (
            <div style={{ marginTop: Spacing.sm, backgroundColor: Colors.surfaceVariant, padding: Spacing.sm, borderRadius: BorderRadius.sm }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: Colors.textSecondary }}>Cash Received (₹):</span>
                <input
                  inputMode="decimal"
                  value={cashReceived}
                  onChange={e => setCashReceived(e.target.value)}
                  placeholder="e.g. 500"
                  style={{ ...s.input, width: 100, textAlign: 'right', fontWeight: 800, fontSize: 15 }}
                />
              </div>

              {/* Quick Cash Buttons */}
              <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                {[100, 200, 500, 2000].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setCashReceived(String(amt))}
                    style={{ flex: 1, padding: '4px', border: `1px solid ${Colors.border}`, borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer', backgroundColor: Colors.surface }}
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>

              {cashReturn > 0 && (
                <div style={{ fontSize: 13, fontWeight: 800, color: Colors.success, marginTop: 6, textAlign: 'right' }}>
                  💵 Return Change: {formatCurrency(cashReturn)}
                </div>
              )}
            </div>
          )}

          {/* Auto Print Thermal Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.md, paddingTop: Spacing.sm, borderTop: `1px solid ${Colors.border}` }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: Colors.textSecondary }}>🖨️ Auto-Print Bluetooth Thermal Receipt</span>
            <input
              type="checkbox"
              checked={autoPrintThermal}
              onChange={e => setAutoPrintThermal(e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
          </div>

          <button
            onClick={handleSave}
            style={{ ...s.primaryBtn, marginTop: Spacing.md, padding: '16px', fontSize: 18, backgroundColor: Colors.success }}
          >
            <Icons.Check size={22} /> Complete Sale {formatCurrency(grandTotal)}
          </button>
        </div>
      )}

      {/* Select Item Sheet */}
      {showItems && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: Spacing.md }}>
          <div style={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.lg, width: '100%', maxWidth: 450, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>Search & Add Item</div>
              <button onClick={() => setShowItems(false)} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search product by name, SKU or barcode..."
              style={{ ...s.input, marginBottom: Spacing.md }}
            />
            {filteredItems.map(item => (
              <div
                key={item.id}
                onClick={() => addItem(item)}
                style={{ padding: '10px 12px', borderBottom: `1px solid ${Colors.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: Colors.textSecondary }}>Stock: {item.currentStock} {item.unit} · SKU: {item.sku || 'N/A'}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, color: Colors.primary }}>₹{item.sellingPrice}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
