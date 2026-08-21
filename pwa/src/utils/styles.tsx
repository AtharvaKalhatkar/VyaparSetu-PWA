import React from 'react'
import { Colors, Spacing, BorderRadius, Shadows } from '../theme'
import type { CSSProperties } from 'react'

export const s = {
  page: { flex: 1, padding: Spacing.lg, paddingBottom: 80, backgroundColor: Colors.background, minHeight: '100vh' } as CSSProperties,
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.lg, border: `1px solid ${Colors.border}`, ...Shadows.sm, transition: 'box-shadow 0.2s, transform 0.15s', cursor: 'default' } as CSSProperties,
  cardHover: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.lg, border: `1px solid ${Colors.border}`, ...Shadows.md, transition: 'box-shadow 0.2s, transform 0.15s', cursor: 'pointer' } as CSSProperties,
  row: { display: 'flex', alignItems: 'center' } as CSSProperties,
  spaceBetween: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as CSSProperties,
  input: { width: '100%', height: 44, padding: '0 14px', border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.md, fontSize: 14, outline: 'none', boxSizing: 'border-box', backgroundColor: Colors.background, color: Colors.textPrimary, transition: 'border-color 0.15s', fontVariantNumeric: 'tabular-nums' } as CSSProperties,
  select: { width: '100%', height: 44, padding: '0 14px', border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.md, fontSize: 14, outline: 'none', boxSizing: 'border-box', backgroundColor: Colors.background, color: Colors.textPrimary, appearance: 'auto' as const } as CSSProperties,
  textarea: { width: '100%', padding: '12px 14px', border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.md, fontSize: 14, outline: 'none', boxSizing: 'border-box', backgroundColor: Colors.background, color: Colors.textPrimary, resize: 'vertical' as const, fontFamily: 'inherit' } as CSSProperties,
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: Colors.textSecondary, marginBottom: Spacing.xs } as CSSProperties,
  field: { marginBottom: Spacing.lg } as CSSProperties,
  primaryBtn: { width: '100%', height: 44, backgroundColor: Colors.primary, color: Colors.textLight, border: 'none', borderRadius: BorderRadius.md, fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, ...Shadows.sm } as CSSProperties,
  primaryBtnDisabled: { width: '100%', height: 44, backgroundColor: Colors.borderStrong, color: Colors.textMuted, border: 'none', borderRadius: BorderRadius.md, fontSize: 15, fontWeight: 700, cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 } as CSSProperties,
  outlineBtn: { width: '100%', height: 44, backgroundColor: 'transparent', color: Colors.primary, border: `1px solid ${Colors.primary}`, borderRadius: BorderRadius.md, fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 } as CSSProperties,
  avatar: (char: string, bg: string) => ({ width: 44, height: 44, borderRadius: 22, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: Colors.textLight, flexShrink: 0 }) as CSSProperties,
  searchBox: { width: '100%', height: 44, padding: '0 14px 0 38px', border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.md, fontSize: 14, outline: 'none', boxSizing: 'border-box', backgroundColor: Colors.background, color: Colors.textPrimary } as CSSProperties,
  badge: (color: string, bg?: string) => ({ fontSize: 11, fontWeight: 700, color, backgroundColor: bg || (color + '15'), padding: '4px 10px', borderRadius: BorderRadius.round, display: 'inline-flex', alignItems: 'center', gap: 5, letterSpacing: '0.02em', textTransform: 'uppercase' as const } as CSSProperties),
  toggleGroup: { display: 'flex', gap: Spacing.sm, marginBottom: Spacing.lg } as CSSProperties,
  toggle: (active: boolean, color: string = Colors.primary) => ({ flex: 1, height: 40, border: 'none', borderRadius: BorderRadius.md, fontWeight: 700, cursor: 'pointer', fontSize: 13, backgroundColor: active ? color : Colors.surfaceVariant, color: active ? Colors.textLight : Colors.textSecondary } as CSSProperties),
  chip: (active: boolean, color: string = Colors.primary) => ({ padding: '6px 14px', border: 'none', borderRadius: BorderRadius.round, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const, backgroundColor: active ? Colors.primaryLight : Colors.surfaceVariant, color: active ? Colors.primary : Colors.textSecondary } as CSSProperties),
  listItem: { display: 'flex', alignItems: 'stretch', backgroundColor: Colors.surface, borderBottom: `1px solid ${Colors.border}`, cursor: 'pointer', transition: 'background 0.15s', minHeight: 56 } as CSSProperties,
  listStrip: (color: string) => ({ width: 4, flexShrink: 0, backgroundColor: color } as CSSProperties),
  listBody: { flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2 } as CSSProperties,
}

export const statusColor = (status: string): string => {
  const map: Record<string, string> = {
    PAID: Colors.success,
    PENDING: Colors.warning,
    PARTIAL: Colors.warning,
    UNPAID: Colors.danger,
    OVERDUE: Colors.danger,
    DRAFT: Colors.textMuted,
    NEW: Colors.info,
    DELIVERED: Colors.success,
    CANCELLED: Colors.danger,
  }
  return map[status] || Colors.textSecondary
}

export const statusColorObj = (status: string): { color: string; bg: string } => {
  const map: Record<string, { color: string; bg: string }> = {
    PAID: { color: Colors.success, bg: Colors.successBg },
    PENDING: { color: Colors.warning, bg: Colors.warningBg },
    PARTIAL: { color: Colors.warning, bg: Colors.warningBg },
    UNPAID: { color: Colors.danger, bg: Colors.dangerBg },
    OVERDUE: { color: Colors.danger, bg: Colors.dangerBg },
    DRAFT: { color: Colors.textMuted, bg: Colors.border },
    NEW: { color: Colors.info, bg: Colors.infoBg },
    DELIVERED: { color: Colors.success, bg: Colors.successBg },
    CANCELLED: { color: Colors.danger, bg: Colors.dangerBg },
  }
  return map[status] || { color: Colors.textSecondary, bg: Colors.surfaceVariant }
}

export function StatusBadge({ status }: { status: string }) {
  const { color, bg } = statusColorObj(status)
  return (
    <span style={s.badge(color, bg)}>
      <span style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
      {status}
    </span>
  )
}

export function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return <div style={s.field}>
    <label style={s.label}>{label}{required && <span style={{ color: Colors.danger, marginLeft: 2 }}>*</span>}</label>
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
            <span style={{ fontSize: 10, color: i === current ? Colors.primary : Colors.textDisabled, fontWeight: i === current ? 700 : 500, whiteSpace: 'nowrap' }}>{label}</span>
          </div>
          {i < steps.length - 1 && <div style={{ width: 24, height: 2, backgroundColor: i < current ? Colors.primary : Colors.surfaceVariant, margin: '0 2px', marginBottom: 20 }} />}
        </React.Fragment>
      ))}
    </div>
  )
}

export function SectionCard({ title, children, onEdit }: { title: string; children: React.ReactNode; onEdit?: () => void }) {
  return (
    <div style={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.md, border: `1px solid ${Colors.border}`, ...Shadows.sm, marginBottom: Spacing.md, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${Colors.divider}`, backgroundColor: Colors.background }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: Colors.textPrimary }}>{title}</span>
        {onEdit && <button onClick={onEdit} style={{ background: 'none', border: 'none', color: Colors.primary, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Edit</button>}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  )
}

export function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
      <span style={{ color: Colors.textSecondary }}>{label}</span>
      <span style={{ fontWeight: 600, color: Colors.textPrimary, textAlign: 'right', maxWidth: '60%' }}>{value || '–'}</span>
    </div>
  )
}
