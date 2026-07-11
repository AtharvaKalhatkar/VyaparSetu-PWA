import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius, Shadows } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, formatDate, generateId, todayISO } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { useToast } from '../utils/smooth'
import type { Subscription } from '../types'

const FREQ = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const

function calcNextDate(start: string, freq: string): string {
  const d = new Date(start + 'T00:00:00')
  if (freq === 'DAILY') d.setDate(d.getDate() + 1)
  else if (freq === 'WEEKLY') d.setDate(d.getDate() + 7)
  else if (freq === 'MONTHLY') d.setMonth(d.getMonth() + 1)
  else if (freq === 'YEARLY') d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().split('T')[0]
}

function advanceDate(date: string, freq: string): string {
  const d = new Date(date + 'T00:00:00')
  if (freq === 'DAILY') d.setDate(d.getDate() + 1)
  else if (freq === 'WEEKLY') d.setDate(d.getDate() + 7)
  else if (freq === 'MONTHLY') d.setMonth(d.getMonth() + 1)
  else if (freq === 'YEARLY') d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().split('T')[0]
}

export function SubscriptionsPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  const { toast } = useToast()
  const [tab, setTab] = useState<'list' | 'add'>('list')
  const [name, setName] = useState('')
  const [partyId, setPartyId] = useState('')
  const [freq, setFreq] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('MONTHLY')
  const [startDate, setStartDate] = useState(todayISO())
  const [lines, setLines] = useState<{ itemId: string; name: string; qty: string; rate: string; unit: string }[]>([])

  const allSubs = DB.subscriptions.list().filter(s => s.isActive)
  const parties = DB.parties.list().filter(p => p.type !== 'SUPPLIER')
  const allItems = DB.items.list().filter(i => i.isActive)

  const addLine = (itemId: string) => {
    const item = allItems.find(i => i.id === itemId)
    if (!item || lines.find(l => l.itemId === itemId)) return
    setLines(prev => [...prev, { itemId: item.id, name: item.name, qty: '1', rate: String(item.sellingPrice), unit: item.unit }])
  }
  const updateLine = (idx: number, field: string, v: string) => setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: v } : l))
  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx))

  const total = lines.reduce((s, l) => s + (parseFloat(l.qty) || 0) * (parseFloat(l.rate) || 0), 0)

  const handleSave = () => {
    if (!name || !partyId || lines.length === 0) return
    const party = parties.find(p => p.id === partyId)
    const items = lines.map(l => ({ itemId: l.itemId, itemName: l.name, quantity: parseFloat(l.qty) || 0, rate: parseFloat(l.rate) || 0, unit: l.unit }))
    const sub: Subscription = {
      id: generateId(), name, partyId, partyName: party?.name || '',
      items, frequency: freq, startDate, nextDate: startDate,
      totalAmount: total, isActive: true,
    }
    DB.subscriptions.save(sub)
    toast('Subscription created!', 'success')
    setTab('list'); setName(''); setPartyId(''); setLines([])
  }

  const generateInvoice = (sub: Subscription) => {
    const invItems = sub.items.map(i => ({
      itemId: i.itemId, itemName: i.itemName, sku: '', quantity: i.quantity, rate: i.rate,
      unit: i.unit, discountPercent: 0, discountAmount: 0, gstRate: 0, amount: i.quantity * i.rate,
    }))
    const subTotal = invItems.reduce((s, i) => s + i.amount, 0)
    const inv = {
      id: generateId(),
      invoiceNo: DB.invoices.list().filter(x => x.docType === 'SALE' || x.docType === 'PURCHASE').length + 1 + '',
      partyId: sub.partyId, partyName: sub.partyName, type: 'SALE' as const, docType: 'SALE' as const,
      items: invItems, subtotal: subTotal, discountAmount: 0, taxAmount: 0, grandTotal: subTotal,
      paymentStatus: 'PENDING' as const, paidAmount: 0, dueAmount: subTotal,
      date: todayISO(), notes: `Auto-generated from subscription: ${sub.name}`,
    }
    DB.invoices.save(inv)
    sub.nextDate = advanceDate(sub.nextDate, sub.frequency)
    DB.subscriptions.save(sub)
    toast(`Invoice #${inv.invoiceNo} generated!`, 'success')
  }

  const dueToday = allSubs.filter(s => s.nextDate <= todayISO())

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ display: 'flex', gap: Spacing.sm, marginBottom: Spacing.lg }}>
        <button onClick={() => setTab('list')} style={s.toggle(tab === 'list', Colors.primary)}>Subscriptions</button>
        <button onClick={() => setTab('add')} style={s.toggle(tab === 'add', Colors.primary)}>New</button>
      </div>

      {tab === 'add' ? (
        <>
          <Field label="Plan Name"><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Monthly Water Supply" style={s.input} /></Field>
          <Field label="Party">
            <select value={partyId} onChange={e => setPartyId(e.target.value)} style={s.select}>
              <option value="">Select party...</option>
              {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: Spacing.sm }}>
            <Field label="Frequency">
              <select value={freq} onChange={e => setFreq(e.target.value as any)} style={s.select}>
                {FREQ.map(f => <option key={f} value={f}>{f.charAt(0) + f.slice(1).toLowerCase()}</option>)}
              </select>
            </Field>
            <Field label="Start Date"><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={s.input} /></Field>
          </div>

          <div style={{ fontSize: 14, fontWeight: 600, color: Colors.textPrimary, marginBottom: Spacing.sm }}>Items</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: Spacing.md }}>
            {allItems.filter(i => !lines.find(l => l.itemId === i.id)).slice(0, 8).map(i => (
              <button key={i.id} onClick={() => addLine(i.id)} style={{ padding: '5px 8px', backgroundColor: Colors.background, border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.sm, fontSize: 11, cursor: 'pointer', color: Colors.textSecondary }}><Icons.Add size={12} /> {i.name}</button>
            ))}
          </div>
          {lines.map((l, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <span style={{ fontSize: 12, width: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</span>
              <input inputMode="decimal" value={l.qty} onChange={e => updateLine(idx, 'qty', e.target.value)} onBlur={e => { const v = parseFloat(e.target.value); if (isNaN(v) || v <= 0) updateLine(idx, 'qty', '1') }} style={{ ...s.input, width: 50, padding: '5px 6px' }} />
              <input inputMode="decimal" value={l.rate} onChange={e => updateLine(idx, 'rate', e.target.value)} style={{ ...s.input, width: 70, padding: '5px 6px' }} />
              <span style={{ fontSize: 12, fontWeight: 600, width: 60, textAlign: 'right' }}>{formatCurrency((parseFloat(l.qty) || 0) * (parseFloat(l.rate) || 0))}</span>
              <button onClick={() => removeLine(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: Colors.textDisabled }}><Icons.Delete size={14} /></button>
            </div>
          ))}
          <div style={{ fontSize: 15, fontWeight: 700, textAlign: 'right', marginTop: Spacing.sm }}>Total: {formatCurrency(total)} / {freq.charAt(0) + freq.slice(1).toLowerCase()}</div>

          <button onClick={handleSave} disabled={!name || !partyId || lines.length === 0} style={{ marginTop: Spacing.md, ...(!name || !partyId || lines.length === 0 ? s.primaryBtnDisabled : s.primaryBtn) }}>
            <Icons.Check size={16} /> Create Subscription
          </button>
        </>
      ) : (
        <>
          {dueToday.length > 0 && (
            <div style={{ backgroundColor: Colors.warningLight, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md, border: `1px solid ${Colors.warning}30` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: Colors.warning, marginBottom: Spacing.sm }}>{dueToday.length} subscription(s) due today!</div>
              {dueToday.map(sub => (
                <div key={sub.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs }}>
                  <span style={{ fontSize: 13 }}>{sub.name} — {sub.partyName}</span>
                  <button onClick={() => generateInvoice(sub)} style={{ padding: '4px 10px', backgroundColor: Colors.primary, color: '#fff', border: 'none', borderRadius: BorderRadius.sm, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Generate Invoice</button>
                </div>
              ))}
            </div>
          )}

          {allSubs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: Spacing.huge, color: Colors.textDisabled }}>
              <Icons.Refresh size={48} style={{ marginBottom: Spacing.md, opacity: 0.4 }} />
              <div>No subscriptions yet</div>
              <button onClick={() => setTab('add')} style={{ marginTop: Spacing.md, ...s.primaryBtn }}>Create First</button>
            </div>
          ) : allSubs.map(sub => {
            const due = sub.nextDate <= todayISO()
            return (
              <div key={sub.id} style={{ ...s.card, marginBottom: Spacing.sm }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: Spacing.xs }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: Colors.textPrimary }}>{sub.name}</span>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span style={s.badge(due ? Colors.error : Colors.success)}>{due ? 'Due' : 'Active'}</span>
                    <span style={{ fontSize: 10, padding: '2px 6px', backgroundColor: Colors.surfaceVariant, borderRadius: 4, color: Colors.textSecondary }}>{sub.frequency}</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.xs }}>{sub.partyName}</div>
                <div style={{ fontSize: 11, color: Colors.textDisabled, marginBottom: Spacing.sm }}>Next: {formatDate(sub.nextDate)} · {sub.items.length} item(s)</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 16, color: Colors.textPrimary }}>{formatCurrency(sub.totalAmount)}</span>
                  <button onClick={() => generateInvoice(sub)} disabled={!due} style={{ padding: '6px 14px', backgroundColor: due ? Colors.primary : Colors.textDisabled, color: '#fff', border: 'none', borderRadius: BorderRadius.sm, fontSize: 12, fontWeight: 600, cursor: due ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icons.Billing size={14} /> Generate
                  </button>
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
