import React, { useState, useMemo, useReducer } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, formatDate, generateId, todayISO } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { useDelayedRender, ListSkeleton, useToast } from '../utils/smooth'
import { useFuzzySearch } from '../utils/useFuzzySearch'
import { useBatchSelect, BatchActionBar } from '../utils/useBatchSelect'
import { ExportBar } from '../utils/ExportBar'

const EXPENSE_CATEGORIES = ['General', 'Rent', 'Electricity & Water', 'Salary', 'Tea & Snacks', 'Fuel & Travel', 'Maintenance', 'Marketing', 'Supplies', 'Others']

export function Expenses({ onNavigate }: { onNavigate: (p: string) => void }) {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('ALL')
  const [showForm, setShowForm] = useState(false)
  const [batchMode, setBatchMode] = useState(false)
  const [rev, bumpRev] = useReducer(x => x + 1, 0)
  const ready = useDelayedRender(200)

  // Form State
  const [desc, setDesc] = useState('')
  const [category, setCategory] = useState('General')
  const [amount, setAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'ONLINE' | 'BANK_TRANSFER'>('CASH')
  const [date, setDate] = useState(todayISO())

  const allExpenses = useMemo(() =>
    [...DB.expenses.list()].sort((a, b) => b.date.localeCompare(a.date)),
  [rev])

  const cats = useMemo(() => {
    const s = new Set([...EXPENSE_CATEGORIES, ...allExpenses.map(e => e.category)])
    return ['ALL', ...Array.from(s)]
  }, [allExpenses])

  const catFiltered = useMemo(() =>
    catFilter === 'ALL' ? allExpenses : allExpenses.filter(e => e.category === catFilter),
    [allExpenses, catFilter]
  )

  const filtered = useFuzzySearch(catFiltered, search, ['description', 'category', 'paymentMode'], 5, 500)

  const batch = useBatchSelect(filtered)

  const handleBatchDelete = () => {
    if (!confirm(`Delete ${batch.selectedCount} expense(s)?`)) return
    batch.selectedIds.forEach(id => DB.expenses.delete(id))
    batch.clearSelection()
    setBatchMode(false); bumpRev()
  }

  const handleSaveExpense = () => {
    const amt = parseFloat(amount)
    if (!desc.trim()) { alert('Please enter expense description'); return }
    if (isNaN(amt) || amt <= 0) { alert('Please enter a valid amount'); return }

    const expId = generateId()
    DB.expenses.save({
      id: expId,
      description: desc.trim(),
      category: category.trim() || 'General',
      amount: amt,
      date,
      paymentMode,
    })

    DB.auditLogs.save({
      id: generateId(), entity: 'EXPENSE', entityId: expId, action: 'CREATE',
      user: 'Admin', timestamp: new Date().toISOString(), description: `Expense added: ${desc} — ${formatCurrency(amt)}`
    })

    toast('Expense saved successfully!', 'success')
    setDesc('')
    setAmount('')
    setCategory('General')
    setDate(todayISO())
    setShowForm(false)
    bumpRev()
  }

  if (showForm) {
    return (
      <div style={{ padding: Spacing.lg, paddingBottom: 80, maxWidth: 500, margin: '0 auto' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: Colors.textPrimary, marginBottom: Spacing.lg, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icons.Expense size={20} color={Colors.primary} /> Add New Expense
        </div>
        <Field label="Description">
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Shop Rent, Office Tea, Electricity Bill" style={s.input} />
        </Field>
        <Field label="Category">
          <select value={category} onChange={e => setCategory(e.target.value)} style={s.select}>
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Amount (₹)">
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" min="0" step="any" style={s.input} />
        </Field>
        <Field label="Payment Mode">
          <div style={s.toggleGroup}>
            <button type="button" onClick={() => setPaymentMode('CASH')} style={{ ...s.toggle(paymentMode === 'CASH', Colors.success), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Icons.Money size={16} /> Cash
            </button>
            <button type="button" onClick={() => setPaymentMode('ONLINE')} style={{ ...s.toggle(paymentMode === 'ONLINE', Colors.primary), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Icons.Payment size={16} /> UPI / Online
            </button>
            <button type="button" onClick={() => setPaymentMode('BANK_TRANSFER')} style={{ ...s.toggle(paymentMode === 'BANK_TRANSFER', Colors.info), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Icons.Bank size={16} /> Bank
            </button>
          </div>
        </Field>
        <Field label="Expense Date">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={s.input} />
        </Field>
        <div style={{ display: 'flex', gap: Spacing.md, marginTop: Spacing.lg }}>
          <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '14px', borderRadius: BorderRadius.sm, border: `1px solid ${Colors.border}`, backgroundColor: 'transparent', color: Colors.textSecondary, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button type="button" onClick={handleSaveExpense} style={{ flex: 2, ...s.primaryBtn }}>
            Save Expense
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ display: 'flex', gap: Spacing.sm, marginBottom: Spacing.md }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 12, top: 10, display: 'flex', alignItems: 'center', color: Colors.textDisabled }}><Icons.Search size={16} /></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search expenses..." style={{ ...s.searchBox, paddingLeft: 36 }} />
        </div>
        <ExportBar title="expenses"
          xlsData={{ name: 'Expenses', headers: ['Description', 'Category', 'Amount', 'Date', 'Payment Mode'], rows: allExpenses.map(e => [e.description, e.category, String(e.amount), e.date, e.paymentMode || '']) }}
        />
        <button onClick={() => { setBatchMode(!batchMode); batch.clearSelection() }} style={{
          padding: '8px 12px', border: `1px solid ${batchMode ? Colors.error : Colors.primary}30`, borderRadius: 6,
          backgroundColor: batchMode ? Colors.error + '10' : 'transparent',
          color: batchMode ? Colors.error : Colors.primary, cursor: 'pointer', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
        }}>
          {batchMode ? 'Cancel' : 'Select'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: Spacing.xs, marginBottom: Spacing.md, flexWrap: 'wrap' }}>
        {cats.slice(0, 10).map(c => (
          <button key={c} onClick={() => setCatFilter(c)} style={s.chip(catFilter === c, c === 'ALL' ? Colors.primary : Colors.warning)}>
            {c === 'ALL' ? 'All' : c}
          </button>
        ))}
      </div>

      {!ready ? (
        <ListSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: Spacing.huge, color: Colors.textDisabled }}>
          <div style={{ marginBottom: Spacing.md }}><Icons.Expense size={48} color={Colors.textDisabled} /></div>
          <div>No expenses found</div>
          <button onClick={() => setShowForm(true)} style={{ ...s.primaryBtn, marginTop: Spacing.md, width: 'auto', padding: '10px 20px' }}>
            + Add Expense
          </button>
        </div>
      ) : (
        filtered.map(e => (
          <div key={e.id} style={{
            ...s.listItem,
            backgroundColor: batch.isSelected(e.id) ? Colors.primary + '08' : Colors.surface,
          }}
            onMouseEnter={r => !batchMode && (r.currentTarget.style.backgroundColor = Colors.surfaceVariant)}
            onMouseLeave={r => !batchMode && (r.currentTarget.style.backgroundColor = Colors.surface)}>
            {batchMode && (
              <div onClick={ev => { ev.stopPropagation(); batch.toggle(e.id) }} style={{
                width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer',
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 4, border: `2px solid ${batch.isSelected(e.id) ? Colors.primary : Colors.border}`,
                  backgroundColor: batch.isSelected(e.id) ? Colors.primary : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {batch.isSelected(e.id) && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>}
                </div>
              </div>
            )}
            <div style={s.listStrip(Colors.error)} />
            <div style={s.listBody}>
              <div style={{ ...s.spaceBetween }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: Colors.textPrimary }}>{e.description}</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: Colors.error }}>-{formatCurrency(e.amount)}</span>
              </div>
              <div style={{ fontSize: 11, color: Colors.textSecondary }}>{e.category} · {formatDate(e.date)} · {e.paymentMode || 'CASH'}</div>
            </div>
          </div>
        ))
      )}

      <BatchActionBar
        selectedCount={batch.selectedCount}
        onClear={() => { batch.clearSelection(); setBatchMode(false) }}
        actions={[
          { label: 'Delete', icon: <Icons.Delete size={14} />, onClick: handleBatchDelete, danger: true },
        ]}
      />

      <button onClick={() => setShowForm(true)} title="Add Expense" style={{
        position: 'fixed', right: Spacing.lg, bottom: 80, width: 56, height: 56, borderRadius: 28,
        backgroundColor: Colors.primary, color: Colors.textLight, border: 'none', fontSize: 28,
        cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Icons.Add size={28} /></button>
    </div>
  )
}
