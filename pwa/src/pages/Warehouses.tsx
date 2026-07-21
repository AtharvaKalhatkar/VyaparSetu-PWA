import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { generateId } from '../utils/formatting'
import { Icons } from '../utils/Icons'

export function Warehouses({ onBack }: { onBack?: () => void }) {
  const [list, setList] = useState(() => DB.warehouses.list())
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const refresh = () => setList([...DB.warehouses.list()])

  const handleSave = () => {
    if (!name.trim()) return
    DB.warehouses.save({ id: generateId(), name: name.trim(), address: address.trim() || undefined, isActive: true })
    refresh(); setShowForm(false); setName(''); setAddress('')
  }

  const handleDelete = (id: string) => {
    if (!confirm('Delete this warehouse?')) return
    DB.warehouses.delete(id); refresh()
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg }}>
        {onBack && <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: Colors.textSecondary, padding: 0, display: 'flex' }}><Icons.Back size={22} /></button>}
        <div><div style={{ fontSize: 18, fontWeight: 700, color: Colors.textPrimary }}>Warehouses</div><div style={{ fontSize: 12, color: Colors.textSecondary }}>{list.length} locations</div></div>
      </div>
      {showForm && (
        <div style={{ ...s.card, marginBottom: Spacing.md }}>
          <Field label="Warehouse Name"><input value={name} onChange={e => setName(e.target.value)} style={s.input} placeholder="e.g. Main Godown" /></Field>
          <Field label="Address"><textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} style={s.textarea} /></Field>
          <div style={{ display: 'flex', gap: Spacing.sm }}>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '12px', background: 'none', border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.sm, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSave} style={{ flex: 2, ...s.primaryBtn }}>Save</button>
          </div>
        </div>
      )}
      {list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: Spacing.huge, color: Colors.textDisabled }}><Icons.Building size={48} /><div style={{ marginTop: Spacing.md }}>No warehouses yet</div></div>
      ) : list.map(w => (
        <div key={w.id} style={s.listItem}>
          <div style={s.listStrip(Colors.primary)} />
          <div style={s.listBody}>
            <div style={s.spaceBetween}>
              <span style={{ fontWeight: 600, fontSize: 14, color: Colors.textPrimary }}>{w.name}</span>
              <span style={s.badge(Colors.success)}>Active</span>
            </div>
            {w.address && <div style={{ fontSize: 12, color: Colors.textSecondary }}>{w.address}</div>}
          </div>
          <button onClick={() => handleDelete(w.id)} style={{ background: 'none', border: 'none', color: Colors.textDisabled, cursor: 'pointer', padding: '0 12px' }}><Icons.Delete size={16} /></button>
        </div>
      ))}
      <button onClick={() => setShowForm(true)} style={{ position: 'fixed', right: Spacing.lg, bottom: 80, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, color: '#fff', border: 'none', fontSize: 28, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Add size={28} /></button>
    </div>
  )
}
