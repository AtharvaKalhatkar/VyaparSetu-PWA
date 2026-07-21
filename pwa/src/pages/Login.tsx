import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s } from '../utils/styles'
import { DB } from '../utils/storage'
import { ALL_VERTICALS } from '../verticals'

import type { EmployeeRole } from '../types'

export function Login({ onLogin }: { onLogin: (name: string, business: string, businessType?: string, role?: EmployeeRole) => void }) {
  const [mode, setMode] = useState<'owner' | 'employee'>('owner')
  const [name, setName] = useState('')
  const [business, setBusiness] = useState('')
  const [businessType, setBusinessType] = useState('RETAIL')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  const handleOwnerSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !business.trim()) return
    onLogin(name.trim(), business.trim(), businessType)
  }

  const handleEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const emp = DB.employees.list().find(e => e.pin === pin.trim())
    if (!emp) { setError('Invalid PIN'); return }
    const profile = DB.businessProfile.get()
    onLogin(emp.name, profile.businessName || 'My Business', '__EMPLOYEE__', emp.role)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: Colors.background, padding: Spacing.xxl }}>
      <div style={{ textAlign: 'center', marginBottom: Spacing.xxxl }}>
        <div style={{ width: 72, height: 72, borderRadius: 36, background: 'linear-gradient(135deg, #2B5DC2, #1E4BA8)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 12px rgba(43,93,194,0.3)' }}>
          <span style={{ fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1 }}>V</span>
        </div>
        <h1 style={{ color: Colors.primary, fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Vyapar Setu</h1>
        <p style={{ color: Colors.textSecondary, fontSize: 13, margin: '4px 0 0' }}>GST Accounting & Business Management</p>
      </div>

      <div style={{ display: 'flex', gap: Spacing.sm, marginBottom: Spacing.lg, maxWidth: 400, width: '100%', margin: '0 auto 16px' }}>
        <button onClick={() => setMode('owner')} style={s.toggle(mode === 'owner', Colors.primary)}>Owner</button>
        <button onClick={() => setMode('employee')} style={s.toggle(mode === 'employee', Colors.primary)}>Employee PIN</button>
      </div>

      {mode === 'owner' ? (
        <form onSubmit={handleOwnerSubmit} style={{
          backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.xxl,
          maxWidth: 400, width: '100%', margin: '0 auto', boxSizing: 'border-box',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 18, color: Colors.textPrimary }}>Owner Sign In</h2>
          <Input label="Your Name" value={name} onChange={setName} placeholder="Enter your name" />
          <Input label="Business Name" value={business} onChange={setBusiness} placeholder="Enter business name" />
          <div style={{ marginBottom: Spacing.lg }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: Colors.textSecondary, marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 }}>Business Type</label>
            <select value={businessType} onChange={e => setBusinessType(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: `1px solid ${Colors.border}`, borderRadius: 6, fontSize: 14, outline: 'none', boxSizing: 'border-box', backgroundColor: Colors.background, color: Colors.textPrimary, fontFamily: 'inherit' }}>
              {ALL_VERTICALS.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
          </div>
          <p style={{ fontSize: 11, color: Colors.textDisabled, margin: '0 0 16px', lineHeight: 1.5 }}>Data is stored locally in your browser. No backend required.</p>
          <button type="submit" style={{
            width: '100%', padding: '14px', backgroundColor: Colors.primary, color: Colors.textLight,
            border: 'none', borderRadius: BorderRadius.sm, fontSize: 16, fontWeight: 600,
            cursor: 'pointer', opacity: name.trim() && business.trim() ? 1 : 0.6,
          }} disabled={!name.trim() || !business.trim()}>Get Started</button>
        </form>
      ) : (
        <form onSubmit={handleEmployeeSubmit} style={{
          backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.xxl,
          maxWidth: 400, width: '100%', margin: '0 auto', boxSizing: 'border-box',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 18, color: Colors.textPrimary }}>Employee Sign In</h2>
          <Input label="Enter PIN" value={pin} onChange={setPin} placeholder="Your 4-6 digit PIN" />
          {error && <div style={{ color: Colors.error, fontSize: 13, marginBottom: Spacing.md }}>{error}</div>}
          <button type="submit" style={{
            width: '100%', padding: '14px', backgroundColor: Colors.primary, color: Colors.textLight,
            border: 'none', borderRadius: BorderRadius.sm, fontSize: 16, fontWeight: 600,
            cursor: 'pointer', opacity: pin.trim() ? 1 : 0.6,
          }} disabled={!pin.trim()}>Sign In</button>
          <p style={{ fontSize: 11, color: Colors.textDisabled, marginTop: Spacing.md, textAlign: 'center' }}>
            Ask your admin to set up a PIN in Employees section
          </p>
        </form>
      )}
    </div>
  )
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ marginBottom: Spacing.lg }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: Colors.textSecondary, marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{
        width: '100%', padding: '12px 14px', border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.sm,
        fontSize: 14, outline: 'none', boxSizing: 'border-box', backgroundColor: Colors.background, color: Colors.textPrimary,
      }} />
    </div>
  )
}
