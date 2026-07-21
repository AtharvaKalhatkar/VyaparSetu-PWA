import React, { useState } from 'react'
import { Colors, Spacing } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { generateId, todayISO } from '../utils/formatting'
import { Icons } from '../utils/Icons'

const CATS = ['Office', 'Travel', 'Utilities', 'Salary', 'Marketing', 'Rent', 'Maintenance', 'Other']

export function AddEntry({ onBack, onNavigate }: { onBack: () => void; onNavigate?: (p: string) => void }) {
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE')
  const [category, setCategory] = useState('Office')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    const amt = parseFloat(amount)
    if (!amount || !description.trim() || isNaN(amt) || amt <= 0) return
    if (type === 'EXPENSE') {
      DB.expenses.save({ id: generateId(), category, amount: amt, description: description.trim(), date: todayISO(), paymentMode: 'CASH' })
    } else {
      DB.ledger.save({ id: generateId(), partyId: '', partyName: 'Income', type: 'RECEIPT', amount: amt, mode: 'CASH', reference: '', description: description.trim(), date: todayISO(), runningBalance: 0 })
    }
    // Update cash/bank account balance
    const accounts = DB.bankAccounts.list()
    const cashAccount = accounts.find(a => a.type === 'CASH' && a.isActive)
    if (cashAccount) {
      const balChange = type === 'INCOME' ? amt : -amt
      DB.bankAccounts.save({ ...cashAccount, balance: cashAccount.balance + balChange })
    }
    setSaved(true)
    setTimeout(onBack, 1000)
  }

  if (saved) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontSize: 20, fontWeight: 700, color: Colors.success }}><Icons.Check size={32} color={Colors.success} style={{ marginRight: 8 }} />Saved!</div>

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={s.toggleGroup}>
        <button onClick={() => setType('INCOME')} style={s.toggle(type === 'INCOME', Colors.success)}>Income</button>
        <button onClick={() => setType('EXPENSE')} style={s.toggle(type === 'EXPENSE', Colors.error)}>Expense</button>
      </div>
      {type === 'EXPENSE' && (
        <div style={{ display: 'flex', gap: Spacing.xs, flexWrap: 'wrap', marginBottom: Spacing.lg }}>
          {CATS.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={s.chip(category === c)}>{c}</button>
          ))}
        </div>
      )}
      <Field label="Amount"><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" style={s.input} /></Field>
      <Field label="Description"><input value={description} onChange={e => setDescription(e.target.value)} placeholder="What for?" style={s.input} /></Field>
      <button onClick={handleSave} disabled={!amount || !description.trim()} style={amount && description.trim() ? s.primaryBtn : s.primaryBtnDisabled}>
        Save {type === 'INCOME' ? 'Income' : 'Expense'}
      </button>
    </div>
  )
}
