import React from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { Icons } from '../utils/Icons'

export function PurchaseHome({ onNavigate }: { onNavigate: (p: string) => void }) {
  return (
    <div style={{ padding: Spacing.lg }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: Colors.textPrimary, marginBottom: Spacing.lg }}>New Purchase</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: Spacing.md }}>
        <button onClick={() => onNavigate('receipt-scan')} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
          padding: Spacing.xl, borderRadius: BorderRadius.md, border: `1.5px solid ${Colors.border}`,
          background: Colors.surface, cursor: 'pointer',
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.successLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icons.Camera size={22} color={Colors.success} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: Colors.textPrimary }}>Scan Bill</div>
        </button>
        <button onClick={() => onNavigate('billing?type=PURCHASE')} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
          padding: Spacing.xl, borderRadius: BorderRadius.md, border: `1.5px solid ${Colors.border}`,
          background: Colors.surface, cursor: 'pointer',
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.warningLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icons.Edit size={22} color={Colors.warning} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: Colors.textPrimary }}>Manual Entry</div>
        </button>
      </div>
    </div>
  )
}
