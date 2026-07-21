import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency } from '../utils/formatting'
import { Icons } from '../utils/Icons'

export function OnlineStore() {
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('All')
  const items = DB.items.list().filter(i => i.isActive && i.currentStock > 0)
  const categories = ['All', ...new Set(items.map(i => i.category).filter((c): c is string => !!c))]
  const filtered = items.filter(i => {
    if (search && !i.name.toLowerCase().includes(search.toLowerCase()) && !i.sku.toLowerCase().includes(search.toLowerCase())) return false
    if (cat !== 'All' && i.category !== cat) return false
    return true
  })

  const shareCatalog = () => {
    const msg = `🛍️ *Catalog*\n\n${filtered.map(i => `• ${i.name} — ${formatCurrency(i.sellingPrice)}${i.mrp ? ` (MRP: ${formatCurrency(i.mrp)})` : ''}`).join('\n')}\n\nSent via Vyapar Setu`
    if (navigator.share) {
      navigator.share({ title: 'Product Catalog', text: msg }).catch(() => { window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank') })
    } else {
      navigator.clipboard.writeText(msg).then(() => alert('Catalog copied to clipboard!')).catch(() => {
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
      })
    }
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ position: 'relative', marginBottom: Spacing.md }}>
        <span style={{ position: 'absolute', left: 12, top: 10, display: 'flex', alignItems: 'center', color: Colors.textDisabled }}><Icons.Search size={16} /></span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search catalog..." style={{ ...s.searchBox, paddingLeft: 36 }} />
      </div>

      {categories.length > 1 && (
        <div style={{ display: 'flex', gap: 6, overflow: 'auto', paddingBottom: Spacing.sm, marginBottom: Spacing.md }}>
          {categories.map(c => (
            <button key={c} onClick={() => setCat(c)} style={s.chip(cat === c, Colors.primary)}>{c}</button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: Spacing.huge, color: Colors.textDisabled }}>
          <Icons.Inventory size={48} />
          <div style={{ marginTop: Spacing.sm }}>No items in catalog</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Add items with stock to share with customers</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: Spacing.sm, marginBottom: Spacing.lg }}>
            {filtered.map(item => (
              <div key={item.id} style={{
                backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: '12px',
                border: `1px solid ${Colors.border}`, display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                <div style={{
                  width: '100%', height: 80, borderRadius: 8, backgroundColor: Colors.primaryLight + '50',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: Colors.primary,
                }}>{item.name[0]}</div>
                <div style={{ fontWeight: 600, fontSize: 13, color: Colors.textPrimary, lineHeight: 1.2 }}>{item.name}</div>
                <div style={{ fontSize: 11, color: Colors.textSecondary }}>{item.sku}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 16, color: Colors.textPrimary }}>{formatCurrency(item.sellingPrice)}</span>
                  {item.mrp && item.mrp > item.sellingPrice && (
                    <span style={{ fontSize: 11, color: Colors.textDisabled, textDecoration: 'line-through' }}>{formatCurrency(item.mrp)}</span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: Colors.textSecondary }}>Stock: {item.currentStock} {item.unit}</div>
              </div>
            ))}
          </div>

          <button onClick={shareCatalog} style={{ ...s.primaryBtn, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icons.WhatsApp size={18} /> Share Catalog
          </button>
        </>
      )}
    </div>
  )
}
