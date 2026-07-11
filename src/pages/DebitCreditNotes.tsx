import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { Icons } from '../utils/Icons'
import { formatCurrency, formatDate, generateId, todayISO } from '../utils/formatting'

interface Note {
  id: string; type: 'DEBIT' | 'CREDIT'
  partyId: string; invoiceNo: string
  amount: number; reason: string; date: string
  status: 'APPLIED' | 'UNAPPLIED'
}

export function DebitCreditNotes() {
  const [notes, setNotes] = useState<Note[]>(() => {
    try { return JSON.parse(localStorage.getItem('vs_debitCreditNotes') || '[]') } catch { return [] }
  })
  const [type, setType] = useState<'DEBIT' | 'CREDIT'>('DEBIT')
  const [showForm, setShowForm] = useState(false)
  const [partyId, setPartyId] = useState('')
  const [invoiceNo, setInvoiceNo] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [date, setDate] = useState(todayISO)

  const parties = DB.parties.list()
  const invoices = DB.invoices.list().filter(i => i.type === 'PURCHASE')

  const addNote = () => {
    const note: Note = {
      id: generateId(), type, partyId, invoiceNo,
      amount: parseFloat(amount) || 0, reason, date, status: 'UNAPPLIED',
    }
    const updated = [...notes, note]
    setNotes(updated)
    localStorage.setItem('vs_debitCreditNotes', JSON.stringify(updated))
    DB.auditLogs.save({ id: generateId(), entity: 'NOTE', entityId: note.id, action: 'CREATE', user: 'Admin', timestamp: new Date().toISOString(), description: `${type} note ${invoiceNo} — ${formatCurrency(note.amount)}` })
    setShowForm(false)
    setInvoiceNo(''); setAmount(''); setReason('')
  }

  const deleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id)
    setNotes(updated)
    localStorage.setItem('vs_debitCreditNotes', JSON.stringify(updated))
  }

  const toggleApplied = (id: string) => {
    const updated = notes.map(n => n.id === id ? { ...n, status: (n.status === 'APPLIED' ? 'UNAPPLIED' : 'APPLIED') as 'APPLIED' | 'UNAPPLIED' } : n)
    setNotes(updated)
    localStorage.setItem('vs_debitCreditNotes', JSON.stringify(updated))
  }

  const filtered = notes.filter(n => n.type === type)
  const totalAmt = filtered.reduce((s, n) => s + n.amount, 0)

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ display: 'flex', gap: Spacing.sm, marginBottom: Spacing.xl }}>
        {(['DEBIT', 'CREDIT'] as const).map(t => (
          <button key={t} onClick={() => setType(t)} style={{
            flex: 1, padding: '12px', border: 'none', borderRadius: BorderRadius.sm, fontWeight: 600, fontSize: 14, cursor: 'pointer',
            backgroundColor: type === t ? Colors.primary : Colors.surfaceVariant, color: type === t ? '#fff' : Colors.textPrimary,
          }}>{t === 'DEBIT' ? 'Debit Notes' : 'Credit Notes'}</button>
        ))}
      </div>

      <div style={{ background: Colors.surfaceVariant, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.lg, textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: Colors.textSecondary }}>Total {type === 'DEBIT' ? 'Debit' : 'Credit'} Notes</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: type === 'DEBIT' ? Colors.error : Colors.success }}>{formatCurrency(totalAmt)}</div>
        <div style={{ fontSize: 12, color: Colors.textSecondary }}>{filtered.length} notes</div>
      </div>

      <button onClick={() => setShowForm(!showForm)} style={{ ...s.primaryBtn, marginBottom: Spacing.lg }}>
        <Icons.Add size={16} /> New {type === 'DEBIT' ? 'Debit' : 'Credit'} Note
      </button>

      {showForm && (
        <div style={{ background: Colors.surfaceVariant, padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.lg }}>
          <Field label="Party">
            <select value={partyId} onChange={e => setPartyId(e.target.value)} style={s.select}>
              <option value="">Select party...</option>
              {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Reference Invoice"><input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} style={s.input} placeholder="INV-001" list="invList" /></Field>
          <datalist id="invList">{invoices.map(i => <option key={i.id} value={i.invoiceNo} />)}</datalist>
          <Field label="Amount (₹)"><input type="number" value={amount} onChange={e => setAmount(e.target.value)} style={s.input} /></Field>
          <Field label="Reason"><textarea value={reason} onChange={e => setReason(e.target.value)} style={s.textarea} placeholder="Reason for adjustment..." rows={2} /></Field>
          <Field label="Date"><input type="date" value={date} onChange={e => setDate(e.target.value)} style={s.input} /></Field>
          <button onClick={addNote} style={s.primaryBtn}>Save Note</button>
        </div>
      )}

      {filtered.length === 0 && <div style={{ textAlign: 'center', padding: Spacing.xxl, color: Colors.textSecondary, fontSize: 14 }}>No {type.toLowerCase()} notes yet</div>}

      {filtered.map(n => {
        const party = parties.find(p => p.id === n.partyId)
        return (
          <div key={n.id} style={{ background: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, border: `1px solid ${Colors.divider}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: Colors.textPrimary }}>{n.invoiceNo}</div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: BorderRadius.round, backgroundColor: n.status === 'APPLIED' ? '#E8F5E9' : '#FFF3E0', color: n.status === 'APPLIED' ? '#2E7D32' : '#E65100' }}>{n.status}</span>
            </div>
            <div style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.xs }}>{party?.name || 'Unknown'} · {formatDate(n.date)}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: n.type === 'DEBIT' ? Colors.error : Colors.success }}>{formatCurrency(n.amount)}</div>
            {n.reason && <div style={{ fontSize: 12, color: Colors.textSecondary, marginTop: Spacing.xs }}>{n.reason}</div>}
            <div style={{ display: 'flex', gap: Spacing.xs, marginTop: Spacing.sm }}>
              <button onClick={() => toggleApplied(n.id)} style={{ padding: '6px 12px', backgroundColor: n.status === 'APPLIED' ? '#FFF3E0' : '#E8F5E9', border: 'none', borderRadius: BorderRadius.sm, color: n.status === 'APPLIED' ? '#E65100' : '#2E7D32', fontSize: 11, cursor: 'pointer' }}>
                {n.status === 'APPLIED' ? 'Mark Unapplied' : 'Mark Applied'}
              </button>
              <button onClick={() => deleteNote(n.id)} style={{ padding: '6px 12px', backgroundColor: '#FFEBEE', border: 'none', borderRadius: BorderRadius.sm, color: Colors.error, fontSize: 11, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
