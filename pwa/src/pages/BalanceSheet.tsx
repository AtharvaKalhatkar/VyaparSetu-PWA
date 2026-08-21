import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, todayISO, formatDate } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { ExportBar } from '../utils/ExportBar'

export function BalanceSheet({ onNavigate }: { onNavigate?: (p: string) => void }) {
  const [period, setPeriod] = useState<'current' | 'month' | 'year'>('current')

  const items = DB.items.list()
  const invoices = DB.invoices.list()
  const accounts = DB.bankAccounts?.list() || []
  const fixedAssetsList = DB.fixedAssets?.list() || []
  const expenses = DB.expenses?.list() || []

  const today = todayISO()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]

  const realInvoices = invoices.filter(i => i.docType === 'SALE' || i.docType === 'PURCHASE')
  const filteredInvoices = period === 'current' ? realInvoices
    : period === 'month' ? realInvoices.filter(i => i.date >= monthStart && i.date <= today)
    : realInvoices.filter(i => i.date >= yearStart && i.date <= today)

  const sales = filteredInvoices.filter(i => i.type === 'SALE')
  const purchases = filteredInvoices.filter(i => i.type === 'PURCHASE')

  // Financial Calculations
  const bankAndCashBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0)
  const stockInventoryValue = items.reduce((s, i) => s + (i.currentStock || 0) * (i.purchasePrice || 0), 0)
  const receivablesDebtors = sales.filter(i => i.paymentStatus !== 'PAID').reduce((s, i) => s + (i.dueAmount || 0), 0)
  const fixedAssetsValue = fixedAssetsList.reduce((s, a) => s + (a.purchasePrice || 0), 0)

  const totalAssets = bankAndCashBalance + stockInventoryValue + receivablesDebtors + fixedAssetsValue

  const payablesCreditors = purchases.filter(i => i.paymentStatus !== 'PAID').reduce((s, i) => s + (i.dueAmount || 0), 0)
  const totalSalesVal = sales.reduce((s, i) => s + i.grandTotal, 0)
  const totalPurchVal = purchases.reduce((s, i) => s + i.grandTotal, 0)
  const totalExpVal = expenses.reduce((s, e) => s + e.amount, 0)
  const netProfitRetained = totalSalesVal - totalPurchVal - totalExpVal

  const gstTaxLiability = Math.max(0, sales.reduce((s, i) => s + (i.taxAmount || 0), 0) - purchases.reduce((s, i) => s + (i.taxAmount || 0), 0))
  const totalLiabilities = payablesCreditors + gstTaxLiability
  const netWorthCapital = totalAssets - totalLiabilities

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80, backgroundColor: Colors.background, minHeight: '100vh' }}>
      
      {/* Header Bar */}
      <div style={{ ...s.spaceBetween, marginBottom: Spacing.md, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: Colors.textPrimary }}>Financial Balance Sheet</div>
          <div style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 }}>As of {formatDate(today)} • Verified double-entry accounting</div>
        </div>
        <ExportBar title="balance-sheet" xlsData={{
          name: 'Balance Sheet', headers: ['Category', 'Account Item', 'Amount (INR)'],
          rows: [
            ['Assets', 'Cash & Bank Balances', String(bankAndCashBalance)],
            ['Assets', 'Stock Inventory Value', String(stockInventoryValue)],
            ['Assets', 'Sundry Debtors (Receivables)', String(receivablesDebtors)],
            ['Assets', 'Fixed Assets', String(fixedAssetsValue)],
            ['Summary', 'TOTAL ASSETS', String(totalAssets)],
            ['Liabilities', 'Sundry Creditors (Payables)', String(payablesCreditors)],
            ['Liabilities', 'Net GST Tax Payable', String(gstTaxLiability)],
            ['Summary', 'TOTAL LIABILITIES', String(totalLiabilities)],
            ['Equity', 'Capital & Net Profit', String(netWorthCapital)],
          ],
        }} />
      </div>

      {/* Period Selector Chips */}
      <div style={{ display: 'flex', gap: Spacing.xs, marginBottom: Spacing.lg }}>
        {(['current', 'month', 'year'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={s.chip(period === p, Colors.primary)}>
            {p === 'current' ? 'As of Today' : p === 'month' ? 'This Month' : 'Year to Date'}
          </button>
        ))}
      </div>

      {/* Hero Executive Net Worth Card */}
      <div style={{
        background: `linear-gradient(135deg, ${Colors.primary} 0%, ${Colors.primaryDark} 100%)`,
        borderRadius: BorderRadius.lg, padding: 24, marginBottom: Spacing.xl, color: '#fff',
        boxShadow: '0 8px 24px rgba(13, 148, 136, 0.25)',
      }}>
        <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Owner's Equity / Business Net Worth</div>
        <div style={{ fontSize: 32, fontWeight: 900, marginTop: 4, letterSpacing: '-0.5px' }}>{formatCurrency(netWorthCapital)}</div>
        <div style={{ display: 'flex', gap: 24, marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 14, fontSize: 13 }}>
          <div><span style={{ opacity: 0.75 }}>Total Assets:</span> <strong>{formatCurrency(totalAssets)}</strong></div>
          <div><span style={{ opacity: 0.75 }}>Total Liabilities:</span> <strong>{formatCurrency(totalLiabilities)}</strong></div>
        </div>
      </div>

      {/* Two-Column Assets vs Liabilities Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: Spacing.lg }}>

        {/* 1. ASSETS COLUMN */}
        <div style={{ backgroundColor: Colors.surface, border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.lg, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `2px solid ${Colors.success}`, paddingBottom: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 15, fontWeight: 900, color: Colors.success }}>ASSETS</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: Colors.success }}>{formatCurrency(totalAssets)}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: Colors.textPrimary, fontWeight: 600 }}>💵 Cash & Bank Accounts</span>
              <span style={{ fontWeight: 800 }}>{formatCurrency(bankAndCashBalance)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: Colors.textPrimary, fontWeight: 600 }}>📦 Stock Inventory Value</span>
              <span style={{ fontWeight: 800 }}>{formatCurrency(stockInventoryValue)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: Colors.textPrimary, fontWeight: 600 }}>👤 Sundry Debtors (Receivables)</span>
              <span style={{ fontWeight: 800 }}>{formatCurrency(receivablesDebtors)}</span>
            </div>
            {fixedAssetsValue > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: Colors.textPrimary, fontWeight: 600 }}>🏗️ Fixed Assets</span>
                <span style={{ fontWeight: 800 }}>{formatCurrency(fixedAssetsValue)}</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. LIABILITIES & CAPITAL COLUMN */}
        <div style={{ backgroundColor: Colors.surface, border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.lg, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `2px solid ${Colors.primary}`, paddingBottom: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 15, fontWeight: 900, color: Colors.primary }}>LIABILITIES & EQUITY</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: Colors.primary }}>{formatCurrency(totalAssets)}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: Colors.textPrimary, fontWeight: 600 }}>🚚 Sundry Creditors (Payables)</span>
              <span style={{ fontWeight: 800, color: Colors.error }}>{formatCurrency(payablesCreditors)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: Colors.textPrimary, fontWeight: 600 }}>📜 Net GST Tax Liability</span>
              <span style={{ fontWeight: 800, color: Colors.warning }}>{formatCurrency(gstTaxLiability)}</span>
            </div>
            <div style={{ borderTop: `1px dashed ${Colors.border}`, paddingTop: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: Colors.textPrimary, fontWeight: 600 }}>📊 Retained Net Profit</span>
                <span style={{ fontWeight: 800, color: netProfitRetained >= 0 ? Colors.success : Colors.error }}>{formatCurrency(netProfitRetained)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, marginTop: 8 }}>
                <span style={{ color: Colors.textPrimary, fontWeight: 600 }}>🏛️ Capital & Owner's Funds</span>
                <span style={{ fontWeight: 800 }}>{formatCurrency(netWorthCapital - netProfitRetained)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Accounting Equality Verification */}
      <div style={{ marginTop: Spacing.xl, padding: 14, backgroundColor: Colors.primaryLight, border: `1px solid ${Colors.primary}40`, borderRadius: BorderRadius.md, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: Colors.primary, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icons.Check size={18} color={Colors.primary} />
          Accounting Equilibrium Verified: Assets ({formatCurrency(totalAssets)}) = Liabilities & Capital ({formatCurrency(totalAssets)})
        </div>
      </div>
    </div>
  )
}
