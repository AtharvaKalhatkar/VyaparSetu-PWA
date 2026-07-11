import React from 'react'
import { Colors, Spacing, BorderRadius, Shadows } from '../theme'
import { s } from '../utils/styles'
import { useAuth } from '../store/auth'
import { Icons } from '../utils/Icons'

export function Settings({ onNavigate, onLogout, isDarkMode, onToggleDarkMode }: { onNavigate: (p: string) => void; onLogout: () => void; isDarkMode?: boolean; onToggleDarkMode?: (v: boolean) => void }) {
  const { userName, businessName } = useAuth()

  const items = [
    { icon: <Icons.Building size={20} />, label: 'Business Profile', desc: businessName, onClick: () => onNavigate('business-profile') },
    { icon: <Icons.Settings size={20} />, label: 'Invoice Settings', desc: 'Prefix, template, terms', onClick: () => onNavigate('invoice-settings') },
    { icon: <Icons.Download size={20} />, label: 'Import / Export', desc: 'Backup, bulk import', onClick: () => onNavigate('data-export') },
    { icon: <Icons.Building size={20} />, label: 'Manage Companies', desc: 'Switch or add companies', onClick: () => onNavigate('companies') },
    { icon: <Icons.Invoice size={20} />, label: 'About', desc: 'v1.0.0', onClick: () => {} },
  ]

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ textAlign: 'center', marginBottom: Spacing.xxl }}>
        <div style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primaryLight + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}><Icons.People size={28} /></div>
        <div style={{ fontWeight: 700, fontSize: 18, color: Colors.textPrimary }}>{userName}</div>
        <div style={{ fontSize: 13, color: Colors.textSecondary }}>{businessName}</div>
      </div>
      {items.map((item, i) => (
        <div key={i} onClick={() => item.onClick()} style={{ ...s.card, ...s.row, marginBottom: Spacing.sm, cursor: 'pointer' }}>
          <span style={{ marginRight: Spacing.md, color: Colors.primary }}>{item.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: Colors.textPrimary }}>{item.label}</div>
            {item.desc && <div style={{ fontSize: 11, color: Colors.textSecondary }}>{item.desc}</div>}
          </div>
          <span style={{ color: Colors.textDisabled }}>›</span>
        </div>
      ))}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', marginTop: Spacing.sm, ...s.card }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: Colors.textPrimary }}>Dark Mode</div>
          <div style={{ fontSize: 11, color: Colors.textSecondary }}>Invert colors for night use</div>
        </div>
        <div onClick={() => onToggleDarkMode?.(!isDarkMode)} style={{
          width: 44, height: 24, borderRadius: 12, cursor: 'pointer', position: 'relative',
          backgroundColor: isDarkMode ? Colors.primary : Colors.border, transition: 'background 0.2s',
        }}>
          <div style={{
            width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', position: 'absolute', top: 2,
            left: isDarkMode ? 22 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
        </div>
      </div>

      <button onClick={onLogout} style={{
        width: '100%', padding: '14px', marginTop: Spacing.lg,
        backgroundColor: Colors.errorLight, color: Colors.error, border: 'none',
        borderRadius: BorderRadius.sm, fontSize: 15, fontWeight: 600, cursor: 'pointer',
      }}>Logout</button>
    </div>
  )
}
