import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { Icons } from './Icons'

/* ── Toast System ── */
interface Toast { id: number; message: string; type: 'success' | 'error' | 'info' | 'warning'; action?: { label: string; onClick: () => void } }

const ToastCtx = createContext<{ toast: (msg: string, type?: Toast['type'], action?: Toast['action']) => void }>({ toast: () => {} })
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  const toast = useCallback((message: string, type: Toast['type'] = 'info', action?: Toast['action']) => {
    const id = ++idRef.current
    setToasts(prev => [...prev, { id, message, type, action }])
    try { navigator.vibrate?.(15) } catch {}
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200)
  }, [])

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

  const InfoIcon = (p: any) => <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none" stroke={p.color || 'currentColor'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
  const WarnIcon = (p: any) => <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none" stroke={p.color || 'currentColor'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  const colors: Record<string, string> = { success: '#059669', error: '#DC2626', info: '#2563EB', warning: '#D97706' }
  const bgBorders: Record<string, string> = { success: '#10B981', error: '#EF4444', info: '#3B82F6', warning: '#F59E0B' }
  const icons: Record<string, any> = { success: Icons.Check, error: Icons.Delete, info: InfoIcon, warning: WarnIcon }

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div style={{ position: 'fixed', top: 20, left: 0, right: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, pointerEvents: 'none', padding: '0 16px' }}>
        {toasts.map(t => {
          const Icon = icons[t.type]
          const borderCol = bgBorders[t.type]
          return (
            <div key={t.id} style={{
              background: '#0F172A', color: '#F8FAFC', borderRadius: 12, padding: '12px 18px',
              borderLeft: `5px solid ${borderCol}`,
              boxShadow: '0 10px 30px rgba(15,23,42,0.35), 0 2px 6px rgba(0,0,0,0.1)',
              display: 'flex', alignItems: 'center', gap: 12,
              pointerEvents: 'auto', maxWidth: 440, width: '100%',
              animation: 'toastSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: borderCol + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={16} color={borderCol} />
              </div>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, lineHeight: 1.4, color: '#F8FAFC' }}>{t.message}</span>
              {t.action && <button onClick={() => { t.action!.onClick(); dismiss(t.id) }} style={{ background: borderCol, border: 'none', color: '#fff', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>{t.action.label}</button>}
              <button onClick={() => dismiss(t.id)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4, display: 'flex', fontSize: 14, lineHeight: 1 }}>✕</button>
            </div>
          )
        })}
      </div>
      <style>{`@keyframes toastSlideDown { from { transform: translateY(-24px) scale(0.96); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }`}</style>
    </ToastCtx.Provider>
  )
}

