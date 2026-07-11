import React, { useState, useMemo } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, formatDate, generateId, todayISO } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { ExportBar } from '../utils/ExportBar'
import type { FixedAsset } from '../types'

function calcDepreciation(a: FixedAsset): { yearlyDep: number; currentValue: number } {
  if (a.depreciationMethod === 'SLM') {
    const yearlyDep = (a.purchasePrice - a.salvageValue) / a.usefulLife
    const yearsElapsed = Math.max(0, (Date.now() - new Date(a.purchaseDate).getTime()) / (365.25 * 86400000))
    const totalDep = Math.min(yearlyDep * yearsElapsed, a.purchasePrice - a.salvageValue)
    return { yearlyDep, currentValue: a.purchasePrice - totalDep }
  } else {
    const rate = a.depreciationRate / 100
    const yearsElapsed = Math.max(0, (Date.now() - new Date(a.purchaseDate).getTime()) / (365.25 * 86400000))
    let value = a.purchasePrice
    for (let y = 0; y < Math.floor(yearsElapsed); y++) value = value * (1 - rate)
    value = value * (1 - rate * (yearsElapsed - Math.floor(yearsElapsed)))
    return { yearlyDep: a.purchasePrice * rate, currentValue: Math.max(value, a.salvageValue) }
  }
}

