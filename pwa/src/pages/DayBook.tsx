import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, formatDate, todayISO } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { ExportBar } from '../utils/ExportBar'

export function DayBook({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [date, setDate] = useState(todayISO())

  const invoices = DB.invoices.list()
  const expenses = DB.expenses.list()
  const txns = DB.bankTransactions.list()

  const dayInvs = invoices.filter(i => i.date === date)
  const dayExps = expenses.filter(e => e.date === date)
  const dayTxns = txns.filter(t => t.date === date)

  const sales = dayInvs.filter(i => i.type === 'SALE')
  const purchases = dayInvs.filter(i => i.type === 'PURCHASE')
  const paymentsIn = dayTxns.filter(t => t.type === 'DEPOSIT')
  const paymentsOut = dayTxns.filter(t => t.type === 'WITHDRAWAL')

  const totalIncome = sales.reduce((s, i) => s + i.grandTotal, 0) + paymentsIn.reduce((s, t) => s + t.amount, 0)
  const totalExpense = purchases.reduce((s, i) => s + i.grandTotal, 0) + dayExps.reduce((s, e) => s + e.amount, 0) + paymentsOut.reduce((s, t) => s + t.amount, 0)
  const netBalance = totalIncome - totalExpense

  const TxnRow = ({ label, type, amount, even }: { label: string; type: string; amount: number; even: boolean }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 100px', gap: Spacing.sm, padding: '10px 14px', backgroundColor: even ? Colors.surfaceVariant : Colors.surface, alignItems: 'center', fontSize: 13, borderBottom: `1px solid ${Colors.divider}` }}>
      <div style={{ color: Colors.textPrimary, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{ color: Colors.textSecondary, fontSize: 11 }}>{type}</div>
      <div style={{ textAlign: 'right', fontWeight: 600, color: amount >= 0 ? Colors.success : Colors.error }}>{formatCurrency(Math.abs(amount))}</div>
    </div>
  )

  const Section = ({ title, color, children }: { title: string; color: string; children: React.ReactNode }) => (
    <div style={{ ...s.card, padding: 0, overflow: 'hidden', marginBottom: Spacing.md }}>
      <div style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14, color, borderBottom: `1px solid ${Colors.divider}`, backgroundColor: Colors.surfaceVariant }}>{title}</div>
      {children}
    </div>
  )

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ ...s.spaceBetween, marginBottom: Spacing.lg }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: Colors.textPrimary }}>Day Book</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm }}>
          <ExportBar title="daybook"
            xlsData={{ name: 'Day Book', headers: ['Type', 'Description', 'Amount'], rows: [...sales.map(i => ['Sale', `${i.partyName} - ${i.invoiceNo}`, String(i.grandTotal)]), ...purchases.map(i => ['Purchase', `${i.partyName} - ${i.invoiceNo}`, String(i.grandTotal)]), ...dayExps.map(e => ['Expense', `${e.category}: ${e.description}`, String(-e.amount)])] }}
          />
          <button onClick={() => { const lines: string[][] = [['Type', 'Description', 'Amount']]; sales.forEach(i => lines.push(['Sale', `${i.partyName} - ${i.invoiceNo}`, String(i.grandTotal)])); purchases.forEach(i => lines.push(['Purchase', `${i.partyName} - ${i.invoiceNo}`, String(i.grandTotal)])); dayExps.forEach(e => lines.push(['Expense', `${e.category}: ${e.description}`, String(-e.amount)])); const csv = lines.map(r => r.map(c => `"${c}"`).join(',')).join('\n'); const b = new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `daybook_${date}.csv`; a.click() }} style={{ padding: '10px 16px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: `1.5px solid ${Colors.primary}`, borderRadius: BorderRadius.sm, color: Colors.primary, fontWeight: 600, cursor: 'pointer' }}>
            <Icons.Download size={14} /> CSV
          </button>
        </div>
      </div>

      <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...s.input, marginBottom: Spacing.md }} />

      <div style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: Spacing.md }}>Transactions for {formatDate(date)}</div>

      {sales.length > 0 && (
        <Section title={`Sales (${sales.length})`} color={Colors.success}>
          {sales.map((inv, i) => (
            <TxnRow key={inv.id} label={`${inv.invoiceNo} · ${inv.partyName}`} type={inv.paymentStatus} amount={inv.grandTotal} even={i % 2 === 0} />
          ))}
        </Section>
      )}

      {purchases.length > 0 && (
        <Section title={`Purchases (${purchases.length})`} color={Colors.primary}>
          {purchases.map((inv, i) => (
            <TxnRow key={inv.id} label={`${inv.invoiceNo} · ${inv.partyName}`} type={inv.paymentStatus} amount={-inv.grandTotal} even={i % 2 === 0} />
          ))}
        </Section>
      )}

      {dayExps.length > 0 && (
        <Section title={`Expenses (${dayExps.length})`} color={Colors.error}>
          {dayExps.map((e, i) => (
            <TxnRow key={e.id} label={e.description} type={e.category} amount={-e.amount} even={i % 2 === 0} />
          ))}
        </Section>
      )}

      {(paymentsIn.length > 0 || paymentsOut.length > 0) && (
        <Section title={`Payments (${paymentsIn.length + paymentsOut.length})`} color={Colors.accent}>
          {paymentsIn.map((t, i) => (
            <TxnRow key={t.id} label={`Payment Received - ${t.description}`} type="RECEIVED" amount={t.amount} even={i % 2 === 0} />
          ))}
          {paymentsOut.map((t, i) => (
            <TxnRow key={t.id} label={`Payment Made - ${t.description}`} type="PAID" amount={-t.amount} even={(paymentsIn.length + i) % 2 === 0} />
          ))}
        </Section>
      )}

      {dayInvs.length === 0 && dayExps.length === 0 && dayTxns.length === 0 && (
        <div style={{ textAlign: 'center', padding: Spacing.huge, color: Colors.textDisabled, fontSize: 14 }}>
          <Icons.Reports size={32} /><br />No transactions for this date
        </div>
      )}

      <div style={{ ...s.card, marginTop: Spacing.md }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: Colors.textPrimary, marginBottom: Spacing.sm }}>Summary</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
          <span style={{ color: Colors.textSecondary }}>Total Income</span>
          <span style={{ fontWeight: 600, color: Colors.success }}>{formatCurrency(totalIncome)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
          <span style={{ color: Colors.textSecondary }}>Total Expenses</span>
          <span style={{ fontWeight: 600, color: Colors.error }}>{formatCurrency(totalExpense)}</span>
        </div>
        <div style={{ borderTop: `1px solid ${Colors.border}`, margin: '8px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 16 }}>
          <span style={{ fontWeight: 700, color: Colors.textPrimary }}>Net Balance</span>
          <span style={{ fontWeight: 700, color: netBalance >= 0 ? Colors.success : Colors.error }}>{formatCurrency(netBalance)}</span>
        </div>
      </div>
    </div>
  )
}
