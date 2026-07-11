import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { Icons } from './Icons'
import { listCompanies, saveCompany, deleteCompany, switchCompany, getActiveCompanyId, getDefaultCompany, type Company } from './company'
import { generateId } from './formatting'

export function CompanySwitcher({ open, onClose, onNavigate }: { open: boolean; onClose: () => void; onNavigate?: (p: string) => void }) {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Company>>({})
  const companies = listCompanies()
  const activeId = getActiveCompanyId()

  const handleSwitch = (id: string) => {
    switchCompany(id)
  }

  const handleSave = () => {
    if (!form.name?.trim()) return
    const company: Company = {
      id: editId || generateId(),
      name: form.name.trim(),
      businessName: form.businessName || form.name.trim(),
      ownerName: form.ownerName || '',
      phone: form.phone || '',
      email: form.email || '',
      address: form.address || '',
      gstin: form.gstin || '',
      pan: form.pan || '',
      bankName: form.bankName || '',
      bankAccount: form.bankAccount || '',
      bankIfsc: form.bankIfsc || '',
      signature: form.signature || '',
      createdAt: editId ? (companies.find(c => c.id === editId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
    }
    saveCompany(company)
    setShowForm(false)
    setEditId(null)
    setForm({})
  }

  const handleEdit = (c: Company) => {
    setForm(c)
    setEditId(c.id)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    if (!confirm('Delete this company and all its data?')) return
    deleteCompany(id)
  }

  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', flexDirection: 'column' }}>
      <div onClick={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} />
      <div style={{ backgroundColor: Colors.surface, borderRadius: '16px 16px 0 0', maxHeight: '80vh', overflow: 'auto', padding: '20px 16px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg }}>
          <div style={{ fontWeight: 700, fontSize: 17, color: Colors.textPrimary }}>{showForm ? (editId ? 'Edit Company' : 'Add Company') : 'Companies'}</div>
          <button onClick={() => { setShowForm(false); setEditId(null); setForm({}); onClose() }} style={{ background: 'none', border: 'none', color: Colors.textSecondary, cursor: 'pointer', fontSize: 14 }}>Done</button>
        </div>

        {showForm ? (
          <div>
            <div style={{ marginBottom: Spacing.md }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: Colors.textSecondary, marginBottom: 4, display: 'block' }}>Company Name *</label>
              <input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Acme Traders" style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${Colors.border}`, borderRadius: BorderRadius.sm, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: Spacing.md }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: Colors.textSecondary, marginBottom: 4, display: 'block' }}>Business Name</label>
              <input value={form.businessName || ''} onChange={e => setForm({ ...form, businessName: e.target.value })} placeholder="Business name" style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${Colors.border}`, borderRadius: BorderRadius.sm, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: Spacing.md }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: Colors.textSecondary, marginBottom: 4, display: 'block' }}>GSTIN</label>
              <input value={form.gstin || ''} onChange={e => setForm({ ...form, gstin: e.target.value })} placeholder="GSTIN" style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${Colors.border}`, borderRadius: BorderRadius.sm, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: Spacing.sm }}>
              <button onClick={() => { setShowForm(false); setEditId(null); setForm({}) }} style={{ flex: 1, padding: '12px', backgroundColor: Colors.surfaceVariant, border: 'none', borderRadius: BorderRadius.sm, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
              <button onClick={handleSave} style={{ flex: 1, padding: '12px', backgroundColor: Colors.primary, color: '#fff', border: 'none', borderRadius: BorderRadius.sm, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>Save</button>
            </div>
          </div>
        ) : (
          <div>
            {companies.map(c => (
              <div key={c.id} onClick={() => handleSwitch(c.id)} style={{
                display: 'flex', alignItems: 'center', gap: Spacing.md, padding: '14px 12px',
                borderRadius: BorderRadius.md, cursor: 'pointer', marginBottom: Spacing.xs,
                backgroundColor: c.id === activeId ? Colors.primary + '08' : 'transparent',
                border: c.id === activeId ? `1px solid ${Colors.primary}20` : '1px solid transparent',
              }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = Colors.surfaceVariant}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = c.id === activeId ? Colors.primary + '08' : 'transparent'}>
                <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: c.id === activeId ? Colors.primary : Colors.surfaceVariant, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: c.id === activeId ? '#fff' : Colors.textPrimary }}>
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: Colors.textPrimary }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: Colors.textSecondary }}>{c.businessName}{c.gstin ? ` · ${c.gstin}` : ''}</div>
                </div>
                {c.id === activeId && <span style={{ fontSize: 10, fontWeight: 700, color: Colors.primary, backgroundColor: Colors.primary + '10', padding: '2px 8px', borderRadius: 4 }}>Active</span>}
                <button onClick={e => { e.stopPropagation(); handleEdit(c) }} style={{ background: 'none', border: 'none', color: Colors.textSecondary, cursor: 'pointer', padding: 4 }}><Icons.Edit size={16} /></button>
                {companies.length > 1 && <button onClick={e => { e.stopPropagation(); handleDelete(c.id) }} style={{ background: 'none', border: 'none', color: Colors.error, cursor: 'pointer', padding: 4 }}><Icons.Delete size={16} /></button>}
              </div>
            ))}
            <button onClick={() => { setForm({ name: '', businessName: '' }); setEditId(null); setShowForm(true) }} style={{
              width: '100%', padding: '12px', marginTop: Spacing.sm,
              backgroundColor: Colors.primary + '08', border: `1.5px dashed ${Colors.primary}40`,
              borderRadius: BorderRadius.sm, color: Colors.primary, fontWeight: 600, cursor: 'pointer', fontSize: 13,
            }}>
              + Add Company
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
