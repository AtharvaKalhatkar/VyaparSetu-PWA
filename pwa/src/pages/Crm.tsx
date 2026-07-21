import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, statusColor, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, formatDate, generateId } from '../utils/formatting'
import { Icons } from '../utils/Icons'

const STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATION', 'WON', 'LOST'] as const

export function Crm() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [estValue, setEstValue] = useState('')
  const [status, setStatus] = useState<string>('NEW')

  const leads = [...DB.crm.list()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const filtered = leads.filter(l => l.name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search))

  const openEdit = (id: string) => {
    const l = DB.crm.byId(id)
    if (!l) return
    setEditId(id); setName(l.name); setPhone(l.phone); setEstValue(String(l.estimatedValue)); setStatus(l.status); setShowForm(true)
  }

  const handleSave = () => {
    if (!name.trim()) return
    const existing = editId ? DB.crm.byId(editId) : null
    DB.crm.save({
      id: editId || generateId(), name: name.trim(), phone: phone.trim(),
      source: existing?.source || 'OTHER', status: status as typeof STATUSES[number],
      estimatedValue: parseFloat(estValue) || 0,
      createdAt: existing?.createdAt || new Date().toISOString().split('T')[0],
    })
    setShowForm(false); setEditId(null); setName(''); setPhone(''); setEstValue(''); setStatus('NEW')
  }

  if (showForm) {
    return (
      <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
        <Field label="Name"><input value={name} onChange={e => setName(e.target.value)} style={s.input} /></Field>
        <Field label="Phone"><input value={phone} onChange={e => setPhone(e.target.value)} style={s.input} /></Field>
        <Field label="Status">
          <select value={status} onChange={e => setStatus(e.target.value)} style={s.select}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Estimated Value (₹)"><input type="number" value={estValue} onChange={e => setEstValue(e.target.value)} style={s.input} /></Field>
        <div style={{ display: 'flex', gap: Spacing.sm }}>
          {editId && <button onClick={() => { DB.crm.delete(editId); setShowForm(false) }} style={{ flex: 1, padding: '14px', backgroundColor: Colors.errorLight, color: Colors.error, border: 'none', borderRadius: BorderRadius.sm, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Delete</button>}
          <button onClick={handleSave} style={{ flex: 2, ...s.primaryBtn }}>{editId ? 'Update' : 'Add'} Lead</button>
        </div>
        <button onClick={() => setShowForm(false)} style={{ marginTop: Spacing.sm, width: '100%', padding: '10px', background: 'none', border: 'none', color: Colors.textSecondary, cursor: 'pointer' }}>Cancel</button>
      </div>
    )
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ position: 'relative', marginBottom: Spacing.md }}>
        <span style={{ position: 'absolute', left: 12, top: 10, display: 'flex', alignItems: 'center', color: Colors.textDisabled }}><Icons.Search size={16} /></span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..." style={{ ...s.searchBox, paddingLeft: 36 }} />
      </div>
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: Spacing.huge, color: Colors.textDisabled }}><Icons.Star size={24} /><br />No leads</div>
      ) : (
        filtered.map(l => (
          <div key={l.id} onClick={() => openEdit(l.id)} style={{ ...s.card, marginBottom: Spacing.sm, cursor: 'pointer' }}>
            <div style={{ ...s.spaceBetween, marginBottom: Spacing.xs }}>
              <span style={{ fontWeight: 600, fontSize: 15, color: Colors.textPrimary }}>{l.name}</span>
              <span style={s.badge(statusColor(l.status))}>{l.status}</span>
            </div>
            <div style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.xs }}>{l.phone} · {formatDate(l.createdAt)}</div>
            {l.estimatedValue > 0 && <div style={{ fontSize: 13, fontWeight: 600, color: Colors.primary }}>{formatCurrency(l.estimatedValue)}</div>}
          </div>
        ))
      )}
      <button onClick={() => { setShowForm(true); setEditId(null); setName(''); setPhone(''); setEstValue('') }} style={{
        position: 'fixed', right: Spacing.lg, bottom: 80, width: 56, height: 56, borderRadius: 28,
        backgroundColor: Colors.primary, color: Colors.textLight, border: 'none', fontSize: 28,
        cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Icons.Add size={28} /></button>
    </div>
  )
}
