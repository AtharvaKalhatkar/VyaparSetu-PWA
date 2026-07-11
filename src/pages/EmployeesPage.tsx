import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { generateId, todayISO } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { useDelayedRender, ListSkeleton } from '../utils/smooth'
import type { EmployeeRole } from '../types'

export function EmployeesPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const ready = useDelayedRender(200)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'ADMIN' | 'SALES' | 'VIEWER'>('SALES')
  const [pin, setPin] = useState('')
  const [salary, setSalary] = useState('')
  const [joinDate, setJoinDate] = useState(todayISO())

  const ROLES: { value: EmployeeRole; label: string; desc: string }[] = [
    { value: 'ADMIN', label: 'Admin', desc: 'Full access — create, edit, delete' },
    { value: 'SALES', label: 'Sales', desc: 'Create & edit invoices, no delete' },
    { value: 'VIEWER', label: 'Viewer', desc: 'Read-only access' },
  ]

  const employees = DB.employees.list()
  const filtered = employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.phone.includes(search))

  const openEdit = (id: string) => {
    const emp = DB.employees.byId(id)
    if (!emp) return
    setEditId(id); setName(emp.name); setPhone(emp.phone); setRole(emp.role as EmployeeRole); setPin(emp.pin || ''); setSalary(String(emp.salary)); setJoinDate(emp.joiningDate); setShowForm(true)
  }

  const handleSave = () => {
    if (!name.trim()) return
    DB.employees.save({ id: editId || generateId(), name: name.trim(), phone: phone.trim(), role, pin: pin.trim() || undefined, salary: parseFloat(salary) || 0, joiningDate: editId ? joinDate : todayISO(), isActive: true })
    setShowForm(false); setEditId(null); setName(''); setPhone(''); setRole('SALES'); setPin(''); setSalary(''); setJoinDate(todayISO())
  }

  const handleDelete = () => {
    if (editId) { DB.employees.delete(editId); setShowForm(false); setEditId(null) }
  }

  if (showForm) {
    return (
      <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
        <Field label="Name"><input value={name} onChange={e => setName(e.target.value)} style={s.input} /></Field>
        <Field label="Phone"><input value={phone} onChange={e => setPhone(e.target.value)} style={s.input} /></Field>
        <Field label="Access Role">
          <div style={{ display: 'flex', gap: Spacing.xs, flexWrap: 'wrap' }}>
            {ROLES.map(r => (
              <button key={r.value} onClick={() => setRole(r.value)} style={{
                ...s.chip(role === r.value, Colors.primary), textAlign: 'left', lineHeight: 1.3,
              }}>
                <div style={{ fontWeight: 600 }}>{r.label}</div>
                <div style={{ fontSize: 9, fontWeight: 400, opacity: 0.7 }}>{r.desc}</div>
              </button>
            ))}
          </div>
        </Field>
        <Field label="PIN (for login)"><input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="4-6 digit PIN" maxLength={6} style={s.input} /></Field>
        <Field label="Salary (₹/mo)"><input type="number" value={salary} onChange={e => setSalary(e.target.value)} style={s.input} /></Field>
        <div style={{ display: 'flex', gap: Spacing.sm }}>
          {editId && <button onClick={handleDelete} style={{ flex: 1, padding: '14px', backgroundColor: Colors.errorLight, color: Colors.error, border: 'none', borderRadius: BorderRadius.sm, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Delete</button>}
          <button onClick={handleSave} style={{ flex: 2, ...s.primaryBtn }}>{editId ? 'Update' : 'Add'} Employee</button>
        </div>
        <button onClick={() => { setShowForm(false); setEditId(null); setName(''); setPhone(''); setRole('SALES'); setPin(''); setSalary('') }} style={{ marginTop: Spacing.sm, width: '100%', padding: '10px', background: 'none', border: 'none', color: Colors.textSecondary, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
      </div>
    )
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ position: 'relative', marginBottom: Spacing.md }}>
        <span style={{ position: 'absolute', left: 12, top: 10, display: 'flex', alignItems: 'center', color: Colors.textDisabled }}><Icons.Search size={16} /></span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees..." style={{ ...s.searchBox, paddingLeft: 36 }} />
      </div>
      <div style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.md }}>{employees.length} total</div>
      {!ready ? (
        <ListSkeleton count={6} height={64} />
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: Spacing.huge, color: Colors.textDisabled }}><Icons.Employee size={24} /><br />No employees</div>
      ) : (
        filtered.map(e => (
          <div key={e.id} onClick={() => openEdit(e.id)} style={s.listItem}
            onMouseEnter={e2 => e2.currentTarget.style.backgroundColor = Colors.surfaceVariant}
            onMouseLeave={e2 => e2.currentTarget.style.backgroundColor = Colors.surface}>
            <div style={s.listStrip('#7C3AED')} />
            <div style={{ ...s.listBody, flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <div style={s.avatar(e.name.charAt(0), '#7C3AED')}>{e.name.charAt(0)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: Colors.textPrimary }}>{e.name}</div>
                <div style={{ display: 'flex', gap: 6, fontSize: 11, color: Colors.textSecondary }}>
                  <span style={s.badge(e.role === 'ADMIN' ? Colors.primary : e.role === 'SALES' ? Colors.warning : Colors.textDisabled)}>{e.role}</span>
                  <span>{e.phone}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>₹{e.salary.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: Colors.textSecondary }}>/mo</div>
              </div>
            </div>
          </div>
        ))
      )}
      <button onClick={() => { setShowForm(true); setEditId(null); setName(''); setPhone(''); setRole('SALES'); setPin(''); setSalary('') }} style={{
        position: 'fixed', right: Spacing.lg, bottom: 80, width: 56, height: 56, borderRadius: 28,
        backgroundColor: Colors.primary, color: Colors.textLight, border: 'none', fontSize: 28,
        cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Icons.Add size={28} /></button>
    </div>
  )
}
