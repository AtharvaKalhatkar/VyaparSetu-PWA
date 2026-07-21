import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Colors, Spacing, BorderRadius, Shadows } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, generateId, todayISO, nextInvoiceNo } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { SelectSheet, useToast } from '../utils/smooth'
import { useVertical } from '../context/VerticalContext'
import { useAuth } from '../store/auth'
import { applyStockChanges, createLedgerEntry } from '../utils/invoiceOps'
import { getSmartSuggestions, getBundleRecommendations } from '../utils/ai'
import type { SmartSuggestion, BundleSuggestion } from '../utils/ai'

const safeNum = (v: string) => { const n = parseFloat(v); return isNaN(n) ? 0 : n }

export function Billing({ editId, initialType, onBack, onNavigate }: { editId?: string; initialType?: 'SALE' | 'PURCHASE'; onBack?: () => void; onNavigate?: (p: string) => void }) {
  const config = useVertical()
  const { userRole } = useAuth()
  const existing = editId ? DB.invoices.byId(editId) : null
  const isReadOnly = userRole === 'VIEWER'

  const [type, setType] = useState<'SALE' | 'PURCHASE'>(initialType || (existing?.type as any) || 'SALE')
  const [partyId, setPartyId] = useState(existing?.partyId || '')
  const [lines, setLines] = useState<{ itemId: string; name: string; qty: string; rate: string; unit: string; gstRate: number }[]>(
    existing?.items.map(i => ({ itemId: i.itemId, name: i.itemName, qty: String(i.quantity), rate: String(i.rate), unit: i.unit, gstRate: i.gstRate })) || []
  )
  const [date, setDate] = useState(existing?.date || todayISO())
  const [notes, setNotes] = useState(existing?.notes || '')
  const [discount, setDiscount] = useState(String(existing?.discountAmount || 0))
  const [saved, setSaved] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [showPartySheet, setShowPartySheet] = useState(false)
  const [showAiSuggestions, setShowAiSuggestions] = useState(false)
  const [bundleRecs, setBundleRecs] = useState<BundleSuggestion[]>([])
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (showPicker && searchRef.current) searchRef.current.focus() }, [showPicker])

  const parties = DB.parties.list().filter(p => type === 'SALE' ? (p.type === 'CUSTOMER' || p.type === 'BOTH') : (p.type === 'SUPPLIER' || p.type === 'BOTH'))
  const allItems = DB.items.list().filter(i => i.isActive)
  const party = parties.find(p => p.id === partyId)

  const { subtotal, tax, grandTotal } = useMemo(() => {
    const sub = lines.reduce((s, l) => s + safeNum(l.qty) * safeNum(l.rate), 0)
    const discAmt = safeNum(discount)
    if (!config.enableGst) return { subtotal: sub, tax: 0, grandTotal: Math.max(0, sub - discAmt) }
    const taxableBase = Math.max(0, sub - discAmt)
    const ratio = sub > 0 ? taxableBase / sub : 1
    const taxAmt = lines.reduce((s, l) => s + safeNum(l.qty) * safeNum(l.rate) * l.gstRate / 100 * ratio, 0)
    return { subtotal: sub, tax: taxAmt, grandTotal: taxableBase + taxAmt }
  }, [lines, discount, config.enableGst])

  const addLine = (itemId: string) => {
    const item = allItems.find(i => i.id === itemId)
    if (!item || lines.find(l => l.itemId === itemId)) return
    const defaultRate = type === 'PURCHASE' && item.purchasePrice ? item.purchasePrice : item.sellingPrice
    const recent = recentMap.get(itemId)
    setLines(prev => [...prev, { itemId: item.id, name: item.name, qty: recent?.qty || '1', rate: recent?.rate || String(defaultRate), unit: recent?.unit || item.unit, gstRate: item.gstRate || config.defaultGstRate }])
    setShowPicker(false); setSearch('')
  }

  const updateLine = (idx: number, field: string, value: string) => {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }

  const changeLineUnit = (idx: number, unitId: string) => {
    const line = lines[idx]; const item = allItems.find(i => i.id === line.itemId)
    if (!item || !item.units) return
    const iu = item.units.find(u => u.unitId === unitId)
    if (!iu) return
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, unit: iu.unitName, rate: String(iu.sellingPrice || item.sellingPrice) } : l))
  }

  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx))

  const saveInvoice = () => {
    if (!partyId || lines.length === 0) return
    if (type === 'SALE' && party && party.creditLimit > 0) {
      const totalDue = DB.invoices.list().filter(i => i.partyId === partyId && i.paymentStatus !== 'PAID').reduce((s, i) => s + i.dueAmount, 0)
      if (totalDue + grandTotal > party.creditLimit) {
        if (!confirm(`⚠️ Credit Limit Exceeded!\n\n${party.name} has a credit limit of ${formatCurrency(party.creditLimit)}.\nCurrent outstanding: ${formatCurrency(totalDue)}\nThis invoice: ${formatCurrency(grandTotal)}\nTotal would be: ${formatCurrency(totalDue + grandTotal)}\n\nDo you still want to proceed?`)) return
        toast('Credit limit exceeded — invoice saved with warning', 'warning')
      }
    }
    const items = lines.map(l => {
      const dbItem = allItems.find(i => i.id === l.itemId)
      return {
        itemId: l.itemId, itemName: l.name, sku: dbItem?.sku || '', quantity: safeNum(l.qty), rate: safeNum(l.rate),
        unit: l.unit, discountPercent: 0, discountAmount: 0, gstRate: l.gstRate, amount: safeNum(l.qty) * safeNum(l.rate),
      }
    })
    const discAmt = safeNum(discount)
    const inv = {
      id: existing?.id || generateId(),
      invoiceNo: existing?.invoiceNo || nextInvoiceNo(
        DB.invoices.list().filter(i => i.docType === (type === 'PURCHASE' ? 'PURCHASE' : 'SALE')).map(i => i.invoiceNo),
        type === 'PURCHASE' ? 'PUR' : 'INV'
      ),
      partyId, partyName: party?.name || '', type, docType: type,
      items, subtotal, discountAmount: discAmt, taxAmount: tax, grandTotal,
      paymentStatus: ((existing?.paidAmount || 0) >= grandTotal ? 'PAID' : (existing?.paidAmount || 0) > 0 ? 'PARTIAL' : 'PENDING') as 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'DRAFT',
      paidAmount: existing?.paidAmount || 0, dueAmount: Math.max(0, grandTotal - (existing?.paidAmount || 0)),
      date, dueDate: party?.creditDays && party.creditDays > 0 ? new Date(new Date(date).getTime() + party.creditDays * 86400000).toISOString().split('T')[0] : undefined,
      notes: notes.trim() || undefined,
    }
    try {
      DB.invoices.save(inv)
      // Reverse old stock if editing an existing invoice
      if (existing) {
        const oldItems = existing.items.map(i => ({ itemId: i.itemId, quantity: i.quantity, unit: i.unit }))
        applyStockChanges(oldItems, existing.type as 'SALE' | 'PURCHASE', true)
      }
      // Apply new stock changes
      const newItems = lines.map(l => ({ itemId: l.itemId, quantity: safeNum(l.qty), unit: l.unit }))
      applyStockChanges(newItems, type)
      // Update ledger
      DB.ledger.list().filter(l => l.reference === inv.invoiceNo && (l.type === 'SALE' || l.type === 'PURCHASE')).forEach(l => DB.ledger.delete(l.id))
      createLedgerEntry(partyId, party?.name || '', type === 'PURCHASE' ? 'PURCHASE' : 'SALE', grandTotal, 'CREDIT', inv.invoiceNo, existing ? 'Invoice updated' : type === 'PURCHASE' ? 'Purchase invoice' : 'Sale invoice', date)
      setSaved(true)
      setTimeout(() => { if (onBack) onBack(); else { setLines([]); setPartyId(''); setDate(todayISO()); setDiscount(''); setNotes(''); setSaved(false) } }, 1500)
    } catch (e) {
      toast('Error saving invoice: ' + (e instanceof Error ? e.message : 'Unknown error'), 'error')
    }
  }

  const aiSuggestions: SmartSuggestion[] = useMemo(() => {
    if (!partyId) return []
    return getSmartSuggestions(partyId, type)
  }, [partyId, type])

  useEffect(() => {
    const itemIds = lines.map(l => l.itemId).filter(Boolean)
    if (itemIds.length > 0) {
      setBundleRecs(getBundleRecommendations(itemIds, type))
    } else {
      setBundleRecs([])
    }
  }, [lines, type])

  const recentMap = useMemo(() => {
    if (!partyId) return new Map<string, { qty: string; rate: string; unit: string }>()
    const recentInvoices = DB.invoices.list()
      .filter(i => i.partyId === partyId && i.id !== editId)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
    const map = new Map<string, { qty: string; rate: string; unit: string }>()
    for (const inv of recentInvoices) {
      for (const item of inv.items) {
        if (!map.has(item.itemId)) {
          map.set(item.itemId, { qty: String(item.quantity), rate: String(item.rate), unit: item.unit })
        }
      }
    }
    return map
  }, [partyId, editId])

  const filteredItems = useMemo(() => {
    if (!search) return allItems.filter(i => !lines.find(l => l.itemId === i.id)).slice(0, 30)
    const q = search.toLowerCase()
    return allItems.filter(i => !lines.find(l => l.itemId === i.id) && (i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q) || (i.barcode && i.barcode.includes(q)))).slice(0, 30)
  }, [search, allItems, lines])

  if (saved) {
    return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <Icons.Check size={48} color={Colors.success} />
      <div style={{ fontSize: 20, fontWeight: 700, color: Colors.success, marginTop: Spacing.md }}>{existing ? 'Invoice Updated!' : 'Invoice Created!'}</div>
    </div>
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      {isReadOnly && (
        <div style={{ backgroundColor: Colors.warningLight, color: Colors.warning, padding: '10px 14px', borderRadius: BorderRadius.sm, marginBottom: Spacing.md, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icons.Delete size={16} /> View-only mode — you don't have permission to create or edit invoices
        </div>
      )}
      <div style={s.toggleGroup}>
        <button onClick={() => setType('SALE')} style={s.toggle(type === 'SALE', Colors.primary)}>Sale</button>
        <button onClick={() => setType('PURCHASE')} style={s.toggle(type === 'PURCHASE', Colors.warning)}>Purchase</button>
      </div>

      <Field label="Party">
        <div onClick={() => setShowPartySheet(true)} style={{ ...s.select, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', appearance: 'none' as const }}>
          <span style={{ color: partyId ? Colors.textPrimary : Colors.textDisabled }}>{party ? party.name : 'Select party...'}</span>
          <span style={{ color: Colors.textDisabled, fontSize: 10 }}>▼</span>
        </div>
      </Field>
      <SelectSheet open={showPartySheet} onClose={() => setShowPartySheet(false)} title="Select Party"
        options={parties.map(p => ({ value: p.id, label: p.name, sublabel: p.phone }))}
        onSelect={(v) => setPartyId(v)} searchable />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: Spacing.sm }}>
        <Field label="Date"><input type="date" value={date} onChange={e => setDate(e.target.value)} style={s.input} /></Field>
        <Field label="Discount (₹)"><input type="number" value={discount} onChange={e => setDiscount(e.target.value)} style={s.input} /></Field>
      </div>

      {partyId && aiSuggestions.length > 0 && (
        <div style={{ backgroundColor: Colors.primaryLight + '60', borderRadius: BorderRadius.md, border: `1px solid ${Colors.primary}30`, padding: Spacing.md, marginBottom: Spacing.md }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: Colors.primary, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icons.Star size={14} /> AI Suggestions
            </div>
            <button onClick={() => setShowAiSuggestions(!showAiSuggestions)} style={{ background: 'none', border: 'none', color: Colors.primary, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              {showAiSuggestions ? 'Hide' : `Show ${aiSuggestions.length}`}
            </button>
          </div>
          {showAiSuggestions && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {aiSuggestions.map(s => (
                <button key={s.itemId} onClick={() => addLine(s.itemId)} style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm, padding: '8px 10px', border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.sm, background: Colors.surface, cursor: 'pointer', textAlign: 'left', width: '100%' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = Colors.primary}
                  onMouseLeave={e => e.currentTarget.style.borderColor = Colors.border}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.successLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: Colors.success, fontWeight: 700 }}>{s.score}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: Colors.textPrimary }}>{s.itemName}</div>
                    <div style={{ fontSize: 10, color: Colors.textSecondary }}>{s.sku} · {s.suggestedQty} × {formatCurrency(s.suggestedRate)} · {s.reason}</div>
                  </div>
                  <Icons.Add size={16} color={Colors.primary} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {bundleRecs.length > 0 && lines.length > 0 && (
        <div style={{ backgroundColor: Colors.successLight + '60', borderRadius: BorderRadius.md, border: `1px solid ${Colors.success}30`, padding: Spacing.md, marginBottom: Spacing.md }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: Colors.success, marginBottom: Spacing.sm, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icons.Star size={14} /> Frequently Bought Together
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {bundleRecs.slice(0, 3).map(r => {
              const item = allItems.find(i => i.id === r.itemId)
              if (!item) return null
              return (
                <button key={r.itemId} onClick={() => addLine(r.itemId)} style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm, padding: '6px 10px', border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.sm, background: Colors.surface, cursor: 'pointer', textAlign: 'left', width: '100%' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = Colors.success}
                  onMouseLeave={e => e.currentTarget.style.borderColor = Colors.border}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: Colors.textPrimary, flex: 1 }}>{r.itemName}</span>
                  <span style={{ fontSize: 10, color: Colors.success, fontWeight: 600 }}>{r.confidence}% match</span>
                  <Icons.Add size={14} color={Colors.success} />
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: Colors.textPrimary }}>Items ({lines.length})</span>
        <button onClick={() => setShowPicker(!showPicker)} style={{ padding: '8px 14px', backgroundColor: Colors.primary, color: '#fff', border: 'none', borderRadius: BorderRadius.md, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icons.Add size={16} /> Add Product
        </button>
      </div>

      {showPicker && (
        <div style={{ ...s.card, marginBottom: Spacing.md, padding: Spacing.sm, borderColor: Colors.primary }}>
          <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, SKU or barcode..." style={{ ...s.input, width: '100%', marginBottom: Spacing.sm, fontSize: 14 }} />
          <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredItems.length === 0 ? (
              <div style={{ padding: Spacing.md, textAlign: 'center', color: Colors.textDisabled, fontSize: 12 }}>No products found</div>
            ) : filteredItems.map(i => (
              <button key={i.id} onClick={() => addLine(i.id)} style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm, padding: '8px 10px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: BorderRadius.sm, textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = Colors.surfaceVariant)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: Colors.primary, fontWeight: 700 }}>{i.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: Colors.textPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {i.name}
                    {recentMap.has(i.id) && <span style={{ fontSize: 9, fontWeight: 700, color: Colors.accent, backgroundColor: Colors.accent + '15', padding: '1px 6px', borderRadius: 4 }}>Recent</span>}
                  </div>
                  <div style={{ fontSize: 11, color: Colors.textSecondary }}>{i.sku} · Stock: {i.currentStock} {i.unit}</div>
                  {recentMap.has(i.id) && <div style={{ fontSize: 10, color: Colors.accent, marginTop: 1 }}>Last: {recentMap.get(i.id)?.qty} × {formatCurrency(safeNum(recentMap.get(i.id)?.rate || '0'))}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  {type === 'PURCHASE' ? (
                    <div style={{ fontSize: 13, fontWeight: 600, color: Colors.textPrimary }}>{i.purchasePrice ? formatCurrency(i.purchasePrice) : '–'}</div>
                  ) : (
                    <div style={{ fontSize: 13, fontWeight: 600, color: Colors.textPrimary }}>{formatCurrency(i.sellingPrice)}</div>
                  )}
                  {i.mrp && i.mrp > i.sellingPrice && type !== 'PURCHASE' && <div style={{ fontSize: 11, color: Colors.textSecondary, textDecoration: 'line-through' }}>{formatCurrency(i.mrp)}</div>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {lines.length === 0 && !showPicker && (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: Colors.textDisabled }}>
          <Icons.Add size={40} style={{ marginBottom: Spacing.sm, opacity: 0.4 }} />
          <div style={{ fontSize: 14 }}>Tap "Add Product" to add items</div>
        </div>
      )}

      {lines.map((l, idx) => {
        const item = allItems.find(i => i.id === l.itemId)
        const multiUnits = item?.units; const hasMultiUnits = multiUnits && multiUnits.length > 0
        const amt = safeNum(l.qty) * safeNum(l.rate)
        return (
          <div key={idx} style={{ backgroundColor: Colors.surface, border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.sm }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: Colors.textPrimary }}>{l.name}</span>
              <button onClick={() => removeLine(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: Colors.textDisabled, padding: 2, display: 'flex' }}><Icons.Delete size={16} /></button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button onClick={() => updateLine(idx, 'qty', String(Math.max(0.001, safeNum(l.qty) - (safeNum(l.qty) >= 1 ? 1 : 0.1))))} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${Colors.border}`, background: Colors.surfaceVariant, cursor: 'pointer', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <input inputMode="decimal" value={l.qty} onChange={e => updateLine(idx, 'qty', e.target.value)} onBlur={e => { const v = parseFloat(e.target.value); if (isNaN(v) || v <= 0) updateLine(idx, 'qty', '1') }} style={{ width: 50, padding: '4px 6px', textAlign: 'center', fontSize: 14, fontWeight: 700, border: `1px solid ${Colors.border}`, borderRadius: 6, outline: 'none', backgroundColor: Colors.surface }} />
                <button onClick={() => updateLine(idx, 'qty', String(safeNum(l.qty) + (safeNum(l.qty) >= 1 ? 1 : 0.1)))} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${Colors.border}`, background: Colors.surfaceVariant, cursor: 'pointer', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>
              {hasMultiUnits ? (
                <select value={multiUnits.find(u => u.unitName === l.unit)?.unitId || ''} onChange={e => changeLineUnit(idx, e.target.value)} style={{ ...s.select, width: 70, padding: '4px 6px', fontSize: 12 }}>
                  <option value={item.unit}>{item.unit} (base)</option>
                  {multiUnits.map(u => <option key={u.unitId} value={u.unitId}>{u.unitName}</option>)}
                </select>
              ) : (
                <span style={{ fontSize: 12, color: Colors.textSecondary, minWidth: 30 }}>{l.unit}</span>
              )}
              <span style={{ fontSize: 11, color: Colors.textSecondary }}>@</span>
              <input inputMode="decimal" value={l.rate} onChange={e => updateLine(idx, 'rate', e.target.value)} style={{ width: 70, padding: '4px 6px', fontSize: 13, fontWeight: 600, textAlign: 'right', border: `1px solid ${Colors.border}`, borderRadius: 6, outline: 'none', backgroundColor: Colors.surface }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: Colors.textPrimary, minWidth: 70, textAlign: 'right' }}>{formatCurrency(amt)}</span>
            </div>
          </div>
        )
      })}

      <Field label="Notes (optional)"><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes..." rows={2} style={{ ...s.input, resize: 'vertical', fontFamily: 'inherit' }} /></Field>

      <div style={{ borderTop: `1px solid ${Colors.divider}`, paddingTop: Spacing.md, marginTop: Spacing.lg }}>
        <div style={s.spaceBetween}><span style={{ color: Colors.textSecondary, fontSize: 13 }}>Items ({lines.length})</span><span style={{ fontWeight: 600, fontSize: 14 }}>{formatCurrency(subtotal)}</span></div>
        {safeNum(discount) > 0 && <div style={s.spaceBetween}><span style={{ color: Colors.textSecondary, fontSize: 13 }}>Discount</span><span style={{ fontWeight: 600, fontSize: 14, color: Colors.error }}>-{formatCurrency(safeNum(discount))}</span></div>}
        {config.enableGst && <div style={s.spaceBetween}><span style={{ color: Colors.textSecondary, fontSize: 13 }}>Tax</span><span style={{ fontWeight: 600, fontSize: 14 }}>{formatCurrency(tax)}</span></div>}
        <div style={{ ...s.spaceBetween, marginTop: Spacing.sm, fontSize: 18, fontWeight: 700, color: Colors.textPrimary, borderTop: `1px solid ${Colors.border}`, paddingTop: Spacing.sm }}>
          <span>Total</span><span>{formatCurrency(grandTotal)}</span>
        </div>
      </div>

      <button data-haptic="15" onClick={saveInvoice} disabled={!partyId || lines.length === 0 || lines.every(l => !safeNum(l.qty) || !safeNum(l.rate))} style={{ marginTop: Spacing.lg, width: '100%', ...(!partyId || lines.length === 0 ? s.primaryBtnDisabled : s.primaryBtn) }}>
        <Icons.Check size={16} /> {existing ? 'Update Invoice' : 'Save Invoice'}
      </button>
    </div>
  )
}