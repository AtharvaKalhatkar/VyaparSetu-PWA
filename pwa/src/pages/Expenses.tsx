import React, { useState, useMemo, useReducer } from 'react'
import { Colors, Spacing } from '../theme'
import { s } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, formatDate } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { useDelayedRender, ListSkeleton } from '../utils/smooth'
import { useFuzzySearch } from '../utils/useFuzzySearch'
import { useBatchSelect, BatchActionBar } from '../utils/useBatchSelect'
import { ExportBar } from '../utils/ExportBar'

export function Expenses({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('ALL')
  const [showForm, setShowForm] = useState(false)
  const [batchMode, setBatchMode] = useState(false)
  const [rev, bumpRev] = useReducer(x => x + 1, 0)
  const ready = useDelayedRender(200)

  const allExpenses = useMemo(() =>
    [...DB.expenses.list()].sort((a, b) => b.date.localeCompare(a.date)),
  [rev])

  const cats = useMemo(() => {
    const s = new Set(allExpenses.map(e => e.category))
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
        {cats.slice(0, 8).map(c => (
          <button key={c} onClick={() => setCatFilter(c)} style={s.chip(catFilter === c, c === 'ALL' ? Colors.primary : Colors.warning)}>
            {c === 'ALL' ? 'All' : c}
          </button>
        ))}
      </div>

      {!ready ? (
        <ListSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: Spacing.huge, color: Colors.textDisabled }}>
          <div style={{ fontSize: 48, marginBottom: Spacing.md }}>💸</div>
          <div>No expenses found</div>
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
              <div style={{ fontSize: 11, color: Colors.textSecondary }}>{e.category} · {formatDate(e.date)}</div>
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

      <button onClick={() => setShowForm(true)} style={{
        position: 'fixed', right: Spacing.lg, bottom: 80, width: 56, height: 56, borderRadius: 28,
        backgroundColor: Colors.primary, color: Colors.textLight, border: 'none', fontSize: 28,
        cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Icons.Add size={28} /></button>
    </div>
  )
}
