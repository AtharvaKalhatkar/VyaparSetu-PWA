import React, { useState, useMemo } from 'react'
import { Colors, Spacing } from '../theme'
import { s } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { useDelayedRender, ListSkeleton } from '../utils/smooth'
import { useFuzzySearch } from '../utils/useFuzzySearch'
import { ExportBar } from '../utils/ExportBar'

export function Ledger({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [search, setSearch] = useState('')
  const parties = useMemo(() => DB.parties.list(), [])
  const entries = useMemo(() => DB.ledger.list(), [])
  const ready = useDelayedRender(200)

  const balances = useMemo(() => parties.map(p => {
    const partyEntries = entries.filter(e => e.partyId === p.id)
    const balance = partyEntries.reduce((sum, e) => {
      if (e.type === 'SALE') return sum + e.amount
      if (e.type === 'PURCHASE') return sum - e.amount
      if (e.type === 'RECEIPT') return sum - e.amount
      if (e.type === 'PAYMENT') return sum + e.amount
      return sum
    }, 0)
    return { ...p, balance }
  }).filter(p => p.balance !== 0).sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)), [parties, entries])

  const filtered = useFuzzySearch(balances, search, ['name', 'phone'], 5, 200)

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ display: 'flex', gap: Spacing.sm, marginBottom: Spacing.md }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 12, top: 10, display: 'flex', alignItems: 'center', color: Colors.textDisabled }}><Icons.Search size={16} /></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search parties..." style={{ ...s.searchBox, paddingLeft: 36 }} />
        </div>
        <ExportBar title="ledger"
          xlsData={{ name: 'Ledger', headers: ['Party', 'Phone', 'Balance', 'Type'], rows: balances.map((p: any) => [p.name, p.phone || '', String(p.balance), p.balance > 0 ? 'To Receive' : 'To Pay']) }}
        />
      </div>

      {!ready ? (
        <ListSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: Spacing.huge, color: Colors.textDisabled, fontSize: 14 }}>
          <div style={{ fontSize: 48, marginBottom: Spacing.md }}>📒</div>
          <div>No outstanding balances</div>
        </div>
      ) : (
        filtered.map((p: any) => {
          const isDebit = p.balance > 0
          return (
            <div key={p.id} style={s.listItem}
              onClick={() => onNavigate('party-ledger?partyId=' + p.id)}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = Colors.surfaceVariant}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = Colors.surface}>
              <div style={s.listStrip(isDebit ? Colors.error : Colors.success)} />
              <div style={{ ...s.listBody, flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                <div style={s.avatar(p.name.charAt(0), isDebit ? Colors.error : Colors.success)}>{p.name.charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: Colors.textPrimary }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: Colors.textSecondary }}>{p.phone}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: isDebit ? Colors.error : Colors.success }}>
                    {formatCurrency(Math.abs(p.balance))}
                  </div>
                  <span style={s.badge(isDebit ? Colors.error : Colors.success)}>
                    {isDebit ? 'To Receive' : 'To Pay'}
                  </span>
                </div>
              </div>
            </div>
          )
        })
      )}
      <button onClick={() => onNavigate('add-party')} style={{
        position: 'fixed', right: Spacing.lg, bottom: 80, width: 56, height: 56, borderRadius: 28,
        backgroundColor: Colors.primary, color: Colors.textLight, border: 'none', fontSize: 28,
        cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Icons.Add size={28} /></button>
    </div>
  )
}
