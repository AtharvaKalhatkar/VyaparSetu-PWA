import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, generateId, todayISO, nextInvoiceNo } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { useToast } from '../utils/smooth'
import { applyStockChanges, createLedgerEntry } from '../utils/invoiceOps'
import type { Item } from '../types'

export function PosBilling({ onBack }: { onBack?: () => void }) {
  const { toast } = useToast()
  const [items, setItems] = useState<{ itemId: string; name: string; qty: number; rate: number; gst: number }[]>([])
  const [search, setSearch] = useState('')
  const [partyId, setPartyId] = useState('')
  const [showParty, setShowParty] = useState(false)
  const [showItems, setShowItems] = useState(false)
  const [saved, setSaved] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const allItems = DB.items.list().filter(i => i.isActive)
  const parties = DB.parties.list().filter(p => p.type === 'CUSTOMER' || p.type === 'BOTH')
  const party = parties.find(p => p.id === partyId)
  const settings = DB.settings.get()
  const { subtotal, tax, grandTotal } = useMemo(() => {
    const sub = items.reduce((s, i) => s + i.qty * i.rate, 0)
    const taxAmt = settings.enableGst ? items.reduce((s, i) => s + i.qty * i.rate * i.gst / 100, 0) : 0
    return { subtotal: sub, tax: taxAmt, grandTotal: sub + taxAmt }
  }, [items, settings.enableGst])

  const filteredItems = useMemo(() => {
    if (!search) return allItems.slice(0, 20)
    const q = search.toLowerCase()
    return allItems.filter(i => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q) || (i.barcode && i.barcode.includes(q))).slice(0, 20)
  }, [search, allItems])

  useEffect(() => { if (showItems && searchRef.current) searchRef.current.focus() }, [showItems])

  const addItem = (item: Item) => {
    const existing = items.find(i => i.itemId === item.id)
    if (existing) { setItems(prev => prev.map(i => i.itemId === item.id ? { ...i, qty: i.qty + 1 } : i)) }
    else { setItems(prev => [...prev, { itemId: item.id, name: item.name, qty: 1, rate: item.sellingPrice, gst: item.gstRate }]) }
    setSearch(''); setShowItems(false)
  }

  const updateQty = (idx: number, delta: number) => {
    setItems(prev => prev.map((i, id) => id === idx ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0))
  }

  const handleSave = () => {
    if (items.length === 0) return
    const inv = {
      id: generateId(),
      invoiceNo: nextInvoiceNo(DB.invoices.list().filter(i => i.docType === 'SALE').map(i => i.invoiceNo), 'POS'),
      partyId, partyName: party?.name || 'Walk-in Customer', type: 'SALE' as const, docType: 'SALE' as const,
      items: items.map(i => ({ itemId: i.itemId, itemName: i.name, sku: allItems.find(a => a.id === i.itemId)?.sku || '', quantity: i.qty, rate: i.rate, unit: allItems.find(a => a.id === i.itemId)?.unit || 'pcs', discountPercent: 0, discountAmount: 0, gstRate: i.gst, amount: i.qty * i.rate })),
      subtotal, discountAmount: 0, taxAmount: tax, grandTotal,
      paymentStatus: 'PAID' as const, paidAmount: grandTotal, dueAmount: 0,
      date: todayISO(), notes: 'POS Sale',
    }
    DB.invoices.save(inv)
    applyStockChanges(items.map(i => ({ itemId: i.itemId, quantity: i.qty, unit: allItems.find(a => a.id === i.itemId)?.unit || 'pcs' })), 'SALE')
    createLedgerEntry(inv.partyId, inv.partyName, 'SALE', grandTotal, 'CREDIT', inv.invoiceNo, 'POS Sale', todayISO())
    DB.auditLogs.save({ id: generateId(), entity: 'INVOICE', entityId: inv.id, action: 'CREATE', user: 'Admin', timestamp: new Date().toISOString(), description: `POS invoice ${inv.invoiceNo}` })
    setSaved(true); toast(`POS Invoice ${inv.invoiceNo} created!`, 'success')
    setTimeout(() => { setItems([]); setPartyId(''); setSaved(false) }, 2000)
  }

  if (saved) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}><div style={{ textAlign: 'center' }}><Icons.Check size={64} color={Colors.success} /><div style={{ fontSize: 24, fontWeight: 700, color: Colors.success, marginTop: Spacing.md }}>Sale Complete!</div></div></div>

  return (
    <div style={{ padding: Spacing.sm, paddingBottom: 80, backgroundColor: Colors.background, minHeight: '100vh' }}>
      <div style={{ display: 'flex', gap: Spacing.sm, marginBottom: Spacing.sm }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: Colors.textSecondary, padding: 4, cursor: 'pointer' }}><Icons.Back size={24} /></button>
        <div style={{ flex: 1, display: 'flex', gap: 6 }}>
          <div onClick={() => setShowParty(true)} style={{ flex: 1, padding: '8px 12px', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, border: `1px solid ${Colors.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: partyId ? Colors.textPrimary : Colors.textDisabled }}>{party ? party.name : 'Walk-in Customer'}</span>
            <span style={{ color: Colors.textDisabled, fontSize: 10 }}>▼</span>
          </div>
          <span onClick={() => setShowItems(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', backgroundColor: Colors.primary, color: '#fff', borderRadius: BorderRadius.md, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}><Icons.Add size={20} /> Add</span>
        </div>
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: Colors.textDisabled }}><Icons.Billing size={64} /><div style={{ fontSize: 16, marginTop: Spacing.md }}>Tap "Add" to start billing</div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: '10px 12px', border: `1px solid ${Colors.border}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: Colors.textPrimary }}>{item.name}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: Colors.textPrimary }}>{formatCurrency(item.qty * item.rate)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button onClick={() => updateQty(idx, -1)} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${Colors.border}`, background: Colors.surfaceVariant, cursor: 'pointer', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <span style={{ minWidth: 36, textAlign: 'center', fontSize: 18, fontWeight: 700, color: Colors.textPrimary }}>{item.qty}</span>
                <button onClick={() => updateQty(idx, 1)} style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${Colors.border}`, background: Colors.surfaceVariant, cursor: 'pointer', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div style={{ ...s.card, marginTop: Spacing.md }}>
          <div style={s.spaceBetween}><span style={{ color: Colors.textSecondary }}>Subtotal</span><span style={{ fontWeight: 600 }}>{formatCurrency(subtotal)}</span></div>
          {tax > 0 && <div style={s.spaceBetween}><span style={{ color: Colors.textSecondary }}>Tax</span><span style={{ fontWeight: 600 }}>{formatCurrency(tax)}</span></div>}
          <div style={{ ...s.spaceBetween, fontSize: 20, fontWeight: 800, color: Colors.textPrimary, borderTop: `1px solid ${Colors.border}`, paddingTop: Spacing.sm, marginTop: Spacing.sm }}>
            <span>Total</span><span>{formatCurrency(grandTotal)}</span>
          </div>
          <button onClick={handleSave} style={{ ...s.primaryBtn, marginTop: Spacing.md, padding: '16px', fontSize: 18, backgroundColor: Colors.success }}><Icons.Check size={20} /> Complete Sale ₹{grandTotal.toFixed(2)}</button>
        </div>
      )}

      {showItems && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 500, display: 'flex', flexDirection: 'column', padding: Spacing.md, paddingTop: 80 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: BorderRadius.lg, padding: Spacing.md, maxHeight: '70vh', overflow: 'auto' }}>
            <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..." style={{ ...s.input, marginBottom: Spacing.sm, fontSize: 16 }} autoFocus />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {filteredItems.map(item => (
                <button key={item.id} onClick={() => addItem(item)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 10px', backgroundColor: Colors.surfaceVariant, border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.md, cursor: 'pointer', gap: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: Colors.textPrimary, textAlign: 'center' }}>{item.name}</span>
                  <span style={{ fontWeight: 700, fontSize: 15, color: Colors.primary }}>{formatCurrency(item.sellingPrice)}</span>
                  <span style={{ fontSize: 10, color: Colors.textSecondary }}>Stock: {item.currentStock}</span>
                </button>
              ))}
            </div>
            <button onClick={() => { setShowItems(false); setSearch('') }} style={{ width: '100%', padding: '12px', background: 'none', border: 'none', color: Colors.textSecondary, fontSize: 14, marginTop: Spacing.sm, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {showParty && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 500, display: 'flex', flexDirection: 'column', padding: Spacing.md, paddingTop: 80 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: BorderRadius.lg, padding: Spacing.md, maxHeight: '60vh', overflow: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: Spacing.md, color: Colors.textPrimary }}>Select Customer</div>
            <button onClick={() => { setPartyId(''); setShowParty(false) }} style={{ width: '100%', padding: '12px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: Colors.textSecondary, borderBottom: `1px solid ${Colors.divider}` }}>
              Walk-in Customer
            </button>
            {parties.map(p => (
              <button key={p.id} onClick={() => { setPartyId(p.id); setShowParty(false) }} style={{ width: '100%', padding: '12px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: Colors.textPrimary, borderBottom: `1px solid ${Colors.divider}` }}>
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
