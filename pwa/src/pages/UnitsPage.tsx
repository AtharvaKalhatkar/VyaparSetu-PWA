import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { generateId } from '../utils/formatting'
import type { Unit } from '../types'
import { Icons } from '../utils/Icons'

export function UnitsPage() {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [shortName, setShortName] = useState('')

  const units = DB.units.list()

  const openEdit = (id: string) => {
    const u = DB.units.byId(id)
    if (!u) return
    setEditId(id); setName(u.name); setShortName(u.shortName); setShowForm(true)
  }

  const handleSave = () => {
    if (!name.trim() || !shortName.trim()) return
    DB.units.save({ id: editId || generateId(), name: name.trim(), shortName: shortName.trim(), isActive: true })
    setShowForm(false); setEditId(null); setName(''); setShortName('')
  }

  const handleDelete = (id: string) => {
    if (confirm('Delete this unit?')) DB.units.delete(id)
  }

  if (showForm) {
    return (
      <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
        <Field label="Unit Name"><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Kilogram" style={s.input} /></Field>
        <Field label="Short Name"><input value={shortName} onChange={e => setShortName(e.target.value)} placeholder="e.g. Kg" style={s.input} /></Field>
        <div style={{ display: 'flex', gap: Spacing.sm }}>
          {editId && <button onClick={() => { handleDelete(editId); setShowForm(false) }} style={{ flex: 1, padding: '14px', backgroundColor: Colors.errorLight, color: Colors.error, border: 'none', borderRadius: BorderRadius.sm, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Delete</button>}
          <button onClick={handleSave} style={{ flex: 2, ...s.primaryBtn }}>{editId ? 'Update' : 'Add'} Unit</button>
        </div>
        <button onClick={() => setShowForm(false)} style={{ marginTop: Spacing.sm, width: '100%', padding: '10px', background: 'none', border: 'none', color: Colors.textSecondary, cursor: 'pointer' }}>Cancel</button>
      </div>
    )
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={s.spaceBetween}>
        <div style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: Spacing.md }}>{units.length} units</div>
      </div>
      {units.length === 0 ? (
        <div style={{ textAlign: 'center', padding: Spacing.huge, color: Colors.textDisabled }}>
          <div style={{ marginBottom: Spacing.md }}><Icons.Unit size={48} /></div>
          <div>No units defined</div>
        </div>
      ) : (
        units.map(u => (
          <div key={u.id} style={{ ...s.card, ...s.spaceBetween, marginBottom: Spacing.sm }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: Colors.textPrimary }}>{u.name}</div>
              <div style={{ fontSize: 12, color: Colors.textSecondary }}>{u.shortName}</div>
            </div>
            <div style={s.row}>
              <button onClick={() => openEdit(u.id)} style={{ background: 'none', border: 'none', color: Colors.primary, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Edit</button>
              <button onClick={() => handleDelete(u.id)} style={{ background: 'none', border: 'none', color: Colors.error, cursor: 'pointer', fontSize: 14, fontWeight: 600, marginLeft: Spacing.sm, display: 'flex', alignItems: 'center' }}><Icons.Delete size={16} /></button>
            </div>
          </div>
        ))
      )}
      <button onClick={() => { setShowForm(true); setEditId(null); setName(''); setShortName('') }} style={{
        position: 'fixed', right: Spacing.lg, bottom: 80, width: 56, height: 56, borderRadius: 28,
        backgroundColor: Colors.primary, color: Colors.textLight, border: 'none', fontSize: 28,
        cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Icons.Add size={28} /></button>
    </div>
  )
}
