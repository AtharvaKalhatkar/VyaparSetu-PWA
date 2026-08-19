import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, generateId, todayISO } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { createLedgerEntry } from '../utils/invoiceOps'

const MODES = ['CASH', 'UPI', 'BANK', 'CHEQUE', 'CARD']

import { SuccessCard } from '../utils/smooth'

export function AddPaymentOut({ onBack, onNavigate, invoiceId: propInvId }: { onBack: () => void; onNavigate?: (p: string) => void; invoiceId?: string }) {
  const [invId, setInvId] = useState(propInvId || '')
  const [amountStr, setAmountStr] = useState('')
  const [mode, setMode] = useState('CASH')
  const [saved, setSaved] = useState(false)

  const invoices = DB.invoices.list().filter(i => (i.docType === 'PURCHASE' || i.type === 'PURCHASE'))
  const inv = invId ? (DB.invoices.byId(invId) || invoices.find(i => i.id === invId)) : undefined
  const dueAmt = inv ? (inv.dueAmount != null ? inv.dueAmount : Math.max(0, inv.grandTotal - (inv.paidAmount || 0))) : 0

  const handleSave = () => {
    const inputAmt = parseFloat(amountStr) || 0
    const amt = inputAmt > 0 ? Math.min(inputAmt, dueAmt || inputAmt) : dueAmt
    if (!inv || amt <= 0) return
    const currentPaid = inv.paidAmount || 0
    const newPaid = currentPaid + amt
    const newDue = Math.max(0, inv.grandTotal - newPaid)
    const isOverdue = inv.dueDate ? inv.dueDate < todayISO() : false
    const status = newDue <= 0 ? 'PAID' : isOverdue ? 'OVERDUE' : 'PARTIAL'
    DB.invoices.save({ ...inv, paidAmount: newPaid, dueAmount: newDue, paymentStatus: status })
    createLedgerEntry(inv.partyId, inv.partyName, 'PAYMENT', amt, mode, inv.invoiceNo, `Payment made for Purchase Bill #${inv.invoiceNo}`, todayISO())
    const accts = DB.bankAccounts.list()
    const target = accts.find(a => a.type === (mode === 'CASH' ? 'CASH' : 'BANK') && a.name !== 'Demo') || accts[0]
    if (target) DB.bankAccounts.save({ ...target, balance: target.balance - amt })
    setSaved(true)
  }

  if (saved) {
    return (
      <SuccessCard
        title="Payment Made to Supplier!"
        subtitle={`Paid ₹${amountStr || dueAmt} to ${inv?.partyName || 'Supplier'} for Bill #${inv?.invoiceNo}.`}
        details={[
          { label: 'Purchase Bill', value: inv?.invoiceNo || 'N/A' },
          { label: 'Supplier', value: inv?.partyName || 'N/A' },
          { label: 'Payment Mode', value: mode },
          { label: 'Amount Paid', value: `₹${amountStr || dueAmt}` },
        ]}
        primaryAction={{
          label: 'View Purchases',
          onClick: () => onNavigate ? onNavigate('invoices') : onBack(),
          icon: <Icons.Truck size={16} color="#fff" />,
        }}
        secondaryAction={{
          label: 'Done',
          onClick: onBack,
        }}
      />
    )
  }

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
        {inv && (
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setAmountStr(String(inv.dueAmount))} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${Colors.primary}`, backgroundColor: Colors.primaryLight, color: Colors.primary, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              Full Due: {formatCurrency(inv.dueAmount)}
            </button>
            {inv.dueAmount > 500 && (
              <button type="button" onClick={() => setAmountStr(String(Math.round(inv.dueAmount / 2)))} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${Colors.border}`, backgroundColor: Colors.surface, color: Colors.textSecondary, fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>
                50% ({formatCurrency(Math.round(inv.dueAmount / 2))})
              </button>
            )}
          </div>
        )}
        {inv && amountStr && (
          <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: parseFloat(amountStr) > inv.dueAmount ? Colors.error : Colors.success }}>
            {parseFloat(amountStr) > inv.dueAmount ? `Excess Payment: ${formatCurrency(parseFloat(amountStr) - inv.dueAmount)}` : `Remaining Due After Payment: ${formatCurrency(inv.dueAmount - parseFloat(amountStr))}`}
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
