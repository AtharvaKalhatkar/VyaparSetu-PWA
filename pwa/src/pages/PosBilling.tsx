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
    <div style={{ backgroundColor: '#0F172A', minHeight: '100vh', color: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>

      {/* POS Top Terminal Command Bar */}
      <div style={{
        backgroundColor: '#1E293B', padding: '10px 16px', borderBottom: '1px solid #334155',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {onBack && (
            <button onClick={onBack} style={{ background: '#334155', border: 'none', color: '#94A3B8', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
              <Icons.Back size={18} color="#94A3B8" /> Exit POS
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #10B981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.Billing size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.2px' }}>EXECUTIVE POS COUNTER</div>
              <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>Real-time Barcode Register & Billing</div>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#94A3B8' }}>
          <span style={{ backgroundColor: '#0F172A', border: '1px solid #334155', padding: '3px 8px', borderRadius: 6, color: '#E2E8F0', fontWeight: 700 }}>[F2] Search</span>
          <span style={{ backgroundColor: '#0F172A', border: '1px solid #334155', padding: '3px 8px', borderRadius: 6, color: '#E2E8F0', fontWeight: 700 }}>[F12] Complete Sale</span>
          <span style={{ backgroundColor: '#0F172A', border: '1px solid #334155', padding: '3px 8px', borderRadius: 6, color: '#E2E8F0', fontWeight: 700 }}>[ESC] Clear</span>
        </div>
      </div>

      {/* Main Split Screen Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>

        {/* 📦 LEFT PANEL: Product Catalog & Search (2/3 Width) */}
        <div style={{
          flex: 1.4, display: 'flex', flexDirection: 'column', borderRight: '1px solid #334155',
          backgroundColor: '#0F172A', padding: 14, overflowY: 'auto', gap: 12,
        }}>

          {/* Barcode Fast Scanner Form */}
          <form onSubmit={handleBarcodeSubmit}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: 12, display: 'flex', color: '#10B981' }}>
                <Icons.Barcode size={20} />
              </span>
              <input
                ref={barcodeRef}
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                placeholder="⚡ Scan Barcode or type SKU/Name & press Enter... [F2]"
                style={{
                  width: '100%', backgroundColor: '#1E293B', color: '#F8FAFC', border: '2px solid #10B981',
                  borderRadius: 10, padding: '12px 14px 12px 44px', fontSize: 14, fontWeight: 700, outline: 'none',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
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
                flex: 1, minWidth: 160, backgroundColor: '#1E293B', color: '#F8FAFC', border: '1px solid #334155',
                borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none',
              }}
            />
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  border: selectedCategory === cat ? '1px solid #10B981' : '1px solid #334155',
                  backgroundColor: selectedCategory === cat ? '#10B981' : '#1E293B',
                  color: selectedCategory === cat ? '#FFFFFF' : '#94A3B8',
                  whiteSpace: 'nowrap', transition: 'all 0.15s ease',
                }}
              >
                {cat === 'ALL' ? '📦 All Items' : cat}
              </button>
            ))}
          </div>

          {/* Visual Product Grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10,
            overflowY: 'auto', alignContent: 'start', flex: 1, paddingRight: 4,
          }}>
            {filteredProducts.map(item => {
              const cartLine = items.find(i => i.itemId === item.id)
              return (
                <div
                  key={item.id}
                  onClick={() => addItem(item)}
                  style={{
                    backgroundColor: '#1E293B', border: cartLine ? '2px solid #10B981' : '1px solid #334155',
                    borderRadius: 10, padding: 12, cursor: 'pointer', position: 'relative',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 110,
                    transition: 'all 0.15s ease', boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  }}
                >
                  {cartLine && (
                    <span style={{
                      position: 'absolute', top: 6, right: 6, backgroundColor: '#10B981', color: '#fff',
                      borderRadius: 10, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800,
                    }}>
                      {cartLine.qty}
                    </span>
                  )}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC', lineHeight: 1.3, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: 10, color: '#94A3B8' }}>
                      Stock: <span style={{ color: item.currentStock <= item.minStockLevel ? '#EF4444' : '#10B981', fontWeight: 700 }}>{item.currentStock} {item.unit}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#38BDF8' }}>₹{item.sellingPrice}</span>
                    <span style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700, color: '#10B981' }}>+ Add</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 🛒 RIGHT PANEL: Fixed Cart Register & Checkout (1/3 Width) */}
        <div style={{
          flex: 1, minWidth: 320, maxWidth: 440, display: 'flex', flexDirection: 'column',
          backgroundColor: '#1E293B', padding: 14, overflowY: 'auto', justifyContent: 'space-between',
        }}>

          {/* Customer Selection Header */}
          <div>
            <div style={{
              backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: 10, padding: '8px 12px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icons.People size={18} color="#10B981" />
                <div>
                  <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>CUSTOMER</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>{party ? party.name : 'Walk-in Customer'}</div>
                </div>
              </div>
              <button
                onClick={() => setShowPartyModal(true)}
                style={{ backgroundColor: '#334155', border: 'none', color: '#38BDF8', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
              >
                Change
              </button>
            </div>

            {/* Cart Line Items */}
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span>ITEM LIST ({items.length})</span>
              {items.length > 0 && <span onClick={() => setItems([])} style={{ color: '#EF4444', cursor: 'pointer' }}>Clear Cart</span>}
            </div>

            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748B' }}>
                <Icons.Billing size={48} color="#475569" style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 14, fontWeight: 700 }}>POS Register Ready</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>Scan barcode or tap products from catalog to start billing</div>
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
                    <div key={idx} style={{ backgroundColor: '#0F172A', borderRadius: 8, padding: 10, border: '1px solid #334155' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>{item.name}</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#38BDF8' }}>{formatCurrency(item.qty * item.rate)}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <button onClick={() => updateQty(idx, -1)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: '#334155', color: '#fff', cursor: 'pointer', fontWeight: 800 }}>−</button>
                          <span style={{ padding: '0 8px', fontSize: 13, fontWeight: 800, color: '#10B981' }}>{item.qty}</span>
                          <button onClick={() => updateQty(idx, 1)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: '#334155', color: '#fff', cursor: 'pointer', fontWeight: 800 }}>+</button>
                        </div>

                        <select
                          value={item.unit}
                          onChange={e => updateUnit(idx, e.target.value)}
                          style={{ backgroundColor: '#1E293B', color: '#CBD5E1', border: '1px solid #334155', borderRadius: 6, padding: '3px 6px', fontSize: 11, fontWeight: 600, outline: 'none' }}
                        >
                          {availableUnits.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>

                        <button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}>✕</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Cash Register Summary & Checkout Form */}
          {items.length > 0 && (
            <div style={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: 12, padding: 14, marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>
                <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
              </div>
              {tax > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>
                  <span>GST Tax</span><span>{formatCurrency(tax)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 900, color: '#F8FAFC', borderTop: '1px solid #334155', paddingTop: 8, marginTop: 6 }}>
                <span>Total Payable</span><span style={{ color: '#10B981' }}>{formatCurrency(grandTotal)}</span>
              </div>

              {/* Payment Methods */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, marginTop: 12 }}>
                {(['CASH', 'UPI', 'CARD', 'SPLIT'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setPaymentMode(m)}
                    style={{
                      padding: '8px 4px', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer',
                      border: paymentMode === m ? '1px solid #10B981' : '1px solid #334155',
                      backgroundColor: paymentMode === m ? '#10B981' : '#1E293B',
                      color: paymentMode === m ? '#FFFFFF' : '#94A3B8',
                    }}
                  >
                    {m === 'CASH' ? '💵 Cash' : m === 'UPI' ? '📱 UPI' : m === 'CARD' ? '💳 Card' : '🔄 Split'}
                  </button>
                ))}
              </div>

              {/* Cash Change Calculator */}
              {paymentMode === 'CASH' && (
                <div style={{ marginTop: 10, backgroundColor: '#1E293B', padding: 8, borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#94A3B8', fontWeight: 600 }}>Tender Cash (₹):</span>
                    <input
                      inputMode="decimal"
                      value={cashReceived}
                      onChange={e => setCashReceived(e.target.value)}
                      placeholder="e.g. 500"
                      style={{ width: 90, backgroundColor: '#0F172A', color: '#F8FAFC', border: '1px solid #334155', borderRadius: 6, padding: '4px 8px', textAlign: 'right', fontWeight: 800, outline: 'none' }}
                    />
                  </div>
                  {cashReturn > 0 && (
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#F59E0B', marginTop: 6, textAlign: 'right' }}>
                      💵 Change Return: {formatCurrency(cashReturn)}
                    </div>
                  )}
                </div>
              )}

              {/* Complete & Print Checkout Button */}
              <button
                onClick={handleCheckout}
                style={{
                  width: '100%', marginTop: 14, padding: '14px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF', fontSize: 16, fontWeight: 900, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 16, width: '100%', maxWidth: 400, border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#F8FAFC' }}>Select Customer</div>
              <button onClick={() => setShowPartyModal(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <div
              onClick={() => { setPartyId(''); setShowPartyModal(false) }}
              style={{ padding: '10px 12px', borderRadius: 8, backgroundColor: !partyId ? '#10B98120' : '#0F172A', border: '1px solid #334155', cursor: 'pointer', marginBottom: 8, fontWeight: 700, color: !partyId ? '#10B981' : '#F8FAFC' }}
            >
              👤 Walk-in Customer (Default)
            </div>
            <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {parties.map(p => (
                <div
                  key={p.id}
                  onClick={() => { setPartyId(p.id); setShowPartyModal(false) }}
                  style={{ padding: '10px 12px', borderRadius: 8, backgroundColor: partyId === p.id ? '#10B98120' : '#0F172A', border: '1px solid #334155', cursor: 'pointer', color: partyId === p.id ? '#10B981' : '#F8FAFC', fontSize: 13, fontWeight: 600 }}
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
