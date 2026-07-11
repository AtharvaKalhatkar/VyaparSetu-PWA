import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, Field } from '../utils/styles'
import { formatCurrency, generateId, formatDate, todayISO } from '../utils/formatting'

import { DB } from '../utils/storage'
import { Icons } from '../utils/Icons'

interface AdjustmentLine {
  itemId: string
  itemName: string
  expectedQty: number
  actualQty: number
  difference: number
  reason: string
}

export function StockTake() {
  const items = DB.items.list().filter(i => i.isActive)
  const [adjustments, setAdjustments] = useState<AdjustmentLine[]>(() =>
    items.map(i => ({ itemId: i.id, itemName: i.name, expectedQty: i.currentStock, actualQty: i.currentStock, difference: 0, reason: '' }))
  )
  const [date, setDate] = useState(todayISO)
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = adjustments.filter(a => a.itemName.toLowerCase().includes(search.toLowerCase()))

  const updateActual = (itemId: string, val: number) => {
    setAdjustments(prev => prev.map(a => a.itemId === itemId ? { ...a, actualQty: val, difference: val - a.expectedQty } : a))
  }

  const updateReason = (itemId: string, reason: string) => {
    setAdjustments(prev => prev.map(a => a.itemId === itemId ? { ...a, reason } : a))
  }

  const totalDiff = adjustments.reduce((s, a) => s + a.difference, 0)
  const diffItems = adjustments.filter(a => a.difference !== 0)

  const saveAdjustment = () => {
    diffItems.forEach(a => {
      const item = DB.items.byId(a.itemId)
      if (item) {
        DB.items.save({ ...item, currentStock: a.actualQty })
        DB.auditLogs.save({ id: generateId(), entity: 'ITEM', entityId: a.itemId, action: 'STOCK_ADJUST', user: 'Admin', description: `Stock adjustment: ${a.itemName} — expected ${a.expectedQty}, actual ${a.actualQty} (diff: ${a.difference > 0 ? '+' : ''}${a.difference}), reason: ${a.reason || 'N/A'}`, timestamp: new Date().toISOString() })
      }
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: Spacing.sm, marginBottom: Spacing.lg }}>
        <div style={{ background: diffItems.length > 0 ? '#FFF3E0' : Colors.successLight, padding: Spacing.md, borderRadius: BorderRadius.md }}>
          <div style={{ fontSize: 11, color: Colors.textSecondary }}>Items with Diff</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: diffItems.length > 0 ? '#E65100' : Colors.success }}>{diffItems.length}</div>
        </div>
        <div style={{ background: totalDiff !== 0 ? '#FFF3E0' : Colors.successLight, padding: Spacing.md, borderRadius: BorderRadius.md }}>
          <div style={{ fontSize: 11, color: Colors.textSecondary }}>Total Difference</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: totalDiff !== 0 ? '#E65100' : Colors.success }}>{formatCurrency(totalDiff)}</div>
        </div>
      </div>

      <Field label="Stock Take Date"><input type="date" value={date} onChange={e => setDate(e.target.value)} style={s.input} /></Field>
      <Field label="Notes"><input value={notes} onChange={e => setNotes(e.target.value)} style={s.input} placeholder="Optional notes about this stock take" /></Field>
      <Field label="Search Item"><input value={search} onChange={e => setSearch(e.target.value)} style={s.input} placeholder="Type item name..." /></Field>

      <div style={{ maxHeight: 400, overflowY: 'auto', marginBottom: Spacing.lg }}>
        {filtered.map(a => (
          <div key={a.itemId} style={{ background: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, border: `1px solid ${a.difference !== 0 ? '#FFCC02' : Colors.divider}` }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: Colors.textPrimary, marginBottom: Spacing.xs }}>{a.itemName}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: Spacing.sm, marginBottom: Spacing.xs }}>
              <div>
                <div style={{ fontSize: 10, color: Colors.textSecondary }}>Expected</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: Colors.textPrimary }}>{a.expectedQty}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: Colors.textSecondary }}>Actual</div>
                <input type="number" value={a.actualQty} onChange={e => updateActual(a.itemId, parseInt(e.target.value) || 0)} style={{ ...s.input, padding: '6px 8px', fontSize: 13, fontWeight: 600 }} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: Colors.textSecondary }}>Diff</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: a.difference > 0 ? Colors.success : a.difference < 0 ? Colors.error : Colors.textSecondary }}>{a.difference > 0 ? '+' : ''}{a.difference}</div>
              </div>
            </div>
            {a.difference !== 0 && <input value={a.reason} onChange={e => updateReason(a.itemId, e.target.value)} style={{ ...s.input, padding: '6px 8px', fontSize: 11 }} placeholder="Reason for difference..." />}
          </div>
        ))}
      </div>

      {diffItems.length > 0 && (
        <button onClick={saveAdjustment} style={saved ? { ...s.primaryBtn, backgroundColor: Colors.success } : { ...s.primaryBtn, backgroundColor: '#E65100' }}>
          {saved ? 'Stock Updated!' : `Save Adjustments (${diffItems.length} items)`}
        </button>
      )}
      {diffItems.length === 0 && <div style={{ textAlign: 'center', color: Colors.textSecondary, fontSize: 13 }}>No differences — all stock counts match</div>}
    </div>
  )
}
