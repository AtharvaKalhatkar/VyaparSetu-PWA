import React from 'react'
import { Colors, Spacing, BorderRadius, Shadows } from '../theme'
import { DB } from '../utils/storage'
import { Icons } from '../utils/Icons'
import type { InvoiceTemplate } from '../types'

const THEMES: { key: InvoiceTemplate; label: string; desc: string; colors: string[]; features: string[] }[] = [
  { key: 'STANDARD', label: 'Standard', desc: 'Clean professional layout with green header, ideal for daily business', colors: ['#1B5E20', '#fff', '#333'], features: ['Company header', 'Qty/Rate table', 'GST column', 'Bank details', 'Signature'] },
  { key: 'COMPACT', label: 'Compact', desc: 'Space-efficient design — fits maximum items per page', colors: ['#1B5E20', '#f5f5f5', '#333'], features: ['Dotted separator', 'Compact rows', 'Minimal', 'More items/page', 'Print friendly'] },
  { key: 'DETAILED', label: 'Detailed Tax', desc: 'Full GST compliance with CGST/SGST breakdown, HSN codes', colors: ['#1B5E20', '#f5f5f5', '#333'], features: ['HSN/SAC column', 'CGST + SGST', 'Taxable value', 'Double border', 'GST summary'] },
  { key: 'CLASSIC', label: 'Classic', desc: 'Traditional navy-and-cream design with serif font — old ledger feel', colors: ['#1a237e', '#faf5e8', '#333'], features: ['Navy header', 'Double border', 'Serif style', 'Traditional', 'Legal look'] },
  { key: 'MODERN', label: 'Modern', desc: 'Minimalist grayscale with clean lines, uppercase labels, premium feel', colors: ['#333', '#fafafa', '#999'], features: ['Minimal design', 'Uppercase labels', 'Gray accents', 'Side client card', 'Clean typography'] },
  { key: 'PREMIUM', label: 'Premium', desc: 'Luxury dark header with gold accents, alternating rows, sophisticated', colors: ['#1a1a2e', '#b8860b', '#faf6f0'], features: ['Dark header', 'Gold accents', 'Zebra rows', 'Premium paper', 'Elegant finish'] },
  { key: 'ELEGANT', label: 'Elegant', desc: 'Soft blush tones with rounded corners, floral accents — warm & inviting', colors: ['#d4a574', '#fdf6f0', '#5d4037'], features: ['Warm palette', 'Rounded cards', 'Elegant font', 'Soft accents', 'Inviting feel'] },
  { key: 'BOLD', label: 'Bold', desc: 'High-contrast orange-black design with thick borders — eye-catching', colors: ['#e65100', '#fff3e0', '#212121'], features: ['Orange accent', 'Thick borders', 'High contrast', 'Modern bold', 'Attention grabber'] },
  { key: 'NATURE', label: 'Nature', desc: 'Earthy green tones with leaf-green accents, fresh & organic feel', colors: ['#2e7d32', '#f1f8e9', '#33691e'], features: ['Green palette', 'Organic feel', 'Earthy tones', 'Fresh design', 'Natural finish'] },
  { key: 'OCEAN', label: 'Ocean', desc: 'Deep blue wave theme with teal accents, calming & professional', colors: ['#01579b', '#e1f5fe', '#006064'], features: ['Ocean blues', 'Teal accents', 'Calming look', 'Wave motif', 'Professional'] },
  { key: 'SUNSET', label: 'Sunset', desc: 'Vibrant purple-to-orange gradient theme — energetic & modern', colors: ['#7b1fa2', '#fce4ec', '#e65100'], features: ['Purple gradient', 'Warm accents', 'Energetic', 'Creative vibe', 'Modern twist'] },
  { key: 'CORPORATE', label: 'Corporate', desc: 'Steel gray and blue business theme with sharp lines — executive grade', colors: ['#37474f', '#eceff1', '#1565c0'], features: ['Corporate gray', 'Blue accents', 'Sharp lines', 'Executive', 'Minimalist'] },
]

export function InvoiceThemeGallery({ onSelect, compact }: { onSelect?: (t: InvoiceTemplate) => void; compact?: boolean }) {
  const current = DB.settings.get().template

  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 600, color: Colors.textPrimary, marginBottom: Spacing.sm }}>
        <Icons.Billing size={16} /> Invoice Themes
      </div>
      <div style={{ fontSize: 11, color: Colors.textSecondary, marginBottom: Spacing.md }}>
        Choose from {THEMES.length} professionally designed invoice templates
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr 1fr 1fr' : '1fr 1fr', gap: Spacing.sm }}>
        {THEMES.map(theme => {
          const active = current === theme.key
          return (
            <div key={theme.key} onClick={() => onSelect?.(theme.key)}
              style={{
                backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: compact ? 10 : 14,
                border: `2px solid ${active ? Colors.primary : 'transparent'}`,
                boxShadow: active ? `0 0 0 2px ${Colors.primary}20` : '0 1px 3px rgba(0,0,0,0.1)',
                cursor: onSelect ? 'pointer' : 'default',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {active && <div style={{ position: 'absolute', top: 4, right: 4, backgroundColor: Colors.primary, color: '#fff', fontSize: 9, padding: '1px 6px', borderRadius: 8, fontWeight: 600 }}>Active</div>}
              <MiniPreview colors={theme.colors} />
              <div style={{ fontSize: compact ? 11 : 13, fontWeight: 600, color: Colors.textPrimary, marginTop: compact ? 4 : 8 }}>{theme.label}</div>
              {!compact && <div style={{ fontSize: 10, color: Colors.textSecondary, marginTop: 2 }}>{theme.desc}</div>}
              {!compact && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 6 }}>
                  {theme.features.map(f => <span key={f} style={{ fontSize: 9, padding: '1px 6px', backgroundColor: Colors.primaryLight + '20', color: Colors.primary, borderRadius: 8 }}>{f}</span>)}
                </div>
              )}
              <div style={{ display: 'flex', gap: 4, marginTop: compact ? 4 : 8 }}>
                {theme.colors.map((cl, i) => <div key={i} style={{ width: compact ? 8 : 14, height: compact ? 8 : 14, borderRadius: '50%', backgroundColor: cl, border: '1px solid rgba(0,0,0,0.1)' }} />)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MiniPreview({ colors }: { colors: string[] }) {
  const [h, b, a] = colors
  return (
    <div style={{ width: '100%', height: 60, backgroundColor: '#fff', borderRadius: 4, overflow: 'hidden', border: '1px solid #eee', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 14, backgroundColor: h, display: 'flex', alignItems: 'center', padding: '0 6px' }}>
        <div style={{ width: 20, height: 4, backgroundColor: '#fff', opacity: 0.7, borderRadius: 2 }} />
      </div>
      <div style={{ flex: 1, padding: '3px 6px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ width: '40%', height: 4, backgroundColor: a, opacity: 0.4, borderRadius: 2 }} />
          <div style={{ width: '20%', height: 4, backgroundColor: a, opacity: 0.4, borderRadius: 2 }} />
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {[40, 15, 15, 20].map((w, i) => <div key={i} style={{ flex: w, height: 3, backgroundColor: b, borderRadius: 1 }} />)}
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {[40, 15, 15, 20].map((w, i) => <div key={i} style={{ flex: w, height: 3, backgroundColor: '#eee', borderRadius: 1 }} />)}
        </div>
        <div style={{ width: '30%', height: 4, backgroundColor: h, borderRadius: 2, alignSelf: 'flex-end', marginTop: 'auto' }} />
      </div>
    </div>
  )
}

export function TEMPLATES_INFO() { return THEMES }
