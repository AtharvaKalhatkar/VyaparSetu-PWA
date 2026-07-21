import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, generateId } from '../utils/formatting'
import { Icons } from '../utils/Icons'

export function PriceListsPage({ onBack }: { onBack?: () => void }) {
  const [lists, setLists] = useState(() => DB.priceLists.list())
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const refresh = () => setLists([...DB.priceLists.list()])

  const handleSave = () => {
    if (!name.trim()) return
    DB.priceLists.save({ id: generateId(), name: name.trim(), isDefault: lists.length === 0 })
    refresh(); setShowForm(false); setName('')
  }

  const handleSetDefault = (id: string) => {
    lists.forEach(l => DB.priceLists.save({ ...l, isDefault: l.id === id }))
    refresh()
  }

  const handleDelete = (id: string) => {
    if (lists.find(l => l.id === id)?.isDefault) { alert('Cannot delete default price list'); return }
    if (!confirm('Delete this price list?')) return
    DB.priceLists.delete(id); refresh()
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg }}>
        {onBack && <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: Colors.textSecondary, padding: 0, display: 'flex' }}><Icons.Back size={22} /></button>}
        <div><div style={{ fontSize: 18, fontWeight: 700, color: Colors.textPrimary }}>Price Lists</div><div style={{ fontSize: 12, color: Colors.textSecondary }}>Manage multiple pricing tiers</div></div>
      </div>
      <div style={{ fontSize: 11, color: Colors.textSecondary, marginBottom: Spacing.md, lineHeight: 1.4 }}>
        Create price lists (Retail, Wholesale, Distributor) and assign prices to items in the item editor.
      </div>
      {showForm && (
        <div style={{ ...s.card, marginBottom: Spacing.md }}>
          <Field label="Price List Name"><input value={name} onChange={e => setName(e.target.value)} style={s.input} placeholder="e.g. Wholesale" /></Field>
          <div style={{ display: 'flex', gap: Spacing.sm }}>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '12px', background: 'none', border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.sm, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSave} style={{ flex: 2, ...s.primaryBtn }}>Save</button>
          </div>
        </div>
      )}
      {lists.map(l => (
        <div key={l.id} style={s.listItem}>
          <div style={s.listStrip(l.isDefault ? Colors.primary : Colors.accent)} />
          <div style={s.listBody}>
            <div style={s.spaceBetween}>
              <span style={{ fontWeight: 600, fontSize: 14, color: Colors.textPrimary }}>{l.name}</span>
              {l.isDefault && <span style={s.badge(Colors.primary)}>Default</span>}
            </div>
          </div>
          {!l.isDefault && <button onClick={() => handleSetDefault(l.id)} style={{ background: 'none', border: 'none', color: Colors.primary, cursor: 'pointer', fontSize: 11, fontWeight: 600, padding: '0 8px' }}>Set Default</button>}
          <button onClick={() => handleDelete(l.id)} style={{ background: 'none', border: 'none', color: Colors.textDisabled, cursor: 'pointer', padding: '0 12px', display: 'flex', alignItems: 'center' }}><Icons.Delete size={16} /></button>
        </div>
      ))}
      <button onClick={() => setShowForm(true)} style={{ position: 'fixed', right: Spacing.lg, bottom: 80, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, color: '#fff', border: 'none', fontSize: 28, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Add size={28} /></button>
    </div>
  )
}
