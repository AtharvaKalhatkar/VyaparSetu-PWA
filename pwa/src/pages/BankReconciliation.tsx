import React, { useState, useRef } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, formatDate, generateId, todayISO } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { createLedgerEntry } from '../utils/invoiceOps'

interface StatementRow {
  id: string
  date: string
  description: string
  amount: number
  type: 'CREDIT' | 'DEBIT'
  matchedInvoiceId?: string
  matchedPartyName?: string
  status: 'MATCHED' | 'UNMATCHED' | 'RECONCILED'
}

export function BankReconciliation({ onBack }: { onBack?: () => void }) {
  const [rows, setRows] = useState<StatementRow[]>([])
  const [accountId, setAccountId] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const accounts = DB.bankAccounts.list()
  const invoices = DB.invoices.list().filter(i => i.dueAmount > 0)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
      const parsed: StatementRow[] = []

      // Skip header line
      const dataLines = lines.length > 1 && (lines[0].toLowerCase().includes('date') || lines[0].toLowerCase().includes('amount')) ? lines.slice(1) : lines

      dataLines.forEach((line, idx) => {
        const cols = line.split(/[,;\t]/).map(c => c.replace(/["']/g, '').trim())
        if (cols.length < 2) return

        const dateStr = cols[0] || todayISO()
        const desc = cols[1] || 'Bank Transaction'
        const amtVal = parseFloat(cols[2] || cols[3] || '0')
        if (isNaN(amtVal) || amtVal === 0) return

        const isCredit = amtVal > 0 || cols.some(c => c.toLowerCase() === 'cr' || c.toLowerCase() === 'credit')
        const absAmt = Math.abs(amtVal)

        // Smart Invoice Matching
        const matchedInv = invoices.find(inv => Math.abs(inv.dueAmount - absAmt) < 1 || desc.toLowerCase().includes(inv.partyName.toLowerCase()))

        parsed.push({
          id: generateId(),
          date: dateStr.includes('-') ? dateStr : todayISO(),
          description: desc,
          amount: absAmt,
          type: isCredit ? 'CREDIT' : 'DEBIT',
          matchedInvoiceId: matchedInv?.id,
          matchedPartyName: matchedInv?.partyName,
          status: matchedInv ? 'MATCHED' : 'UNMATCHED',
        })
      })

      setRows(parsed)
      setUploading(false)
    }

    reader.readAsText(file)
  }

  const reconcileRow = (rowId: string) => {
    const row = rows.find(r => r.id === rowId)
    if (!row || !row.matchedInvoiceId) return

    const inv = DB.invoices.byId(row.matchedInvoiceId)
    if (!inv) return

    const amt = Math.min(row.amount, inv.dueAmount)
    const newPaid = inv.paidAmount + amt
    const newDue = Math.max(0, inv.grandTotal - newPaid)
    const status = newDue <= 0 ? 'PAID' : 'PARTIAL'

    DB.invoices.save({ ...inv, paidAmount: newPaid, dueAmount: newDue, paymentStatus: status })
    createLedgerEntry(inv.partyId, inv.partyName, row.type === 'CREDIT' ? 'RECEIPT' : 'PAYMENT', amt, 'BANK', inv.invoiceNo, `Bank Reconciled: ${row.description}`, todayISO())

    if (accountId) {
      const acct = DB.bankAccounts.list().find(a => a.id === accountId)
      if (acct) {
        DB.bankAccounts.save({ ...acct, balance: acct.balance + (row.type === 'CREDIT' ? amt : -amt) })
      }
    }

    setRows(prev => prev.map(r => r.id === rowId ? { ...r, status: 'RECONCILED' } : r))
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm }}>
          {onBack && <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: Colors.textSecondary, padding: 0 }}><Icons.Back size={20} /></button>}
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: Colors.textPrimary }}>Bank Statement Auto-Reconciliation</h2>
            <div style={{ fontSize: 12, color: Colors.textSecondary }}>Upload HDFC/ICICI/SBI bank statement & auto-match invoices</div>
          </div>
        </div>
        <button onClick={() => fileRef.current?.click()} style={{ ...s.primaryBtn, width: 'auto', padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icons.Download size={16} /> Upload Bank Statement (.CSV)
        </button>
        <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: Spacing.md, marginBottom: Spacing.xl }}>
        <div style={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: '14px 16px', border: `1px solid ${Colors.border}` }}>
          <div style={{ fontSize: 11, color: Colors.textSecondary }}>Total Statement Entries</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: Colors.primary, marginTop: 2 }}>{rows.length}</div>
        </div>
        <div style={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: '14px 16px', border: `1px solid ${Colors.border}` }}>
          <div style={{ fontSize: 11, color: Colors.textSecondary }}>Auto-Matched Invoices</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: Colors.success, marginTop: 2 }}>{rows.filter(r => r.status === 'MATCHED').length}</div>
        </div>
        <div style={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: '14px 16px', border: `1px solid ${Colors.border}` }}>
          <div style={{ fontSize: 11, color: Colors.textSecondary }}>Reconciled Transactions</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: Colors.accent, marginTop: 2 }}>{rows.filter(r => r.status === 'RECONCILED').length}</div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: Spacing.huge, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, border: `1px solid ${Colors.border}` }}>
          <Icons.Bank size={48} color={Colors.textDisabled} />
          <div style={{ marginTop: Spacing.md, fontSize: 14, fontWeight: 600, color: Colors.textPrimary }}>Upload Your Bank Statement CSV</div>
          <div style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 4 }}>Auto-matches bank deposits and withdrawals with pending sales & purchases</div>
          <button onClick={() => fileRef.current?.click()} style={{ ...s.primaryBtn, width: 240, marginTop: Spacing.lg, marginInline: 'auto' }}>Select Statement File</button>
        </div>
      ) : (
        <div style={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.md, border: `1px solid ${Colors.border}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: Colors.surfaceVariant, borderBottom: `1px solid ${Colors.border}`, textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: Colors.textSecondary }}>DATE</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: Colors.textSecondary }}>DESCRIPTION</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: Colors.textSecondary, textAlign: 'right' }}>AMOUNT</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: Colors.textSecondary }}>MATCHED INVOICE</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: Colors.textSecondary }}>STATUS</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: Colors.textSecondary, textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${Colors.divider}` }}>
                  <td style={{ padding: '12px 14px', fontSize: 12 }}>{formatDate(r.date)}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 500 }}>{r.description}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: r.type === 'CREDIT' ? Colors.success : Colors.error }}>
                    {r.type === 'CREDIT' ? '+' : '-'}{formatCurrency(r.amount)}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    {r.matchedPartyName ? (
                      <div><span style={{ fontWeight: 600, color: Colors.primary }}>{r.matchedPartyName}</span></div>
                    ) : (
                      <span style={{ color: Colors.textDisabled, fontSize: 11 }}>Unmatched</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 10, backgroundColor: r.status === 'RECONCILED' ? Colors.successLight : r.status === 'MATCHED' ? Colors.primaryLight : Colors.surfaceVariant, color: r.status === 'RECONCILED' ? Colors.success : r.status === 'MATCHED' ? Colors.primary : Colors.textDisabled }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    {r.status === 'MATCHED' && (
                      <button onClick={() => reconcileRow(r.id)} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', backgroundColor: Colors.primary, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        Approve Payment ✓
                      </button>
                    )}
                    {r.status === 'RECONCILED' && <span style={{ fontSize: 12, color: Colors.success, fontWeight: 700 }}>Done ✓</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
