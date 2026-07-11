import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, SummaryRow, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { Icons } from '../utils/Icons'
import { formatCurrency, formatDate } from '../utils/formatting'

export function Gstr2Matching() {
  const [filter, setFilter] = useState<'ALL' | 'MATCHED' | 'MISMATCHED' | 'UNMATCHED'>('ALL')
  const settings = DB.settings.get()
  const invoices = DB.invoices.list().filter(i => i.type === 'PURCHASE')
  const parties = DB.parties.list()
  const getParty = (id: string) => parties.find(p => p.id === id)
  const matched = invoices.filter(i => i.gstr2Matched === true)
  const mismatched = invoices.filter(i => i.gstr2Matched === false)
  const unmatched = invoices.filter(i => i.gstr2Matched === undefined)

  const rows = filter === 'ALL' ? invoices : filter === 'MATCHED' ? matched : filter === 'MISMATCHED' ? mismatched : unmatched

  const toggleMatch = (id: string, status: boolean) => {
    const inv = DB.invoices.byId(id)
    if (inv) {
      DB.invoices.save({ ...inv, gstr2Matched: status })
      DB.auditLogs.save({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8), entity: 'GSTR2', entityId: inv.id, action: status ? 'MATCHED' : 'MISMATCHED', user: 'Admin', description: `GSTR-2 ${status ? 'matched' : 'mismatched'} for invoice ${inv.invoiceNo}`, timestamp: new Date().toISOString() })
    }
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: Spacing.sm, marginBottom: Spacing.xl }}>
        <div style={{ background: Colors.successLight, padding: Spacing.md, borderRadius: BorderRadius.md, textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: Colors.success }}>{matched.length}</div>
          <div style={{ fontSize: 11, color: Colors.textSecondary }}>Matched</div>
        </div>
        <div style={{ background: '#FFF3E0', padding: Spacing.md, borderRadius: BorderRadius.md, textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#E65100' }}>{mismatched.length}</div>
          <div style={{ fontSize: 11, color: Colors.textSecondary }}>Mismatched</div>
        </div>
        <div style={{ background: '#F3E5F5', padding: Spacing.md, borderRadius: BorderRadius.md, textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#7B1FA2' }}>{unmatched.length}</div>
          <div style={{ fontSize: 11, color: Colors.textSecondary }}>Unmatched</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: Spacing.xs, marginBottom: Spacing.lg, flexWrap: 'wrap' }}>
        {(['ALL', 'MATCHED', 'MISMATCHED', 'UNMATCHED'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', border: `1px solid ${filter === f ? Colors.primary : Colors.border}`, borderRadius: BorderRadius.round,
            backgroundColor: filter === f ? Colors.primary : Colors.surface, color: filter === f ? '#fff' : Colors.textPrimary, fontSize: 12, cursor: 'pointer', fontWeight: filter === f ? 600 : 400,
          }}>{f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}</button>
        ))}
      </div>

      {rows.length === 0 && <div style={{ textAlign: 'center', padding: Spacing.xxl, color: Colors.textSecondary, fontSize: 14 }}>No purchase invoices found</div>}

      {rows.map(inv => {
        const party = getParty(inv.partyId)
        const status = inv.gstr2Matched === true ? 'MATCHED' : inv.gstr2Matched === false ? 'MISMATCHED' : 'UNMATCHED'
        const colors = { MATCHED: Colors.success, MISMATCHED: '#E65100', UNMATCHED: '#7B1FA2' }
        return (
          <div key={inv.id} style={{ background: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, border: `1px solid ${Colors.divider}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: Colors.textPrimary }}>{inv.invoiceNo}</div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: BorderRadius.round, backgroundColor: colors[status] + '22', color: colors[status] }}>{status}</span>
            </div>
            <div style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: Spacing.xs }}>{party?.name || 'Unknown'} · {formatDate(inv.date)}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: Colors.textPrimary }}>{formatCurrency(inv.grandTotal)}</div>
            <div style={{ display: 'flex', gap: Spacing.xs, marginTop: Spacing.sm }}>
              {status !== 'MATCHED' && <button onClick={() => toggleMatch(inv.id, true)} style={{ padding: '6px 12px', backgroundColor: Colors.successLight, border: 'none', borderRadius: BorderRadius.sm, color: Colors.success, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}><Icons.Check size={14} /> Mark Matched</button>}
              {status !== 'MISMATCHED' && <button onClick={() => toggleMatch(inv.id, false)} style={{ padding: '6px 12px', backgroundColor: '#FFF3E0', border: 'none', borderRadius: BorderRadius.sm, color: '#E65100', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}><Icons.Delete size={14} /> Mark Mismatch</button>}
            </div>
            {inv.gstr2Matched === false && <div style={{ marginTop: Spacing.sm }}>
              <Field label="Mismatch Reason"><input style={s.input} placeholder="e.g., Rate mismatch, missing invoice" /></Field>
            </div>}
          </div>
        )
      })}
    </div>
  )
}
