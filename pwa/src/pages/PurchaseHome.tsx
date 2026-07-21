import React from 'react'
import { Colors, Spacing, BorderRadius, Shadows } from '../theme'
import { Icons } from '../utils/Icons'

const ArrowRight = (p: { size?: number; color?: string }) => <svg width={p.size || 20} height={p.size || 20} viewBox="0 0 24 24" fill="none" stroke={p.color || 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>

export function PurchaseHome({ onNavigate }: { onNavigate: (p: string) => void }) {
  return (
    <div style={{ padding: Spacing.lg }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: Colors.textPrimary, marginBottom: Spacing.xs }}>New Purchase</div>
      <div style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: Spacing.lg }}>Choose how you want to record this purchase</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: Spacing.md }}>
        <button onClick={() => onNavigate('smart-purchase')} style={{
          display: 'flex', alignItems: 'center', gap: Spacing.lg, padding: Spacing.lg,
          borderRadius: BorderRadius.md, border: `1.5px solid ${Colors.primary}`,
          background: Colors.primaryLight, cursor: 'pointer', textAlign: 'left',
          ...Shadows.sm,
        }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icons.Barcode size={24} color={Colors.textLight} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: Colors.primary, marginBottom: 2 }}>Smart Scan (OCR)</div>
            <div style={{ fontSize: 12, color: Colors.textSecondary, lineHeight: 1.4 }}>Upload a bill photo &mdash; we&rsquo;ll auto-detect items, quantities &amp; prices using AI</div>
          </div>
          <ArrowRight size={20} color={Colors.primary} />
        </button>
        <button onClick={() => onNavigate('receipt-scan')} style={{
          display: 'flex', alignItems: 'center', gap: Spacing.lg, padding: Spacing.lg,
          borderRadius: BorderRadius.md, border: `1.5px solid ${Colors.border}`,
          background: Colors.surface, cursor: 'pointer', textAlign: 'left',
          ...Shadows.sm,
        }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.successLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icons.Camera size={24} color={Colors.success} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: Colors.textPrimary, marginBottom: 2 }}>Quick Scan</div>
            <div style={{ fontSize: 12, color: Colors.textSecondary, lineHeight: 1.4 }}>Take a photo &amp; manually enter items &mdash; fastest way for simple receipts</div>
          </div>
          <ArrowRight size={20} color={Colors.textDisabled} />
        </button>
        <button onClick={() => onNavigate('billing?type=PURCHASE')} style={{
          display: 'flex', alignItems: 'center', gap: Spacing.lg, padding: Spacing.lg,
          borderRadius: BorderRadius.md, border: `1.5px solid ${Colors.border}`,
          background: Colors.surface, cursor: 'pointer', textAlign: 'left',
          ...Shadows.sm,
        }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.warningLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icons.Edit size={24} color={Colors.warning} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: Colors.textPrimary, marginBottom: 2 }}>Manual Entry</div>
            <div style={{ fontSize: 12, color: Colors.textSecondary, lineHeight: 1.4 }}>Full invoice form with product search &mdash; best for complex bills</div>
          </div>
          <ArrowRight size={20} color={Colors.textDisabled} />
        </button>
      </div>
    </div>
  )
}
