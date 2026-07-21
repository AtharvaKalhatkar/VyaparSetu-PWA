import React, { useState, useMemo, useReducer } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { ExportBar } from '../utils/ExportBar'

export function StockSummary() {
  const [filter, setFilter] = useState<'ALL' | 'LOW' | 'ZERO'>('ALL')
  const [search, setSearch] = useState('')
  const [rev] = useReducer(x => x + 1, 0)

  const allItems = useMemo(() => DB.items.list(), [rev])

  const filtered = useMemo(() => {
    let list = allItems
    if (filter === 'LOW') list = list.filter(i => i.currentStock <= i.minStockLevel)
    if (filter === 'ZERO') list = list.filter(i => i.currentStock === 0)
    if (search) list = list.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase()))
    return list
  }, [allItems, filter, search])

  const totalStockQty = allItems.reduce((s, i) => s + i.currentStock, 0)
  const totalCostValue = allItems.reduce((s, i) => s + i.currentStock * (i.purchasePrice || 0), 0)
  const totalSellingValue = allItems.reduce((s, i) => s + i.currentStock * i.sellingPrice, 0)
  const lowStockCount = allItems.filter(i => i.currentStock <= i.minStockLevel).length
  const zeroStockCount = allItems.filter(i => i.currentStock === 0).length

  const xlsData = {
    name: 'Stock Summary',
    headers: ['Item', 'SKU', 'Category', 'Stock', 'Min Level', 'Unit', 'Purchase Price', 'Selling Price', 'Cost Value', 'Selling Value', 'Status'],
    rows: allItems.map(i => [
      i.name, i.sku, i.category || '', String(i.currentStock), String(i.minStockLevel), i.unit,
      formatCurrency(i.purchasePrice || 0), formatCurrency(i.sellingPrice),
      formatCurrency(i.currentStock * (i.purchasePrice || 0)),
      formatCurrency(i.currentStock * i.sellingPrice),
      i.currentStock <= i.minStockLevel ? 'Low Stock' : i.currentStock === 0 ? 'Zero Stock' : 'OK',
    ]),
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: Colors.textPrimary }}>Stock Summary</div>
          <div style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 }}>{allItems.length} items</div>
        </div>
        <ExportBar title="stock-summary" xlsData={xlsData} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: Spacing.sm, marginBottom: Spacing.md }}>
        <div style={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: '12px 14px', border: `1px solid ${Colors.border}` }}>
          <div style={{ fontSize: 11, color: Colors.textSecondary }}>Cost Value</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: Colors.textPrimary }}>{formatCurrency(totalCostValue)}</div>
        </div>
        <div style={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: '12px 14px', border: `1px solid ${Colors.border}` }}>
          <div style={{ fontSize: 11, color: Colors.textSecondary }}>Selling Value</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: Colors.primary }}>{formatCurrency(totalSellingValue)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: Spacing.sm, marginBottom: Spacing.md }}>
        <div style={{ textAlign: 'center', padding: '10px', backgroundColor: Colors.surfaceVariant, borderRadius: BorderRadius.sm }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: Colors.textPrimary }}>{totalStockQty}</div>
          <div style={{ fontSize: 10, color: Colors.textSecondary }}>Total Qty</div>
        </div>
        <div style={{ textAlign: 'center', padding: '10px', backgroundColor: Colors.warning + '10', borderRadius: BorderRadius.sm }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: Colors.warning }}>{lowStockCount}</div>
          <div style={{ fontSize: 10, color: Colors.textSecondary }}>Low Stock</div>
        </div>
        <div style={{ textAlign: 'center', padding: '10px', backgroundColor: Colors.errorLight, borderRadius: BorderRadius.sm }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: Colors.error }}>{zeroStockCount}</div>
          <div style={{ fontSize: 10, color: Colors.textSecondary }}>Zero Stock</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: Spacing.md, flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('ALL')} style={s.chip(filter === 'ALL', Colors.primary)}>All Items</button>
        <button onClick={() => setFilter('LOW')} style={s.chip(filter === 'LOW', Colors.warning)}>Low Stock ({lowStockCount})</button>
        <button onClick={() => setFilter('ZERO')} style={s.chip(filter === 'ZERO', Colors.error)}>Zero Stock ({zeroStockCount})</button>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ ...s.searchBox, flex: 1, minWidth: 120, padding: '6px 10px', fontSize: 12, marginLeft: 'auto' }} />
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: Spacing.huge, color: Colors.textDisabled }}>
          <Icons.Inventory size={48} />
          <div style={{ marginTop: Spacing.md }}>No items found</div>
        </div>
      ) : (
        filtered.map(item => {
          const stockColor = item.currentStock <= item.minStockLevel ? Colors.error
            : item.currentStock <= item.minStockLevel * 1.5 ? Colors.warning : Colors.success
          return (
            <div key={item.id} style={{ ...s.listItem }}>
              <div style={s.listStrip(stockColor)} />
              <div style={s.listBody}>
                <div style={{ ...s.spaceBetween }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: Colors.textPrimary }}>{item.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: stockColor }}>{item.currentStock}</span>
                    <span style={{ fontSize: 11, color: Colors.textSecondary }}>{item.unit}</span>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: Colors.textSecondary }}>
                  {item.sku} · Purchase: {formatCurrency(item.purchasePrice || 0)} · Selling: {formatCurrency(item.sellingPrice)}
                  {item.currentStock <= item.minStockLevel && (
                    <span style={{ color: Colors.error, fontWeight: 600 }}> · Min: {item.minStockLevel}</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: Colors.textDisabled }}>
                  Value: {formatCurrency(item.currentStock * (item.purchasePrice || 0))} (cost) / {formatCurrency(item.currentStock * item.sellingPrice)} (sell)
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
