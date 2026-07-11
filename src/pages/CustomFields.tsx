import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { generateId } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import type { CustomFieldDef } from '../types'

const ENTITIES = ['ITEM', 'PARTY', 'INVOICE'] as const
const TYPES = ['TEXT', 'NUMBER', 'DATE', 'SELECT'] as const

export function CustomFields({ onBack }: { onBack?: () => void }) {
  const [fields, setFields] = useState(() => DB.customFields.list())
  const [showForm, setShowForm] = useState(false)
  const [entity, setEntity] = useState<'ITEM' | 'PARTY' | 'INVOICE'>('ITEM')
  const [label, setLabel] = useState('')
  const [type, setType] = useState<'TEXT' | 'NUMBER' | 'DATE' | 'SELECT'>('TEXT')
  const [options, setOptions] = useState('')
  const refresh = () => setFields([...DB.customFields.list()])

  const handleSave = () => {
    if (!label.trim()) return
    DB.customFields.save({ id: generateId(), entity, label: label.trim(), type, options: type === 'SELECT' ? options.split(',').map(s => s.trim()).filter(Boolean) : undefined, isRequired: false, isActive: true })
    refresh(); setShowForm(false); setLabel(''); setOptions('')
  }

  const handleDelete = (id: string) => {
    if (!confirm('Delete this custom field?')) return
    DB.customFields.delete(id); refresh()
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg }}>
        {onBack && <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: Colors.textSecondary, padding: 0, display: 'flex' }}><Icons.Back size={22} /></button>}
        <div><div style={{ fontSize: 18, fontWeight: 700, color: Colors.textPrimary }}>Custom Fields</div><div style={{ fontSize: 12, color: Colors.textSecondary }}>{fields.length} custom fields</div></div>
      </div>
      {showForm && (
        <div style={{ ...s.card, marginBottom: Spacing.md }}>
          <Field label="Applies To"><select value={entity} onChange={e => setEntity(e.target.value as any)} style={s.select}>{ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}</select></Field>
          <Field label="Field Label"><input value={label} onChange={e => setLabel(e.target.value)} style={s.input} placeholder="e.g. Department" /></Field>
          <Field label="Field Type"><select value={type} onChange={e => setType(e.target.value as any)} style={s.select}>{TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></Field>
          {type === 'SELECT' && <Field label="Options (comma-separated)"><input value={options} onChange={e => setOptions(e.target.value)} style={s.input} placeholder="Option1, Option2, Option3" /></Field>}
          <div style={{ display: 'flex', gap: Spacing.sm }}>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '12px', background: 'none', border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.sm, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSave} style={{ flex: 2, ...s.primaryBtn }}>Add Field</button>
          </div>
        </div>
      )}
      {fields.length === 0 ? (
        <div style={{ textAlign: 'center', padding: Spacing.huge, color: Colors.textDisabled }}><Icons.Add size={48} /><div style={{ marginTop: Spacing.md }}>No custom fields yet</div></div>
      ) : ENTITIES.map(ent => {
        const entFields = fields.filter(f => f.entity === ent)
        if (entFields.length === 0) return null
        return (
          <div key={ent} style={{ marginBottom: Spacing.md }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.xs }}>{ent}</div>
            {entFields.map(f => (
              <div key={f.id} style={s.listItem}>
                <div style={s.listStrip(Colors.accent)} />
                <div style={s.listBody}>
                  <div style={s.spaceBetween}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: Colors.textPrimary }}>{f.label}</span>
                    <span style={s.badge(Colors.accent)}>{f.type}</span>
                  </div>
                  <div style={{ fontSize: 11, color: Colors.textSecondary }}>{f.options?.join(', ') || ''}</div>
                </div>
                <button onClick={() => handleDelete(f.id)} style={{ background: 'none', border: 'none', color: Colors.textDisabled, cursor: 'pointer', padding: '0 12px' }}><Icons.Delete size={16} /></button>
              </div>
            ))}
          </div>
        )
      })}
      <button onClick={() => setShowForm(true)} style={{ position: 'fixed', right: Spacing.lg, bottom: 80, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, color: '#fff', border: 'none', fontSize: 28, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Add size={28} /></button>
    </div>
  )
}
