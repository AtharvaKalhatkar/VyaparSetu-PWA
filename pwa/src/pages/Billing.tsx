import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Colors, Spacing, BorderRadius, Shadows } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, formatDate, generateId, todayISO, nextInvoiceNo } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { SelectSheet, useToast, SuccessCard } from '../utils/smooth'
import { useVertical } from '../context/VerticalContext'
import { useAuth } from '../store/auth'
import { applyStockChanges, createLedgerEntry } from '../utils/invoiceOps'
import { getSmartSuggestions, getBundleRecommendations } from '../utils/ai'
import type { SmartSuggestion, BundleSuggestion } from '../utils/ai'
import type { Item } from '../types'

import { toBaseQty } from '../utils/invoiceOps'

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
  const [lastSavedInv, setLastSavedInv] = useState<any>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [showPartySheet, setShowPartySheet] = useState(false)
  const [showAddPartyModal, setShowAddPartyModal] = useState(false)
  const [newPartyName, setNewPartyName] = useState('')
  const [newPartyPhone, setNewPartyPhone] = useState('')
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [newItemPrice, setNewItemPrice] = useState('')
  const [newItemStock, setNewItemStock] = useState('10')

  const handleAddNewItemPrompt = (name: string) => {
    setNewItemName(name)
    setNewItemPrice('')
    setNewItemStock('10')
    setShowAddItemModal(true)
  }

  const handleSaveNewItem = () => {
    if (!newItemName.trim()) {
      toast('Please enter product name', 'warning')
      return
    }
    const price = parseFloat(newItemPrice) || 0
    const stock = parseFloat(newItemStock) || 0
    const newItem = {
      id: generateId(),
      name: newItemName.trim(),
      sku: 'SKU-' + Math.floor(1000 + Math.random() * 9000),
      unit: 'PCS',
      sellingPrice: price,
      purchasePrice: price * 0.8,
      currentStock: stock,
      minStockLevel: 5,
      gstRate: config.defaultGstRate || 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    }
    DB.items.save(newItem)
    setLines(prev => [...prev, {
      itemId: newItem.id,
      name: newItem.name,
      qty: '1',
      rate: String(price),
      unit: newItem.unit,
      gstRate: newItem.gstRate,
    }])
    setShowAddItemModal(false)
    setShowPicker(false)
    setSearch('')
    toast(`Created & added product "${newItem.name}"!`, 'success')
  }
  const [showAiSuggestions, setShowAiSuggestions] = useState(false)
  const [bundleRecs, setBundleRecs] = useState<BundleSuggestion[]>([])
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (showPicker && searchRef.current) searchRef.current.focus() }, [showPicker])

  // Auto-open Party Sheet on page land if no party is selected
  useEffect(() => {
    if (!partyId && !editId) {
      setShowPartySheet(true)
    }
  }, [])

  const handleAddNewPartyPrompt = (name: string) => {
    setNewPartyName(name)
    setNewPartyPhone('')
    setShowAddPartyModal(true)
  }

  const handleSaveNewParty = () => {
    if (!newPartyName.trim()) {
      toast('Please enter customer name', 'warning')
      return
    }
    const newP = {
      id: generateId(),
      name: newPartyName.trim(),
      phone: newPartyPhone.trim(),
      type: type === 'PURCHASE' ? ('SUPPLIER' as const) : ('CUSTOMER' as const),
      openingBalance: 0,
      balanceType: 'DEBIT' as const,
      creditLimit: 0,
      creditDays: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    }
    DB.parties.save(newP)
    setPartyId(newP.id)
    setShowAddPartyModal(false)
    setShowPartySheet(false)
    toast(`Created & selected "${newP.name}"!`, 'success')
  }

  const partyBalances = useMemo(() => {
    const invs = DB.invoices.list()
    const map = new Map<string, number>()
    for (const p of DB.parties.list()) {
      const pInvs = invs.filter(i => i.partyId === p.id)
      const salesDue = pInvs.filter(i => (i.type === 'SALE' || i.docType === 'SALE') && i.paymentStatus !== 'PAID').reduce((sum, i) => sum + i.dueAmount, 0)
      const purchDue = pInvs.filter(i => (i.type === 'PURCHASE' || i.docType === 'PURCHASE') && i.paymentStatus !== 'PAID').reduce((sum, i) => sum + i.dueAmount, 0)
      const bal = (p.openingBalance || 0) + salesDue - purchDue
      map.set(p.id, bal)
    }
    return map
  }, [])

  const parties = DB.parties.list().filter(p => type === 'SALE' ? (p.type === 'CUSTOMER' || p.type === 'BOTH') : (p.type === 'SUPPLIER' || p.type === 'BOTH'))
  const allItems = DB.items.list().filter(i => i.isActive)
  const party = parties.find(p => p.id === partyId)

  const [isGstInvoice, setIsGstInvoice] = useState<boolean>(existing?.isGstInvoice ?? true)

  const { subtotal, tax, grandTotal } = useMemo(() => {
    const sub = lines.reduce((s, l) => s + safeNum(l.qty) * safeNum(l.rate), 0)
    const discAmt = safeNum(discount)
    if (!config.enableGst || !isGstInvoice) return { subtotal: sub, tax: 0, grandTotal: Math.max(0, sub - discAmt) }
    const taxableBase = Math.max(0, sub - discAmt)
    const ratio = sub > 0 ? taxableBase / sub : 1
    const taxAmt = lines.reduce((s, l) => s + safeNum(l.qty) * safeNum(l.rate) * l.gstRate / 100 * ratio, 0)
    return { subtotal: sub, tax: taxAmt, grandTotal: taxableBase + taxAmt }
  }, [lines, discount, config.enableGst, isGstInvoice])

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
    if (isReadOnly) {
      toast('View-only users cannot create or edit invoices', 'warning')
      return
    }
    if (!partyId || lines.length === 0) return

    // Out of Stock / Negative Stock Validation for Sale Invoices
    if (type === 'SALE') {
      const outOfStockLines: { name: string; available: number; requested: number; unit: string }[] = []
      lines.forEach(l => {
        const item = allItems.find(i => i.id === l.itemId)
        if (!item) return
        const requested = toBaseQty(item, safeNum(l.qty), l.unit)
        let available = item.currentStock || 0

        if (existing?.type === 'SALE') {
          const oldLine = existing.items.find(i => i.itemId === l.itemId)
          if (oldLine) available += toBaseQty(item, oldLine.quantity, oldLine.unit)
        }

        if (available < requested) {
          outOfStockLines.push({ name: l.name, available, requested, unit: item.unit })
        }
      })

      if (outOfStockLines.length > 0) {
        const allowNegative = DB.settings.get()?.allowNegativeStock ?? false
        const details = outOfStockLines.map(x => `• ${x.name}: Available ${x.available} ${x.unit}, Requested ${x.requested} ${x.unit}`).join('\n')
        
        if (!allowNegative) {
          alert(`❌ Cannot Create Sale Invoice!\n\nThe following items are OUT OF STOCK:\n\n${details}\n\nTo allow negative stock sales, enable 'Allow Negative Stock' in Invoice Settings.`)
          return
        } else {
          if (!confirm(`⚠️ Out of Stock Warning!\n\nThe following items have insufficient stock:\n\n${details}\n\nDo you still want to proceed with negative stock sale?`)) {
            return
          }
        }
      }
    }

    if (type === 'SALE' && party && party.creditLimit > 0) {
      const totalDue = DB.invoices.list().filter(i => i.partyId === partyId && (i.type === 'SALE' || i.docType === 'SALE') && i.paymentStatus !== 'PAID').reduce((s, i) => s + i.dueAmount, 0)
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
      partyId, partyName: party?.name || '', type, docType: type, isGstInvoice,
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
      setLastSavedInv(inv)
      setSaved(true)
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

  const cannotSave = isReadOnly || !partyId || lines.length === 0 || lines.every(l => !safeNum(l.qty) || !safeNum(l.rate))

  if (saved && lastSavedInv) {
    const shareWhatsApp = () => {
      const text = `Invoice #${lastSavedInv.invoiceNo} for ${lastSavedInv.partyName} of amount ${formatCurrency(lastSavedInv.grandTotal)}. Thank you for doing business with us!`
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }

    const resetFormForNext = () => {
      setLines([])
      setPartyId('')
      setDate(todayISO())
      setDiscount('')
      setNotes('')
      setSaved(false)
      setLastSavedInv(null)
    }

    const isPur = lastSavedInv.docType === 'PURCHASE' || lastSavedInv.type === 'PURCHASE'

    return (
      <SuccessCard
        title={existing ? (isPur ? 'Purchase Bill Updated!' : 'Invoice Updated!') : (isPur ? 'Purchase Bill Recorded!' : 'Invoice Created Successfully!')}
        subtitle={`${isPur ? 'Purchase Bill' : 'Invoice'} #${lastSavedInv.invoiceNo} has been saved.`}
        details={[
          { label: isPur ? 'Bill Number' : 'Invoice Number', value: `#${lastSavedInv.invoiceNo}` },
          { label: isPur ? 'Supplier' : 'Customer', value: lastSavedInv.partyName || 'Cash' },
          { label: 'Bill Date', value: formatDate(lastSavedInv.date) },
          { label: 'Grand Total', value: formatCurrency(lastSavedInv.grandTotal) },
        ]}
        primaryAction={{
          label: 'View & Print',
          onClick: () => onNavigate?.('invoice-view?id=' + lastSavedInv.id),
          icon: <Icons.Invoice size={16} color="#fff" />,
        }}
        secondaryAction={{
          label: 'Share WhatsApp',
          onClick: shareWhatsApp,
          icon: <Icons.WhatsApp size={16} color="#25D366" />,
        }}
      />
    )
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      {isReadOnly && (
        <div style={{ backgroundColor: Colors.warningLight, color: Colors.warning, padding: '10px 14px', borderRadius: BorderRadius.sm, marginBottom: Spacing.md, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icons.Delete size={16} /> View-only mode — you don't have permission to create or edit invoices
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md, gap: 10, flexWrap: 'wrap' }}>
        <div style={s.toggleGroup}>
          <button onClick={() => setType('SALE')} style={s.toggle(type === 'SALE', Colors.primary)}>Sale</button>
          <button onClick={() => setType('PURCHASE')} style={s.toggle(type === 'PURCHASE', Colors.warning)}>Purchase</button>
        </div>

        {config.enableGst && (
          <label onClick={() => setIsGstInvoice(!isGstInvoice)} style={{
            display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
            backgroundColor: isGstInvoice ? Colors.primaryLight : Colors.surfaceVariant,
            border: `1.5px solid ${isGstInvoice ? Colors.primary : Colors.border}`,
            borderRadius: BorderRadius.sm, padding: '6px 12px', fontSize: 12, fontWeight: 800,
            color: isGstInvoice ? Colors.primary : Colors.textSecondary,
            userSelect: 'none',
          }}>
            <input
              type="checkbox"
              checked={isGstInvoice}
              onChange={e => setIsGstInvoice(e.target.checked)}
              style={{ accentColor: Colors.primary, width: 15, height: 15, cursor: 'pointer' }}
            />
            {isGstInvoice ? '☑️ GST Invoice' : '☐ Non-GST Bill'}
          </label>
        )}
      </div>

      <Field label="Party">
        <div onClick={() => setShowPartySheet(true)} style={{ ...s.select, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', appearance: 'none' as const }}>
          <span style={{ color: partyId ? Colors.textPrimary : Colors.textDisabled, fontWeight: partyId ? 800 : 400 }}>
            {party
              ? `${party.name} (${formatCurrency(partyBalances.get(party.id) || 0)})`
              : 'Select party...'}
          </span>
          <span style={{ color: Colors.textDisabled, fontSize: 10 }}>▼</span>
        </div>
      </Field>
      <SelectSheet open={showPartySheet} onClose={() => setShowPartySheet(false)} title={type === 'PURCHASE' ? 'Select Supplier' : 'Select Customer'}
        options={parties.map(p => {
          const bal = partyBalances.get(p.id) || 0
          const balText = bal > 0 ? ` • Bal: ${formatCurrency(bal)} (To Receive)` : bal < 0 ? ` • Bal: ${formatCurrency(Math.abs(bal))} (To Pay)` : ` • Bal: ₹0`
          return {
            value: p.id,
            label: p.name,
            sublabel: `${p.phone ? p.phone : 'No Phone'}${balText}`,
          }
        })}
        onSelect={(v) => setPartyId(v)} searchable onAddNew={handleAddNewPartyPrompt} />

      {/* Inline Fast Add New Customer / Supplier Modal */}
      {showAddPartyModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: 20, width: '100%', maxWidth: 400, ...Shadows.lg }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: Colors.textPrimary }}>
                + Add New {type === 'PURCHASE' ? 'Supplier' : 'Customer'}
              </div>
              <button onClick={() => setShowAddPartyModal(false)} style={{ background: 'none', border: 'none', color: Colors.textMuted, cursor: 'pointer' }}>
                <Icons.Close size={20} />
              </button>
            </div>

            <Field label={`${type === 'PURCHASE' ? 'Supplier' : 'Customer'} Name`} required>
              <input
                autoFocus
                type="text"
                value={newPartyName}
                onChange={e => setNewPartyName(e.target.value)}
                placeholder="Enter full name"
                style={s.input}
              />
            </Field>

            <Field label="Mobile / Phone Number">
              <input
                type="tel"
                value={newPartyPhone}
                onChange={e => setNewPartyPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                style={s.input}
              />
            </Field>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowAddPartyModal(false)} style={{ ...s.outlineBtn, flex: 1 }}>
                Cancel
              </button>
              <button onClick={handleSaveNewParty} style={{ ...s.primaryBtn, flex: 1 }}>
                Save & Select
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Big Prominent + Add Product Button */}
      <button onClick={() => setShowPicker(true)} style={{
        width: '100%', height: 50, borderRadius: BorderRadius.md,
        backgroundColor: Colors.primary, color: '#fff', border: 'none',
        fontSize: 15, fontWeight: 900, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)', marginBottom: 16, marginTop: 10,
      }}>
        <Icons.Add size={22} color="#fff" /> Add Product / Item (Fast Search)
      </button>

      {/* Centered Fast Product Selection Modal */}
      {showPicker && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: 18, width: '100%', maxWidth: 460, maxHeight: '80vh', display: 'flex', flexDirection: 'column', ...Shadows.lg }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: Colors.textPrimary }}>
                Add Products to {type === 'PURCHASE' ? 'Bill' : 'Invoice'}
              </div>
              <button onClick={() => { setShowPicker(false); setSearch('') }} style={{ background: 'none', border: 'none', color: Colors.textMuted, cursor: 'pointer' }}>
                <Icons.Close size={20} />
              </button>
            </div>

            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search product name, SKU or barcode..."
              style={{ ...s.input, width: '100%', marginBottom: 12, fontSize: 14, padding: '10px 14px' }}
            />

            {/* Instant Add New Product Button if search text typed and not matched */}
            {search.trim().length > 0 && !filteredItems.some(i => i.name.toLowerCase() === search.trim().toLowerCase()) && (
              <button onClick={() => handleAddNewItemPrompt(search.trim())} style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px',
                backgroundColor: Colors.primaryLight, border: `1px solid ${Colors.primaryLight}`, borderRadius: BorderRadius.sm,
                fontSize: 13, fontWeight: 800, color: Colors.primary, cursor: 'pointer', marginBottom: 10, textAlign: 'left',
              }}>
                <span style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>+</span>
                Add "{search.trim()}" as New Product
              </button>
            )}

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredItems.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: Colors.textDisabled, fontSize: 13 }}>
                  No products matched "{search}"
                </div>
              ) : filteredItems.map(i => (
                <div key={i.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.sm,
                  backgroundColor: Colors.surface,
                }}>
                  <div style={{ flex: 1, paddingRight: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: Colors.textPrimary }}>
                      {i.name}
                    </div>
                    <div style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 2 }}>
                      Stock: <strong>{i.currentStock} {i.unit}</strong> • Rate: <strong>{formatCurrency(type === 'PURCHASE' ? (i.purchasePrice || 0) : i.sellingPrice)}</strong>
                    </div>
                  </div>
                  <button onClick={() => addLine(i.id)} style={{
                    padding: '6px 14px', backgroundColor: Colors.primary, color: '#fff', border: 'none',
                    borderRadius: BorderRadius.sm, fontSize: 12, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap',
                  }}>
                    + Add
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${Colors.divider}`, textAlign: 'right' }}>
              <button onClick={() => { setShowPicker(false); setSearch('') }} style={{ ...s.primaryBtn, width: 'auto', padding: '8px 20px' }}>
                Done ({lines.length} added)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Fast Add New Product Modal */}
      {showAddItemModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: 20, width: '100%', maxWidth: 400, ...Shadows.lg }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: Colors.textPrimary }}>
                + Add New Product
              </div>
              <button onClick={() => setShowAddItemModal(false)} style={{ background: 'none', border: 'none', color: Colors.textMuted, cursor: 'pointer' }}>
                <Icons.Close size={20} />
              </button>
            </div>

            <Field label="Product Name" required>
              <input autoFocus value={newItemName} onChange={e => setNewItemName(e.target.value)} style={s.input} />
            </Field>

            <Field label="Selling Price (₹)" required>
              <input type="number" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} placeholder="0.00" style={s.input} />
            </Field>

            <Field label="Opening Stock Quantity">
              <input type="number" value={newItemStock} onChange={e => setNewItemStock(e.target.value)} placeholder="10" style={s.input} />
            </Field>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowAddItemModal(false)} style={{ ...s.outlineBtn, flex: 1 }}>Cancel</button>
              <button onClick={handleSaveNewItem} style={{ ...s.primaryBtn, flex: 1 }}>Save & Add</button>
            </div>
          </div>
        </div>
      )}

      {lines.length === 0 && !showPicker && (
        <div style={{ textAlign: 'center', padding: '30px 16px', color: Colors.textDisabled }}>
          <Icons.Add size={40} style={{ marginBottom: Spacing.sm, opacity: 0.4 }} />
          <div style={{ fontSize: 14 }}>Tap "Add Product" above to start adding items</div>
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

      <button data-haptic="15" onClick={saveInvoice} disabled={cannotSave} style={{ marginTop: Spacing.lg, width: '100%', ...(cannotSave ? s.primaryBtnDisabled : s.primaryBtn) }}>
        <Icons.Check size={16} /> {existing ? 'Update Invoice' : 'Save Invoice'}
      </button>
    </div>
  )
}
