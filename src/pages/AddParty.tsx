import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { generateId } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { useVertical, t } from '../context/VerticalContext'

export function AddParty({ editId, onBack, onNavigate }: { editId?: string; onBack: () => void; onNavigate?: (p: string) => void }) {
  const config = useVertical()
  const existing = editId ? DB.parties.byId(editId) : null
  const [name, setName] = useState(existing?.name || '')
  const [phone, setPhone] = useState(existing?.phone || '')
  const [email, setEmail] = useState(existing?.email || '')
  const [gstin, setGstin] = useState(existing?.gstin || '')
  const [type, setType] = useState<'CUSTOMER' | 'SUPPLIER' | 'BOTH'>(existing?.type || 'CUSTOMER')
  const [balance, setBalance] = useState(String(existing?.openingBalance || '0'))
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    if (!name.trim()) return
    DB.parties.save({
      id: existing?.id || generateId(), name: name.trim(), phone: phone.trim(), email: email.trim() || undefined,
      gstin: gstin.trim() || undefined, type, openingBalance: parseFloat(balance) || 0,
      balanceType: existing?.balanceType || 'DEBIT', creditLimit: existing?.creditLimit || 0,
      creditDays: existing?.creditDays != null ? existing.creditDays : 30, isActive: true,
      createdAt: existing?.createdAt || new Date().toISOString().split('T')[0],
    })
    setSaved(true)
    setTimeout(onBack, 800)
  }

  const handleDelete = () => {
    if (editId && confirm('Delete this party?')) { DB.parties.delete(editId); onBack() }
  }

  if (saved) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontSize: 20, fontWeight: 700, color: Colors.success }}>✅ {editId ? 'Updated!' : 'Added!'}</div>

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={s.toggleGroup}>
        {(['CUSTOMER', 'SUPPLIER', 'BOTH'] as const).map(t => (
          <button key={t} onClick={() => setType(t)} style={s.toggle(type === t)}>{t === 'BOTH' ? 'Both' : t.charAt(0) + t.slice(1).toLowerCase() + 's'}</button>
        ))}
      </div>
      <Field label="Name"><input value={name} onChange={e => setName(e.target.value)} placeholder="Party name" style={s.input} /></Field>
      <Field label="Phone"><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" style={s.input} /></Field>
      <Field label="Email"><input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (optional)" style={s.input} /></Field>
      {config.partyFields.gstin !== 'hidden' && <Field label="GSTIN"><input value={gstin} onChange={e => setGstin(e.target.value)} placeholder={`GSTIN (${config.partyFields.gstin === 'required' ? 'required' : 'optional'})`} style={s.input} /></Field>}
      <Field label="Opening Balance (₹)"><input type="number" value={balance} onChange={e => setBalance(e.target.value)} style={s.input} /></Field>
      <div style={{ display: 'flex', gap: Spacing.sm, marginTop: Spacing.lg }}>
        {editId && <button onClick={handleDelete} style={{ flex: 1, padding: '14px', backgroundColor: Colors.errorLight, color: Colors.error, border: 'none', borderRadius: BorderRadius.sm, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Delete</button>}
        <button onClick={handleSave} disabled={!name.trim()} style={{ flex: 2, ...(name.trim() ? s.primaryBtn : s.primaryBtnDisabled) }}>
          {editId ? 'Update ' + t(config, 'party', 'Party') : 'Save ' + t(config, 'party', 'Party')}
        </button>
      </div>
    </div>
  )
}
