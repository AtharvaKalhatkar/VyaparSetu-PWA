import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, generateId, todayISO } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { createLedgerEntry } from '../utils/invoiceOps'

const MODES = ['CASH', 'UPI', 'BANK', 'CHEQUE', 'CARD']

export function AddPaymentOut({ onBack, onNavigate, invoiceId: propInvId }: { onBack: () => void; onNavigate?: (p: string) => void; invoiceId?: string }) {
  const [invId, setInvId] = useState(propInvId || '')
  const [amountStr, setAmountStr] = useState('')
  const [mode, setMode] = useState('CASH')
  const [saved, setSaved] = useState(false)

  const invoices = DB.invoices.list().filter(i => (i.docType === 'PURCHASE' || i.type === 'PURCHASE') && i.dueAmount > 0)
  const inv = invoices.find(i => i.id === invId)

  const handleSave = () => {
    const amt = Math.min(parseFloat(amountStr) || 0, inv?.dueAmount || 0)
    if (!inv || !amt) return
    const newPaid = inv.paidAmount + amt
    const newDue = Math.max(0, inv.grandTotal - newPaid)
    const isOverdue = inv.dueDate ? inv.dueDate < todayISO() : false
    const status = newDue <= 0 ? 'PAID' : isOverdue ? 'OVERDUE' : 'PARTIAL'
    DB.invoices.save({ ...inv, paidAmount: newPaid, dueAmount: newDue, paymentStatus: status })
    createLedgerEntry(inv.partyId, inv.partyName, 'PAYMENT', amt, mode, inv.invoiceNo, `Payment made for ${inv.invoiceNo}`, todayISO())
    const accts = DB.bankAccounts.list()
    const target = accts.find(a => a.type === (mode === 'CASH' ? 'CASH' : 'BANK') && a.name !== 'Demo')
    if (target) DB.bankAccounts.save({ ...target, balance: target.balance - amt })
    setSaved(true)
    setTimeout(onBack, 1500)
  }

  if (saved) return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><Icons.Check size={48} color={Colors.success} /><div style={{ fontSize: 20, fontWeight: 700, color: Colors.success, marginTop: Spacing.md }}>Payment Recorded!</div></div>

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: Colors.textPrimary, marginBottom: Spacing.lg }}>Make Payment</h2>
      <Field label="Select Purchase Invoice">
        <select value={invId} onChange={e => { setInvId(e.target.value); setAmountStr('') }} style={s.select}>
          <option value="">Choose invoice...</option>
          {invoices.map(i => <option key={i.id} value={i.id}>{i.invoiceNo} — {i.partyName} (Due: {formatCurrency(i.dueAmount)})</option>)}
        </select>
      </Field>
      {inv && (
        <div style={{ ...s.card, marginBottom: Spacing.md, backgroundColor: Colors.primaryLight }}>
          <div style={s.spaceBetween}><span style={{ fontSize: 13, color: Colors.textSecondary }}>Invoice No</span><span style={{ fontWeight: 600 }}>{inv.invoiceNo}</span></div>
          <div style={s.spaceBetween}><span style={{ fontSize: 13, color: Colors.textSecondary }}>Supplier</span><span style={{ fontWeight: 600 }}>{inv.partyName}</span></div>
          <div style={s.spaceBetween}><span style={{ fontSize: 13, color: Colors.textSecondary }}>Total</span><span style={{ fontWeight: 600 }}>{formatCurrency(inv.grandTotal)}</span></div>
          <div style={s.spaceBetween}><span style={{ fontSize: 13, color: Colors.textSecondary }}>Already Paid</span><span style={{ fontWeight: 600, color: Colors.success }}>{formatCurrency(inv.paidAmount)}</span></div>
          <div style={{ ...s.spaceBetween, borderTop: `1px solid ${Colors.border}`, paddingTop: 6 }}><span style={{ fontWeight: 700 }}>Due Amount</span><span style={{ fontWeight: 700, color: Colors.error, fontSize: 16 }}>{formatCurrency(inv.dueAmount)}</span></div>
        </div>
      )}
      <Field label="Payment Amount">
        <input inputMode="decimal" value={amountStr} onChange={e => setAmountStr(e.target.value)} placeholder="0.00" style={s.input} />
        {inv && amountStr && (
          <div style={{ marginTop: 4, fontSize: 12, color: parseFloat(amountStr) > inv.dueAmount ? Colors.error : Colors.textSecondary }}>
            {parseFloat(amountStr) > inv.dueAmount ? `Excess: ${formatCurrency(parseFloat(amountStr) - inv.dueAmount)}` : `Balance after: ${formatCurrency(inv.dueAmount - parseFloat(amountStr))}`}
          </div>
        )}
      </Field>
      <Field label="Payment Mode">
        <div style={{ display: 'flex', gap: Spacing.xs, flexWrap: 'wrap' }}>
          {MODES.map(m => (
            <button key={m} onClick={() => setMode(m)} style={s.chip(mode === m)}>{m}</button>
          ))}
        </div>
      </Field>
      <button onClick={handleSave} disabled={!invId || !amountStr || parseFloat(amountStr) <= 0} style={invId && amountStr && parseFloat(amountStr) > 0 ? s.primaryBtn : s.primaryBtnDisabled}>
        <Icons.Check size={16} /> Confirm Payment
      </button>
    </div>
  )
}
