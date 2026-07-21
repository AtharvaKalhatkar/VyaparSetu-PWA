import React, { useMemo, useState, useEffect } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import JsBarcode from 'jsbarcode'

export function BarcodePrint({ onBack }: { onBack: () => void }) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [labelSize, setLabelSize] = useState<'small' | 'medium' | 'large'>('medium')
  const items = DB.items.list().filter(i => i.isActive && (i.barcode || i.sku))

  const toggle = (id: string) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const selectAll = () => {
    if (selectedItems.length === items.length) setSelectedItems([])
    else setSelectedItems(items.map(i => i.id))
  }

  const printLabels = () => window.print()

  const dims = labelSize === 'small' ? { width: 180, height: 60, fontSize: 8 } : labelSize === 'large' ? { width: 280, height: 100, fontSize: 13 } : { width: 220, height: 80, fontSize: 11 }

  const selected = useMemo(() => items.filter(i => selectedItems.includes(i.id)), [items, selectedItems])

  useEffect(() => {
    selected.forEach(item => {
      const code = item.barcode || item.sku
      if (code) {
        const svg = document.querySelector(`svg[data-barcode-id="${item.id}"]`) as SVGSVGElement
        if (svg) {
          try {
            JsBarcode(svg, code, {
              format: 'CODE128',
              width: 1.5,
              height: 30,
              displayValue: false,
              margin: 0,
              background: 'transparent',
            })
          } catch { console.error('Barcode generation failed for', item.id, code) }
        }
      }
    })
  }, [selected])

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div className="no-print" style={{ marginBottom: Spacing.md, display: 'flex', gap: Spacing.sm, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={selectAll} style={{ flex: 1, ...s.outlineBtn, padding: '8px 14px', fontSize: 13 }}>
          {selectedItems.length === items.length && items.length > 0 ? 'Deselect All' : `Select All (${items.length})`}
        </button>
        <select value={labelSize} onChange={e => setLabelSize(e.target.value as any)} style={{ ...s.select, width: 100, fontSize: 12 }}>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
        <button onClick={printLabels} disabled={selectedItems.length === 0} style={{ ...s.primaryBtn, width: 'auto', padding: '8px 18px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Icons.Print size={14} /> Print ({selectedItems.length})
        </button>
      </div>

      <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: Spacing.md }}>
        {items.map(item => (
          <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm, padding: '6px 10px', borderRadius: BorderRadius.sm, border: `1px solid ${selectedItems.includes(item.id) ? Colors.primary : Colors.border}`, backgroundColor: selectedItems.includes(item.id) ? Colors.primaryLight : Colors.surface, cursor: 'pointer' }}>
            <input type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => toggle(item.id)} style={{ accentColor: Colors.primary }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: Colors.textPrimary }}>{item.name}</div>
              <div style={{ fontSize: 11, color: Colors.textSecondary }}>{item.sku} · {formatCurrency(item.sellingPrice)}{item.barcode ? ` · ${item.barcode}` : ''}</div>
            </div>
            <div style={{ fontSize: 10, color: Colors.textDisabled }}>{item.unit}</div>
          </label>
        ))}
      </div>

      <div id="barcode-labels" style={{ visibility: 'hidden', position: 'absolute', left: '-9999px', top: '-9999px' }}>
        {selected.map(item => {
          const code = item.barcode || item.sku
          return (
            <div key={item.id} style={{ width: dims.width, height: dims.height, padding: 6, borderBottom: '1px dashed #ccc', boxSizing: 'border-box', overflow: 'hidden', pageBreakInside: 'avoid', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: dims.fontSize, fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
              <div style={{ fontSize: dims.fontSize - 2, color: '#666' }}>{formatCurrency(item.sellingPrice)}</div>
              <svg data-barcode-id={item.id} style={{ display: 'block', margin: '1px auto', maxWidth: '100%' }}></svg>
              <div style={{ fontSize: 8, color: '#999', textAlign: 'center' }}>{code}</div>
            </div>
          )
        })}
      </div>

      <style>{`
        #barcode-labels { visibility: hidden; position: absolute; left: -9999px; top: -9999px; }
        @media print {
          .no-print { display: none !important; }
          body { background: white; margin: 0; padding: 5mm; }
          #barcode-labels {
            visibility: visible !important;
            position: static !important;
            left: auto !important;
            top: auto !important;
            display: flex !important;
            flex-wrap: wrap;
            gap: 2mm;
            justify-content: flex-start;
            align-items: flex-start;
          }
          @page { margin: 5mm; size: auto; }
        }
      `}</style>
    </div>
  )
}
