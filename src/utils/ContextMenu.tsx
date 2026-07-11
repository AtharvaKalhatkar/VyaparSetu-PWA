import React, { useState, useRef, useEffect } from 'react'
import { Colors } from '../theme'

export interface MenuItem {
  label?: string; icon?: React.ReactNode; onClick?: () => void; color?: string; danger?: boolean; divider?: boolean
}

export function ContextMenu({ trigger, items, align = 'right' }: { trigger: React.ReactNode; items: MenuItem[]; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <div onClick={(e) => { e.stopPropagation(); setOpen(!open) }} style={{ display: 'inline-flex', cursor: 'pointer' }}>
        {trigger}
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', ...(align === 'right' ? { right: 0 } : { left: 0 }),
          marginTop: 4, minWidth: 180, backgroundColor: '#fff', borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 200, overflow: 'hidden', padding: '4px 0',
        }}>
          {items.map((item, i) => (
            <div key={i}>
              {item.divider && <div style={{ height: 1, backgroundColor: Colors.divider, margin: '4px 8px' }} />}
              {!item.divider && (
                <div onClick={(e) => { e.stopPropagation(); setOpen(false); item.onClick?.() }} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer',
                  fontSize: 13, fontWeight: 500, color: item.danger ? Colors.error : item.color || Colors.textPrimary,
                  transition: 'background 0.1s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = Colors.surfaceVariant)}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  {item.icon && <span style={{ display: 'flex', fontSize: 16, opacity: 0.8 }}>{item.icon}</span>}
                  {item.label}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function useDefaultShareOption() {
  const [defaultOption, setDefaultOption] = React.useState(() => localStorage.getItem('vs_defaultShareOption') || 'pdf')
  const saveDefault = (key: string) => {
    localStorage.setItem('vs_defaultShareOption', key)
    setDefaultOption(key)
  }
  return { defaultOption, saveDefault }
}
