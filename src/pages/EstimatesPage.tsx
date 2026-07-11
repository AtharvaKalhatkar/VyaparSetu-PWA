import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, formatDate, generateId, todayISO, nextInvoiceNo } from '../utils/formatting'
import { SelectSheet } from '../utils/smooth'
import { Icons } from '../utils/Icons'
import { deleteInvoiceWithReversal, applyStockChanges, createLedgerEntry } from '../utils/invoiceOps'
import type { Invoice } from '../types'

export function EstimatesPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [partyId, setPartyId] = useState('')
  const [showPartySheet, setShowPartySheet] = useState(false)
  const [date, setDate] = useState(todayISO())
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<{ itemId: string; name: string; qty: string; rate: string; unit: string }[]>([])

  const allEstimates = DB.invoices.list().filter(i => i.docType === 'ESTIMATE')
  const filtered = allEstimates.filter(i => i.invoiceNo.toLowerCase().includes(search.toLowerCase()) || i.partyName.toLowerCase().includes(search.toLowerCase()))

  const parties = DB.parties.list().filter(p => p.type !== 'SUPPLIER')
  const allItems = DB.items.list().filter(i => i.isActive)

  const calcTotal = () => lines.reduce((s, l) => s + (parseFloat(l.qty) || 0) * (parseFloat(l.rate) || 0), 0)

  const addLine = (itemId: string) => {
    const item = allItems.find(i => i.id === itemId)
    if (!item || lines.find(l => l.itemId === itemId)) return
    setLines(prev => [...prev, { itemId: item.id, name: item.name, qty: '1', rate: String(item.sellingPrice), unit: item.unit }])
  }

  const updateLine = (idx: number, field: string, value: number | string) => {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }

  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx))

  const resetForm = () => {
    setShowForm(false); setLines([]); setPartyId(''); setDate(todayISO()); setValidUntil(''); setNotes('')
  }

  const handleSave = () => {
    if (!partyId || lines.length === 0) return
    const party = parties.find(p => p.id === partyId)
    const total = calcTotal()
    DB.invoices.save({
      id: generateId(), docType: 'ESTIMATE', invoiceNo: nextInvoiceNo(DB.invoices.list().filter(i => i.docType === 'ESTIMATE').map(i => i.invoiceNo), 'EST'),
      partyId, partyName: party?.name || '', type: 'SALE',
      items: lines.map(l => { const item = allItems.find(i => i.id === l.itemId); return { itemId: l.itemId, itemName: l.name, sku: '', quantity: parseFloat(l.qty) || 0, rate: parseFloat(l.rate) || 0, unit: l.unit, discountPercent: 0, discountAmount: 0, gstRate: item?.gstRate || 0, amount: (parseFloat(l.qty) || 0) * (parseFloat(l.rate) || 0) } }),
      subtotal: total, discountAmount: 0, taxAmount: 0, grandTotal: total,
      paymentStatus: 'DRAFT', paidAmount: 0, dueAmount: total, date,
      dueDate: validUntil || undefined, notes,
    })
    resetForm()
  }

  const handleConvert = (est: Invoice) => {
    const subtotal = est.items.reduce((s, i) => s + i.amount, 0)
    const taxAmt = est.items.reduce((s, i) => s + i.amount * i.gstRate / 100, 0)
    const grandTotal = subtotal + taxAmt
    const newInv = {
      id: generateId(), docType: 'SALE' as const, invoiceNo: nextInvoiceNo(DB.invoices.list().filter(i => i.docType === 'SALE').map(i => i.invoiceNo), 'INV'),
      partyId: est.partyId, partyName: est.partyName, type: 'SALE' as const,
      items: est.items.map(i => ({ ...i })),
      subtotal, discountAmount: 0, taxAmount: taxAmt, grandTotal,
      paymentStatus: 'PENDING' as const, paidAmount: 0, dueAmount: grandTotal, date: todayISO(),
    }
    DB.invoices.save(newInv)
    DB.invoices.save({ ...est, orderStatus: 'CONVERTED', convertedTo: newInv.id })
    applyStockChanges(
      est.items.map(i => ({ itemId: i.itemId, quantity: i.quantity, unit: i.unit })),
      'SALE', false
    )
    createLedgerEntry(newInv.partyId, newInv.partyName, 'SALE', grandTotal, 'CREDIT', newInv.invoiceNo, 'Converted from estimate ' + est.invoiceNo, todayISO())
  }

  const handleDelete = (id: string) => {
    if (confirm('Delete this estimate?')) deleteInvoiceWithReversal(id)
  }

  const handleShare = (est: Invoice) => {
    const msg = `📋 *Estimate*\n\nEstimate: ${est.invoiceNo}\nDate: ${est.date}\nParty: ${est.partyName}\nAmount: ₹${est.grandTotal.toLocaleString()}\n\nThank you!`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  if (showForm) {
    return (
      <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: Spacing.md }}>New Estimate</div>
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
        <Field label="Valid Until"><input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} style={s.input} /></Field>
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
        <Field label="Notes"><textarea value={notes} onChange={e => setNotes(e.target.value)} style={s.textarea} rows={2} /></Field>
        <div style={{ display: 'flex', gap: Spacing.sm, marginTop: Spacing.md }}>
          <button onClick={handleSave} disabled={!partyId || lines.length === 0} style={!partyId || lines.length === 0 ? s.primaryBtnDisabled : s.primaryBtn}>Save Estimate</button>
        </div>
        <button onClick={resetForm} style={{ marginTop: Spacing.sm, width: '100%', padding: '10px', background: 'none', border: 'none', color: Colors.textSecondary, cursor: 'pointer' }}>Cancel</button>
      </div>
    )
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ position: 'relative', marginBottom: Spacing.md }}>
        <span style={{ position: 'absolute', left: 12, top: 10, display: 'flex', alignItems: 'center', color: Colors.textDisabled }}><Icons.Search size={16} /></span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search estimates..." style={{ ...s.searchBox, paddingLeft: 36 }} />
      </div>
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: Spacing.huge, color: Colors.textDisabled }}>
          <div style={{ marginBottom: Spacing.md }}><Icons.Invoice size={48} /></div>
          <div>No estimates found</div>
        </div>
      ) : (
        filtered.map(est => {
          const estStatus = est.orderStatus === 'CONVERTED' ? 'CONVERTED' : est.paymentStatus === 'DRAFT' ? 'DRAFT' : 'SENT'
          const stColor = estStatus === 'CONVERTED' ? Colors.textDisabled : estStatus === 'DRAFT' ? Colors.warning : Colors.success
          return (
            <div key={est.id} style={{ ...s.card, marginBottom: Spacing.sm }}>
              <div style={{ ...s.spaceBetween, marginBottom: Spacing.xs }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: Colors.textPrimary }}>#{est.invoiceNo}</span>
                <span style={s.badge(stColor)}>{estStatus}</span>
              </div>
              <div style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.sm }}>{est.partyName} · {formatDate(est.date)}{est.dueDate ? ' · Valid till ' + formatDate(est.dueDate) : ''}</div>
              <div style={{ ...s.spaceBetween, marginBottom: Spacing.sm }}>
                <span style={{ fontSize: 12, color: Colors.textDisabled }}>{est.items.length} items</span>
                <span style={{ fontWeight: 700, fontSize: 17, color: Colors.textPrimary }}>{formatCurrency(est.grandTotal)}</span>
              </div>
              <div style={{ display: 'flex', gap: Spacing.xs }}>
                <button onClick={() => onNavigate('invoice-view?id=' + est.id)} style={{ flex: 1, padding: '8px', backgroundColor: Colors.surfaceVariant, border: 'none', borderRadius: BorderRadius.sm, fontSize: 12, fontWeight: 600, color: Colors.textPrimary, cursor: 'pointer' }}>View</button>
                {estStatus !== 'CONVERTED' && (
                  <button onClick={() => handleConvert(est)} style={{ flex: 1, padding: '8px', backgroundColor: Colors.primary + '15', border: 'none', borderRadius: BorderRadius.sm, fontSize: 12, fontWeight: 600, color: Colors.primary, cursor: 'pointer' }}>Convert to Sale</button>
                )}
                <button onClick={() => handleShare(est)} style={{ padding: '8px', backgroundColor: '#25D36615', border: 'none', borderRadius: BorderRadius.sm, color: '#25D366', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Icons.WhatsApp size={16} /></button>
                <button onClick={() => handleDelete(est.id)} style={{ padding: '8px', backgroundColor: Colors.errorLight, border: 'none', borderRadius: BorderRadius.sm, color: Colors.error, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Icons.Delete size={16} /></button>
              </div>
            </div>
          )
        })
      )}
      <button onClick={() => setShowForm(true)} style={{
        position: 'fixed', right: Spacing.lg, bottom: 80, width: 56, height: 56, borderRadius: 28,
        backgroundColor: Colors.primary, color: Colors.textLight, border: 'none', fontSize: 28,
        cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Icons.Add size={28} /></button>
    </div>
  )
}
