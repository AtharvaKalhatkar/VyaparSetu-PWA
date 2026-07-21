import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, formatDate, generateId, todayISO, nextInvoiceNo } from '../utils/formatting'
import { SelectSheet } from '../utils/smooth'
import { Icons } from '../utils/Icons'
import { deleteInvoiceWithReversal, applyStockChanges, createLedgerEntry } from '../utils/invoiceOps'
import type { Invoice } from '../types'

export function ReturnsPage({ onNavigate, sourceId }: { onNavigate: (p: string) => void; sourceId?: string }) {
  const sourceInv = sourceId ? DB.invoices.byId(sourceId) : null
  const [tab, setTab] = useState<'SALE' | 'PURCHASE'>((sourceInv?.type as any) || 'SALE')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(!!sourceInv)
  const [formType, setFormType] = useState<'SALE' | 'PURCHASE'>((sourceInv?.type as any) || 'SALE')
  const [partyId, setPartyId] = useState(sourceInv?.partyId || '')
  const [showPartySheet, setShowPartySheet] = useState(false)
  const [date, setDate] = useState(sourceInv?.date || todayISO())
  const [reason, setReason] = useState(sourceInv ? 'Return of ' + sourceInv.invoiceNo : '')
  const [lines, setLines] = useState<{ itemId: string; name: string; qty: string; rate: string; unit: string }[]>(
    sourceInv?.items.map(i => ({ itemId: i.itemId, name: i.itemName, qty: String(i.quantity), rate: String(i.rate), unit: i.unit })) || []
  )

  const docType = tab === 'SALE' ? 'SALE_RETURN' : 'PURCHASE_RETURN'
  const allReturns = DB.invoices.list().filter(i => i.docType === docType)
  const filtered = allReturns.filter(i => i.invoiceNo.toLowerCase().includes(search.toLowerCase()) || i.partyName.toLowerCase().includes(search.toLowerCase()))

  const parties = DB.parties.list().filter(p => formType === 'SALE' ? p.type !== 'SUPPLIER' : p.type !== 'CUSTOMER')
  const allItems = DB.items.list().filter(i => i.isActive)

  const addLine = (itemId: string) => {
    const item = allItems.find(i => i.id === itemId)
    if (!item || lines.find(l => l.itemId === itemId)) return
    setLines(prev => [...prev, { itemId: item.id, name: item.name, qty: '1', rate: String(formType === 'SALE' ? item.sellingPrice : item.purchasePrice), unit: item.unit }])
  }

  const updateLine = (idx: number, field: string, value: number | string) => {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }

  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx))

  const resetForm = () => {
    setShowForm(false); setLines([]); setPartyId(''); setDate(todayISO()); setReason('')
  }

  const calcTotal = () => lines.reduce((s, l) => s + (parseFloat(l.qty) || 0) * (parseFloat(l.rate) || 0), 0)

  const handleSave = () => {
    if (!partyId || lines.length === 0) return
    const party = parties.find(p => p.id === partyId)
    const dt = formType === 'SALE' ? 'SALE_RETURN' : 'PURCHASE_RETURN'
    const prefix = formType === 'SALE' ? 'SRET' : 'PRET'
    const subtotal = calcTotal()
    const taxAmt = lines.reduce((s, l) => {
      const item = allItems.find(i => i.id === l.itemId)
      return s + (parseFloat(l.qty) || 0) * (parseFloat(l.rate) || 0) * (item?.gstRate || 0) / 100
    }, 0)
    const grandTotal = subtotal + taxAmt
    const newId = generateId()
    const returnInvoiceNo = nextInvoiceNo(DB.invoices.list().filter(i => i.docType === dt).map(i => i.invoiceNo), prefix)
    DB.invoices.save({
      id: newId, docType: dt, invoiceNo: returnInvoiceNo,
      partyId, partyName: party?.name || '', type: formType,
      items: lines.map(l => { const item = allItems.find(i => i.id === l.itemId); return { itemId: l.itemId, itemName: l.name, sku: '', quantity: parseFloat(l.qty) || 0, rate: parseFloat(l.rate) || 0, unit: l.unit, discountPercent: 0, discountAmount: 0, gstRate: item?.gstRate || 0, amount: (parseFloat(l.qty) || 0) * (parseFloat(l.rate) || 0) } }),
      subtotal, discountAmount: 0, taxAmount: taxAmt, grandTotal,
      paymentStatus: 'PENDING', paidAmount: 0, dueAmount: grandTotal, date,
      notes: reason, convertedTo: sourceInv ? sourceInv.id : undefined,
    })
    // Link original invoice to this return
    if (sourceInv) DB.invoices.save({ ...sourceInv, orderStatus: 'CONVERTED', convertedTo: newId })
    // Reverse stock: SALE return adds stock back, PURCHASE return subtracts stock
    applyStockChanges(
      lines.map(l => ({ itemId: l.itemId, quantity: parseFloat(l.qty) || 0, unit: l.unit })),
      formType as 'SALE' | 'PURCHASE',
      true
    )
    // Create ledger entry for the return
    const ledgType = formType === 'SALE' ? 'RECEIPT' as const : 'PAYMENT' as const
    createLedgerEntry(
      partyId, party?.name || '', ledgType, Math.abs(grandTotal), 'RETURN',
      returnInvoiceNo,
      `Return of ${formType === 'SALE' ? 'Sale' : 'Purchase'} - ${reason}`, date,
    )
    resetForm()
  }

  const handleDelete = (id: string) => {
    if (confirm('Delete this return?')) deleteInvoiceWithReversal(id)
  }

  if (showForm) {
    return (
      <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: Spacing.md }}>New Return</div>
        <div style={s.toggleGroup}>
          <button onClick={() => setFormType('SALE')} style={s.toggle(formType === 'SALE', Colors.primary)}>Sale Return</button>
          <button onClick={() => setFormType('PURCHASE')} style={s.toggle(formType === 'PURCHASE', Colors.warning)}>Purchase Return</button>
        </div>
        <Field label="Party">
          <div onClick={() => setShowPartySheet(true)} style={{ ...s.select, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: partyId ? Colors.textPrimary : Colors.textDisabled }}>{partyId ? parties.find(p => p.id === partyId)?.name : 'Select...'}</span>
            <span style={{ color: Colors.textDisabled, fontSize: 10 }}>▼</span>
          </div>
        </Field>
        <SelectSheet open={showPartySheet} onClose={() => setShowPartySheet(false)} title="Select Party"
          options={parties.map(p => ({ value: p.id, label: p.name, sublabel: p.phone }))}
          onSelect={(v) => setPartyId(v)} searchable />
        <Field label="Date"><input type="date" value={date} onChange={e => setDate(e.target.value)} style={s.input} /></Field>
        <div style={{ fontSize: 14, fontWeight: 600, color: Colors.textPrimary, marginBottom: Spacing.sm }}>Items</div>
        <div style={{ display: 'flex', gap: Spacing.xs, flexWrap: 'wrap', marginBottom: Spacing.md }}>
          {allItems.filter(i => !lines.find(l => l.itemId === i.id)).slice(0, 10).map(i => (
            <button key={i.id} onClick={() => addLine(i.id)} style={{ padding: '6px 10px', backgroundColor: Colors.background, border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.sm, fontSize: 11, cursor: 'pointer', color: Colors.textSecondary }}><Icons.Add size={12} />{i.name}</button>
          ))}
        </div>
        {lines.map((l, idx) => (
          <div key={idx} style={{ ...s.row, gap: Spacing.xs, marginBottom: Spacing.xs }}>
            <span style={{ fontSize: 12, color: Colors.textSecondary, width: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</span>
            <input inputMode="decimal" value={l.qty} onChange={e => updateLine(idx, 'qty', e.target.value)} onBlur={e => { const v = parseFloat(e.target.value); if (isNaN(v) || v <= 0) updateLine(idx, 'qty', '1') }} style={{ ...s.input, width: 50, padding: '6px 8px' }} />
            <input inputMode="decimal" value={l.rate} onChange={e => updateLine(idx, 'rate', e.target.value)} onBlur={e => { const v = parseFloat(e.target.value); if (isNaN(v) || v < 0) updateLine(idx, 'rate', '0') }} style={{ ...s.input, width: 70, padding: '6px 8px' }} />
            <span style={{ fontSize: 13, fontWeight: 600, width: 70, textAlign: 'right' }}>{formatCurrency((parseFloat(l.qty) || 0) * (parseFloat(l.rate) || 0))}</span>
            <button onClick={() => removeLine(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: Colors.error, padding: 4 }}><Icons.Delete size={18} /></button>
          </div>
        ))}
        <Field label="Reason"><textarea value={reason} onChange={e => setReason(e.target.value)} style={s.textarea} rows={2} /></Field>
        <div style={{ display: 'flex', gap: Spacing.sm, marginTop: Spacing.md }}>
          <button onClick={handleSave} disabled={!partyId || lines.length === 0} style={!partyId || lines.length === 0 ? s.primaryBtnDisabled : s.primaryBtn}>Save Return</button>
        </div>
        <button onClick={resetForm} style={{ marginTop: Spacing.sm, width: '100%', padding: '10px', background: 'none', border: 'none', color: Colors.textSecondary, cursor: 'pointer' }}>Cancel</button>
      </div>
    )
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={s.toggleGroup}>
        <button onClick={() => setTab('SALE')} style={s.toggle(tab === 'SALE', Colors.primary)}>Sale Returns</button>
        <button onClick={() => setTab('PURCHASE')} style={s.toggle(tab === 'PURCHASE', Colors.warning)}>Purchase Returns</button>
      </div>
      <div style={{ position: 'relative', marginBottom: Spacing.md }}>
        <span style={{ position: 'absolute', left: 12, top: 10, display: 'flex', alignItems: 'center', color: Colors.textDisabled }}><Icons.Search size={16} /></span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search returns..." style={{ ...s.searchBox, paddingLeft: 36 }} />
      </div>
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: Spacing.huge, color: Colors.textDisabled }}>
          <div style={{ marginBottom: Spacing.md }}><Icons.Invoice size={48} /></div>
          <div>No returns found</div>
        </div>
      ) : (
        filtered.map(r => (
          <div key={r.id} style={{ ...s.card, marginBottom: Spacing.sm }}>
            <div style={{ ...s.spaceBetween, marginBottom: Spacing.xs }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: Colors.textPrimary }}>#{r.invoiceNo}</span>
              <span style={{ fontSize: 11, color: Colors.error }}>Return</span>
            </div>
            <div style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.sm }}>{r.partyName} · {formatDate(r.date)}</div>
            <div style={{ ...s.spaceBetween, marginBottom: Spacing.sm }}>
              <span style={{ fontSize: 12, color: Colors.textDisabled }}>{r.items.length} items</span>
              <span style={{ fontWeight: 700, fontSize: 17, color: Colors.error }}>-{formatCurrency(r.grandTotal)}</span>
            </div>
            {r.notes && <div style={{ fontSize: 11, color: Colors.textSecondary, marginBottom: Spacing.sm, fontStyle: 'italic' }}>{r.notes}</div>}
            <div style={{ display: 'flex', gap: Spacing.xs }}>
              <button onClick={() => onNavigate('invoice-view?id=' + r.id)} style={{ flex: 1, padding: '8px', backgroundColor: Colors.surfaceVariant, border: 'none', borderRadius: BorderRadius.sm, fontSize: 12, fontWeight: 600, color: Colors.textPrimary, cursor: 'pointer' }}>View</button>
              <button onClick={() => handleDelete(r.id)} style={{ padding: '8px', backgroundColor: Colors.errorLight, border: 'none', borderRadius: BorderRadius.sm, color: Colors.error, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Icons.Delete size={16} /></button>
            </div>
          </div>
        ))
      )}
      <button onClick={() => { setShowForm(true); setFormType(tab) }} style={{
        position: 'fixed', right: Spacing.lg, bottom: 80, width: 56, height: 56, borderRadius: 28,
        backgroundColor: Colors.primary, color: Colors.textLight, border: 'none', fontSize: 28,
        cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Icons.Add size={28} /></button>
    </div>
  )
}
