import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, formatDate, generateId, todayISO } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import type { BankAccount, BankTransaction } from '../types'

const ACCOUNT_TYPES = ['BANK', 'CASH', 'WALLET'] as const
const TXN_TYPES = ['DEPOSIT', 'WITHDRAWAL'] as const

const typeIcon: Record<string, (p: { size?: number; color?: string }) => JSX.Element> = {
  BANK: Icons.Building, CASH: Icons.Money, WALLET: Icons.Payment,
}
const typeColor: Record<string, string> = {
  BANK: Colors.primary, CASH: Colors.success, WALLET: Colors.accent,
}

export function BankAccounts() {
  const [accounts, setAccounts] = useState(() => DB.bankAccounts.list())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showTxnForm, setShowTxnForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [accType, setAccType] = useState<'BANK' | 'CASH' | 'WALLET'>('BANK')
  const [accNo, setAccNo] = useState('')
  const [ifsc, setIfsc] = useState('')
  const [holderName, setHolderName] = useState('')
  const [openingBal, setOpeningBal] = useState('')

  const [txnType, setTxnType] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT')
  const [txnAmount, setTxnAmount] = useState('')
  const [txnDesc, setTxnDesc] = useState('')
  const [txnDate, setTxnDate] = useState(todayISO())

  const refresh = () => setAccounts([...DB.bankAccounts.list()])
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)

  const handleSaveAccount = () => {
    if (!name.trim()) return
    DB.bankAccounts.save({
      id: generateId(), name: name.trim(), type: accType,
      accountNo: accNo.trim() || undefined, ifsc: ifsc.trim() || undefined,
      holderName: holderName.trim() || undefined,
      balance: parseFloat(openingBal) || 0,
      isDefault: accounts.length === 0, isActive: true,
    })
    refresh()
    setShowAddForm(false)
    setName(''); setAccType('BANK'); setAccNo(''); setIfsc(''); setHolderName(''); setOpeningBal('')
  }

  const handleSaveTxn = () => {
    if (!txnAmount || !txnDesc.trim() || !expandedId) return
    const amt = parseFloat(txnAmount)
    const account = DB.bankAccounts.byId(expandedId)
    if (!account) return
    const newBalance = txnType === 'DEPOSIT' ? account.balance + amt : account.balance - amt
    DB.bankTransactions.save({
      id: generateId(), accountId: expandedId, type: txnType,
      amount: amt, description: txnDesc.trim(), date: txnDate, balance: newBalance,
    })
    DB.bankAccounts.save({ ...account, balance: newBalance })
    refresh()
    setShowTxnForm(false)
    setTxnType('DEPOSIT'); setTxnAmount(''); setTxnDesc(''); setTxnDate(todayISO())
  }

  const handleDeleteAccount = (id: string) => {
    const remaining = DB.bankTransactions.list().filter(t => t.accountId !== id)
    localStorage.setItem('vs_bankTxns', JSON.stringify(remaining))
    DB.bankAccounts.delete(id)
    setConfirmDelete(null); setExpandedId(null)
    refresh()
  }

  if (showAddForm) {
    return (
      <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: Colors.textPrimary, marginBottom: Spacing.lg }}>Add Account</div>
        <Field label="Account Name"><input value={name} onChange={e => setName(e.target.value)} style={s.input} placeholder="e.g. SBI Current" /></Field>
        <Field label="Type">
          <select value={accType} onChange={e => setAccType(e.target.value as any)} style={s.select}>
            {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        {accType === 'BANK' && <>
          <Field label="Account No"><input value={accNo} onChange={e => setAccNo(e.target.value)} style={s.input} /></Field>
          <Field label="IFSC Code"><input value={ifsc} onChange={e => setIfsc(e.target.value)} style={s.input} /></Field>
          <Field label="Account Holder"><input value={holderName} onChange={e => setHolderName(e.target.value)} style={s.input} /></Field>
        </>}
        <Field label="Opening Balance"><input type="number" value={openingBal} onChange={e => setOpeningBal(e.target.value)} style={s.input} /></Field>
        <button onClick={handleSaveAccount} style={s.primaryBtn}>Save Account</button>
        <button onClick={() => setShowAddForm(false)} style={{ marginTop: Spacing.sm, width: '100%', padding: '10px', background: 'none', border: 'none', color: Colors.textSecondary, cursor: 'pointer' }}>Cancel</button>
      </div>
    )
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ marginBottom: Spacing.xl }}>
        <div style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: 2 }}>Total Balance</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: Colors.textPrimary }}>{formatCurrency(totalBalance)}</div>
      </div>

      {accounts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: Spacing.huge, color: Colors.textDisabled, fontSize: 14 }}>
          <Icons.Building size={32} /><br />No accounts yet
        </div>
      ) : accounts.map(acc => {
        const Icon = typeIcon[acc.type] || Icons.Building
        const isExpanded = expandedId === acc.id
        const transactions = DB.bankTransactions.forAccount(acc.id).slice(0, 10)

        return (
          <div key={acc.id} style={{ ...s.card, marginBottom: Spacing.md, overflow: 'hidden' }}>
            <div onClick={() => { setExpandedId(isExpanded ? null : acc.id); setShowTxnForm(false); setConfirmDelete(null) }} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.md }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: (acc.isDefault ? Colors.primary : typeColor[acc.type]) + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={22} color={acc.isDefault ? Colors.primary : typeColor[acc.type]} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 15, color: Colors.textPrimary }}>{acc.name}</span>
                    <span style={s.badge(typeColor[acc.type])}>{acc.type}</span>
                    {acc.isDefault && <span style={s.badge(Colors.accent)}>Default</span>}
                  </div>
                  {acc.type === 'BANK' && acc.accountNo && (
                    <div style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 }}>{acc.accountNo}{acc.ifsc ? ` · ${acc.ifsc}` : ''}</div>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 18, color: Colors.textPrimary }}>{formatCurrency(acc.balance)}</div>
                </div>
              </div>
            </div>

            {isExpanded && (
              <div style={{ marginTop: Spacing.md, borderTop: `1px solid ${Colors.divider}`, paddingTop: Spacing.md }}>
                {confirmDelete === acc.id ? (
                  <div style={{ display: 'flex', gap: Spacing.sm, marginBottom: Spacing.sm }}>
                    <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: '10px', background: 'none', border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.sm, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={() => handleDeleteAccount(acc.id)} style={{ flex: 1, padding: '10px', backgroundColor: Colors.error, color: Colors.textLight, border: 'none', borderRadius: BorderRadius.sm, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Delete Account</button>
                  </div>
                ) : showTxnForm ? (
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: Colors.textPrimary, marginBottom: Spacing.md }}>Add Transaction</div>
                    <Field label="Type">
                      <select value={txnType} onChange={e => setTxnType(e.target.value as any)} style={s.select}>
                        {TXN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </Field>
                    <Field label="Amount"><input type="number" value={txnAmount} onChange={e => setTxnAmount(e.target.value)} style={s.input} /></Field>
                    <Field label="Description"><input value={txnDesc} onChange={e => setTxnDesc(e.target.value)} style={s.input} /></Field>
                    <Field label="Date"><input type="date" value={txnDate} onChange={e => setTxnDate(e.target.value)} style={s.input} /></Field>
                    <div style={{ display: 'flex', gap: Spacing.sm }}>
                      <button onClick={() => setShowTxnForm(false)} style={{ flex: 1, padding: '10px', background: 'none', border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.sm, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                      <button onClick={handleSaveTxn} style={{ flex: 2, ...s.primaryBtn }}>Save Transaction</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {transactions.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: Spacing.md, color: Colors.textDisabled, fontSize: 13 }}>No transactions yet</div>
                    ) : transactions.map(t => (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${Colors.divider}`, fontSize: 13 }}>
                        <div>
                          <div style={{ fontWeight: 500, color: Colors.textPrimary }}>{t.description}</div>
                          <div style={{ fontSize: 11, color: Colors.textSecondary }}>{formatDate(t.date)}{t.reference ? ` · ${t.reference}` : ''}</div>
                        </div>
                        <div style={{ fontWeight: 600, color: t.type === 'DEPOSIT' ? Colors.success : Colors.error }}>
                          {t.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(t.amount)}
                        </div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: Spacing.sm, marginTop: Spacing.md }}>
                      <button onClick={() => { setShowTxnForm(true); setTxnType('DEPOSIT'); setTxnAmount(''); setTxnDesc(''); setTxnDate(todayISO()) }} style={{ flex: 1, padding: '10px', backgroundColor: Colors.primary, color: Colors.textLight, border: 'none', borderRadius: BorderRadius.sm, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Add Transaction</button>
                      <button onClick={() => setConfirmDelete(acc.id)} style={{ padding: '10px', backgroundColor: Colors.errorLight, color: Colors.error, border: 'none', borderRadius: BorderRadius.sm, fontSize: 13, cursor: 'pointer' }}><Icons.Delete size={16} /></button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      <button onClick={() => { setShowAddForm(true); setName(''); setAccType('BANK'); setAccNo(''); setIfsc(''); setHolderName(''); setOpeningBal('') }} style={{
        position: 'fixed', right: Spacing.lg, bottom: 80, width: 56, height: 56, borderRadius: 28,
        backgroundColor: Colors.primary, color: Colors.textLight, border: 'none', fontSize: 28,
        cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Icons.Add size={28} /></button>
    </div>
  )
}
