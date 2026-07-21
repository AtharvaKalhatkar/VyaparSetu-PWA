import React, { useMemo, useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatDate } from '../utils/formatting'
import { Icons } from '../utils/Icons'

export function AuditLog() {
  const [entityFilter, setEntityFilter] = useState('ALL')
  const logs = useMemo(() => [...DB.auditLogs.list()].sort((a, b) => b.timestamp.localeCompare(a.timestamp)), [])
  const entities = useMemo(() => ['ALL', ...new Set(logs.map(l => l.entity))], [logs])
  const filtered = entityFilter === 'ALL' ? logs : logs.filter(l => l.entity === entityFilter)

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: Colors.textPrimary, marginBottom: Spacing.xs }}>Audit Trail</div>
      <div style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.md }}>{logs.length} activities logged</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: Spacing.md, flexWrap: 'wrap', overflow: 'auto' }}>
        {entities.slice(0, 10).map(e => (
          <button key={e} onClick={() => setEntityFilter(e)} style={s.chip(entityFilter === e, Colors.primary)}>{e === 'ALL' ? 'All' : e}</button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: Spacing.huge, color: Colors.textDisabled }}><Icons.Reports size={48} /><div style={{ marginTop: Spacing.md }}>No audit logs yet</div></div>
      ) : filtered.map(log => (
        <div key={log.id} style={s.listItem}>
          <div style={s.listStrip(log.action === 'CREATE' ? Colors.success : log.action === 'UPDATE' ? Colors.warning : Colors.error)} />
          <div style={s.listBody}>
            <div style={s.spaceBetween}>
              <span style={{ fontWeight: 600, fontSize: 13, color: Colors.textPrimary }}>{log.description}</span>
              <span style={s.badge(log.action === 'CREATE' ? Colors.success : log.action === 'UPDATE' ? Colors.warning : Colors.error)}>{log.action}</span>
            </div>
            <div style={{ fontSize: 11, color: Colors.textSecondary }}>{log.entity} · {formatDate(log.timestamp.split('T')[0])} {log.timestamp.split('T')[1]?.slice(0, 5)}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
