import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatDate, generateId, todayISO } from '../utils/formatting'
import { Icons } from '../utils/Icons'

export function StockTransfer({ onBack }: { onBack?: () => void }) {
  const [transfers, setTransfers] = useState(() => [...DB.stockTransfers.list()].sort((a, b) => b.date.localeCompare(a.date)))
  const [showForm, setShowForm] = useState(false)
  const [itemId, setItemId] = useState('')
  const [fromW, setFromW] = useState('')
  const [toW, setToW] = useState('')
  const [qty, setQty] = useState('1')
  const [date, setDate] = useState(todayISO())
  const [notes, setNotes] = useState('')

  const items = DB.items.list().filter(i => i.isActive)
  const warehouses = DB.warehouses.list().filter(w => w.isActive)
  const selectedItem = items.find(i => i.id === itemId)
  const refresh = () => setTransfers([...DB.stockTransfers.list()].sort((a, b) => b.date.localeCompare(a.date)))

  const handleSave = () => {
    if (!itemId || !fromW || !toW || !qty || fromW === toW) return
    const item = items.find(i => i.id === itemId)
    if (!item) return
    const q = parseInt(qty) || 0
    if (q <= 0) return
    DB.stockTransfers.save({ id: generateId(), itemId, itemName: item.name, fromWarehouse: fromW, toWarehouse: toW, quantity: q, date, notes: notes.trim() || undefined })
    DB.auditLogs.save({ id: generateId(), entity: 'STOCK', entityId: itemId, action: 'UPDATE', user: 'Admin', timestamp: new Date().toISOString(), description: `Transferred ${q} ${item.name} from ${fromW} to ${toW}` })
    const savedItem = DB.items.byId(itemId)
    if (savedItem) { DB.items.save({ ...savedItem, warehouse: toW }) }
    refresh(); setShowForm(false); setItemId(''); setFromW(''); setToW(''); setQty('1'); setDate(todayISO()); setNotes('')
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg }}>
        {onBack && <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: Colors.textSecondary, padding: 0, display: 'flex' }}><Icons.Back size={22} /></button>}
        <div><div style={{ fontSize: 18, fontWeight: 700, color: Colors.textPrimary }}>Stock Transfer</div><div style={{ fontSize: 12, color: Colors.textSecondary }}>Move stock between warehouses</div></div>
      </div>
      {showForm && (
        <div style={{ ...s.card, marginBottom: Spacing.md }}>
          <Field label="Item"><select value={itemId} onChange={e => setItemId(e.target.value)} style={s.select}><option value="">Select item...</option>{items.map(i => <option key={i.id} value={i.id}>{i.name} (Stock: {i.currentStock})</option>)}</select></Field>
          {selectedItem && <div style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.sm }}>Current Stock: <strong>{selectedItem.currentStock} {selectedItem.unit}</strong></div>}
          <Field label="From Warehouse"><select value={fromW} onChange={e => setFromW(e.target.value)} style={s.select}><option value="">Select source...</option>{warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}</select></Field>
          <Field label="To Warehouse"><select value={toW} onChange={e => setToW(e.target.value)} style={s.select}><option value="">Select destination...</option>{warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}</select></Field>
          {fromW && toW && fromW === toW && <div style={{ fontSize: 12, color: Colors.error, marginBottom: Spacing.sm }}>Source and destination must be different</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: Spacing.md }}>
            <Field label="Quantity"><input type="number" value={qty} onChange={e => setQty(e.target.value)} min="1" style={s.input} /></Field>
            <Field label="Date"><input type="date" value={date} onChange={e => setDate(e.target.value)} style={s.input} /></Field>
          </div>
          <Field label="Notes"><input value={notes} onChange={e => setNotes(e.target.value)} style={s.input} placeholder="Reason for transfer" /></Field>
          <div style={{ display: 'flex', gap: Spacing.sm }}>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '12px', background: 'none', border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.sm, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSave} disabled={!itemId || !fromW || !toW || fromW === toW} style={{ flex: 2, ...(!itemId || !fromW || !toW || fromW === toW ? s.primaryBtnDisabled : s.primaryBtn) }}>Transfer</button>
          </div>
        </div>
      )}
      {transfers.length === 0 && !showForm ? (
        <div style={{ textAlign: 'center', padding: Spacing.huge, color: Colors.textDisabled }}><Icons.Transfer size={48} /><div style={{ marginTop: Spacing.md }}>No transfers yet</div></div>
      ) : transfers.map(t => (
        <div key={t.id} style={s.listItem}>
          <div style={s.listStrip(Colors.accent)} />
          <div style={s.listBody}>
            <div style={s.spaceBetween}>
              <span style={{ fontWeight: 600, fontSize: 14, color: Colors.textPrimary }}>{t.itemName}</span>
              <span style={{ fontWeight: 700, fontSize: 14, color: Colors.accent }}>{t.quantity}</span>
            </div>
            <div style={{ fontSize: 11, color: Colors.textSecondary }}>{t.fromWarehouse} → {t.toWarehouse} · {formatDate(t.date)}</div>
          </div>
        </div>
      ))}
      <button onClick={() => setShowForm(true)} style={{ position: 'fixed', right: Spacing.lg, bottom: 80, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, color: '#fff', border: 'none', fontSize: 28, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Add size={28} /></button>
    </div>
  )
}
