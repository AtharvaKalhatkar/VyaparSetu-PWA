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
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

  const InfoIcon = (p: any) => <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill={p.color}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
  const WarnIcon = (p: any) => <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill={p.color}><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
  const colors: Record<string, string> = { success: Colors.success, error: Colors.error, info: Colors.primary, warning: Colors.warning }
  const icons: Record<string, any> = { success: Icons.Check, error: Icons.Delete, info: InfoIcon, warning: WarnIcon }

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div style={{ position: 'fixed', top: 60, left: 0, right: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, pointerEvents: 'none', padding: '0 16px' }}>
        {toasts.map(t => {
          const Icon = icons[t.type]
          return (
            <div key={t.id} style={{
              background: colors[t.type], color: '#fff', borderRadius: BorderRadius.md, padding: '10px 16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 8,
              pointerEvents: 'auto', maxWidth: 400, width: '100%',
              animation: 'toastSlideIn 0.3s ease-out',
            }}>
              <Icon size={16} color="#fff" />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}>{t.message}</span>
              {t.action && <button onClick={() => { t.action!.onClick(); dismiss(t.id) }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>{t.action.label}</button>}
              <button onClick={() => dismiss(t.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: 2, display: 'flex', fontSize: 16, lineHeight: 1 }}>✕</button>
            </div>
          )
        })}
      </div>
      <style>{`@keyframes toastSlideIn { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </ToastCtx.Provider>
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
