import React, { useState, useMemo, useReducer } from 'react'
import { Colors, Spacing } from '../theme'
import { s } from '../utils/styles'
import { DB } from '../utils/storage'
import { Icons } from '../utils/Icons'
import { useDelayedRender, ListSkeleton } from '../utils/smooth'
import { useFuzzySearch } from '../utils/useFuzzySearch'
import { useBatchSelect, BatchActionBar } from '../utils/useBatchSelect'
import { ExportBar } from '../utils/ExportBar'

export function Customers({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [search, setSearch] = useState('')
  const [batchMode, setBatchMode] = useState(false)
  const [rev, bumpRev] = useReducer(x => x + 1, 0)
  const ready = useDelayedRender(200)

  const allCustomers = useMemo(() => DB.parties.list().filter(p => p.type !== 'SUPPLIER'), [rev])
  const filtered = useFuzzySearch(allCustomers, search, ['name', 'phone', 'email', 'gstin'], 5, 200)

  const batch = useBatchSelect(filtered)

  const handleBatchDelete = () => {
    if (!confirm(`Delete ${batch.selectedCount} customer(s)? This cannot be undone.`)) return
    batch.selectedIds.forEach(id => DB.parties.delete(id))
    batch.clearSelection()
    setBatchMode(false); bumpRev()
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ display: 'flex', gap: Spacing.sm, marginBottom: Spacing.md }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 12, top: 10, display: 'flex', alignItems: 'center', color: Colors.textDisabled }}><Icons.Search size={16} /></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..." style={{ ...s.searchBox, paddingLeft: 36 }} />
        </div>
        <ExportBar title="customers"
          xlsData={{ name: 'Customers', headers: ['Name', 'Phone', 'Email', 'GSTIN', 'Address'], rows: allCustomers.map(c => [c.name, c.phone || '', c.email || '', c.gstin || '', c.shippingAddress || '']) }}
        />
        <button onClick={() => { setBatchMode(!batchMode); batch.clearSelection() }} style={{
          padding: '8px 12px', border: `1px solid ${batchMode ? Colors.error : Colors.primary}30`, borderRadius: 6,
          backgroundColor: batchMode ? Colors.error + '10' : 'transparent',
          color: batchMode ? Colors.error : Colors.primary, cursor: 'pointer', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
        }}>
          {batchMode ? 'Cancel' : 'Select'}
        </button>
      </div>

      {!ready ? (
        <ListSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: Spacing.huge, color: Colors.textDisabled }}>
          <div style={{ fontSize: 48, marginBottom: Spacing.md }}>👤</div>
          <div>No customers yet</div>
          <button onClick={() => onNavigate('add-party')} style={{ marginTop: Spacing.md, ...s.primaryBtn }}>Add Customer</button>
        </div>
      ) : (
        filtered.map(c => (
          <div key={c.id} onClick={() => !batchMode && onNavigate('add-party?id=' + c.id)} style={{
            ...s.listItem,
            backgroundColor: batch.isSelected(c.id) ? Colors.primary + '08' : Colors.surface,
          }}
            onMouseEnter={e => !batchMode && (e.currentTarget.style.backgroundColor = Colors.surfaceVariant)}
            onMouseLeave={e => !batchMode && (e.currentTarget.style.backgroundColor = Colors.surface)}>
            {batchMode && (
              <div onClick={e => { e.stopPropagation(); batch.toggle(c.id) }} style={{
                width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer',
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 4, border: `2px solid ${batch.isSelected(c.id) ? Colors.primary : Colors.border}`,
                  backgroundColor: batch.isSelected(c.id) ? Colors.primary : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {batch.isSelected(c.id) && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>}
                </div>
              </div>
            )}
            <div style={s.listStrip(Colors.accent)} />
            <div style={{ ...s.listBody, flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <div style={s.avatar(c.name.charAt(0), Colors.accent)}>{c.name.charAt(0)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: Colors.textPrimary }}>{c.name}</div>
                <div style={{ fontSize: 11, color: Colors.textSecondary }}>{c.phone}{c.email ? ' · ' + c.email : ''}</div>
              </div>
              <span style={{ color: Colors.textDisabled, fontSize: 18 }}>›</span>
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

      <button onClick={() => onNavigate('add-party')} style={{
        position: 'fixed', right: Spacing.lg, bottom: 80, width: 56, height: 56, borderRadius: 28,
        backgroundColor: Colors.primary, color: Colors.textLight, border: 'none', fontSize: 28,
        cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Icons.Add size={28} /></button>
    </div>
  )
}
