import React, { useState, useMemo, useReducer } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { useDelayedRender, ListSkeleton } from '../utils/smooth'
import { useFuzzySearch } from '../utils/useFuzzySearch'
import { useBatchSelect, BatchActionBar } from '../utils/useBatchSelect'
import { ExportBar } from '../utils/ExportBar'
import * as XLSX from 'xlsx'
import type { Item } from '../types'

export function Inventory({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [search, setSearch] = useState('')
  const [batchMode, setBatchMode] = useState(false)
  const [rev, bumpRev] = useReducer(x => x + 1, 0)
  const ready = useDelayedRender(200)

  const allItems = useMemo(() => DB.items.list(), [rev])
  const filtered = useFuzzySearch(allItems, search, ['name', 'sku'], 5, 500)

  const batch = useBatchSelect(filtered)

  const handleBatchDelete = () => {
    if (!confirm(`Delete ${batch.selectedCount} item(s)? This cannot be undone.`)) return
    batch.selectedIds.forEach(id => DB.items.delete(id))
    batch.clearSelection()
    setBatchMode(false); bumpRev()
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ display: 'flex', gap: Spacing.sm, marginBottom: Spacing.md }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 12, top: 10, display: 'flex', alignItems: 'center', color: Colors.textDisabled }}><Icons.Search size={16} /></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..." style={{ ...s.searchBox, paddingLeft: 36 }} />
        </div>
        <ExportBar title="items"
          xlsData={{ name: 'Items', headers: ['Name', 'SKU', 'Category', 'Stock', 'Unit', 'Purchase Price', 'Selling Price', 'GST Rate'], rows: allItems.map(i => [i.name, i.sku, i.category || '', String(i.currentStock), i.unit, String(i.purchasePrice || 0), String(i.sellingPrice), String(i.gstRate || 0) + '%']) }}
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
          <div style={{ marginBottom: Spacing.md }}><Icons.Inventory size={48} /></div>
          <div style={{ fontSize: 14, marginBottom: Spacing.md }}>No items found</div>
          <button onClick={() => onNavigate('add-item')} style={s.primaryBtn}>Add First Item</button>
        </div>
      ) : (
        filtered.map(item => {
          const stockColor = item.currentStock <= item.minStockLevel ? Colors.error : item.currentStock <= item.minStockLevel * 1.5 ? Colors.warning : Colors.success
          return (
            <div key={item.id} onClick={() => !batchMode && onNavigate('add-item?id=' + item.id)} style={{
              ...s.listItem,
              backgroundColor: batch.isSelected(item.id) ? Colors.primary + '08' : Colors.surface,
            }}
              onMouseEnter={e => !batchMode && (e.currentTarget.style.backgroundColor = Colors.surfaceVariant)}
              onMouseLeave={e => !batchMode && (e.currentTarget.style.backgroundColor = Colors.surface)}>
              {batchMode && (
                <div onClick={e => { e.stopPropagation(); batch.toggle(item.id) }} style={{
                  width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer',
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 4, border: `2px solid ${batch.isSelected(item.id) ? Colors.primary : Colors.border}`,
                    backgroundColor: batch.isSelected(item.id) ? Colors.primary : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                  }}>
                    {batch.isSelected(item.id) && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>}
                  </div>
                </div>
              )}
              <div style={s.listStrip(stockColor)} />
              <div style={s.listBody}>
                <div style={{ ...s.spaceBetween }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: Colors.textPrimary }}>{item.name}</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: Colors.textPrimary }}>{formatCurrency(item.sellingPrice)}</span>
                </div>
                <div style={{ fontSize: 11, color: Colors.textSecondary }}>{item.sku} · {item.unit} · Stock: <span style={{ fontWeight: 600, color: stockColor }}>{item.currentStock}</span></div>
              </div>
            </div>
          )
        })
      )}

      <div style={{ display: 'flex', gap: Spacing.sm, marginTop: Spacing.md }}>
        <button onClick={() => onNavigate('data-export')} style={{ flex: 1, padding: '12px', backgroundColor: Colors.accent + '10', border: `1px solid ${Colors.accent}30`, borderRadius: BorderRadius.sm, fontSize: 13, fontWeight: 500, color: Colors.accent, cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Icons.Download size={16} /> Bulk Import Items
        </button>
        <button onClick={() => onNavigate('barcode-print')} style={{ flex: 1, padding: '12px', backgroundColor: Colors.primary + '10', border: `1px solid ${Colors.primary}30`, borderRadius: BorderRadius.sm, fontSize: 13, fontWeight: 500, color: Colors.primary, cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Icons.Barcode size={16} /> Print Barcode
        </button>
      </div>

      <BatchActionBar
        selectedCount={batch.selectedCount}
        onClear={() => { batch.clearSelection(); setBatchMode(false) }}
        actions={[
          { label: 'Delete', icon: <Icons.Delete size={14} />, onClick: handleBatchDelete, danger: true },
        ]}
      />

      <button data-haptic="8" onClick={() => onNavigate('add-item')} style={{
        position: 'fixed', right: Spacing.lg, bottom: 80, width: 56, height: 56, borderRadius: 28,
        backgroundColor: Colors.primary, color: Colors.textLight, border: 'none', fontSize: 28,
        cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Icons.Add size={28} /></button>
    </div>
  )
}
