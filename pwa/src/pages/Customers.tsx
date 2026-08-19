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
  const [filterTab, setFilterTab] = useState<'ALL' | 'CUSTOMERS' | 'SUPPLIERS'>('ALL')
  const [search, setSearch] = useState('')
  const [batchMode, setBatchMode] = useState(false)
  const [rev, bumpRev] = useReducer(x => x + 1, 0)
  const ready = useDelayedRender(200)

  const allPartiesList = useMemo(() => DB.parties.list(), [rev])

  const displayedParties = useMemo(() => {
    if (filterTab === 'CUSTOMERS') return allPartiesList.filter(p => p.type === 'CUSTOMER' || p.type === 'BOTH' || !p.type)
    if (filterTab === 'SUPPLIERS') return allPartiesList.filter(p => p.type === 'SUPPLIER' || p.type === 'BOTH')
    return allPartiesList
  }, [allPartiesList, filterTab])

  const filtered = useFuzzySearch(displayedParties, search, ['name', 'phone', 'email', 'gstin'], 5, 200)

  const batch = useBatchSelect(filtered)

  const handleBatchDelete = () => {
    if (!confirm(`Delete ${batch.selectedCount} party(ies)? This cannot be undone.`)) return
    batch.selectedIds.forEach(id => DB.parties.delete(id))
    batch.clearSelection()
    setBatchMode(false); bumpRev()
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      {/* Party Category Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: Spacing.md }}>
        {[
          { key: 'ALL', label: `All Parties (${allPartiesList.length})` },
          { key: 'CUSTOMERS', label: `Customers (${allPartiesList.filter(p => p.type !== 'SUPPLIER').length})` },
          { key: 'SUPPLIERS', label: `Suppliers (${allPartiesList.filter(p => p.type === 'SUPPLIER' || p.type === 'BOTH').length})` },
        ].map(tabItem => {
          const active = filterTab === tabItem.key
          return (
            <button key={tabItem.key} onClick={() => setFilterTab(tabItem.key as any)} style={{
              flex: 1, padding: '8px 4px', borderRadius: 8, border: active ? `1px solid ${Colors.primary}` : `1px solid ${Colors.border}`,
              backgroundColor: active ? Colors.primaryLight : Colors.surface,
              color: active ? Colors.primary : Colors.textSecondary,
              fontWeight: active ? 700 : 500, fontSize: 12, cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
            }}>
              {tabItem.label}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: Spacing.sm, marginBottom: Spacing.md }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 12, top: 10, display: 'flex', alignItems: 'center', color: Colors.textDisabled }}><Icons.Search size={16} /></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search parties by name, phone, gstin..." style={{ ...s.searchBox, paddingLeft: 36 }} />
        </div>
        <ExportBar title="parties"
          xlsData={{ name: 'Parties', headers: ['Name', 'Type', 'Phone', 'Email', 'GSTIN', 'Address'], rows: displayedParties.map(c => [c.name, c.type || 'CUSTOMER', c.phone || '', c.email || '', c.gstin || '', c.shippingAddress || '']) }}
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
            <div style={s.listStrip(c.gstin ? Colors.primary : Colors.accent)} />
            <div style={{ ...s.listBody, flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <div style={s.avatar(c.name.charAt(0), c.gstin ? Colors.primary : Colors.accent)}>{c.name.charAt(0)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: Colors.textPrimary }}>{c.name}</div>
                  {c.gstin && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, backgroundColor: Colors.primaryLight, color: Colors.primary, fontWeight: 700 }}>GST</span>}
                </div>
                <div style={{ fontSize: 11, color: Colors.textSecondary }}>{c.phone}{c.email ? ' · ' + c.email : ''}</div>
              </div>

              {(() => {
                const bal = DB.ledger.forParty(c.id).reduce((b, e) => {
                  if (e.type === 'SALE') return b + e.amount
                  if (e.type === 'PURCHASE') return b - e.amount
                  if (e.type === 'RECEIPT') return b - e.amount
                  if (e.type === 'PAYMENT') return b + e.amount
                  return b
                }, 0)
                const isCollect = bal > 0
                const isPay = bal < 0
                const color = isCollect ? Colors.success : isPay ? Colors.error : Colors.textSecondary
                const bg = isCollect ? Colors.successLight : isPay ? Colors.errorLight : Colors.surfaceVariant
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color, backgroundColor: bg, padding: '3px 8px', borderRadius: 6 }}>
                      {isCollect ? `Rec: ₹${bal.toLocaleString()}` : isPay ? `Pay: ₹${Math.abs(bal).toLocaleString()}` : 'Settled'}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => onNavigate('party-ledger?partyId=' + c.id)} title="View Ledger" style={{ background: 'none', border: 'none', color: Colors.primary, cursor: 'pointer', fontSize: 11, padding: 2 }}>Statement →</button>
                    </div>
                  </div>
                )
              })()}
              <span style={{ color: Colors.textDisabled, fontSize: 18, marginLeft: 4 }}>›</span>
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