/* ── Executive Success Card View Component ── */
export function SuccessCard({
  title,
  subtitle,
  details,
  primaryAction,
  secondaryAction,
}: {
  title: string
  subtitle?: string
  details?: { label: string; value: string }[]
  primaryAction?: { label: string; onClick: () => void; icon?: React.ReactNode }
  secondaryAction?: { label: string; onClick: () => void; icon?: React.ReactNode }
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '65vh', padding: '24px 16px', textAlign: 'center',
      animation: 'successPop 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <style>{`
        @keyframes successPop { from { opacity: 0; transform: scale(0.92) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes pulseRing { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { transform: scale(1); box-shadow: 0 0 0 16px rgba(16, 185, 129, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
      `}</style>

      {/* Animated Dual Ring Checkmark */}
      <div style={{
        width: 88, height: 88, borderRadius: 44,
        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20, boxShadow: '0 10px 25px rgba(5, 150, 105, 0.35)',
        animation: 'pulseRing 2s infinite', position: 'relative',
      }}>
        <div style={{ width: 72, height: 72, borderRadius: 36, border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icons.Check size={44} color="#FFFFFF" />
        </div>
      </div>

      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 8px', letterSpacing: '-0.4px' }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 20px', maxWidth: 360, lineHeight: 1.5 }}>{subtitle}</p>}

      {/* Optional Details Chips Grid */}
      {details && details.length > 0 && (
        <div style={{
          backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12,
          padding: '12px 18px', marginBottom: 24, width: '100%', maxWidth: 380,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {details.map((d, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
              <span style={{ color: '#64748B', fontWeight: 500 }}>{d.label}</span>
              <span style={{ color: '#0F172A', fontWeight: 700 }}>{d.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 380, flexWrap: 'wrap' }}>
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            style={{
              flex: 1, minWidth: 140, padding: '14px 18px', borderRadius: 10,
              backgroundColor: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.15s ease',
            }}
          >
            {secondaryAction.icon}
            {secondaryAction.label}
          </button>
        )}
        {primaryAction && (
          <button
            onClick={primaryAction.onClick}
            style={{
              flex: 1, minWidth: 140, padding: '14px 18px', borderRadius: 10,
              background: 'linear-gradient(135deg, #1E40AF 0%, #1D4ED8 100%)',
              color: '#FFFFFF', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 14px rgba(30,64,175,0.3)', transition: 'all 0.15s ease',
            }}
          >
            {primaryAction.icon}
            {primaryAction.label}
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Ripple Button ── */
export function RippleBtn({ children, onClick, style, disabled }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties; disabled?: boolean }) {
  const btnRef = useRef<HTMLButtonElement>(null)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    const btn = e.currentTarget
    const rect = btn.getBoundingClientRect()
    const ripple = document.createElement('span')
    const size = Math.max(rect.width, rect.height)
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2
    ripple.style.cssText = `position:absolute;width:${size}px;height:${size}px;left:${x}px;top:${y}px;border-radius:50%;background:rgba(255,255,255,0.3);transform:scale(0);animation:rippleAnim 0.5s ease-out;pointer-events:none;`
    btn.appendChild(ripple)
    setTimeout(() => ripple.remove(), 500)
    onClick?.()
  }

  return (
    <button ref={btnRef} onClick={handleClick} disabled={disabled} style={{ position: 'relative', overflow: 'hidden', ...style } as any}>
      {children}
      <style>{`@keyframes rippleAnim { to { transform:scale(2.5);opacity:0 } }`}</style>
    </button>
  )
}

/* ── Page Transition Hook ── */
export function usePageTransition() {
  const [navDir, setNavDir] = useState<'forward' | 'back'>('forward')

  const navigate = useCallback((go: (p: string) => void, p: string) => {
    setNavDir('forward')
    go(p)
  }, [])

  const goBack = useCallback((go: () => void) => {
    setNavDir('back')
    go()
  }, [])

  return { navDir, navigate, goBack }
}

/* ── Staggered Entrance ── */
export function StaggerList({ children, baseDelay = 50 }: { children: React.ReactNode[]; baseDelay?: number }) {
  return (
    <>
      {children.map((child, i) => (
        <div key={i} style={{ animation: `staggerIn 0.35s ease-out ${i * baseDelay}ms both` }}>
          {child}
          <style>{`@keyframes staggerIn { from { opacity:0;transform:translateY(12px) } to { opacity:1;transform:translateY(0) } }`}</style>
        </div>
      ))}
    </>
  )
}

/* ── Bottom Sheet ── */
export function BottomSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200,
        animation: 'bsFadeIn 0.2s ease-out',
      }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201,
        backgroundColor: Colors.surface, borderRadius: '16px 16px 0 0', maxHeight: '75vh',
        display: 'flex', flexDirection: 'column',
        animation: 'bsSlideUp 0.3s ease-out',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${Colors.divider}`, flexShrink: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: Colors.textPrimary }}>{title || ''}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: Colors.textDisabled, cursor: 'pointer', padding: 4, display: 'flex' }}><Icons.Close size={20} /></button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
          {children}
        </div>
      </div>
      <style>{`
        @keyframes bsFadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes bsSlideUp { from { transform:translateY(100%) } to { transform:translateY(0) } }
      `}</style>
    </>
  )
}

/* ── Skeleton / Shimmer ── */
export function Skeleton({ width = '100%', height = 14, borderRadius = 6, style }: { width?: string | number; height?: string | number; borderRadius?: number; style?: React.CSSProperties }) {
  return (
    <div style={{
      width, height, borderRadius,
      background: `linear-gradient(90deg, ${Colors.skelton} 25%, #f0f0f0 50%, ${Colors.skelton} 75%)`,
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s ease-in-out infinite',
      ...style,
    }}>
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
    </div>
  )
}

/* ── List Skeleton ── */
/* ── Bottom Sheet Select ── */
interface SelectOption { value: string; label: string; sublabel?: string; }
export function SelectSheet({ open, onClose, options, onSelect, title, searchable }: { open: boolean; onClose: () => void; options: SelectOption[]; onSelect: (value: string) => void; title?: string; searchable?: boolean }) {
  const [q, setQ] = useState('')
  const filtered = searchable && q ? options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()) || o.sublabel?.toLowerCase().includes(q.toLowerCase())) : options
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      {searchable && (
        <div style={{ padding: '0 16px 8px' }}>
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search..." style={{
            width: '100%', padding: '10px 12px', border: `1.5px solid ${Colors.border}`, borderRadius: BorderRadius.sm,
            fontSize: 14, outline: 'none', boxSizing: 'border-box', backgroundColor: Colors.surfaceVariant, color: Colors.textPrimary,
          }} />
        </div>
      )}
      {filtered.length === 0 && <div style={{ padding: '24px 16px', textAlign: 'center', color: Colors.textDisabled, fontSize: 13 }}>No options found</div>}
      {filtered.map(opt => (
        <button key={opt.value} onClick={() => { onSelect(opt.value); onClose() }} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, width: '100%', padding: '12px 16px',
          border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: Colors.textPrimary, textAlign: 'left',
          borderBottom: `1px solid ${Colors.divider}`,
        }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = Colors.surfaceVariant}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
          <span style={{ fontWeight: 500 }}>{opt.label}</span>
          {opt.sublabel && <span style={{ fontSize: 11, color: Colors.textSecondary }}>{opt.sublabel}</span>}
        </button>
      ))}
    </BottomSheet>
  )
}

/* ── Loadable (skeleton then reveal) ── */
export function useDelayedRender(delay = 300) {
  const [ready, setReady] = useState(false)
  useEffect(() => { const t = setTimeout(() => setReady(true), delay); return () => clearTimeout(t) }, [delay])
  return ready
}

export function Loadable({ loading, skeleton, children }: { loading: boolean; skeleton: React.ReactNode; children: React.ReactNode }) {
  if (loading) return <>{skeleton}</>
  return <>{children}</>
}

export function ListSkeleton({ count = 5, height = 72 }: { count?: number; height?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, border: `1px solid ${Colors.border}` }}>
          <Skeleton width={40} height={40} borderRadius={10} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Skeleton width="60%" height={14} />
            <Skeleton width="40%" height={11} />
          </div>
          <Skeleton width={70} height={16} borderRadius={4} />
        </div>
      ))}
    </div>
  )
}
