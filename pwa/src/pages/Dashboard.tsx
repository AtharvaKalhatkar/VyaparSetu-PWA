import React, { useMemo, useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, formatDate, greeting } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { AdBanner, AdPopup } from '../utils/Ads'

function lastNDays(n: number): string[] {
  const days: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

function StatCard({ label, value, color, onClick }: { label: string; value: string; color: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{
      flex: 1, padding: '14px 12px', borderRadius: BorderRadius.md,
      backgroundColor: Colors.surface, border: `1px solid ${Colors.border}`,
      cursor: onClick ? 'pointer' : undefined,
    }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: Colors.textSecondary, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}

export function Dashboard({ userName, onNavigate }: { userName: string; onNavigate: (p: string) => void }) {
  const invoices = DB.invoices.list()
  const items = DB.items.list()

  const today = new Date().toISOString().split('T')[0]
  const todaySales = invoices.filter(i => i.date === today).reduce((s, i) => s + i.grandTotal, 0)
  const toCollect = invoices.filter(i => i.paymentStatus !== 'PAID').reduce((s, i) => s + i.dueAmount, 0)
  const toPay = invoices.filter(i => i.type === 'PURCHASE' && i.paymentStatus !== 'PAID').reduce((s, i) => s + i.dueAmount, 0)

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const thisMonthInvoices = invoices.filter(i => i.date >= monthStart)
  const monthSales = thisMonthInvoices.reduce((s, i) => s + i.grandTotal, 0)

  const recentInvoices = [...invoices].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  const lowStock = items.filter(i => i.currentStock <= i.minStockLevel).length

  const weekDays = lastNDays(7)
  const salesTrend = useMemo(() => weekDays.map(d => ({
    date: d,
    total: invoices.filter(i => i.date === d).reduce((s, i) => s + i.grandTotal, 0),
  })), [invoices])
  const maxSales = Math.max(...salesTrend.map(s => s.total), 1)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div style={{ backgroundColor: Colors.background, minHeight: '100%', paddingBottom: 80 }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
      `}</style>

      {/* Header */}
      <div style={{ padding: '20px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: 2 }}>{greeting()}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: Colors.textPrimary }}>{userName}</div>
          </div>
          <button onClick={() => onNavigate('billing')} style={{
            padding: '10px 18px', borderRadius: BorderRadius.md,
            backgroundColor: Colors.primary, color: '#fff', border: 'none',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 2px 8px rgba(43,93,194,0.2)',
          }}>
            <Icons.Add size={16} /> New Sale
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
          <StatCard label="Today's Sale" value={formatCurrency(todaySales)} color={Colors.primary} />
          <StatCard label="To Collect" value={formatCurrency(toCollect)} color={Colors.error} onClick={() => onNavigate('invoices')} />
          <StatCard label="To Pay" value={formatCurrency(toPay)} color={Colors.warning} onClick={() => onNavigate('expenses')} />
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ padding: '4px 16px 12px' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { icon: Icons.Cart, label: 'Purchase', color: Colors.warning, action: 'purchase' },
            { icon: Icons.Money, label: 'Receive', color: Colors.success, action: 'add-payment' },
            { icon: Icons.Payment, label: 'Pay', color: Colors.error, action: 'add-payment-out' },
            { icon: Icons.Inventory, label: 'Add Item', color: Colors.primary, action: 'add-item' },
            { icon: Icons.People, label: 'Add Party', color: Colors.accent, action: 'add-party' },
          ].map((ac, i) => (
            <button key={i} onClick={() => onNavigate(ac.action)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '12px 4px', background: Colors.surface, border: `1px solid ${Colors.border}`,
              borderRadius: BorderRadius.md, cursor: 'pointer',
              animation: `fadeUp 0.3s ease-out ${i * 60}ms both`,
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: ac.color + '12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ac.icon size={20} color={ac.color} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 500, color: Colors.textPrimary }}>{ac.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Ad */}
      <div style={{ padding: '0 16px' }}>
        <AdBanner position="inline" onAction={(ad) => {
          const navMap: Record<string, string> = {
            'stock-summary': 'stock-summary', 'backup': 'backup-restore', 'pos-mode': 'pos-billing',
            'price-lists': 'price-lists', 'fixed-assets': 'fixed-assets', 'barcode-scan': 'barcode-print',
            'gstr2': 'gst-reports', 'multi-currency': 'invoice-settings', 'credit-limit': 'settings',
          }
          const target = navMap[ad.id]
          if (target) onNavigate(target)
        }} />
      </div>

      {/* This Month */}
      <div style={{ padding: '4px 16px 0' }}>
        <div style={{
          backgroundColor: Colors.surface, borderRadius: BorderRadius.md, overflow: 'hidden',
          border: `1px solid ${Colors.border}`, animation: 'fadeUp 0.35s ease-out 0.1s both',
        }}>
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${Colors.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: Colors.textPrimary }}>This Month</span>
            <button onClick={() => onNavigate('reports')} style={{ background: 'none', border: 'none', color: Colors.primary, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Report →</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            <div style={{ padding: '14px', borderRight: `1px solid ${Colors.divider}`, borderBottom: `1px solid ${Colors.divider}` }}>
              <div style={{ fontSize: 11, color: Colors.textSecondary, marginBottom: 4 }}>Sales</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: Colors.success }}>{formatCurrency(monthSales)}</div>
            </div>
            <div style={{ padding: '14px', borderBottom: `1px solid ${Colors.divider}` }}>
              <div style={{ fontSize: 11, color: Colors.textSecondary, marginBottom: 4 }}>Transactions</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: Colors.textPrimary }}>{thisMonthInvoices.length}</div>
            </div>
            <div style={{ padding: '14px', borderRight: `1px solid ${Colors.divider}` }}>
              <div style={{ fontSize: 11, color: Colors.textSecondary, marginBottom: 4 }}>Due</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: Colors.error }}>{invoices.filter(i => i.paymentStatus !== 'PAID').length}</div>
            </div>
            <div style={{ padding: '14px' }}>
              <div style={{ fontSize: 11, color: Colors.textSecondary, marginBottom: 4 }}>Low Stock</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: Colors.warning }}>{lowStock}</div>
            </div>
          </div>
        </div>
      </div>



      {/* Sales Trend + Recent Activity */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {invoices.length > 0 && (
          <div style={{
            backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
            border: `1px solid ${Colors.border}`, padding: '14px',
            animation: 'fadeUp 0.35s ease-out 0.15s both',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: Colors.textPrimary, marginBottom: 12 }}>7-Day Sales</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 64 }}>
              {salesTrend.map((st, i) => {
                const isToday = i === salesTrend.length - 1
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div style={{
                      width: '100%', maxWidth: 28,
                      height: Math.max(3, (st.total / maxSales) * 48),
                      backgroundColor: isToday ? Colors.primary : Colors.primaryLight,
                      borderRadius: '3px 3px 0 0', minHeight: 3,
                    }} />
                    <span style={{ fontSize: 8, color: isToday ? Colors.primary : Colors.textSecondary, fontWeight: isToday ? 700 : 400 }}>{dayNames[new Date(st.date).getDay()]}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {recentInvoices.length > 0 && (
          <div style={{
            backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
            border: `1px solid ${Colors.border}`, overflow: 'hidden',
            animation: 'fadeUp 0.35s ease-out 0.2s both',
          }}>
            <div style={{ padding: '12px 14px', borderBottom: `1px solid ${Colors.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: Colors.textPrimary }}>Recent</span>
              <button onClick={() => onNavigate('invoices')} style={{ background: 'none', border: 'none', color: Colors.primary, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>All →</button>
            </div>
            {recentInvoices.map((inv, idx) => (
              <div key={inv.id} onClick={() => onNavigate('invoice-view?id=' + inv.id)} style={{
                padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                borderBottom: idx < recentInvoices.length - 1 ? `1px solid ${Colors.divider}` : 'none',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: Colors.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: Colors.primary, flexShrink: 0 }}>
                  {inv.partyName.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: Colors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.partyName}</div>
                  <div style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 1 }}>
                    #{inv.invoiceNo} · {formatDate(inv.date)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: Colors.textPrimary }}>{formatCurrency(inv.grandTotal)}</div>
                  <span style={{ fontSize: 9, fontWeight: 600, color: inv.paymentStatus === 'PAID' ? Colors.success : Colors.error, backgroundColor: inv.paymentStatus === 'PAID' ? Colors.successLight : Colors.errorLight, borderRadius: 4, padding: '1px 6px', textTransform: 'uppercase' }}>{inv.paymentStatus}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AdPopup onAction={(ad) => {
        const navMap: Record<string, string> = {
          'stock-summary': 'stock-summary', 'backup': 'backup-restore', 'pos-mode': 'pos-billing',
          'price-lists': 'price-lists', 'fixed-assets': 'fixed-assets', 'barcode-scan': 'barcode-print',
          'gstr2': 'gst-reports', 'multi-currency': 'invoice-settings', 'credit-limit': 'settings',
        }
        const target = navMap[ad.id]
        if (target) onNavigate(target)
      }} />
    </div>
  )
}
