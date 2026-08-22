import React, { useState, useMemo } from 'react'
import { Colors, Spacing, BorderRadius, Shadows } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, formatDate, generateId, todayISO } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { useToast } from '../utils/smooth'

const ACCOUNT_TYPES = ['BANK', 'CASH', 'WALLET'] as const
const TXN_TYPES = ['DEPOSIT', 'WITHDRAWAL'] as const

const typeIcon: Record<string, (p: { size?: number; color?: string }) => JSX.Element> = {
  BANK: Icons.Building, CASH: Icons.Money, WALLET: Icons.Payment,
}
const typeColor: Record<string, string> = {
  BANK: Colors.primary, CASH: Colors.success, WALLET: Colors.accent,
}

export function BankAccounts() {
  const { toast } = useToast()
  
  // Ensure default system accounts exist
  const getInitialAccounts = () => {
    let list = DB.bankAccounts.list()
    if (list.length === 0) {
      const defaultCash = { id: 'cash_default', name: 'Cash in Hand', type: 'CASH' as const, balance: 0, isDefault: true, isActive: true }
      const defaultBank = { id: 'bank_default', name: 'Primary Bank Account', type: 'BANK' as const, balance: 0, isDefault: false, isActive: true }
      DB.bankAccounts.save(defaultCash)
      DB.bankAccounts.save(defaultBank)
      list = [defaultCash, defaultBank]
    }
    return list
  }

  const [accounts, setAccounts] = useState(getInitialAccounts)
  const [expandedId, setExpandedId] = useState<string | null>(accounts[0]?.id || null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showTxnForm, setShowTxnForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // Account creation state
  const [name, setName] = useState('')
  const [accType, setAccType] = useState<'BANK' | 'CASH' | 'WALLET'>('BANK')
  const [accNo, setAccNo] = useState('')
  const [ifsc, setIfsc] = useState('')
  const [holderName, setHolderName] = useState('')
  const [openingBal, setOpeningBal] = useState('')

  // Transaction creation state
  const [targetAccId, setTargetAccId] = useState<string>('')
  const [txnType, setTxnType] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT')
  const [txnAmount, setTxnAmount] = useState('')
  const [txnDesc, setTxnDesc] = useState('')
  const [txnDate, setTxnDate] = useState(todayISO())

  const refresh = () => setAccounts([...DB.bankAccounts.list()])

  const totalCash = useMemo(() => accounts.filter(a => a.type === 'CASH').reduce((sum, a) => sum + (a.balance || 0), 0), [accounts])
  const totalBank = useMemo(() => accounts.filter(a => a.type !== 'CASH').reduce((sum, a) => sum + (a.balance || 0), 0), [accounts])
  const totalCombined = totalCash + totalBank

  const handleSaveAccount = () => {
    if (!name.trim()) {
      toast('Please enter account name', 'warning')
      return
    }
    const newAccount = {
      id: generateId(),
      name: name.trim(),
      type: accType,
      accountNo: accNo.trim() || undefined,
      ifsc: ifsc.trim() || undefined,
      holderName: holderName.trim() || undefined,
      balance: parseFloat(openingBal) || 0,
      isDefault: accounts.length === 0,
      isActive: true,
    }
    DB.bankAccounts.save(newAccount)
    refresh()
    setShowAddForm(false)
    setName(''); setAccType('BANK'); setAccNo(''); setIfsc(''); setHolderName(''); setOpeningBal('')
    toast(`Added "${newAccount.name}" account!`, 'success')
  }

  const openTxnModal = (accId: string, defaultTxnType: 'DEPOSIT' | 'WITHDRAWAL') => {
    setTargetAccId(accId)
    setTxnType(defaultTxnType)
    setTxnAmount('')
    setTxnDesc(defaultTxnType === 'DEPOSIT' ? 'Cash Deposit' : 'Cash Payout')
    setTxnDate(todayISO())
    setShowTxnForm(true)
  }

  const handleSaveTxn = () => {
    const amt = parseFloat(txnAmount)
    const accId = targetAccId || expandedId
    if (!txnAmount || isNaN(amt) || amt <= 0) {
      toast('Please enter a valid amount', 'warning')
      return
    }
    if (!accId) return

    const account = DB.bankAccounts.byId(accId)
    if (!account) return

    const newBalance = txnType === 'DEPOSIT' ? account.balance + amt : account.balance - amt
    const txnRecord = {
      id: generateId(),
      accountId: accId,
      type: txnType,
      amount: amt,
      description: txnDesc.trim() || (txnType === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'),
      date: txnDate,
      balance: newBalance,
    }

    DB.bankTransactions.save(txnRecord)
    DB.bankAccounts.save({ ...account, balance: newBalance })
    refresh()
    setShowTxnForm(false)
    setTxnAmount('')
    setTxnDesc('')
    toast(`${txnType === 'DEPOSIT' ? 'Added' : 'Deducted'} ${formatCurrency(amt)}!`, 'success')
  }

  const handleDeleteAccount = (id: string) => {
    const account = DB.bankAccounts.byId(id)
    if (account?.isDefault) {
      toast('Cannot delete default Cash account', 'warning')
      setConfirmDelete(null)
      return
    }
    DB.bankAccounts.delete(id)
    setConfirmDelete(null)
    setExpandedId(null)
    refresh()
    toast('Account deleted', 'info')
  }

  if (showAddForm) {
    return (
      <div style={{ padding: Spacing.lg, paddingBottom: 100 }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: Colors.textPrimary, marginBottom: Spacing.lg }}>
          + Add Bank or Cash Account
        </div>
        <Field label="Account Name" required>
          <input value={name} onChange={e => setName(e.target.value)} style={s.input} placeholder="e.g. HDFC Current Account or Shop Cash Box" />
        </Field>
        <Field label="Account Type">
          <select value={accType} onChange={e => setAccType(e.target.value as any)} style={s.select}>
            <option value="BANK">🏦 Bank Account</option>
            <option value="CASH">💵 Cash Counter</option>
            <option value="WALLET">📱 UPI / Wallet (Paytm/GPay)</option>
          </select>
        </Field>

        {accType === 'BANK' && (
          <>
            <Field label="Account Number"><input value={accNo} onChange={e => setAccNo(e.target.value)} style={s.input} placeholder="e.g. 5010023948293" /></Field>
            <Field label="IFSC Code"><input value={ifsc} onChange={e => setIfsc(e.target.value)} style={s.input} placeholder="e.g. HDFC0000240" /></Field>
            <Field label="Account Holder Name"><input value={holderName} onChange={e => setHolderName(e.target.value)} style={s.input} placeholder="Name as per bank passbook" /></Field>
          </>
        )}

        <Field label="Opening Balance (₹)">
          <input type="number" value={openingBal} onChange={e => setOpeningBal(e.target.value)} style={s.input} placeholder="0.00" />
        </Field>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={() => setShowAddForm(false)} style={{ ...s.outlineBtn, flex: 1 }}>Cancel</button>
          <button onClick={handleSaveAccount} style={{ ...s.primaryBtn, flex: 1 }}>Save Account</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 100 }}>
      
      {/* Executive Cash & Bank Summary Hero Header */}
      <div style={{
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        border: `1px solid ${Colors.border}`,
        padding: 16,
        marginBottom: 16,
        boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Total Liquidity & Balances
        </div>
        <div style={{ fontSize: 26, fontWeight: 900, color: Colors.primary, margin: '4px 0 14px', fontVariantNumeric: 'tabular-nums' }}>
          {formatCurrency(totalCombined)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ backgroundColor: Colors.successBg, border: `1px solid ${Colors.success}30`, borderRadius: BorderRadius.sm, padding: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: Colors.success }}>💵 Cash in Hand</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: Colors.success, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrency(totalCash)}
            </div>
          </div>

          <div style={{ backgroundColor: Colors.primarySurface, border: `1px solid ${Colors.primaryLight}`, borderRadius: BorderRadius.sm, padding: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: Colors.primary }}>🏦 Bank & UPI</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: Colors.primary, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrency(totalBank)}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Account Addition Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: Colors.textPrimary }}>Accounts List ({accounts.length})</div>
        <button onClick={() => { setShowAddForm(true); setName(''); setAccType('BANK'); setAccNo(''); setIfsc(''); setHolderName(''); setOpeningBal('') }} style={{
          padding: '8px 14px', backgroundColor: Colors.primary, color: '#fff', border: 'none', borderRadius: BorderRadius.md,
          fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Icons.Add size={16} color="#fff" /> + Add Account
        </button>
      </div>

      {/* Account Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {accounts.map(acc => {
          const Icon = typeIcon[acc.type] || Icons.Building
          const isExpanded = expandedId === acc.id
          const transactions = DB.bankTransactions.forAccount(acc.id).slice(0, 10)

          return (
            <div key={acc.id} style={{
              backgroundColor: Colors.surface, border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.md,
              padding: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
            }}>
              <div onClick={() => { setExpandedId(isExpanded ? null : acc.id); setConfirmDelete(null) }} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 21,
                      backgroundColor: typeColor[acc.type] + '15',
                      color: typeColor[acc.type],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={22} color={typeColor[acc.type]} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: Colors.textPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {acc.name}
                        {acc.isDefault && <span style={{ fontSize: 9, fontWeight: 800, backgroundColor: Colors.primaryLight, color: Colors.primary, padding: '2px 6px', borderRadius: 4 }}>DEFAULT</span>}
                      </div>
                      <div style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 2 }}>
                        {acc.type} {acc.accountNo ? `• ${acc.accountNo}` : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: Colors.textPrimary, fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(acc.balance)}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: Colors.primary }}>
                      {isExpanded ? 'Hide Details ▲' : 'View Txns ▼'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fast Quick Action Bar for Account */}
              <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 10, borderTop: `1px solid ${Colors.divider}` }}>
                <button onClick={() => openTxnModal(acc.id, 'DEPOSIT')} style={{
                  flex: 1, padding: '8px 10px', backgroundColor: Colors.successBg, border: `1px solid ${Colors.success}30`,
                  color: Colors.success, borderRadius: BorderRadius.sm, fontSize: 12, fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}>
                  + Deposit / Cash In
                </button>
                <button onClick={() => openTxnModal(acc.id, 'WITHDRAWAL')} style={{
                  flex: 1, padding: '8px 10px', backgroundColor: Colors.dangerBg, border: `1px solid ${Colors.danger}30`,
                  color: Colors.danger, borderRadius: BorderRadius.sm, fontSize: 12, fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}>
                  − Withdraw / Pay Out
                </button>
              </div>

              {/* Expanded Recent Transactions */}
              {isExpanded && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${Colors.border}` }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: Colors.textSecondary, marginBottom: 8 }}>
                    Recent Transactions
                  </div>
                  {transactions.length === 0 ? (
                    <div style={{ fontSize: 11, color: Colors.textMuted, textAlign: 'center', padding: '12px 0' }}>
                      No transaction history recorded yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {transactions.map(t => (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, paddingBottom: 6, borderBottom: `1px solid ${Colors.divider}` }}>
                          <div>
                            <div style={{ fontWeight: 700, color: Colors.textPrimary }}>{t.description}</div>
                            <div style={{ fontSize: 10, color: Colors.textSecondary }}>{formatDate(t.date)}</div>
                          </div>
                          <div style={{ fontWeight: 900, color: t.type === 'DEPOSIT' ? Colors.success : Colors.danger, fontVariantNumeric: 'tabular-nums' }}>
                            {t.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(t.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!acc.isDefault && (
                    <div style={{ marginTop: 12, textAlign: 'right' }}>
                      {confirmDelete === acc.id ? (
                        <button onClick={() => handleDeleteAccount(acc.id)} style={{ padding: '6px 12px', backgroundColor: Colors.danger, color: '#fff', border: 'none', borderRadius: BorderRadius.sm, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                          Confirm Delete Account
                        </button>
                      ) : (
                        <button onClick={() => setConfirmDelete(acc.id)} style={{ background: 'none', border: 'none', color: Colors.danger, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                          🗑️ Delete Account
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Transaction Modal */}
      {showTxnForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: 20, width: '100%', maxWidth: 400, ...Shadows.lg }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: Colors.textPrimary }}>
                {txnType === 'DEPOSIT' ? '+ Add Deposit / Cash In' : '− Withdraw / Cash Out'}
              </div>
              <button onClick={() => setShowTxnForm(false)} style={{ background: 'none', border: 'none', color: Colors.textMuted, cursor: 'pointer' }}>
                <Icons.Close size={20} />
              </button>
            </div>

            <Field label="Type">
              <select value={txnType} onChange={e => setTxnType(e.target.value as any)} style={s.select}>
                <option value="DEPOSIT">📥 Deposit / Cash In (+)</option>
                <option value="WITHDRAWAL">📤 Withdrawal / Pay Out (-)</option>
              </select>
            </Field>

            <Field label="Amount (₹)" required>
              <input autoFocus type="number" value={txnAmount} onChange={e => setTxnAmount(e.target.value)} placeholder="0.00" style={s.input} />
            </Field>

            <Field label="Description / Remarks">
              <input value={txnDesc} onChange={e => setTxnDesc(e.target.value)} placeholder="e.g. Sales cash deposit or Expense payout" style={s.input} />
            </Field>

            <Field label="Transaction Date">
              <input type="date" value={txnDate} onChange={e => setTxnDate(e.target.value)} style={s.input} />
            </Field>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowTxnForm(false)} style={{ ...s.outlineBtn, flex: 1 }}>Cancel</button>
              <button onClick={handleSaveTxn} style={{ ...s.primaryBtn, flex: 1 }}>Save Entry</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
