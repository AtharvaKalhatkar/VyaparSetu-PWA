import React, { useMemo, useState } from 'react'
import { Colors, Spacing, BorderRadius, Shadows } from '../theme'
import { s, statusColor } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, formatDate, greeting } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { useVertical } from '../context/VerticalContext'
import { ALL_VERTICALS } from '../verticals'
import type { BusinessType } from '../verticals/types'

export function Dashboard({ userName, onNavigate }: { userName: string; onNavigate: (p: string) => void }) {
  const config = useVertical()
  const invoices = DB.invoices.list()
  const items = DB.items.list()
  const today = new Date().toISOString().split('T')[0]
  const profile = DB.businessProfile.get()
  const bankAccounts = DB.bankAccounts?.list() || []

  const salesInvoices = useMemo(() => invoices.filter(i => i.type === 'SALE' || i.docType === 'SALE'), [invoices])
  const purchaseInvoices = useMemo(() => invoices.filter(i => i.type === 'PURCHASE' || i.docType === 'PURCHASE'), [invoices])
  const expensesList = DB.expenses.list()

  const todayInvoices = salesInvoices.filter(i => i.date === today)
  const todaySales = todayInvoices.reduce((s, i) => s + i.grandTotal, 0)

  // Debtors to collect
  const toCollect = salesInvoices.filter(i => i.paymentStatus !== 'PAID').reduce((s, i) => s + i.dueAmount, 0)

  // Payables & Expenses
  const purchaseDue = purchaseInvoices.filter(i => i.paymentStatus !== 'PAID').reduce((s, i) => s + i.dueAmount, 0)
  const expensesTotal = expensesList.reduce((s, e) => s + e.amount, 0)
  const toPay = purchaseDue + expensesTotal

  // Net Cash & Bank Balance
  const totalCashBank = bankAccounts.reduce((s, a) => s + (a.balance || 0), 0)

  // Month-to-date sales
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const monthInvoices = salesInvoices.filter(i => i.date >= monthStart)
  const monthSales = monthInvoices.reduce((s, i) => s + i.grandTotal, 0)

  // Stock Alerts
  const lowStockItems = items.filter(i => (i.currentStock || 0) <= (i.minStockLevel || 0))

  // Expiring items
  const expiringItems = useMemo(() => {
    if (config.itemFields.batchExpiry === 'hidden') return []
    const next60Days = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0]
    return items.filter(i => i.expDate && i.expDate <= next60Days)
  }, [items, config])

  // Recent transactions list (last 5)
  const recentTransactions = useMemo(() => {
    return [...invoices]
      .sort((a, b) => (b.date).localeCompare(a.date))
      .slice(0, 5)
  }, [invoices])

  return (
    <div style={{ backgroundColor: Colors.background, minHeight: '100vh', paddingBottom: 100 }}>
      
      {/* 1. NATIVE MOBILE APP TOP BAR */}
      <div style={{
        backgroundColor: Colors.surface,
        padding: '16px 16px 14px',
        borderBottom: `1px solid ${Colors.border}`,
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div onClick={() => onNavigate('business-profile')} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: Colors.primarySurface,
              border: `2px solid ${Colors.primaryLight}`,
              color: Colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 900,
            }}>
              {(profile.ownerName || userName || 'O').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: Colors.textSecondary }}>{greeting()}</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: Colors.textPrimary, lineHeight: 1.2 }}>
                {profile.ownerName || userName || 'Store Owner'}
              </div>
            </div>
          </div>

          <button onClick={() => onNavigate('business-profile')} title="View & Edit Profile" style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: Colors.surfaceVariant,
            color: Colors.primary,
            border: `1px solid ${Colors.border}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
          }}>
            <Icons.People size={20} color={Colors.primary} />
          </button>
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>

        {/* 2. EXECUTIVE FINANCIAL KPI CARDS (2x2 GRID) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          
          {/* Today's Sales */}
          <div style={{
            backgroundColor: Colors.primarySurface,
            border: `1px solid ${Colors.primaryLight}`,
            borderRadius: BorderRadius.md,
            padding: 14,
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: Colors.primary, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>
              Today's Sale
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: Colors.primary, fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrency(todaySales)}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: Colors.textSecondary, marginTop: 4 }}>
              {todayInvoices.length} bill{todayInvoices.length !== 1 ? 's' : ''} generated
            </div>
          </div>

          {/* To Collect */}
          <div onClick={() => onNavigate('collections')} style={{
            backgroundColor: Colors.successBg,
            border: `1px solid ${Colors.success}30`,
            borderRadius: BorderRadius.md,
            padding: 14,
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: Colors.success, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>
              To Collect (Debtors)
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: Colors.success, fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrency(toCollect)}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: Colors.success, marginTop: 4 }}>
              Collect Payments ➔
            </div>
          </div>

          {/* To Pay */}
          <div onClick={() => onNavigate('suppliers')} style={{
            backgroundColor: Colors.dangerBg,
            border: `1px solid ${Colors.danger}30`,
            borderRadius: BorderRadius.md,
            padding: 14,
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: Colors.danger, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>
              To Pay (Suppliers)
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: Colors.danger, fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrency(toPay)}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: Colors.danger, marginTop: 4 }}>
              Pay Out Bills ➔
            </div>
          </div>

          {/* Bank & Cash Balance */}
          <div onClick={() => onNavigate('bank-accounts')} style={{
            backgroundColor: Colors.infoBg,
            border: `1px solid ${Colors.info}30`,
            borderRadius: BorderRadius.md,
            padding: 14,
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: Colors.info, textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>
              Bank & Cash
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: Colors.info, fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrency(totalCashBank)}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: Colors.info, marginTop: 4 }}>
              View Balances ➔
            </div>
          </div>

        </div>

        {/* 3. NATIVE MOBILE QUICK ACTION TILES (4-TILE APP GRID) */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
            Quick Actions
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            
            <button onClick={() => onNavigate('billing')} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '12px 6px', backgroundColor: Colors.surface, border: `1px solid ${Colors.border}`,
              borderRadius: BorderRadius.md, cursor: 'pointer', boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icons.Invoice size={20} color={Colors.primary} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: Colors.textPrimary }}>Sale</span>
            </button>

            <button onClick={() => onNavigate('purchase')} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '12px 6px', backgroundColor: Colors.surface, border: `1px solid ${Colors.border}`,
              borderRadius: BorderRadius.md, cursor: 'pointer', boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.warningBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icons.Truck size={20} color={Colors.warning} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: Colors.textPrimary }}>Purchase</span>
            </button>

            <button onClick={() => onNavigate('collections')} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '12px 6px', backgroundColor: Colors.surface, border: `1px solid ${Colors.border}`,
              borderRadius: BorderRadius.md, cursor: 'pointer', boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.successBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icons.Payment size={20} color={Colors.success} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: Colors.textPrimary }}>Receive</span>
            </button>

            <button onClick={() => onNavigate('inventory')} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '12px 6px', backgroundColor: Colors.surface, border: `1px solid ${Colors.border}`,
              borderRadius: BorderRadius.md, cursor: 'pointer', boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.infoBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icons.Inventory size={20} color={Colors.info} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: Colors.textPrimary }}>Item</span>
            </button>

          </div>
        </div>

        {/* 4. SMART BUSINESS ALERTS */}

        {/* Low Stock Warning */}
        {lowStockItems.length > 0 && (
          <div style={{
            backgroundColor: Colors.warningBg,
            border: `1px solid ${Colors.warning}40`,
            borderRadius: BorderRadius.md,
            padding: 12,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: Colors.warning, display: 'flex', alignItems: 'center', gap: 6 }}>
                ⚠️ {lowStockItems.length} Item{lowStockItems.length > 1 ? 's' : ''} Low in Stock
              </div>
              <div style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 2 }}>
                {lowStockItems.slice(0, 2).map(i => i.name).join(', ')} below threshold
              </div>
            </div>
            <button onClick={() => onNavigate('inventory')} style={{
              padding: '6px 12px',
              backgroundColor: Colors.warning,
              color: '#fff',
              border: 'none',
              borderRadius: BorderRadius.sm,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
            }}>
              Reorder ➔
            </button>
          </div>
        )}

        {/* Pharma Expiry Warning */}
        {config.itemFields.batchExpiry !== 'hidden' && expiringItems.length > 0 && (
          <div style={{
            backgroundColor: Colors.dangerBg,
            border: `1px solid ${Colors.danger}40`,
            borderRadius: BorderRadius.md,
            padding: 12,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: Colors.danger, display: 'flex', alignItems: 'center', gap: 6 }}>
                💊 {expiringItems.length} Medicine{expiringItems.length > 1 ? 's' : ''} Expiring Soon
              </div>
              <div style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 2 }}>
                {expiringItems.slice(0, 2).map(i => i.name).join(', ')} expire within 60 days
              </div>
            </div>
            <button onClick={() => onNavigate('inventory')} style={{
              padding: '6px 12px',
              backgroundColor: Colors.danger,
              color: '#fff',
              border: 'none',
              borderRadius: BorderRadius.sm,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
            }}>
              Check ➔
            </button>
          </div>
        )}

        {/* 5. LIVE RECENT TRANSACTIONS STREAM */}
        <div style={{
          backgroundColor: Colors.surface,
          border: `1px solid ${Colors.border}`,
          borderRadius: BorderRadius.md,
          padding: 16,
          marginBottom: 16,
          boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: Colors.textPrimary }}>Recent Activity</div>
            <button onClick={() => onNavigate('invoices')} style={{ background: 'none', border: 'none', color: Colors.primary, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              View All ➔
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div style={{ fontSize: 12, color: Colors.textMuted, textAlign: 'center', padding: '16px 0' }}>
              No transactions recorded yet. Tap <strong>Sale</strong> to create your first invoice!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentTransactions.map(inv => {
                const isSale = inv.type === 'SALE' || inv.docType === 'SALE'
                return (
                  <div key={inv.id} onClick={() => onNavigate('invoices')} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: 10,
                    borderBottom: `1px solid ${Colors.divider}`,
                    cursor: 'pointer',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 18,
                        backgroundColor: isSale ? Colors.successBg : Colors.warningBg,
                        color: isSale ? Colors.success : Colors.warning,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 800, flexShrink: 0,
                      }}>
                        {isSale ? '📄' : '🧾'}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: Colors.textPrimary }}>
                          {inv.partyName || 'Walk-in Customer'}
                        </div>
                        <div style={{ fontSize: 11, color: Colors.textSecondary }}>
                          {inv.invoiceNo} • {formatDate(inv.date)}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: isSale ? Colors.success : Colors.textPrimary, fontVariantNumeric: 'tabular-nums' }}>
                        {formatCurrency(inv.grandTotal)}
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: statusColor(inv.paymentStatus), textTransform: 'uppercase' }}>
                        {inv.paymentStatus}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 6. MONTHLY PERFORMANCE CARD */}
        <div style={{
          backgroundColor: Colors.surface,
          border: `1px solid ${Colors.border}`,
          borderRadius: BorderRadius.md,
          padding: 16,
          boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: Colors.textPrimary }}>This Month Performance</div>
            <button onClick={() => onNavigate('reports')} style={{ background: 'none', border: 'none', color: Colors.primary, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Full Reports ➔
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ backgroundColor: Colors.background, padding: 12, borderRadius: BorderRadius.sm }}>
              <div style={{ fontSize: 11, color: Colors.textSecondary, fontWeight: 600 }}>Total Sales</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: Colors.success, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(monthSales)}
              </div>
            </div>

            <div style={{ backgroundColor: Colors.background, padding: 12, borderRadius: BorderRadius.sm }}>
              <div style={{ fontSize: 11, color: Colors.textSecondary, fontWeight: 600 }}>Invoices Generated</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: Colors.textPrimary, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                {monthInvoices.length}
              </div>
            </div>

            <div style={{ backgroundColor: Colors.background, padding: 12, borderRadius: BorderRadius.sm }}>
              <div style={{ fontSize: 11, color: Colors.textSecondary, fontWeight: 600 }}>Total Expenses</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: Colors.danger, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(expensesTotal)}
              </div>
            </div>

            <div style={{ backgroundColor: Colors.background, padding: 12, borderRadius: BorderRadius.sm }}>
              <div style={{ fontSize: 11, color: Colors.textSecondary, fontWeight: 600 }}>Est. Net Profit</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: (monthSales - expensesTotal) >= 0 ? Colors.primary : Colors.danger, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(monthSales - expensesTotal)}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
