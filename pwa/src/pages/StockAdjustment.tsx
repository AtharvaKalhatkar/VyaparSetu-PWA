import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { generateId, todayISO } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import type { StockAdjustment as SA } from '../types'

export function StockAdjustment() {
  const [, setTick] = useState(0)
  const allItems = DB.items.list().filter(i => i.isActive)
  const adjustments = DB.stockAdjustments.list().sort((a, b) => b.date.localeCompare(a.date))
  const [itemId, setItemId] = useState('')
  const [type, setType] = useState<'ADD' | 'REMOVE'>('ADD')
  const [qty, setQty] = useState('1')
  const [reason, setReason] = useState('')
  const [date, setDate] = useState(todayISO())
  const [notes, setNotes] = useState('')

  const selectedItem = allItems.find(i => i.id === itemId)

  const handleSave = () => {
    if (!itemId || !qty || !reason) return
    const item = allItems.find(i => i.id === itemId)
    if (!item) return
    const q = parseInt(qty) || 0
    if (q <= 0) return
    const adj: SA = {
      id: generateId(), itemId, itemName: item.name,
      type, quantity: q, reason, date, notes,
    }
    DB.stockAdjustments.save(adj)
    if (type === 'ADD') item.currentStock += q
    else item.currentStock = Math.max(0, item.currentStock - q)
    DB.items.save(item)
    setReason('')
    setNotes('')
    setDate(todayISO())
    setQty('1')
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <Field label="Item">
        <select value={itemId} onChange={e => setItemId(e.target.value)} style={s.select}>
          <option value="">Select item...</option>
          {allItems.map(i => <option key={i.id} value={i.id}>{i.name} (Stock: {i.currentStock} {i.unit})</option>)}
        </select>
      </Field>
      {selectedItem && (
        <div style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.sm }}>
          Current Stock: <strong>{selectedItem.currentStock} {selectedItem.unit}</strong>
        </div>
      )}
      <div style={s.toggleGroup}>
        <button onClick={() => setType('ADD')} style={s.toggle(type === 'ADD', Colors.success)}>+ Add Stock</button>
        <button onClick={() => setType('REMOVE')} style={s.toggle(type === 'REMOVE', Colors.error)}>− Remove Stock</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: Spacing.md }}>
        <Field label="Quantity"><input type="number" value={qty} onChange={e => setQty(e.target.value)} min="1" style={s.input} /></Field>
        <Field label="Date"><input type="date" value={date} onChange={e => setDate(e.target.value)} style={s.input} /></Field>
      </div>
      <Field label="Reason"><input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g., Damaged, New stock, Return" style={s.input} /></Field>
      <Field label="Notes (optional)"><input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional details" style={s.input} /></Field>
      <button onClick={handleSave} disabled={!itemId || !qty || !reason} style={{ ...s.primaryBtn, marginTop: Spacing.sm }}>Save Adjustment</button>

      <div style={{ fontSize: 15, fontWeight: 600, color: Colors.textPrimary, marginTop: Spacing.xxl, marginBottom: Spacing.md }}>
        Adjustment History ({adjustments.length})
      </div>
      {adjustments.map(a => {
        const item = allItems.find(i => i.id === a.itemId)
        return (
          <div key={a.id} style={{ ...s.card, marginBottom: Spacing.sm, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: Colors.textPrimary }}>{a.itemName}</div>
              <div style={{ fontSize: 11, color: Colors.textSecondary }}>{a.reason} · {a.date} {a.notes ? `· ${a.notes}` : ''}</div>
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: a.type === 'ADD' ? Colors.success : Colors.error }}>
              {a.type === 'ADD' ? '+' : '-'}{a.quantity}
            </span>
            <button onClick={() => { if (confirm('Undo this adjustment?')) { if (item && a.type === 'ADD') item.currentStock -= a.quantity; else if (item) item.currentStock = Math.max(0, item.currentStock + a.quantity); if (item) DB.items.save(item); DB.stockAdjustments.delete(a.id); setTick(t => t + 1) } }} style={{ background: 'none', border: 'none', color: Colors.error, cursor: 'pointer', marginLeft: Spacing.sm, display: 'flex' }}><Icons.Delete size={16} /></button>
          </div>
        )
      })}
    </div>
  )
}
