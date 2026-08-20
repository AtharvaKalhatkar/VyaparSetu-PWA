import React, { useMemo, useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, formatDate, greeting } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { useVertical } from '../context/VerticalContext'
import { ALL_VERTICALS } from '../verticals'
import type { BusinessType } from '../verticals/types'

function lastNDays(n: number): string[] {
  const days: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

function StatCard({ label, value, color, bg, accentColor, onClick }: { label: string; value: string; color: string; bg?: string; accentColor?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{
      flex: 1, padding: '16px 14px', borderRadius: BorderRadius.md,
      backgroundColor: bg || Colors.surface, border: `1px solid ${Colors.border}`,
      borderTop: accentColor ? `3px solid ${accentColor}` : `1px solid ${Colors.border}`,
      boxShadow: '0 4px 12px rgba(15,23,42,0.04)',
      cursor: onClick ? 'pointer' : 'default', transition: 'all 0.15s ease',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: '-0.5px' }}>{value}</div>
    </div>
  )
}

export function Dashboard({ userName, onNavigate }: { userName: string; onNavigate: (p: string) => void }) {
  const config = useVertical()
  const invoices = DB.invoices.list()
  const items = DB.items.list()
  const today = new Date().toISOString().split('T')[0]
  const profile = DB.businessProfile.get()

  const [showVerticalModal, setShowVerticalModal] = useState(false)

  const salesInvoices = useMemo(() => invoices.filter(i => i.type === 'SALE' || i.docType === 'SALE'), [invoices])
  const purchaseInvoices = useMemo(() => invoices.filter(i => i.type === 'PURCHASE' || i.docType === 'PURCHASE'), [invoices])

  const todayInvoices = salesInvoices.filter(i => i.date === today)
  const todaySales = todayInvoices.reduce((s, i) => s + i.grandTotal, 0)

  // To Collect = Customer Sales Invoices where paymentStatus !== 'PAID'
  const toCollect = salesInvoices.filter(i => i.paymentStatus !== 'PAID').reduce((s, i) => s + i.dueAmount, 0)

  // To Pay = Supplier Purchase Invoices where paymentStatus !== 'PAID' + Unpaid Expenses
  const purchaseDue = purchaseInvoices.filter(i => i.paymentStatus !== 'PAID').reduce((s, i) => s + i.dueAmount, 0)
  const expensesTotal = DB.expenses.list().reduce((s, e) => s + e.amount, 0)
  const toPay = purchaseDue + expensesTotal

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const monthInvoices = salesInvoices.filter(i => i.date >= monthStart)
  const monthSales = monthInvoices.reduce((s, i) => s + i.grandTotal, 0)
  const lowStockItems = items.filter(i => (i.currentStock || 0) <= (i.minStockLevel || 0))

  // Vertical-specific calculations
  const expiringItems = useMemo(() => {
    if (config.itemFields.batchExpiry === 'hidden') return []
    const next60Days = new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0]
    return items.filter(i => i.expDate && i.expDate <= next60Days)
  }, [items, config])

  const handleSwitchVertical = (newBizType: BusinessType) => {
    DB.businessProfile.save({
      ...profile,
      businessType: newBizType,
    })
    setShowVerticalModal(false)
    window.location.reload()
  }

  return (
    <div style={{ backgroundColor: Colors.background, minHeight: '100%', paddingBottom: 80 }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
      `}</style>

      {/* Header */}
      <div style={{ padding: '16px 16px 12px' }}>
        {/* Setup Business Profile Banner if Profile is Missing or Default */}
        {(!profile.businessName || profile.businessName === 'My Business' || !profile.phone) && (
          <div style={{ backgroundColor: Colors.primaryLight, border: `1.5px solid ${Colors.primary}40`, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: Colors.primary, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icons.Settings size={14} color={Colors.primary} /> Set Up Your Business Profile
              </div>
              <div style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 2 }}>Select business vertical, GSTIN, phone & bank details</div>
            </div>
            <button onClick={() => onNavigate('business-profile')} style={{ padding: '8px 12px', backgroundColor: Colors.primary, color: '#fff', border: 'none', borderRadius: BorderRadius.sm, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Set Up Profile ➔
            </button>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: 2 }}>{greeting()}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: Colors.textPrimary }}>{profile.ownerName || userName || 'Owner'}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: Colors.primary, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icons.Building size={14} color={Colors.primary} /> {profile.businessName || 'My Business'}
            </div>
          </div>
          <button onClick={() => onNavigate('billing')} style={{
            padding: '10px 18px', borderRadius: BorderRadius.md,
            backgroundColor: Colors.primary, color: '#fff', border: 'none',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 12px rgba(30,64,175,0.3)',
          }}>
            <Icons.Add size={16} /> New {config.terms.invoice || 'Sale'}
          </button>
        </div>

        {/* Top Summary Stats */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
          <StatCard label="Today's Sale" value={formatCurrency(todaySales)} color={Colors.primary} bg={Colors.primaryLight} accentColor={Colors.primary} />
          <StatCard label="To Collect" value={formatCurrency(toCollect)} color="#4CA82F" bg="#E4F8E1" accentColor="#4CA82F" onClick={() => onNavigate('collections')} />
          <StatCard label="To Pay" value={formatCurrency(toPay)} color="#E1416B" bg="#FFE9EE" accentColor="#E1416B" onClick={() => onNavigate('suppliers')} />
        </div>
      </div>

      {/* Quick Action Bar (Filtered by Vertical Enabled Modules) */}
      <div style={{ padding: '4px 16px 12px' }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {[
            { icon: Icons.Payment, label: 'Collections', color: '#059669', bg: '#D1FAE5', action: 'collections', key: 'collections' },
            { icon: Icons.Cart, label: 'Purchase', color: '#D97706', bg: '#FEF3C7', action: 'purchase', key: 'purchase' },
            { icon: Icons.Payment, label: 'Pay Out', color: '#E1416B', bg: '#FFE4E6', action: 'add-payment-out', key: 'expenses' },
            { icon: Icons.Inventory, label: 'Add Item', color: '#4F46E5', bg: '#E0E7FF', action: 'add-item', key: 'inventory' },
            { icon: Icons.People, label: `Add ${config.terms.party || 'Party'}`, color: '#7C3AED', bg: '#EDE9FE', action: 'add-party', key: 'customers' },
          ].filter(ac => config.enabledModules.includes(ac.key)).map((ac, i) => (
            <button key={i} onClick={() => onNavigate(ac.action)} style={{
              flex: 1, minWidth: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '12px 4px', background: Colors.surface, border: `1px solid ${Colors.border}`,
              borderRadius: BorderRadius.md, cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(15,23,42,0.04)',
              animation: `fadeUp 0.3s ease-out ${i * 60}ms both`,
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: ac.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ac.icon size={20} color={ac.color} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: Colors.textPrimary }}>{ac.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Vertical-Specific Special Widgets */}

      {/* 1. Medical / Pharma: Expiry Alert Widget */}
      {config.itemFields.batchExpiry !== 'hidden' && expiringItems.length > 0 && (
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{ backgroundColor: Colors.errorLight, border: `1.5px solid ${Colors.error}40`, borderRadius: BorderRadius.md, padding: Spacing.md }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: Colors.error, display: 'flex', alignItems: 'center', gap: 6 }}>
                💊 <span>{expiringItems.length} Medicine{expiringItems.length > 1 ? 's' : ''} Expiring Soon</span>
              </div>
              <button onClick={() => onNavigate('inventory')} style={{ background: 'none', border: 'none', color: Colors.error, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>View Inventory →</button>
            </div>
            <div style={{ fontSize: 11, color: Colors.textSecondary }}>
              Items like <strong>{expiringItems.slice(0, 2).map(i => i.name).join(', ')}</strong> expire within 60 days. Run a discount promotion or return to supplier.
            </div>
          </div>
        </div>
      )}

      {/* 2. Hardware / Construction: Warehouse Rack & Multi-Unit Converter Widget */}
      {config.itemFields.warehouseRack !== 'hidden' && (
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{ backgroundColor: '#F0F9FF', border: `1px solid #0284C7`, borderRadius: BorderRadius.md, padding: Spacing.md, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0369A1' }}>🏗️ Warehouse Racks & Multi-Unit Engine</div>
              <div style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 2 }}>Easily track hardware stock in Racks, Aisles & Convert Ton ➔ Kg or Box ➔ Pcs</div>
            </div>
            <button onClick={() => onNavigate('warehouses')} style={{ padding: '6px 10px', backgroundColor: '#0284C7', color: '#fff', border: 'none', borderRadius: BorderRadius.sm, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              Racks
            </button>
          </div>
        </div>
      )}

      {/* 3. Grocery / Kirana: Low Stock FMCG Warning */}
      {lowStockItems.length > 0 && (
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{ backgroundColor: Colors.warning + '15', border: `1px solid ${Colors.warning}40`, borderRadius: BorderRadius.md, padding: Spacing.md, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: Colors.warning, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icons.Warning size={14} color={Colors.warning} /> {lowStockItems.length} Low Stock Item{lowStockItems.length > 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 2 }}>{lowStockItems.slice(0, 3).map(i => i.name).join(', ')} below minimum level</div>
            </div>
            <button onClick={() => onNavigate('inventory')} style={{ padding: '6px 10px', backgroundColor: Colors.warning, color: '#fff', border: 'none', borderRadius: BorderRadius.sm, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              Reorder
            </button>
          </div>
        </div>
      )}

      {/* SaaS Marketing Video Banner */}
      <div style={{ padding: '0 16px 12px' }}>
        <div
          onClick={() => onNavigate('video-teaser')}
          style={{
            backgroundColor: '#F3E8FF', border: '1.5px solid #7C3AED', borderRadius: BorderRadius.md, padding: Spacing.md,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(124, 58, 237, 0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff' }}>
              🎬
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#6D28D9' }}>Official SaaS Marketing Video Kit</div>
              <div style={{ fontSize: 11, color: '#4C1D95', marginTop: 2 }}>60-sec video screenplay & 1080p presenter</div>
            </div>
          </div>
          <button style={{ padding: '6px 12px', backgroundColor: '#7C3AED', color: '#fff', border: 'none', borderRadius: BorderRadius.sm, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
            Watch Kit ▶
          </button>
        </div>
      </div>

      {/* Monthly Summary */}
      <div style={{ padding: '4px 16px 0' }}>
        <div style={{
          backgroundColor: Colors.surface, borderRadius: BorderRadius.md, overflow: 'hidden',
          border: `1px solid ${Colors.border}`, animation: 'fadeUp 0.35s ease-out 0.1s both',
        }}>
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${Colors.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: Colors.textPrimary }}>This Month Performance</span>
            <button onClick={() => onNavigate('reports')} style={{ background: 'none', border: 'none', color: Colors.primary, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Report →</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            <div style={{ padding: '14px', borderRight: `1px solid ${Colors.divider}`, borderBottom: `1px solid ${Colors.divider}` }}>
              <div style={{ fontSize: 11, color: Colors.textSecondary, marginBottom: 4 }}>Sales</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: Colors.success }}>{formatCurrency(monthSales)}</div>
            </div>
            <div style={{ padding: '14px', borderBottom: `1px solid ${Colors.divider}` }}>
              <div style={{ fontSize: 11, color: Colors.textSecondary, marginBottom: 4 }}>Transactions</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: Colors.textPrimary }}>{monthInvoices.length}</div>
            </div>
            <div style={{ padding: '14px', borderRight: `1px solid ${Colors.divider}` }}>
              <div style={{ fontSize: 11, color: Colors.textSecondary, marginBottom: 4 }}>Unpaid Bills</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: Colors.error }}>{invoices.filter(i => i.paymentStatus !== 'PAID').length}</div>
            </div>
            <div style={{ padding: '14px' }}>
              <div style={{ fontSize: 11, color: Colors.textSecondary, marginBottom: 4 }}>Total Expenses</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: Colors.error }}>{formatCurrency(expensesTotal)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
