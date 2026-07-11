import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius, Shadows } from '../theme'
import { s } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, formatDate, generateId, todayISO } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { useToast } from '../utils/smooth'
import type { Item } from '../types'

export function ManufacturingPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  const { toast } = useToast()
  const [productId, setProductId] = useState('')
  const [qty, setQty] = useState('1')
  const [notes, setNotes] = useState('')
  const [tab, setTab] = useState<'produce' | 'history'>('produce')

  const allItems = DB.items.list().filter(i => i.isActive)
  const productions = [...DB.productions.list()].sort((a, b) => b.date.localeCompare(a.date))

  const selected = allItems.find(i => i.id === productId)

  const bomItems = allItems.filter(i => i.category === 'Raw Material' || (i.id !== productId))

  const handleProduce = () => {
    if (!productId || !qty || parseFloat(qty) <= 0) return
    const product = allItems.find(i => i.id === productId)
    if (!product) return

    const components = selected?.units?.filter(u => u.unitId !== 'main')?.map(u => ({
      itemId: u.unitId, itemName: u.unitName, quantityUsed: u.conversionRate * parseFloat(qty), unit: 'Pcs'
    })) || []

    const batch: any = {
      id: generateId(), productId, productName: product.name, productUnit: product.unit,
      quantity: parseFloat(qty), components, date: todayISO(), notes: notes.trim() || undefined,
    }
    DB.productions.save(batch)

    product.currentStock += parseFloat(qty)
    DB.items.save(product)

    components.forEach(c => {
      const comp = DB.items.byId(c.itemId)
      if (comp) {
        comp.currentStock = Math.max(0, comp.currentStock - c.quantityUsed)
        DB.items.save(comp)
      }
    })

    toast(`Produced ${qty} ${product.unit}(s) of ${product.name}`, 'success')
    setProductId(''); setQty('1'); setNotes('')
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ display: 'flex', gap: Spacing.sm, marginBottom: Spacing.lg }}>
        <button onClick={() => setTab('produce')} style={s.toggle(tab === 'produce', '#7C3AED')}>Produce</button>
        <button onClick={() => setTab('history')} style={s.toggle(tab === 'history', '#7C3AED')}>History</button>
      </div>

      {tab === 'produce' ? (
        <>
          <div style={{ backgroundColor: '#7C3AED10', borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.lg, border: '1px solid #7C3AED20' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#7C3AED', marginBottom: Spacing.xs }}>How it works</div>
            <div style={{ fontSize: 11, color: Colors.textSecondary, lineHeight: 1.5 }}>
              Select a finished product → enter quantity → raw materials are auto-deducted from stock → finished goods are added.
              {selected?.units && selected.units.length > 0 && ' Uses the multi-unit BOM defined on this item.'}
            </div>
          </div>

          <div style={{ marginBottom: Spacing.md }}>
            <label style={s.label}>Finished Product</label>
            <select value={productId} onChange={e => setProductId(e.target.value)} style={s.select}>
              <option value="">Select product...</option>
              {allItems.filter(i => i.currentStock >= 0).map(i => (
                <option key={i.id} value={i.id}>{i.name} ({i.unit}) — Stock: {i.currentStock}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: Spacing.sm, alignItems: 'flex-end', marginBottom: Spacing.lg }}>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Quantity to Produce</label>
              <input type="number" value={qty} onChange={e => setQty(e.target.value)} min="1" style={s.input} />
            </div>
            {selected && <div style={{ fontSize: 13, color: Colors.textSecondary, paddingBottom: 12 }}>{selected.unit}(s)</div>}
          </div>

          <div style={{ marginBottom: Spacing.lg }}>
            <label style={s.label}>Notes (optional)</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Batch notes..." style={s.input} />
          </div>

          {selected && (
            <div style={{ ...s.card, marginBottom: Spacing.lg, backgroundColor: Colors.infoLight, borderColor: Colors.info + '30' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: Colors.textPrimary, marginBottom: Spacing.sm }}>Production Summary</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: Colors.textSecondary }}>Product</span>
                <span style={{ fontWeight: 600 }}>{selected.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: Colors.textSecondary }}>Quantity</span>
                <span style={{ fontWeight: 600 }}>{qty} {selected.unit}(s)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: Colors.textSecondary }}>Current Stock</span>
                <span style={{ fontWeight: 600 }}>{selected.currentStock} → {selected.currentStock + parseFloat(qty || '0')} {selected.unit}</span>
              </div>
            </div>
          )}

          <button onClick={handleProduce} disabled={!productId || !qty} style={{ ...(!productId || !qty ? s.primaryBtnDisabled : s.primaryBtn) }}>
            <Icons.Transfer size={16} /> Produce {qty || '0'} Unit(s)
          </button>
        </>
      ) : (
        <>
          {productions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: Spacing.huge, color: Colors.textDisabled }}>
              <Icons.Transfer size={48} style={{ marginBottom: Spacing.md, opacity: 0.4 }} />
              <div>No production history</div>
            </div>
          ) : productions.map(p => (
            <div key={p.id} style={{ ...s.card, marginBottom: Spacing.sm }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: Spacing.xs }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: Colors.textPrimary }}>{p.productName}</span>
                <span style={{ fontWeight: 700, fontSize: 16, color: '#7C3AED' }}>+{p.quantity} {p.productUnit}</span>
              </div>
              <div style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.sm }}>{formatDate(p.date)}{p.notes ? ` · ${p.notes}` : ''}</div>
              {p.components.length > 0 && (
                <div style={{ fontSize: 11, color: Colors.textDisabled }}>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>Components used:</div>
                  {p.components.map((c, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                      <span>{c.itemName}</span>
                      <span style={{ color: Colors.error }}>-{c.quantityUsed} {c.unit}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
