import { useEffect, useState } from 'react'

interface Shortcut {
  key: string
  ctrl?: boolean
  meta?: boolean
  label: string
  action: () => void
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        if (e.key === 'Escape') (e.target as HTMLElement).blur()
        return
      }
      for (const s of shortcuts) {
        const matchCtrl = s.ctrl ? e.ctrlKey || e.metaKey : true
        const matchMeta = s.meta ? e.metaKey : true
        if (e.key.toLowerCase() === s.key.toLowerCase() && matchCtrl && matchMeta) {
          e.preventDefault()
          s.action()
          return
        }
      }
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        setShowHelp(s => !s)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [shortcuts])

  const helpOverlay = showHelp ? (
    <div onClick={() => setShowHelp(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: 12, padding: '24px 20px', maxWidth: 300, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Keyboard Shortcuts</div>
        {shortcuts.map((s, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ color: '#333' }}>{s.label}</span>
            <kbd style={{ backgroundColor: '#f0f0f0', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace' }}>
              {s.ctrl && 'Ctrl+'}{s.key === ' ' ? 'Space' : s.key}
            </kbd>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
          <span style={{ color: '#333' }}>Show this help</span>
          <kbd style={{ backgroundColor: '#f0f0f0', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace' }}>?</kbd>
        </div>
        <button onClick={() => setShowHelp(false)} style={{ width: '100%', padding: '10px', marginTop: 16, backgroundColor: '#2B5DC2', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Close</button>
      </div>
    </div>
  ) : null

  return { showHelp, setShowHelp, helpOverlay }
}
