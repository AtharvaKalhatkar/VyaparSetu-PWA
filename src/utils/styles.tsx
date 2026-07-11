import React from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import type { CSSProperties } from 'react'

const ShadowsSm = { boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)' }
const ShadowsMd = { boxShadow: '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04)' }

export const s = {
  page: { flex: 1, padding: Spacing.lg, paddingBottom: 80 } as CSSProperties,
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.lg, border: `1px solid ${Colors.border}`, ...ShadowsSm, transition: 'box-shadow 0.2s, transform 0.15s', cursor: 'default' } as CSSProperties,
  cardHover: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.lg, border: `1px solid ${Colors.border}`, ...ShadowsMd, transition: 'box-shadow 0.2s, transform 0.15s', cursor: 'pointer' } as CSSProperties,
  row: { display: 'flex', alignItems: 'center' } as CSSProperties,
  spaceBetween: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as CSSProperties,
  input: { width: '100%', padding: '12px 14px', border: `1.5px solid ${Colors.border}`, borderRadius: BorderRadius.sm, fontSize: 14, outline: 'none', boxSizing: 'border-box', backgroundColor: Colors.surface, color: Colors.textPrimary, transition: 'border-color 0.15s', ':focus': { borderColor: Colors.primary } } as CSSProperties,
  select: { width: '100%', padding: '12px 14px', border: `1.5px solid ${Colors.border}`, borderRadius: BorderRadius.sm, fontSize: 14, outline: 'none', boxSizing: 'border-box', backgroundColor: Colors.surface, color: Colors.textPrimary, appearance: 'auto' as const } as CSSProperties,
  textarea: { width: '100%', padding: '12px 14px', border: `1.5px solid ${Colors.border}`, borderRadius: BorderRadius.sm, fontSize: 14, outline: 'none', boxSizing: 'border-box', backgroundColor: Colors.surface, color: Colors.textPrimary, resize: 'vertical' as const, fontFamily: 'inherit' } as CSSProperties,
  label: { display: 'block', fontSize: 13, fontWeight: 500, color: Colors.textSecondary, marginBottom: Spacing.xs } as CSSProperties,
  field: { marginBottom: Spacing.lg } as CSSProperties,
  primaryBtn: { width: '100%', padding: '14px', backgroundColor: Colors.primary, color: Colors.textLight, border: 'none', borderRadius: BorderRadius.sm, fontSize: 15, fontWeight: 600, cursor: 'pointer' } as CSSProperties,
  primaryBtnDisabled: { width: '100%', padding: '14px', backgroundColor: Colors.textDisabled, color: Colors.textLight, border: 'none', borderRadius: BorderRadius.sm, fontSize: 15, fontWeight: 600, cursor: 'not-allowed' } as CSSProperties,
  outlineBtn: { width: '100%', padding: '14px', backgroundColor: 'transparent', color: Colors.primary, border: `1.5px solid ${Colors.primary}`, borderRadius: BorderRadius.sm, fontSize: 15, fontWeight: 600, cursor: 'pointer' } as CSSProperties,
  avatar: (char: string, bg: string) => ({ width: 44, height: 44, borderRadius: 22, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: Colors.textLight, flexShrink: 0 }) as CSSProperties,
  searchBox: { width: '100%', padding: '10px 14px 10px 36px', border: `1.5px solid ${Colors.border}`, borderRadius: BorderRadius.md, fontSize: 14, outline: 'none', boxSizing: 'border-box', backgroundColor: Colors.surface, color: Colors.textPrimary } as CSSProperties,
  badge: (color: string) => ({ fontSize: 10, fontWeight: 700, color, backgroundColor: color + '15', padding: '3px 10px', borderRadius: BorderRadius.xs } as CSSProperties),
  toggleGroup: { display: 'flex', gap: Spacing.sm, marginBottom: Spacing.lg } as CSSProperties,
  toggle: (active: boolean, color: string = Colors.primary) => ({ flex: 1, padding: '10px', border: 'none', borderRadius: BorderRadius.sm, fontWeight: 600, cursor: 'pointer', fontSize: 13, backgroundColor: active ? color : Colors.surfaceVariant, color: active ? Colors.textLight : Colors.textSecondary } as CSSProperties),
  chip: (active: boolean, color: string = Colors.primary) => ({ padding: '6px 14px', border: 'none', borderRadius: BorderRadius.round, fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' as const, backgroundColor: active ? color + '15' : Colors.surfaceVariant, color: active ? color : Colors.textSecondary } as CSSProperties),
  listItem: { display: 'flex', alignItems: 'stretch', backgroundColor: Colors.surface, borderBottom: `1px solid ${Colors.divider}`, cursor: 'pointer', transition: 'background 0.15s', minHeight: 56 } as CSSProperties,
  listStrip: (color: string) => ({ width: 4, flexShrink: 0, backgroundColor: color } as CSSProperties),
  listBody: { flex: 1, padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2 } as CSSProperties,
}

export const statusColor = (status: string): string => {
  const map: Record<string, string> = { PAID: Colors.success, PENDING: Colors.warning, PARTIAL: Colors.accent, OVERDUE: Colors.error, DRAFT: Colors.textDisabled, NEW: Colors.info, CONTACTED: Colors.warning, QUALIFIED: Colors.success, WON: Colors.success, LOST: Colors.error, NEGOTIATION: Colors.secondary, IN_TRANSIT: Colors.info, DELIVERED: Colors.success, CANCELLED: Colors.error }
  return map[status] || Colors.textSecondary
}

export function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return <div style={s.field}>
    <label style={s.label}>{label}{required && <span style={{ color: Colors.error, marginLeft: 2 }}>*</span>}</label>
    {children}
  </div>
}

export function StepIndicator({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: Spacing.xxl }}>
      {steps.map((label, i) => (
        <React.Fragment key={i}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: i <= current ? Colors.primary : Colors.surfaceVariant, color: i <= current ? Colors.textLight : Colors.textDisabled, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
              {i < current ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: 9, color: i === current ? Colors.primary : Colors.textDisabled, fontWeight: i === current ? 600 : 400, whiteSpace: 'nowrap' }}>{label}</span>
          </div>
          {i < steps.length - 1 && <div style={{ width: 24, height: 2, backgroundColor: i < current ? Colors.primary : Colors.surfaceVariant, margin: '0 2px', marginBottom: 20 }} />}
        </React.Fragment>
      ))}
    </div>
  )
}

export function SectionCard({ title, children, onEdit }: { title: string; children: React.ReactNode; onEdit?: () => void }) {
  return (
    <div style={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.md, border: `1px solid ${Colors.border}`, ...ShadowsSm, marginBottom: Spacing.md, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${Colors.divider}`, backgroundColor: Colors.surfaceVariant }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: Colors.textPrimary }}>{title}</span>
        {onEdit && <button onClick={onEdit} style={{ background: 'none', border: 'none', color: Colors.primary, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  )
}

export function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
      <span style={{ color: Colors.textSecondary }}>{label}</span>
      <span style={{ fontWeight: 500, color: Colors.textPrimary, textAlign: 'right', maxWidth: '60%' }}>{value || '–'}</span>
    </div>
  )
}
