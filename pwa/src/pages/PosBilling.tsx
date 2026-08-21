import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Colors, Spacing, BorderRadius, Shadows } from '../theme'
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

  // Mobile View Switcher: 'CATALOG' | 'CART'
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'CART'>('CATALOG')
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768)

  // Payment Options
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD' | 'SPLIT'>('CASH')
  const [cashReceived, setCashReceived] = useState('')
  const [autoPrintThermal, setAutoPrintThermal] = useState(true)

  const barcodeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const allItems = useMemo(() => DB.items.list().filter(i => i.isActive), [saved])
  const parties = useMemo(() => DB.parties.list().filter(p => p.type === 'CUSTOMER' || p.type === 'BOTH'), [saved])
  const itemsMap = useMemo(() => new Map(allItems.map(i => [i.id, i])), [allItems])
  const party = useMemo(() => parties.find(p => p.id === partyId), [parties, partyId])
  const settings = useMemo(() => DB.settings.get(), [])

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
    toast(`Added ${item.name} to cart`, 'success')
  }, [toast])

  const handleBarcodeSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!barcodeInput.trim()) return
    const code = barcodeInput.trim().toLowerCase()
    const found = allItems.find(i => (i.barcode && i.barcode.toLowerCase() === code) || (i.sku && i.sku.toLowerCase() === code) || i.name.toLowerCase().includes(code))
    if (found) {
      addItem(found)
      setBarcodeInput('')
    } else {
      toast(`No product found matching "${barcodeInput}"`, 'error')
    }
  }, [barcodeInput, allItems, addItem, toast])

  const updateQty = useCallback((itemId: string, delta: number) => {
    setItems(prev => prev.map(i => {
      if (i.itemId === itemId) {
        const newQty = +(i.qty + delta).toFixed(3)
        return newQty > 0 ? { ...i, qty: newQty } : null
      }
      return i
    }).filter(Boolean) as CartItem[])
  }, [])

  const updateUnit = useCallback((itemId: string, unit: string) => {
    setItems(prev => prev.map(i => i.itemId === itemId ? { ...i, unit } : i))
  }, [])

  const updateRate = useCallback((itemId: string, rate: number) => {
    setItems(prev => prev.map(i => i.itemId === itemId ? { ...i, rate } : i))
  }, [])

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(i => i.itemId !== itemId))
  }, [])

  const handleCheckout = useCallback(async () => {
    if (items.length === 0) {
      toast('Cart is empty! Add products first.', 'error')
      return
    }

    const inv = {
      id: generateId(),
      invoiceNo: nextInvoiceNo(DB.invoices.list().map(i => i.invoiceNo), 'INV'),
      type: 'SALE' as const,
      docType: 'SALE' as const,
      partyId: partyId || 'WALK_IN',
      partyName: party?.name || 'Walk-in Customer',
      partyGstin: party?.gstin || '',
      partyAddress: party?.address || '',
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
  }, [items, partyId, party, itemsMap, subtotal, tax, grandTotal, paymentMode, autoPrintThermal, toast])

  // Global Keyboard Shortcuts (Desktop)
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
          label: 'Next POS Sale',
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

      {/* Modern POS Header Bar */}
      <div style={{
        backgroundColor: Colors.surface, padding: '12px 16px', borderBottom: `1px solid ${Colors.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {onBack && (
            <button onClick={onBack} style={{ background: Colors.background, border: `1px solid ${Colors.border}`, color: Colors.textPrimary, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700 }}>
              <Icons.Back size={16} /> Exit
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${Colors.primary}, ${Colors.primaryDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Icons.Billing size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: Colors.textPrimary, letterSpacing: '-0.3px' }}>POS Counter</div>
              <div style={{ fontSize: 10, color: Colors.textSecondary, fontWeight: 600 }}>Fast Billing & Register</div>
            </div>
          </div>
        </div>

        {/* Mobile Tab Switcher: Catalog vs Cart */}
        {isMobile ? (
          <div style={{ display: 'flex', backgroundColor: Colors.background, padding: 3, borderRadius: 8, border: `1px solid ${Colors.border}` }}>
            <button
              onClick={() => setActiveTab('CATALOG')}
              style={{
                padding: '6px 12px', borderRadius: 6, border: 'none',
                backgroundColor: activeTab === 'CATALOG' ? Colors.primary : 'transparent',
                color: activeTab === 'CATALOG' ? '#fff' : Colors.textSecondary,
                fontWeight: 800, fontSize: 12, cursor: 'pointer',
              }}
            >
              📦 Products ({filteredProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('CART')}
              style={{
                padding: '6px 12px', borderRadius: 6, border: 'none',
                backgroundColor: activeTab === 'CART' ? Colors.primary : 'transparent',
                color: activeTab === 'CART' ? '#fff' : Colors.textSecondary,
                fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              🛒 Cart ({items.length})
            </button>
          </div>
        ) : (
          /* Desktop Keyboard Shortcuts */
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: Colors.textSecondary }}>
            <span style={{ backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', padding: '4px 10px', borderRadius: 6, color: '#334155', fontWeight: 700 }}>[F2] Search</span>
            <span style={{ backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', padding: '4px 10px', borderRadius: 6, color: '#334155', fontWeight: 700 }}>[F12] Complete Sale</span>
            <span style={{ backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', padding: '4px 10px', borderRadius: 6, color: '#334155', fontWeight: 700 }}>[ESC] Clear</span>
          </div>
        )}
      </div>

      {/* Main Responsive Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden' }}>

        {/* 📦 PRODUCT CATALOG PANEL */}
        {(!isMobile || activeTab === 'CATALOG') && (
          <div style={{
            flex: isMobile ? 1 : 1.4, display: 'flex', flexDirection: 'column', borderRight: isMobile ? 'none' : `1px solid ${Colors.border}`,
            backgroundColor: Colors.background, padding: 14, overflowY: 'auto', gap: 12,
          }}>

            {/* Barcode Fast Scanner Form */}
            <form onSubmit={handleBarcodeSubmit}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: 12, display: 'flex', color: Colors.primary }}>
                  <Icons.Barcode size={20} />
                </span>
                <input
                  ref={barcodeRef}
                  value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)}
                  placeholder="⚡ Scan Barcode or type Name & press Enter..."
                  style={{
                    width: '100%', backgroundColor: Colors.surface, color: Colors.textPrimary, border: `2px solid ${Colors.primary}`,
                    borderRadius: 10, padding: '11px 14px 11px 44px', fontSize: 13, fontWeight: 700, outline: 'none',
                    boxShadow: '0 2px 8px rgba(13, 148, 136, 0.1)',
                  }}
                />
              </div>
            </form>

            {/* Search Filter & Category Chips */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter items..."
                style={{
                  flex: 1, backgroundColor: Colors.surface, color: Colors.textPrimary, border: `1px solid ${Colors.border}`,
                  borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none',
                }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: Colors.textSecondary, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Clear</button>
              )}
            </div>

            {/* Horizontal Category Chips */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '5px 12px', borderRadius: 20, whiteSpace: 'nowrap', fontSize: 11, fontWeight: 700,
                    border: selectedCategory === cat ? `1.5px solid ${Colors.primary}` : `1px solid ${Colors.border}`,
                    backgroundColor: selectedCategory === cat ? Colors.primaryLight : Colors.surface,
                    color: selectedCategory === cat ? Colors.primary : Colors.textSecondary, cursor: 'pointer',
                  }}
                >
                  {cat === 'ALL' ? 'All Items' : cat}
                </button>
              ))}
            </div>

            {/* Product Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: 10, flex: 1, alignContent: 'start' }}>
              {filteredProducts.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 30, color: Colors.textSecondary, fontSize: 13 }}>
                  No products found. Add items in Inventory menu.
                </div>
              ) : (
                filteredProducts.map(prod => {
                  const cartItem = items.find(i => i.itemId === prod.id)
                  return (
                    <div
                      key={prod.id}
                      onClick={() => addItem(prod)}
                      style={{
                        backgroundColor: Colors.surface, border: cartItem ? `2px solid ${Colors.primary}` : `1px solid ${Colors.border}`,
                        borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                        cursor: 'pointer', position: 'relative', transition: 'all 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                      }}
                    >
                      {cartItem && (
                        <div style={{ position: 'absolute', top: 6, right: 6, backgroundColor: Colors.primary, color: '#fff', borderRadius: 10, width: 20, height: 20, fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {cartItem.qty}
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: Colors.textPrimary, marginBottom: 4, lineClamp: 2, WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {prod.name}
                        </div>
                        <div style={{ fontSize: 10, color: Colors.textSecondary }}>Stock: {prod.currentStock} {prod.unit || 'Pcs'}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 900, color: Colors.primary }}>₹{prod.sellingPrice}</span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: Colors.primary, backgroundColor: Colors.primaryLight, padding: '3px 8px', borderRadius: 6 }}>+ Add</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Mobile Bottom Sticky Cart Summary Bar */}
            {isMobile && items.length > 0 && (
              <div
                onClick={() => setActiveTab('CART')}
                style={{
                  backgroundColor: Colors.primary, color: '#fff', padding: '12px 16px', borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(13,148,136,0.3)', marginTop: 'auto',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 8, fontWeight: 900, fontSize: 13 }}>
                    {items.length} Items
                  </span>
                  <span style={{ fontWeight: 800, fontSize: 15 }}>View Cart</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 900 }}>
                  {formatCurrency(grandTotal)} ➔
                </div>
              </div>
            )}
          </div>
        )}

        {/* 🛒 RIGHT CART REGISTER PANEL */}
        {(!isMobile || activeTab === 'CART') && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: Colors.surface,
            padding: 14, overflowY: 'auto', gap: 12, borderLeft: isMobile ? 'none' : `1px solid ${Colors.border}`,
          }}>

            {/* Customer Switcher Card */}
            <div style={{ backgroundColor: Colors.background, border: `1px solid ${Colors.border}`, borderRadius: 10, padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icons.People size={18} color={Colors.primary} />
                <div>
                  <div style={{ fontSize: 10, color: Colors.textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>Customer</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: Colors.textPrimary }}>{party ? party.name : 'Walk-in Customer'}</div>
                </div>
              </div>
              <button
                onClick={() => setShowPartyModal(true)}
                style={{ backgroundColor: Colors.surface, border: `1px solid ${Colors.border}`, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: Colors.primary, cursor: 'pointer' }}
              >
                Change
              </button>
            </div>

            {/* Cart Line Items */}
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 180 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: Colors.textSecondary, textTransform: 'uppercase', marginBottom: 8 }}>
                Item List ({items.length})
              </div>

              {items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 10px', color: Colors.textSecondary }}>
                  <Icons.Billing size={36} color={Colors.textDisabled} />
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 8 }}>POS Register Ready</div>
                  <div style={{ fontSize: 11, color: Colors.textDisabled, marginTop: 2 }}>Scan barcode or tap products from catalog to start billing</div>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.itemId} style={{ backgroundColor: Colors.background, border: `1px solid ${Colors.border}`, borderRadius: 8, padding: 10, marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: Colors.textPrimary }}>{item.name}</span>
                      <button onClick={() => removeItem(item.itemId)} style={{ background: 'none', border: 'none', color: Colors.error, cursor: 'pointer', padding: 2 }}>
                        <Icons.Close size={16} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      {/* Qty Counter */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, backgroundColor: Colors.surface, border: `1px solid ${Colors.border}`, borderRadius: 6, padding: 2 }}>
                        <button onClick={() => updateQty(item.itemId, -1)} style={{ width: 26, height: 26, border: 'none', background: Colors.background, borderRadius: 4, fontWeight: 800, cursor: 'pointer' }}>−</button>
                        <input
                          type="number"
                          value={item.qty}
                          onChange={e => updateQty(item.itemId, (parseFloat(e.target.value) || 0) - item.qty)}
                          style={{ width: 44, textAlign: 'center', border: 'none', fontWeight: 800, fontSize: 13, outline: 'none', background: 'transparent' }}
                        />
                        <button onClick={() => updateQty(item.itemId, 1)} style={{ width: 26, height: 26, border: 'none', background: Colors.background, borderRadius: 4, fontWeight: 800, cursor: 'pointer' }}>+</button>
                      </div>

                      {/* Unit Selector */}
                      <select
                        value={item.unit}
                        onChange={e => updateUnit(item.itemId, e.target.value)}
                        style={{ backgroundColor: Colors.surface, border: `1px solid ${Colors.border}`, borderRadius: 6, padding: '4px 6px', fontSize: 11, fontWeight: 700 }}
                      >
                        {COMMON_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>

                      {/* Rate */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 900, color: Colors.textPrimary }}>₹{(item.qty * item.rate).toFixed(2)}</div>
                        <div style={{ fontSize: 10, color: Colors.textSecondary }}>@ ₹{item.rate}/{item.unit}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totals & Payment Summary */}
            <div style={{ backgroundColor: Colors.background, border: `1px solid ${Colors.border}`, borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: Colors.textSecondary }}>
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {settings.enableGst && tax > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: Colors.textSecondary }}>
                  <span>Estimated GST</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, color: Colors.textPrimary, borderTop: `1px dashed ${Colors.border}`, paddingTop: 6 }}>
                <span>Grand Total</span>
                <span style={{ color: Colors.primary }}>{formatCurrency(grandTotal)}</span>
              </div>

              {/* Payment Mode Selector */}
              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                {(['CASH', 'UPI', 'CARD', 'SPLIT'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setPaymentMode(mode)}
                    style={{
                      flex: 1, padding: '6px 2px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                      border: paymentMode === mode ? `1.5px solid ${Colors.primary}` : `1px solid ${Colors.border}`,
                      backgroundColor: paymentMode === mode ? Colors.primaryLight : Colors.surface,
                      color: paymentMode === mode ? Colors.primary : Colors.textSecondary, cursor: 'pointer',
                    }}
                  >
                    {mode === 'CASH' ? '💵 Cash' : mode === 'UPI' ? '📱 UPI' : mode === 'CARD' ? '💳 Card' : '🔄 Split'}
                  </button>
                ))}
              </div>

              {/* Cash Return Calculator */}
              {paymentMode === 'CASH' && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={e => setCashReceived(e.target.value)}
                    placeholder="Cash Received ₹"
                    style={{ flex: 1, backgroundColor: Colors.surface, border: `1px solid ${Colors.border}`, borderRadius: 6, padding: '6px 10px', fontSize: 12, fontWeight: 700, outline: 'none' }}
                  />
                  {cashReturn > 0 && (
                    <div style={{ fontSize: 11, fontWeight: 800, color: Colors.success, backgroundColor: '#D1FAE5', padding: '6px 8px', borderRadius: 6 }}>
                      Change: ₹{cashReturn.toFixed(2)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Complete Sale Action Button */}
            <button
              onClick={handleCheckout}
              disabled={items.length === 0}
              style={{
                backgroundColor: items.length > 0 ? Colors.success : Colors.border, color: '#fff', border: 'none',
                borderRadius: 10, padding: 14, fontWeight: 900, fontSize: 15, cursor: items.length > 0 ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: items.length > 0 ? '0 4px 14px rgba(5,150,105,0.3)' : 'none',
              }}
            >
              <Icons.Billing size={20} color="#fff" />
              ⚡ COMPLETE SALE ({formatCurrency(grandTotal)})
            </button>
          </div>
        )}
      </div>

      {/* Customer Selector Modal */}
      {showPartyModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ backgroundColor: Colors.surface, borderRadius: 12, width: '100%', maxWidth: 400, padding: 20, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: Colors.textPrimary }}>Select Customer</div>
              <button onClick={() => setShowPartyModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icons.Close size={20} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <button
                onClick={() => { setPartyId(''); setShowPartyModal(false) }}
                style={{ width: '100%', textAlign: 'left', padding: 12, borderRadius: 8, border: `1px solid ${Colors.border}`, backgroundColor: !partyId ? Colors.primaryLight : Colors.background, marginBottom: 8, fontWeight: 800, cursor: 'pointer' }}
              >
                👤 Walk-in Customer (Default)
              </button>
              {parties.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setPartyId(p.id); setShowPartyModal(false) }}
                  style={{ width: '100%', textAlign: 'left', padding: 12, borderRadius: 8, border: `1px solid ${Colors.border}`, backgroundColor: partyId === p.id ? Colors.primaryLight : Colors.background, marginBottom: 8, cursor: 'pointer' }}
                >
                  <div style={{ fontWeight: 800, fontSize: 13, color: Colors.textPrimary }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: Colors.textSecondary }}>{p.phone || 'No phone'}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