export function FixedAssets() {
  const [assets, setAssets] = useState(() => DB.fixedAssets.list())
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [purDate, setPurDate] = useState(todayISO())
  const [purPrice, setPurPrice] = useState('')
  const [depMethod, setDepMethod] = useState<'SLM' | 'WDV'>('SLM')
  const [depRate, setDepRate] = useState('10')
  const [usefulLife, setUsefulLife] = useState('5')
  const [salvage, setSalvage] = useState('0')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  const refresh = () => setAssets([...DB.fixedAssets.list()])

  const handleSave = () => {
    if (!name.trim() || !purPrice) return
    const asset: FixedAsset = {
      id: editId || generateId(), name: name.trim(), category: category.trim() || 'General',
      purchaseDate: purDate, purchasePrice: parseFloat(purPrice),
      depreciationMethod: depMethod, depreciationRate: parseFloat(depRate),
      usefulLife: parseFloat(usefulLife), salvageValue: parseFloat(salvage) || 0,
      currentValue: parseFloat(purPrice), location: location.trim() || undefined,
      notes: notes.trim() || undefined, isActive: true,
    }
    DB.fixedAssets.save(asset)
    DB.auditLogs.save({ id: generateId(), entity: 'FIXED_ASSET', entityId: asset.id, action: editId ? 'UPDATE' : 'CREATE', user: 'Admin', timestamp: new Date().toISOString(), description: `${editId ? 'Updated' : 'Created'} asset: ${asset.name}` })
    refresh(); setShowForm(false); resetForm()
  }

  const handleDelete = (id: string) => {
    if (!confirm('Delete this asset?')) return
    DB.fixedAssets.delete(id)
    DB.auditLogs.save({ id: generateId(), entity: 'FIXED_ASSET', entityId: id, action: 'DELETE', user: 'Admin', timestamp: new Date().toISOString(), description: 'Deleted asset' })
    refresh()
  }

  const resetForm = () => { setName(''); setCategory(''); setPurDate(todayISO()); setPurPrice(''); setDepMethod('SLM'); setDepRate('10'); setUsefulLife('5'); setSalvage('0'); setLocation(''); setNotes(''); setEditId(null) }

  const editAsset = (a: FixedAsset) => {
    setEditId(a.id); setName(a.name); setCategory(a.category); setPurDate(a.purchaseDate)
    setPurPrice(String(a.purchasePrice)); setDepMethod(a.depreciationMethod); setDepRate(String(a.depreciationRate))
    setUsefulLife(String(a.usefulLife)); setSalvage(String(a.salvageValue)); setLocation(a.location || ''); setNotes(a.notes || '')
    setShowForm(true)
  }

  const totalValue = assets.reduce((s, a) => s + calcDepreciation(a).currentValue, 0)
  const totalCost = assets.reduce((s, a) => s + a.purchasePrice, 0)

  const xlsData = { name: 'Fixed Assets', headers: ['Name', 'Category', 'Purchase Date', 'Purchase Price', 'Current Value', 'Method', 'Rate', 'Location'], rows: assets.map(a => { const d = calcDepreciation(a); return [a.name, a.category, a.purchaseDate, formatCurrency(a.purchasePrice), formatCurrency(d.currentValue), a.depreciationMethod, a.depreciationRate + '%', a.location || ''] }) }

  if (showForm) {
    return (
      <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: Colors.textPrimary, marginBottom: Spacing.lg }}>{editId ? 'Edit Asset' : 'Add Asset'}</div>
        <Field label="Asset Name"><input value={name} onChange={e => setName(e.target.value)} style={s.input} placeholder="e.g. Office Laptop" /></Field>
        <Field label="Category"><input value={category} onChange={e => setCategory(e.target.value)} style={s.input} placeholder="e.g. Electronics, Furniture" /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: Spacing.md }}>
          <Field label="Purchase Date"><input type="date" value={purDate} onChange={e => setPurDate(e.target.value)} style={s.input} /></Field>
          <Field label="Purchase Price"><input type="number" value={purPrice} onChange={e => setPurPrice(e.target.value)} style={s.input} /></Field>
        </div>
        <Field label="Depreciation Method">
          <select value={depMethod} onChange={e => setDepMethod(e.target.value as any)} style={s.select}>
            <option value="SLM">Straight Line Method (SLM)</option>
            <option value="WDV">Written Down Value (WDV)</option>
          </select>
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: Spacing.md }}>
          <Field label="Depreciation Rate (%)"><input type="number" value={depRate} onChange={e => setDepRate(e.target.value)} style={s.input} /></Field>
          <Field label="Useful Life (years)"><input type="number" value={usefulLife} onChange={e => setUsefulLife(e.target.value)} style={s.input} /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: Spacing.md }}>
          <Field label="Salvage Value"><input type="number" value={salvage} onChange={e => setSalvage(e.target.value)} style={s.input} /></Field>
          <Field label="Location"><input value={location} onChange={e => setLocation(e.target.value)} style={s.input} /></Field>
        </div>
        <Field label="Notes"><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={s.textarea} /></Field>
        <div style={{ display: 'flex', gap: Spacing.sm }}>
          <button onClick={() => { setShowForm(false); resetForm() }} style={{ flex: 1, padding: '14px', background: 'none', border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.sm, fontSize: 14, cursor: 'pointer', color: Colors.textSecondary }}>Cancel</button>
          <button onClick={handleSave} style={{ flex: 2, ...s.primaryBtn }}>{editId ? 'Update' : 'Save'} Asset</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md }}>
        <div><div style={{ fontSize: 18, fontWeight: 700, color: Colors.textPrimary }}>Fixed Assets</div><div style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 }}>{assets.length} assets</div></div>
        <ExportBar title="fixed-assets" xlsData={xlsData} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: Spacing.sm, marginBottom: Spacing.md }}>
        <div style={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: '12px 14px', border: `1px solid ${Colors.border}` }}>
          <div style={{ fontSize: 11, color: Colors.textSecondary }}>Total Cost</div><div style={{ fontSize: 20, fontWeight: 700, color: Colors.textPrimary }}>{formatCurrency(totalCost)}</div>
        </div>
        <div style={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: '12px 14px', border: `1px solid ${Colors.border}` }}>
          <div style={{ fontSize: 11, color: Colors.textSecondary }}>Current Value</div><div style={{ fontSize: 20, fontWeight: 700, color: Colors.primary }}>{formatCurrency(totalValue)}</div>
        </div>
      </div>
      {assets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: Spacing.huge, color: Colors.textDisabled }}><Icons.Building size={48} /><div style={{ marginTop: Spacing.md }}>No fixed assets yet</div></div>
      ) : assets.map(a => {
        const dep = calcDepreciation(a)
        return (
          <div key={a.id} style={s.listItem} onClick={() => editAsset(a)}>
            <div style={s.listStrip(Colors.primary)} />
            <div style={s.listBody}>
              <div style={s.spaceBetween}>
                <span style={{ fontWeight: 600, fontSize: 14, color: Colors.textPrimary }}>{a.name}</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: Colors.textPrimary }}>{formatCurrency(dep.currentValue)}</span>
              </div>
              <div style={{ fontSize: 11, color: Colors.textSecondary }}>{a.category} · Purchased: {formatDate(a.purchaseDate)} · Cost: {formatCurrency(a.purchasePrice)}</div>
              <div style={{ fontSize: 11, color: Colors.textDisabled }}>Dep: {formatCurrency(dep.yearlyDep)}/yr · {a.depreciationMethod}</div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); handleDelete(a.id) }} style={{ background: 'none', border: 'none', color: Colors.textDisabled, cursor: 'pointer', padding: '0 12px', display: 'flex', alignItems: 'center' }}><Icons.Delete size={16} /></button>
          </div>
        )
      })}
      <button onClick={() => { resetForm(); setShowForm(true) }} style={{ position: 'fixed', right: Spacing.lg, bottom: 80, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, color: Colors.textLight, border: 'none', fontSize: 28, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Add size={28} /></button>
    </div>
  )
}
