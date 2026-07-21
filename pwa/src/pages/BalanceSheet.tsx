import React, { useState } from 'react'
import { Colors, Spacing } from '../theme'
import { s } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { ExportBar } from '../utils/ExportBar'
import { todayISO } from '../utils/formatting'

export function BalanceSheet() {
  const [period, setPeriod] = useState<'current' | 'month' | 'year'>('current')

  const items = DB.items.list()
  const invoices = DB.invoices.list()
  const accounts = DB.bankAccounts.list()
  const today = todayISO()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]

  const realInvoices = invoices.filter(i => i.docType === 'SALE' || i.docType === 'PURCHASE')
  const filtered = period === 'current' ? realInvoices
    : period === 'month' ? realInvoices.filter(i => i.date >= monthStart && i.date <= today)
    : realInvoices.filter(i => i.date >= yearStart && i.date <= today)

  const bankBalance = accounts.reduce((s, a) => s + a.balance, 0)
  const stockValue = items.reduce((s, i) => s + (i.currentStock || 0) * (i.purchasePrice || 0), 0)
  const receivables = filtered.filter(i => i.type === 'SALE' && i.docType === 'SALE').reduce((s, i) => s + i.dueAmount, 0)
  const payables = filtered.filter(i => i.type === 'PURCHASE' && i.docType === 'PURCHASE').reduce((s, i) => s + i.dueAmount, 0)
  const totalAssets = bankBalance + receivables + stockValue
  const totalLiabilities = payables
  const equity = totalAssets - totalLiabilities

  const sections = [
    { label: 'Assets', color: Colors.primary, items: [
      { label: 'Cash & Bank', value: bankBalance, icon: Icons.Bank },
      { label: 'Receivables', value: receivables, icon: Icons.Invoice },
      { label: 'Stock Value', value: stockValue, icon: Icons.Inventory },
    ]},
    { label: 'Liabilities', color: Colors.error, items: [
      { label: 'Payables', value: payables, icon: Icons.People },
    ]},
  ]

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ ...s.spaceBetween, marginBottom: Spacing.md }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: Colors.textPrimary }}>Balance Sheet</h2>
        <ExportBar title="balance-sheet" xlsData={{
          name: 'Balance Sheet', headers: ['Account', 'Amount'],
          rows: [
            ['Assets - Cash & Bank', formatCurrency(bankBalance)],
            ['Assets - Receivables', formatCurrency(receivables)],
            ['Assets - Stock Value', formatCurrency(stockValue)],
            ['Total Assets', formatCurrency(totalAssets)],
            ['Liabilities - Payables', formatCurrency(payables)],
            ['Equity', formatCurrency(equity)],
          ],
        }} />
      </div>
      <div style={{ display: 'flex', gap: Spacing.xs, marginBottom: Spacing.xl }}>
        {(['current', 'month', 'year'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={s.chip(period === p, Colors.primary)}>
            {p === 'current' ? 'As of Today' : p === 'month' ? 'This Month' : 'Year to Date'}
          </button>
        ))}
      </div>

      <div style={{
        background: `linear-gradient(135deg, ${Colors.primary}, ${Colors.primaryDark})`,
        borderRadius: 12, padding: '20px 16px', marginBottom: Spacing.xl,
        color: '#fff',
      }}>
        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>Net Worth</div>
        <div style={{ fontSize: 28, fontWeight: 700 }}>{formatCurrency(equity)}</div>
        <div style={{ display: 'flex', gap: Spacing.xl, marginTop: Spacing.md, fontSize: 12, opacity: 0.85 }}>
          <span>Assets: {formatCurrency(totalAssets)}</span>
          <span>Liabilities: {formatCurrency(totalLiabilities)}</span>
        </div>
      </div>

      {sections.map(section => (
        <div key={section.label} style={{ marginBottom: Spacing.xl }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: section.color, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm }}>
            {section.label}
          </div>
          {section.items.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: Spacing.md,
              padding: '12px 14px', backgroundColor: Colors.surface,
              borderBottom: i < section.items.length - 1 ? `1px solid ${Colors.divider}` : 'none',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                backgroundColor: section.color + '12',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <item.icon size={18} color={section.color} />
              </div>
              <span style={{ flex: 1, fontSize: 14, color: Colors.textPrimary }}>{item.label}</span>
              <span style={{ fontWeight: 700, fontSize: 15, color: Colors.textPrimary }}>
                {formatCurrency(item.value)}
              </span>
            </div>
          ))}
        </div>
      ))}

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 14px', backgroundColor: Colors.surfaceVariant,
        borderRadius: 8, marginTop: Spacing.lg,
      }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: Colors.textPrimary }}>Equity (Assets − Liabilities)</span>
        <span style={{ fontWeight: 700, fontSize: 17, color: equity >= 0 ? Colors.success : Colors.error }}>
          {formatCurrency(equity)}
        </span>
      </div>
    </div>
  )
}
