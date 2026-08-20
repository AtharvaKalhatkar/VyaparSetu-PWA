import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, generateId, todayISO, nextInvoiceNo } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { useToast, SuccessCard } from '../utils/smooth'
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

function playPosBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1050, ctx.currentTime)
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.1)
  } catch {}
}

export function PosBilling({ onBack }: { onBack?: () => void }) {
  const { toast } = useToast()
  const [items, setItems] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [partyId, setPartyId] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [showPartyModal, setShowPartyModal] = useState(false)
  const [saved, setSaved] = useState(false)
  const [lastInvoice, setLastInvoice] = useState<any>(null)

  // Payment Options
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD' | 'SPLIT'>('CASH')
  const [cashReceived, setCashReceived] = useState('')
  const [autoPrintThermal, setAutoPrintThermal] = useState(true)

  const barcodeRef = useRef<HTMLInputElement>(null)

  // Memoize static data fetches to avoid re-parsing localStorage on every single keypress
  const allItems = useMemo(() => DB.items.list().filter(i => i.isActive), [saved])
  const parties = useMemo(() => DB.parties.list().filter(p => p.type === 'CUSTOMER' || p.type === 'BOTH'), [saved])
  const itemsMap = useMemo(() => new Map(allItems.map(i => [i.id, i])), [allItems])
  const party = useMemo(() => parties.find(p => p.id === partyId), [parties, partyId])
  const settings = useMemo(() => DB.settings.get(), [])

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>()
    allItems.forEach(i => { if (i.category) set.add(i.category) })
    return ['ALL', ...Array.from(set)]
  }, [allItems])

  const { subtotal, tax, grandTotal } = useMemo(() => {
    const sub = items.reduce((s, i) => s + i.qty * i.rate, 0)
    const taxAmt = settings.enableGst ? items.reduce((s, i) => s + i.qty * i.rate * i.gst / 100, 0) : 0
    return { subtotal: sub, tax: taxAmt, grandTotal: sub + taxAmt }
  }, [items, settings.enableGst])

  const cashReturn = useMemo(() => {
    const r = parseFloat(cashReceived) || 0
    return Math.max(0, r - grandTotal)
  }, [cashReceived, grandTotal])

  // Filtered Products for POS Catalog
  const filteredProducts = useMemo(() => {
    let result = allItems
    if (selectedCategory !== 'ALL') {
      result = result.filter(i => i.category === selectedCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      result = result.filter(i =>
        i.name.toLowerCase().includes(q) ||
        (i.sku && i.sku.toLowerCase().includes(q)) ||
        (i.barcode && i.barcode.toLowerCase().includes(q))
      )
    }
    return result
  }, [search, selectedCategory, allItems])

  // Focus barcode input on mount & keyboard shortcuts
  useEffect(() => {
    barcodeRef.current?.focus()
  }, [])

  const addItem = useCallback((item: Item) => {
    playPosBeep()
    try { navigator.vibrate?.(20) } catch {}
    setItems(prev => {
      const existingIdx = prev.findIndex(i => i.itemId === item.id)
      if (existingIdx >= 0) {
        const next = [...prev]
        next[existingIdx] = { ...next[existingIdx], qty: +(next[existingIdx].qty + 1).toFixed(3) }
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
  }, [])

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
      toast(`Added ${matchedItem.name}`, 'success')
    } else {
      toast(`Item not found for barcode: ${barcodeInput}`, 'error')
    }
  }, [barcodeInput, allItems, addItem, toast])

  const updateQty = useCallback((idx: number, delta: number) => {
    playPosBeep()
    setItems(prev => prev.map((i, id) => id === idx ? { ...i, qty: Math.max(0, +(i.qty + delta).toFixed(3)) } : i).filter(i => i.qty > 0))
  }, [])

  const updateUnit = useCallback((idx: number, newUnit: string) => {
    setItems(prev => {
      const cartItem = prev[idx]
      const dbItem = itemsMap.get(cartItem.itemId)
      let newRate = cartItem.rate
      if (dbItem && dbItem.units) {
        const iu = dbItem.units.find(u => u.unitName === newUnit)
        if (iu && iu.sellingPrice) newRate = iu.sellingPrice
      }
      return prev.map((i, id) => id === idx ? { ...i, unit: newUnit, rate: newRate } : i)
    })
  }, [itemsMap])

  const removeItem = useCallback((idx: number) => {
    setItems(prev => prev.filter((_, id) => id !== idx))
  }, [])

  const handleCheckout = useCallback(async () => {
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
        const item = itemsMap.get(i.itemId)
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
      notes: `POS Terminal Sale (${paymentMode})`,
    }

    DB.invoices.save(inv)
    applyStockChanges(items.map(i => ({ itemId: i.itemId, quantity: i.qty, unit: i.unit })), 'SALE')
    createLedgerEntry(inv.partyId, inv.partyName, 'SALE', grandTotal, paymentMode, inv.invoiceNo, `POS Sale (${paymentMode})`, todayISO())

    DB.auditLogs.save({
      id: generateId(),
      entity: 'INVOICE',
      entityId: inv.id,
      action: 'CREATE',
      user: 'Cashier',
      timestamp: new Date().toISOString(),
      description: `POS Counter sale #${inv.invoiceNo} (Total: ₹${grandTotal}, Mode: ${paymentMode})`,
    })

    setLastInvoice(inv)
    setSaved(true)

    if (autoPrintThermal) {
      try { await printThermalInvoice(inv, 58) } catch {}
    }
  }, [items, partyId, party, itemsMap, subtotal, tax, grandTotal, paymentMode, autoPrintThermal])

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault()
        barcodeRef.current?.focus()
      } else if (e.key === 'F12' || (e.ctrlKey && e.key === 'Enter')) {
        e.preventDefault()
        if (items.length > 0) handleCheckout()
      } else if (e.key === 'Escape') {
        if (search) setSearch('')
        else if (items.length > 0 && confirm('Clear current cart?')) setItems([])
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [items, handleCheckout, search])

  if (saved) {
    return (
      <SuccessCard
        title="POS Sale Completed!"
        subtitle={`Receipt #${lastInvoice?.invoiceNo} processed for ${lastInvoice?.partyName || 'Customer'}.`}
        details={[
          { label: 'Invoice No', value: `#${lastInvoice?.invoiceNo}` },
          { label: 'Payment Mode', value: paymentMode },
          { label: 'Grand Total', value: formatCurrency(lastInvoice?.grandTotal || 0) },
          ...(cashReturn > 0 ? [{ label: '💵 Change Returned', value: formatCurrency(cashReturn) }] : []),
        ]}
        primaryAction={{
          label: 'Next POS Sale (F12)',
          onClick: () => {
            setItems([])
            setPartyId('')
            setCashReceived('')
            setSaved(false)
            setTimeout(() => barcodeRef.current?.focus(), 100)
          },
          icon: <Icons.Billing size={16} color="#fff" />,
        }}
        secondaryAction={{
          label: 'Print Thermal Receipt',
          onClick: () => lastInvoice && printThermalInvoice(lastInvoice, 58),
          icon: <Icons.Print size={16} color="#334155" />,
        }}
      />
    )
  }

  return (
    <div style={{ backgroundColor: Colors.background, minHeight: '100vh', color: Colors.textPrimary, display: 'flex', flexDirection: 'column' }}>

      {/* POS Top Terminal Command Bar */}
      <div style={{
        backgroundColor: Colors.surface, padding: '12px 20px', borderBottom: `1px solid ${Colors.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {onBack && (
            <button onClick={onBack} style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#334155', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}>
              <Icons.Back size={18} color="#334155" /> Exit POS
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #0D9488, #0F766E)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(13,148,136,0.25)' }}>
              <Icons.Billing size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: Colors.textPrimary, letterSpacing: '-0.3px' }}>POS COUNTER TERMINAL</div>
              <div style={{ fontSize: 11, color: Colors.textSecondary, fontWeight: 600 }}>Real-time Barcode Register & Billing</div>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: Colors.textSecondary }}>
          <span style={{ backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', padding: '4px 10px', borderRadius: 6, color: '#334155', fontWeight: 700 }}>[F2] Search</span>
          <span style={{ backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', padding: '4px 10px', borderRadius: 6, color: '#334155', fontWeight: 700 }}>[F12] Complete Sale</span>
          <span style={{ backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', padding: '4px 10px', borderRadius: 6, color: '#334155', fontWeight: 700 }}>[ESC] Clear</span>
        </div>
      </div>

      {/* Main Split Screen Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>

        {/* 📦 LEFT PANEL: Product Catalog & Search (2/3 Width) */}
        <div style={{
          flex: 1.4, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${Colors.border}`,
          backgroundColor: Colors.background, padding: 16, overflowY: 'auto', gap: 14,
        }}>

          {/* Barcode Fast Scanner Form */}
          <form onSubmit={handleBarcodeSubmit}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 16, top: 13, display: 'flex', color: Colors.primary }}>
                <Icons.Barcode size={22} />
              </span>
              <input
                ref={barcodeRef}
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                placeholder="⚡ Scan Barcode or type SKU/Name & press Enter... [F2]"
                style={{
                  width: '100%', backgroundColor: Colors.surface, color: Colors.textPrimary, border: `2px solid ${Colors.primary}`,
                  borderRadius: 12, padding: '13px 16px 13px 50px', fontSize: 14, fontWeight: 700, outline: 'none',
                  boxShadow: '0 4px 14px rgba(13, 148, 136, 0.12)',
                }}
              />
            </div>
          </form>

          {/* Search Filter & Category Chips */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search product catalog..."
              style={{
                flex: 1, minWidth: 160, backgroundColor: Colors.surface, color: Colors.textPrimary, border: `1px solid ${Colors.border}`,
                borderRadius: 8, padding: '9px 14px', fontSize: 13, outline: 'none',
              }}
            />
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  border: selectedCategory === cat ? `1px solid ${Colors.primary}` : `1px solid ${Colors.border}`,
                  backgroundColor: selectedCategory === cat ? Colors.primary : Colors.surface,
                  color: selectedCategory === cat ? '#FFFFFF' : Colors.textSecondary,
                  whiteSpace: 'nowrap', transition: 'all 0.15s ease', boxShadow: selectedCategory === cat ? '0 2px 6px rgba(13,148,136,0.2)' : 'none',
                }}
              >
                {cat === 'ALL' ? '📦 All Items' : cat}
              </button>
            ))}
          </div>

          {/* Visual Product Grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12,
            overflowY: 'auto', alignContent: 'start', flex: 1, paddingRight: 4,
          }}>
            {filteredProducts.map(item => {
              const cartLine = items.find(i => i.itemId === item.id)
              return (
                <div
                  key={item.id}
                  onClick={() => addItem(item)}
                  style={{
                    backgroundColor: Colors.surface, border: cartLine ? `2px solid ${Colors.primary}` : `1px solid ${Colors.border}`,
                    borderRadius: 12, padding: 14, cursor: 'pointer', position: 'relative',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 118,
                    transition: 'all 0.15s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  {cartLine && (
                    <span style={{
                      position: 'absolute', top: 8, right: 8, backgroundColor: Colors.primary, color: '#fff',
                      borderRadius: 12, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800, boxShadow: '0 2px 6px rgba(13,148,136,0.3)',
                    }}>
                      {cartLine.qty}
                    </span>
                  )}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: Colors.textPrimary, lineHeight: 1.3, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: 11, color: Colors.textSecondary }}>
                      Stock: <span style={{ color: item.currentStock <= item.minStockLevel ? Colors.error : Colors.success, fontWeight: 700 }}>{item.currentStock} {item.unit}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                    <span style={{ fontSize: 15, fontWeight: 900, color: Colors.primary }}>₹{item.sellingPrice}</span>
                    <span style={{ backgroundColor: Colors.primaryLight, border: `1px solid ${Colors.primary}30`, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 800, color: Colors.primary }}>+ Add</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 🛒 RIGHT PANEL: Fixed Cart Register & Checkout (1/3 Width) */}
        <div style={{
          flex: 1, minWidth: 340, maxWidth: 460, display: 'flex', flexDirection: 'column',
          backgroundColor: Colors.surface, padding: 16, overflowY: 'auto', justifyContent: 'space-between',
          boxShadow: '-2px 0 10px rgba(0,0,0,0.03)',
        }}>

          {/* Customer Selection Header */}
          <div>
            <div style={{
              backgroundColor: Colors.background, border: `1px solid ${Colors.border}`, borderRadius: 12, padding: '10px 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icons.People size={20} color={Colors.primary} />
                <div>
                  <div style={{ fontSize: 10, color: Colors.textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>CUSTOMER</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: Colors.textPrimary }}>{party ? party.name : 'Walk-in Customer'}</div>
                </div>
              </div>
              <button
                onClick={() => setShowPartyModal(true)}
                style={{ backgroundColor: Colors.surface, border: `1px solid ${Colors.border}`, color: Colors.primary, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Change
              </button>
            </div>

            {/* Cart Line Items */}
            <div style={{ fontSize: 12, fontWeight: 800, color: Colors.textSecondary, marginBottom: 10, display: 'flex', justifyContent: 'space-between', letterSpacing: '0.3px' }}>
              <span>ITEM LIST ({items.length})</span>
              {items.length > 0 && <span onClick={() => setItems([])} style={{ color: Colors.error, cursor: 'pointer' }}>Clear Cart</span>}
            </div>

            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: Colors.textDisabled }}>
                <Icons.Billing size={56} color={Colors.textDisabled} style={{ marginBottom: 10 }} />
                <div style={{ fontSize: 15, fontWeight: 800, color: Colors.textSecondary }}>POS Register Ready</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Scan barcode or tap products from catalog to start billing</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '35vh', overflowY: 'auto', paddingRight: 4 }}>
                {items.map((item, idx) => {
                  const dbItem = itemsMap.get(item.itemId)
                  const availableUnits = Array.from(new Set([
                    item.unit,
                    dbItem?.unit || 'Pcs',
                    ...(dbItem?.units?.map(u => u.unitName) || []),
                    ...COMMON_UNITS,
                  ])).filter(Boolean)

                  return (
                    <div key={idx} style={{ backgroundColor: Colors.background, borderRadius: 10, padding: 12, border: `1px solid ${Colors.border}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: Colors.textPrimary }}>{item.name}</span>
                        <span style={{ fontSize: 15, fontWeight: 900, color: Colors.primary }}>{formatCurrency(item.qty * item.rate)}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <button onClick={() => updateQty(idx, -1)} style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${Colors.border}`, background: Colors.surface, color: Colors.textPrimary, cursor: 'pointer', fontWeight: 800, fontSize: 16 }}>−</button>
                          <span style={{ padding: '0 8px', fontSize: 14, fontWeight: 900, color: Colors.primary }}>{item.qty}</span>
                          <button onClick={() => updateQty(idx, 1)} style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${Colors.border}`, background: Colors.surface, color: Colors.textPrimary, cursor: 'pointer', fontWeight: 800, fontSize: 16 }}>+</button>
                        </div>

                        <select
                          value={item.unit}
                          onChange={e => updateUnit(idx, e.target.value)}
                          style={{ backgroundColor: Colors.surface, color: Colors.textPrimary, border: `1px solid ${Colors.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 12, fontWeight: 700, outline: 'none' }}
                        >
                          {availableUnits.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>

                        <button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: Colors.error, cursor: 'pointer', padding: 4, fontSize: 16 }}>✕</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Cash Register Summary & Checkout Form */}
          {items.length > 0 && (
            <div style={{ backgroundColor: Colors.background, border: `1px solid ${Colors.border}`, borderRadius: 14, padding: 16, marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: Colors.textSecondary, marginBottom: 6 }}>
                <span>Subtotal</span><span style={{ fontWeight: 600 }}>{formatCurrency(subtotal)}</span>
              </div>
              {tax > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: Colors.textSecondary, marginBottom: 6 }}>
                  <span>GST Tax</span><span style={{ fontWeight: 600 }}>{formatCurrency(tax)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 900, color: Colors.textPrimary, borderTop: `1px solid ${Colors.border}`, paddingTop: 10, marginTop: 8 }}>
                <span>Total Payable</span><span style={{ color: Colors.primary }}>{formatCurrency(grandTotal)}</span>
              </div>

              {/* Payment Methods */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, marginTop: 14 }}>
                {(['CASH', 'UPI', 'CARD', 'SPLIT'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setPaymentMode(m)}
                    style={{
                      padding: '9px 4px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer',
                      border: paymentMode === m ? `1px solid ${Colors.primary}` : `1px solid ${Colors.border}`,
                      backgroundColor: paymentMode === m ? Colors.primary : Colors.surface,
                      color: paymentMode === m ? '#FFFFFF' : Colors.textSecondary,
                      boxShadow: paymentMode === m ? '0 2px 6px rgba(13,148,136,0.2)' : 'none',
                    }}
                  >
                    {m === 'CASH' ? '💵 Cash' : m === 'UPI' ? '📱 UPI' : m === 'CARD' ? '💳 Card' : '🔄 Split'}
                  </button>
                ))}
              </div>

              {/* Cash Change Calculator */}
              {paymentMode === 'CASH' && (
                <div style={{ marginTop: 12, backgroundColor: Colors.surface, padding: 10, borderRadius: 10, border: `1px solid ${Colors.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: Colors.textSecondary, fontWeight: 600 }}>Tender Cash (₹):</span>
                    <input
                      inputMode="decimal"
                      value={cashReceived}
                      onChange={e => setCashReceived(e.target.value)}
                      placeholder="e.g. 500"
                      style={{ width: 100, backgroundColor: Colors.background, color: Colors.textPrimary, border: `1px solid ${Colors.border}`, borderRadius: 6, padding: '6px 10px', textAlign: 'right', fontWeight: 800, outline: 'none', fontSize: 14 }}
                    />
                  </div>
                  {cashReturn > 0 && (
                    <div style={{ fontSize: 13, fontWeight: 900, color: Colors.warning, marginTop: 8, textAlign: 'right' }}>
                      💵 Change Return: {formatCurrency(cashReturn)}
                    </div>
                  )}
                </div>
              )}

              {/* Complete & Print Checkout Button */}
              <button
                onClick={handleCheckout}
                style={{
                  width: '100%', marginTop: 16, padding: '15px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
                  color: '#FFFFFF', fontSize: 16, fontWeight: 900, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 16px rgba(13,148,136,0.3)',
                }}
              >
                ⚡ COMPLETE SALE {formatCurrency(grandTotal)} [F12]
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Customer Selector Modal */}
      {showPartyModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ backgroundColor: Colors.surface, borderRadius: 16, padding: 20, width: '100%', maxWidth: 420, border: `1px solid ${Colors.border}`, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: Colors.textPrimary }}>Select Customer</div>
              <button onClick={() => setShowPartyModal(false)} style={{ background: 'none', border: 'none', color: Colors.textSecondary, fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <div
              onClick={() => { setPartyId(''); setShowPartyModal(false) }}
              style={{ padding: '12px 14px', borderRadius: 10, backgroundColor: !partyId ? Colors.primaryLight : Colors.background, border: !partyId ? `1px solid ${Colors.primary}` : `1px solid ${Colors.border}`, cursor: 'pointer', marginBottom: 10, fontWeight: 800, color: !partyId ? Colors.primary : Colors.textPrimary, fontSize: 14 }}
            >
              👤 Walk-in Customer (Default)
            </div>
            <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {parties.map(p => (
                <div
                  key={p.id}
                  onClick={() => { setPartyId(p.id); setShowPartyModal(false) }}
                  style={{ padding: '12px 14px', borderRadius: 10, backgroundColor: partyId === p.id ? Colors.primaryLight : Colors.background, border: partyId === p.id ? `1px solid ${Colors.primary}` : `1px solid ${Colors.border}`, cursor: 'pointer', color: partyId === p.id ? Colors.primary : Colors.textPrimary, fontSize: 13, fontWeight: 700 }}
                >
                  {p.name} {p.phone ? `(${p.phone})` : ''}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
