import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, formatDate, todayISO } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { ExportBar } from '../utils/ExportBar'

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0] }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0] }
function startOfQuarter(d: Date) { return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1).toISOString().split('T')[0] }
function startOfYear(d: Date) { return new Date(d.getFullYear(), 0, 1).toISOString().split('T')[0] }

type Range = { label: string; from: string; to: string }

export function ProfitLoss({ onNavigate }: { onNavigate: (p: string) => void }) {
  const now = new Date()
  const [from, setFrom] = useState(startOfMonth(now))
  const [to, setTo] = useState(todayISO())
  const [expanded, setExpanded] = useState<string[]>([])

  const toggle = (key: string) => setExpanded(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])

  const ranges: Range[] = [
    { label: 'This Month', from: startOfMonth(now), to: todayISO() },
    { label: 'Last Month', from: startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1)), to: endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1)) },
    { label: 'This Quarter', from: startOfQuarter(now), to: todayISO() },
    { label: 'This Year', from: startOfYear(now), to: todayISO() },
  ]

  const selectRange = (r: Range) => { setFrom(r.from); setTo(r.to) }

  const invoices = DB.invoices.list().filter(i => i.date >= from && i.date <= to)
  const expenses = DB.expenses.list().filter(e => e.date >= from && e.date <= to)

  const sales = invoices.filter(i => i.type === 'SALE')
  const allItems = DB.items.list()

  const totalSales = sales.reduce((s, i) => s + i.grandTotal, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

  const cogs = sales.reduce((s, inv) =>
    s + inv.items.reduce((s2, line) => {
      const item = allItems.find(i => i.id === line.itemId)
      return s2 + (item?.purchasePrice || 0) * line.quantity
    }, 0), 0)
  const grossProfit = totalSales - cogs
  const netProfit = grossProfit - totalExpenses

  const CollapsibleSection = ({ id, title, amount, color, children }: { id: string; title: string; amount: number; color: string; children: React.ReactNode }) => {
    const open = expanded.includes(id)
    return (
      <div style={{ ...s.card, padding: 0, overflow: 'hidden', marginBottom: Spacing.md }}>
        <div onClick={() => toggle(id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer', borderBottom: open ? `1px solid ${Colors.divider}` : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: Colors.textPrimary }}>{title}</span>
            <span style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', color: Colors.textSecondary, fontSize: 10 }}>▶</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color }}>{formatCurrency(amount)}</span>
        </div>
        {open && <div style={{ padding: '8px 0' }}>{children}</div>}
      </div>
    )
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ ...s.spaceBetween, marginBottom: Spacing.lg }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: Colors.textPrimary }}>Profit & Loss</h2>
        <ExportBar title="profit-loss" xlsData={{
          name: 'P&L', headers: ['Period', 'Sales', 'COGS', 'Gross Profit', 'Expenses', 'Net Profit'],
          rows: [[`${from} to ${to}`, formatCurrency(totalSales), formatCurrency(cogs), formatCurrency(grossProfit), formatCurrency(totalExpenses), formatCurrency(netProfit)]],
        }} />
      </div>

      <div style={{ display: 'flex', gap: Spacing.xs, overflow: 'auto', paddingBottom: Spacing.sm, marginBottom: Spacing.md }}>
        {ranges.map(r => (
          <button key={r.label} onClick={() => selectRange(r)} style={{ ...s.chip(from === r.from && to === r.to, Colors.primary), flexShrink: 0 }}>{r.label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: Spacing.sm, marginBottom: Spacing.lg }}>
        <div style={{ flex: 1 }}>
          <label style={s.label}>From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={s.input} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={s.label}>To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} style={s.input} />
        </div>
      </div>

      <CollapsibleSection id="income" title="Income" amount={totalSales} color={Colors.success}>
        <div style={{ padding: '0 16px' }}>
          {sales.map(inv => (
            <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderBottom: `1px solid ${Colors.divider}` }}>
              <span style={{ color: Colors.textPrimary }}>{inv.invoiceNo} · {inv.partyName}</span>
              <span style={{ fontWeight: 500, color: Colors.success }}>{formatCurrency(inv.grandTotal)}</span>
            </div>
          ))}
          {sales.length === 0 && <div style={{ color: Colors.textDisabled, fontSize: 13, textAlign: 'center', padding: 12 }}>No sales</div>}
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="cogs" title="Cost of Goods Sold (COGS)" amount={cogs} color={Colors.warning}>
        <div style={{ padding: '0 16px' }}>
          {sales.length > 0 ? (
            <div style={{ fontSize: 11, color: Colors.textSecondary, padding: '6px 0 4px' }}>Based on purchase price of sold items. {sales.length} invoices in period.</div>
          ) : (
            <div style={{ color: Colors.textDisabled, fontSize: 13, textAlign: 'center', padding: 12 }}>No sales data</div>
          )}
        </div>
      </CollapsibleSection>

      <div style={{ ...s.card, marginBottom: Spacing.md, backgroundColor: Colors.surfaceVariant }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: Colors.textPrimary }}>Gross Profit</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: grossProfit >= 0 ? Colors.success : Colors.error }}>{formatCurrency(grossProfit)}</span>
        </div>
        <div style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 4 }}>Revenue {formatCurrency(totalSales)} − COGS {formatCurrency(cogs)}</div>
      </div>

      <CollapsibleSection id="expenses" title="Operating Expenses" amount={totalExpenses} color={Colors.error}>
        {expenses.length > 0 ? (
          <div style={{ padding: '0 16px' }}>
            {expenses.map(e => (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderBottom: `1px solid ${Colors.divider}` }}>
                <span style={{ color: Colors.textPrimary }}>{e.description}</span>
                <span style={{ fontWeight: 500, color: Colors.error }}>{formatCurrency(e.amount)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: Colors.textDisabled, fontSize: 13, textAlign: 'center', padding: 12 }}>No expenses</div>
        )}
      </CollapsibleSection>

      <div style={{ ...s.card, marginTop: Spacing.md, backgroundColor: netProfit >= 0 ? Colors.successLight : Colors.errorLight, border: `1px solid ${netProfit >= 0 ? Colors.success : Colors.error}30` }}>
        <div style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: 4 }}>Net {netProfit >= 0 ? 'Profit' : 'Loss'}</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: netProfit >= 0 ? Colors.success : Colors.error }}>{formatCurrency(Math.abs(netProfit))}</div>
        <div style={{ fontSize: 12, color: Colors.textSecondary, marginTop: Spacing.xs }}>Revenue: {formatCurrency(totalSales)} · COGS: {formatCurrency(cogs)} · Expenses: {formatCurrency(totalExpenses)}</div>
      </div>
    </div>
  )
}
