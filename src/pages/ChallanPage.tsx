import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, formatDate, generateId, todayISO, nextInvoiceNo } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { deleteInvoiceWithReversal } from '../utils/invoiceOps'

export function ChallanPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'list' | 'pick' | 'create'>('list')
  const [loadDate, setLoadDate] = useState(todayISO())
  const [selectedInvs, setSelectedInvs] = useState<string[]>([])
  const [vehicleNo, setVehicleNo] = useState('')
  const [driverName, setDriverName] = useState('')
  const [notes, setNotes] = useState('')
  const [editingLines, setEditingLines] = useState<{ itemId: string; name: string; qty: string; unit: string }[]>([])
  const [printId, setPrintId] = useState<string | null>(null)

  const allChallans = DB.invoices.list().filter(i => i.docType === 'CHALLAN')
  const filtered = allChallans.filter(i => i.invoiceNo.toLowerCase().includes(search.toLowerCase()) || i.partyName.toLowerCase().includes(search.toLowerCase()))
  const daySales = DB.invoices.list().filter(i => i.type === 'SALE' && i.date === loadDate && i.docType === 'SALE')

  const toggleInv = (id: string) => {
    setSelectedInvs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const buildFromInvoices = () => {
    const merged: Record<string, { itemId: string; name: string; qty: string; unit: string }> = {}
    selectedInvs.forEach(id => {
      const inv = DB.invoices.byId(id)
      if (!inv) return
      inv.items.forEach(item => {
        const key = item.itemId
        if (merged[key]) merged[key].qty = String(parseFloat(merged[key].qty) + item.quantity)
        else merged[key] = { itemId: key, name: item.itemName, qty: String(item.quantity), unit: item.unit }
      })
    })
    setEditingLines(Object.values(merged))
    setView('create')
  }

  const updateLine = (idx: number, qty: string) => {
    setEditingLines(prev => prev.map((l, i) => i === idx ? { ...l, qty } : l))
  }

  const removeLine = (idx: number) => {
    setEditingLines(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSave = () => {
    const activeLines = editingLines.filter(l => parseFloat(l.qty) > 0)
    if (activeLines.length === 0) return
    DB.invoices.save({
      id: generateId(), docType: 'CHALLAN', invoiceNo: nextInvoiceNo(allChallans.map(i => i.invoiceNo), 'LS'),
      partyId: selectedInvs.join(','), partyName: `${selectedInvs.length} invoices`, type: 'SALE',
      items: activeLines.map(l => ({ itemId: l.itemId, itemName: l.name, sku: '', quantity: parseFloat(l.qty) || 0, rate: 0, unit: l.unit, discountPercent: 0, discountAmount: 0, gstRate: 0, amount: 0 })),
      subtotal: 0, discountAmount: 0, taxAmount: 0, grandTotal: 0,
      paymentStatus: 'DRAFT', paidAmount: 0, dueAmount: 0, date: loadDate,
      notes: `Vehicle: ${vehicleNo}, Driver: ${driverName}${notes ? ', ' + notes : ''}`, transportDetails: vehicleNo,
    })
    setSelectedInvs([]); setView('list')
  }

  if (printId) {
    const doc = DB.invoices.byId(printId)
    if (!doc) { setPrintId(null); return null }
    return (
      <div style={{ padding: Spacing.lg, maxWidth: 400, margin: '0 auto', backgroundColor: '#fff', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', marginBottom: Spacing.lg, borderBottom: `2px solid ${Colors.textPrimary}`, paddingBottom: Spacing.md }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>LOAD SHEET</h2>
          <div style={{ fontSize: 11, color: Colors.textSecondary }}>{doc.invoiceNo} · {formatDate(doc.date)}</div>
        </div>
        {doc.transportDetails && <div style={{ fontSize: 12, marginBottom: Spacing.sm }}>Vehicle: <strong>{doc.transportDetails}</strong></div>}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${Colors.textPrimary}` }}>
              <th style={{ padding: '6px 4px', textAlign: 'left' }}>#</th>
              <th style={{ padding: '6px 4px', textAlign: 'left' }}>Item</th>
              <th style={{ padding: '6px 4px', textAlign: 'right' }}>Qty</th>
              <th style={{ padding: '6px 4px', textAlign: 'right' }}>Delivered</th>
            </tr>
          </thead>
          <tbody>
            {doc.items.map((item, i) => (
              <tr key={i} style={{ borderBottom: `1px dashed ${Colors.divider}` }}>
                <td style={{ padding: '8px 4px' }}>{i + 1}</td>
                <td style={{ padding: '8px 4px', fontWeight: 600 }}>{item.itemName}</td>
                <td style={{ padding: '8px 4px', textAlign: 'right' }}>{item.quantity} {item.unit}</td>
                <td style={{ padding: '8px 4px', textAlign: 'right' }}>______</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: Spacing.lg, fontSize: 11, color: Colors.textSecondary, textAlign: 'center', borderTop: `1px solid ${Colors.divider}`, paddingTop: Spacing.md }}>
          <div>Driver Signature: __________________</div>
          <div>Shopkeeper Signature: __________________</div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button onClick={() => window.print()} className="no-print" style={{ padding: '10px 24px', backgroundColor: Colors.primary, color: '#fff', border: 'none', borderRadius: BorderRadius.md, cursor: 'pointer', fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icons.Print size={16} /> Print</button>
          <button onClick={() => setPrintId(null)} className="no-print" style={{ marginLeft: 10, padding: '10px 24px', background: 'none', border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.md, cursor: 'pointer' }}>Back</button>
        </div>
      </div>
    )
  }

  if (view === 'list') {
    return (
      <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: Colors.textPrimary }}>Load Sheets</h2>
          <button onClick={() => setView('pick')} style={{ padding: '8px 14px', backgroundColor: Colors.primary, color: '#fff', border: 'none', borderRadius: BorderRadius.md, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icons.Add size={14} /> Create
          </button>
        </div>
        <div style={{ position: 'relative', marginBottom: Spacing.md }}>
          <span style={{ position: 'absolute', left: 12, top: 10, display: 'flex', alignItems: 'center', color: Colors.textDisabled }}><Icons.Search size={16} /></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ ...s.searchBox, paddingLeft: 36 }} />
        </div>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: Spacing.huge, color: Colors.textDisabled }}>
            <Icons.Truck size={48} /><div style={{ marginTop: Spacing.sm }}>No load sheets yet</div>
            <button onClick={() => setView('pick')} style={{ marginTop: Spacing.md, padding: '10px 20px', backgroundColor: Colors.primary, color: '#fff', border: 'none', borderRadius: BorderRadius.md, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Create from Invoices</button>
          </div>
        ) : filtered.map(c => (
          <div key={c.id} style={{ ...s.card, marginBottom: Spacing.sm }}>
            <div style={{ ...s.spaceBetween, marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>#{c.invoiceNo}</span>
              <span style={s.badge(c.orderStatus === 'CONVERTED' ? Colors.textDisabled : Colors.info)}>{c.orderStatus === 'CONVERTED' ? 'Delivered' : 'Open'}</span>
            </div>
            <div style={{ fontSize: 11, color: Colors.textSecondary, marginBottom: Spacing.sm }}>{formatDate(c.date)} · {c.items.length} items · {c.transportDetails || 'No vehicle'}</div>
            <div style={{ display: 'flex', gap: Spacing.xs }}>
              <button onClick={() => setPrintId(c.id)} style={{ flex: 1, padding: '8px', backgroundColor: Colors.primary, border: 'none', borderRadius: BorderRadius.sm, fontSize: 11, fontWeight: 600, color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Icons.Print size={14} /> Print</button>
              {c.orderStatus !== 'CONVERTED' && <button onClick={() => { DB.invoices.save({ ...c, orderStatus: 'CONVERTED' }); alert('Marked delivered!') }} style={{ flex: 1, padding: '8px', backgroundColor: Colors.success + '20', border: 'none', borderRadius: BorderRadius.sm, fontSize: 11, fontWeight: 600, color: Colors.success, cursor: 'pointer' }}>Mark Delivered</button>}
              <button onClick={() => { if (confirm('Delete?')) deleteInvoiceWithReversal(c.id) }} style={{ padding: '8px', backgroundColor: Colors.errorLight, border: 'none', borderRadius: BorderRadius.sm, color: Colors.error, cursor: 'pointer' }}><Icons.Delete size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (view === 'pick') {
    return (
      <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md }}>
          <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Icons.Back size={20} /></button>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Select Invoices</h2>
        </div>
        <Field label="Load Date"><input type="date" value={loadDate} onChange={e => setLoadDate(e.target.value)} style={s.input} /></Field>
        <div style={{ fontSize: 13, fontWeight: 600, color: Colors.textPrimary, marginBottom: Spacing.sm }}>Invoices on {formatDate(loadDate)} ({daySales.length})</div>
        {daySales.length === 0 ? (
          <div style={{ textAlign: 'center', padding: Spacing.lg, color: Colors.textDisabled, fontSize: 13 }}>No sales on this date</div>
        ) : daySales.map(inv => (
          <label key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm, padding: '10px 12px', backgroundColor: selectedInvs.includes(inv.id) ? Colors.primaryLight : Colors.surface, border: `1px solid ${selectedInvs.includes(inv.id) ? Colors.primary : Colors.border}`, borderRadius: BorderRadius.md, marginBottom: Spacing.xs, cursor: 'pointer' }}>
            <input type="checkbox" checked={selectedInvs.includes(inv.id)} onChange={() => toggleInv(inv.id)} style={{ width: 18, height: 18, accentColor: Colors.primary }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{inv.invoiceNo} — {inv.partyName}</div>
              <div style={{ fontSize: 11, color: Colors.textSecondary }}>{inv.items.length} items · {formatCurrency(inv.grandTotal)}</div>
            </div>
          </label>
        ))}
        <Field label="Vehicle No"><input value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} placeholder="e.g., MH-12-AB-1234" style={s.input} /></Field>
        <Field label="Driver Name"><input value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="Driver name" style={s.input} /></Field>
        <Field label="Notes"><textarea value={notes} onChange={e => setNotes(e.target.value)} style={s.textarea} rows={2} placeholder="Any instructions..." /></Field>
        <button onClick={buildFromInvoices} disabled={selectedInvs.length === 0} style={{ width: '100%', ...(selectedInvs.length === 0 ? s.primaryBtnDisabled : s.primaryBtn) }}>
          Generate Load Sheet ({selectedInvs.length} invoices)
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md }}>
        <button onClick={() => { setView('pick'); setSelectedInvs([]) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Icons.Back size={20} /></button>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Review Load Items</h2>
      </div>
      <div style={{ backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md, fontSize: 13 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Load Sheet for {formatDate(loadDate)}</div>
        <div style={{ fontSize: 11, color: Colors.textSecondary }}>{selectedInvs.length} invoices · Vehicle: {vehicleNo || '—'} · Driver: {driverName || '—'}</div>
      </div>
      {editingLines.map((l, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, backgroundColor: Colors.surface, border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.md, padding: '6px 10px' }}>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{l.name}</span>
          <button onClick={() => updateLine(idx, String(Math.max(0, (parseFloat(l.qty) || 0) - 1)))} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${Colors.border}`, background: Colors.surfaceVariant, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>−</button>
          <input inputMode="decimal" value={l.qty} onChange={e => updateLine(idx, e.target.value)} onBlur={e => { const v = parseFloat(e.target.value); updateLine(idx, isNaN(v) || v < 0 ? '0' : String(v)) }} style={{ width: 50, textAlign: 'center', border: `1px solid ${Colors.border}`, borderRadius: 6, padding: '4px', fontSize: 14, fontWeight: 700 }} />
          <button onClick={() => updateLine(idx, String((parseFloat(l.qty) || 0) + 1))} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${Colors.border}`, background: Colors.surfaceVariant, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>+</button>
          <span style={{ fontSize: 11, color: Colors.textSecondary, minWidth: 24 }}>{l.unit}</span>
          {editingLines.length > 1 && <button onClick={() => removeLine(idx)} style={{ background: 'none', border: 'none', color: Colors.error, cursor: 'pointer' }}><Icons.Delete size={14} /></button>}
        </div>
      ))}
      <button onClick={handleSave} disabled={editingLines.filter(l => parseFloat(l.qty) > 0).length === 0} style={{ marginTop: Spacing.md, width: '100%', ...s.primaryBtn }}>Save Load Sheet</button>
    </div>
  )
}