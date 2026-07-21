import React, { useState, useMemo } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, formatDate } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { ExportBar } from '../utils/ExportBar'
import * as XLSX from 'xlsx'

interface ReportItem {
  label: string; icon: React.ReactNode; desc?: string; onClick: () => void; color?: string; badge?: string
}

function Section({ title, icon, children, defaultOpen }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen || false)
  return (
    <div style={{ marginBottom: Spacing.sm }}>
      <div onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, cursor: 'pointer', border: `1px solid ${Colors.border}`, transition: 'all 0.15s' }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = Colors.primary + '40')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = Colors.border)}>
        <span style={{ color: Colors.primary, display: 'flex' }}>{icon}</span>
        <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: Colors.textPrimary }}>{title}</span>
        <span style={{ color: Colors.textDisabled, fontSize: 12, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
      </div>
      {open && <div style={{ padding: '6px 0 6px 8px', borderLeft: `2px solid ${Colors.primary}20`, marginLeft: 14, marginTop: 4 }}>{children}</div>}
    </div>
  )
}

function ReportRow({ item }: { item: ReportItem }) {
  return (
    <div onClick={item.onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: BorderRadius.sm, cursor: 'pointer', transition: 'background 0.1s' }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = Colors.surfaceVariant)}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
      <span style={{ color: item.color || Colors.textSecondary, display: 'flex', width: 20, justifyContent: 'center' }}>{item.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: Colors.textPrimary }}>{item.label}</div>
        {item.desc && <div style={{ fontSize: 11, color: Colors.textDisabled, marginTop: 1 }}>{item.desc}</div>}
      </div>
      {item.badge && <span style={{ fontSize: 11, fontWeight: 600, color: Colors.primary, backgroundColor: Colors.primaryLight, padding: '2px 8px', borderRadius: 10 }}>{item.badge}</span>}
      <span style={{ color: Colors.textDisabled, fontSize: 14 }}>›</span>
    </div>
  )
}

function downloadXLSX(filename: string, sheets: { name: string; headers: string[]; rows: (string | number)[][]; colWidths?: number[] }[]) {
  const wb = XLSX.utils.book_new()
  sheets.forEach(s => {
    const ws = XLSX.utils.aoa_to_sheet([s.headers, ...s.rows])
    if (s.colWidths) ws['!cols'] = s.colWidths.map(w => ({ wch: w }))
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1')
    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C })
        if (!ws[addr]) continue
        const cell = ws[addr]
        if (R === 0) {
          cell.s = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '2B5DC2' } }, alignment: { horizontal: 'center' } }
        } else if (typeof cell.v === 'number') {
          cell.s = { numFmt: '#,##0.00', alignment: { horizontal: 'right' } }
          cell.t = 'n'
        }
      }
    }
    XLSX.utils.book_append_sheet(wb, ws, s.name)
  })
  XLSX.writeFile(wb, filename)
}

function KpiCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: '14px 16px', border: `1px solid ${Colors.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 11, color: Colors.textSecondary, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color, marginTop: 1 }}>{value}</div>
      </div>
    </div>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 500, display: 'flex', flexDirection: 'column', padding: Spacing.lg, paddingTop: 60 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: BorderRadius.lg, maxHeight: '85vh', overflow: 'auto', padding: Spacing.lg }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: Colors.textPrimary }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: Colors.textDisabled, cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Reports({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [modal, setModal] = useState<string | null>(null)
  const allInvoices = DB.invoices.list()
  const allItems = DB.items.list()
  const allParties = DB.parties.list()
  const allExpenses = DB.expenses.list()
  const allLedger = DB.ledger.list()

  const today = new Date().toISOString().split('T')[0]
  const monthStart = new Date(); monthStart.setDate(1); const monthStartStr = monthStart.toISOString().split('T')[0]

  const sales = allInvoices.filter(i => i.type === 'SALE')
  const purchases = allInvoices.filter(i => i.type === 'PURCHASE')
  const thisMonthSales = sales.filter(i => i.date >= monthStartStr)
  const thisMonthPurchases = purchases.filter(i => i.date >= monthStartStr)
  const returns = allInvoices.filter(i => i.docType === 'SALE_RETURN' || i.docType === 'PURCHASE_RETURN')

  const totalSales = sales.reduce((s, i) => s + i.grandTotal, 0)
  const totalPurchases = purchases.reduce((s, i) => s + i.grandTotal, 0)
  const totalExpenses = allExpenses.reduce((s, e) => s + e.amount, 0)
  const outstanding = allInvoices.filter(i => i.paymentStatus !== 'PAID').reduce((s, i) => s + i.dueAmount, 0)

  const modalContent = (key: string): React.ReactNode => {
    switch (key) {
      case 'overview': return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: Spacing.sm }}>
          <KpiCard label="Total Sales" value={formatCurrency(totalSales)} color={Colors.success} icon={<Icons.Money size={20} />} />
          <KpiCard label="Total Purchases" value={formatCurrency(totalPurchases)} color={Colors.accent} icon={<Icons.Inventory size={20} />} />
          <KpiCard label="Total Expenses" value={formatCurrency(totalExpenses)} color={Colors.error} icon={<Icons.Expense size={20} />} />
          <KpiCard label="Outstanding" value={formatCurrency(outstanding)} color={Colors.warning} icon={<Icons.Payment size={20} />} />
          <KpiCard label="Net Profit" value={formatCurrency(totalSales - totalPurchases - totalExpenses)} color={Colors.primary} icon={<Icons.Trending size={20} />} />
          <KpiCard label="Total Invoices" value={String(sales.length)} color={Colors.info} icon={<Icons.Invoice size={20} />} />
          <KpiCard label="Items" value={String(allItems.length)} color={'#7B1FA2'} icon={<Icons.Inventory size={20} />} />
          <KpiCard label="Parties" value={String(allParties.length)} color={'#1565C0'} icon={<Icons.People size={20} />} />
        </div>
      )

      case 'sales-report': {
        const byMonth: Record<string, { count: number; total: number; paid: number; due: number }> = {}
        sales.forEach(i => {
          const m = i.date.slice(0, 7)
          if (!byMonth[m]) byMonth[m] = { count: 0, total: 0, paid: 0, due: 0 }
          byMonth[m].count++
          byMonth[m].total += i.grandTotal
          if (i.paymentStatus === 'PAID') byMonth[m].paid += i.grandTotal
          else byMonth[m].due += i.dueAmount
        })
        const months = Object.keys(byMonth).sort().reverse()
        return (
          <>
            <div style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.sm }}>Monthly Sales Summary</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ backgroundColor: Colors.primaryLight }}>
                <th style={th}>Month</th><th style={th}>Inv</th><th style={th}>Total</th><th style={th}>Collected</th><th style={th}>Due</th>
              </tr></thead>
              <tbody>{months.map(m => (
                <tr key={m} style={{ borderBottom: `1px solid ${Colors.divider}` }}>
                  <td style={td}>{m}</td><td style={td}>{byMonth[m].count}</td>
                  <td style={td}>{formatCurrency(byMonth[m].total)}</td>
                  <td style={{ ...td, color: Colors.success }}>{formatCurrency(byMonth[m].paid)}</td>
                  <td style={{ ...td, color: Colors.error }}>{formatCurrency(byMonth[m].due)}</td>
                </tr>
              ))}</tbody>
            </table>
            <button onClick={() => downloadXLSX('sales-report.xlsx', [{ name: 'Sales', headers: ['Month', 'Invoices', 'Total', 'Collected', 'Due'], colWidths: [12, 10, 15, 15, 15], rows: months.map(m => [m, byMonth[m].count, byMonth[m].total, byMonth[m].paid, byMonth[m].due]) }])} style={{ marginTop: Spacing.md, ...s.primaryBtn, width: 'auto', padding: '8px 16px', fontSize: 12 }}>Export XLSX</button>
          </>
        )
      }

      case 'outstanding': {
        const due = allInvoices.filter(i => i.paymentStatus !== 'PAID').sort((a, b) => a.date.localeCompare(b.date))
        return (
          <div>{due.length === 0 ? <div style={{ color: Colors.textDisabled, textAlign: 'center', padding: 20 }}>No outstanding invoices</div> :
            due.map(i => (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${Colors.divider}` }}>
                <div><div style={{ fontSize: 13, fontWeight: 600 }}>{i.partyName}</div><div style={{ fontSize: 11, color: Colors.textSecondary }}>{i.invoiceNo} · {formatDate(i.date)}</div></div>
                <div style={{ textAlign: 'right' }}><div style={{ fontSize: 14, fontWeight: 700, color: Colors.error }}>{formatCurrency(i.dueAmount)}</div><div style={{ fontSize: 10, color: Colors.textSecondary }}>Due: {formatDate(i.date)}</div></div>
              </div>
            ))
          }</div>
        )
      }

      case 'customer-aging': {
        const now = new Date()
        const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 }
        const byParty: Record<string, { name: string; due: number; days: number }> = {}
        allInvoices.filter(i => i.type === 'SALE' && i.paymentStatus !== 'PAID').forEach(i => {
          const days = Math.floor((now.getTime() - new Date(i.date).getTime()) / 86400000)
          const key = days <= 30 ? '0-30' : days <= 60 ? '31-60' : days <= 90 ? '61-90' : '90+'
          buckets[key as keyof typeof buckets] += i.dueAmount
          if (!byParty[i.partyId]) byParty[i.partyId] = { name: i.partyName, due: 0, days: 0 }
          byParty[i.partyId].due += i.dueAmount
          byParty[i.partyId].days = Math.max(byParty[i.partyId].days, days)
        })
        return (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: Spacing.md }}>
              {Object.entries(buckets).map(([k, v]) => (
                <div key={k} style={{ padding: '10px 12px', backgroundColor: Colors.surfaceVariant, borderRadius: BorderRadius.sm, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: Colors.textSecondary }}>{k} days</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: parseInt(k) >= 90 ? Colors.error : Colors.warning }}>{formatCurrency(v)}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Party-wise</div>
            {Object.entries(byParty).sort((a, b) => b[1].due - a[1].due).slice(0, 20).map(([id, p]) => (
              <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${Colors.divider}`, fontSize: 12 }}>
                <span style={{ fontWeight: 500 }}>{p.name}</span>
                <span style={{ color: p.days > 60 ? Colors.error : Colors.warning }}>{formatCurrency(p.due)} ({p.days}d)</span>
              </div>
            ))}
          </div>
        )
      }

      case 'bill-wise-profit': {
        const itemsMap = new Map(allItems.map(i => [i.id, i]))
        const rows = sales.filter(i => i.dueAmount === 0).slice(0, 50).map(i => {
          const cost = i.items.reduce((s, li) => {
            const item = itemsMap.get(li.itemId)
            const conv = item?.units?.find(u => u.unitName === li.unit)?.conversionRate || 1
            const baseQty = li.unit === item?.unit ? li.quantity : li.quantity * conv
            return s + (item?.purchasePrice || 0) * baseQty
          }, 0)
          return { inv: i, profit: i.grandTotal - cost, margin: i.grandTotal > 0 ? ((i.grandTotal - cost) / i.grandTotal * 100) : 0 }
        }).sort((a, b) => b.profit - a.profit)
        return (
          <div>{rows.map(r => (
            <div key={r.inv.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${Colors.divider}`, fontSize: 12 }}>
              <span>{r.inv.invoiceNo} · {r.inv.partyName}</span>
              <span style={{ color: r.profit >= 0 ? Colors.success : Colors.error, fontWeight: 600 }}>{formatCurrency(r.profit)} ({r.margin.toFixed(1)}%)</span>
            </div>
          ))}</div>
        )
      }

      case 'stock-summary': {
        const lowStock = allItems.filter(i => i.currentStock <= i.minStockLevel)
        return (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: Spacing.md }}>
              <KpiCard label="Total Items" value={String(allItems.length)} color={Colors.primary} icon={<Icons.Inventory size={16} />} />
              <KpiCard label="Total Stock" value={String(allItems.reduce((s, i) => s + i.currentStock, 0))} color={Colors.success} icon={<Icons.Inventory size={16} />} />
              <KpiCard label="Low Stock" value={String(lowStock.length)} color={Colors.error} icon={<Icons.Inventory size={16} />} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Stock Value</div>
            <div style={{ fontSize: 13, marginBottom: Spacing.md }}>Cost: {formatCurrency(allItems.reduce((s, i) => s + i.currentStock * (i.purchasePrice || 0), 0))} | Selling: {formatCurrency(allItems.reduce((s, i) => s + i.currentStock * i.sellingPrice, 0))}</div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Low Stock Items</div>
            {lowStock.slice(0, 20).map(i => (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${Colors.divider}`, fontSize: 12 }}>
                <span>{i.name} ({i.sku})</span><span style={{ color: Colors.error }}>{i.currentStock} / {i.minStockLevel} {i.unit}</span>
              </div>
            ))}
            <button onClick={() => { setModal(null); onNavigate('stock-summary') }} style={{ marginTop: Spacing.sm, ...s.primaryBtn, width: 'auto', padding: '8px 20px', fontSize: 12 }}>Full Stock Summary</button>
          </div>
        )
      }

      case 'stock-movement': {
        const adjustments = DB.stockAdjustments?.list() || []
        return (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: Spacing.md }}>
              <KpiCard label="Added" value={String(adjustments.filter(a => a.type === 'ADD').reduce((s, a) => s + a.quantity, 0))} color={Colors.success} icon={<Icons.Add size={16} />} />
              <KpiCard label="Removed" value={String(adjustments.filter(a => a.type === 'REMOVE').reduce((s, a) => s + a.quantity, 0))} color={Colors.error} icon={<Icons.Delete size={16} />} />
            </div>
            {adjustments.slice(-30).reverse().map(a => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${Colors.divider}`, fontSize: 12 }}>
                <span>{a.itemName}</span><span style={{ color: a.type === 'ADD' ? Colors.success : Colors.error }}>{a.type === 'ADD' ? '+' : '-'}{a.quantity} · {formatDate(a.date)}</span>
              </div>
            ))}
          </div>
        )
      }

      case 'fast-slow-moving': {
        const itemSales: Record<string, { sold: number; revenue: number; name: string }> = {}
        sales.forEach(i => i.items.forEach(li => {
          if (!itemSales[li.itemId]) itemSales[li.itemId] = { sold: 0, revenue: 0, name: li.itemName }
          itemSales[li.itemId].sold += li.quantity
          itemSales[li.itemId].revenue += li.amount
        }))
        const sorted = Object.entries(itemSales).sort((a, b) => b[1].sold - a[1].sold)
        return (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Fast Moving (Top 10)</div>
            {sorted.slice(0, 10).map(([id, d]) => (
              <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${Colors.divider}`, fontSize: 12 }}>
                <span>{d.name}</span><span>{d.sold} units · {formatCurrency(d.revenue)}</span>
              </div>
            ))}
            <div style={{ fontSize: 12, fontWeight: 600, marginTop: Spacing.md, marginBottom: 6 }}>Slow Moving / No Sales</div>
            {allItems.filter(i => !itemSales[i.id] && i.currentStock > 0).slice(0, 10).map(i => (
              <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${Colors.divider}`, fontSize: 12 }}>
                <span>{i.name}</span><span style={{ color: Colors.warning }}>Stock: {i.currentStock} {i.unit} · No sales</span>
              </div>
            ))}
          </div>
        )
      }

      case 'day-book': {
        const todayEntries = allInvoices.filter(i => i.date === today).sort((a, b) => a.date.localeCompare(b.date))
        return (
          <div>
            <div style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.sm }}>Today ({formatDate(today)})</div>
            {todayEntries.length === 0 ? <div style={{ color: Colors.textDisabled, padding: 16, textAlign: 'center' }}>No entries today</div> :
              todayEntries.map(i => (
                <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${Colors.divider}`, fontSize: 12 }}>
                  <span><span style={{ fontWeight: 600 }}>{i.invoiceNo}</span> · {i.partyName}</span>
                  <span style={{ fontWeight: 600, color: i.type === 'SALE' ? Colors.success : Colors.warning }}>{formatCurrency(i.grandTotal)}</span>
                </div>
              ))
            }
            <button onClick={() => onNavigate('daybook')} style={{ marginTop: Spacing.sm, ...s.primaryBtn, width: 'auto', padding: '8px 16px', fontSize: 12 }}>Full Day Book</button>
          </div>
        )
      }

      case 'tax-summary': {
        const gstRates = [...new Set(allItems.map(i => i.gstRate).filter(r => r > 0))].sort()
        const gstData = gstRates.map(r => {
          const taxable = sales.reduce((s, inv) => s + inv.items.filter(li => li.gstRate === r).reduce((ss, li) => ss + li.amount, 0), 0)
          const cgst = taxable * r / 200
          const sgst = taxable * r / 200
          return { rate: r, taxable, cgst, sgst, total: taxable + cgst + sgst }
        })
        return (
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ backgroundColor: Colors.primaryLight }}>
                <th style={th}>GST%</th><th style={th}>Taxable</th><th style={th}>CGST</th><th style={th}>SGST</th><th style={th}>Total</th>
              </tr></thead>
              <tbody>{gstData.map(d => (
                <tr key={d.rate} style={{ borderBottom: `1px solid ${Colors.divider}` }}>
                  <td style={td}>{d.rate}%</td><td style={td}>{formatCurrency(d.taxable)}</td>
                  <td style={{ ...td, color: Colors.primary }}>{formatCurrency(d.cgst)}</td>
                  <td style={{ ...td, color: Colors.primary }}>{formatCurrency(d.sgst)}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{formatCurrency(d.total)}</td>
                </tr>
              ))}</tbody>
            </table>
            <div style={{ marginTop: Spacing.sm, fontSize: 13, fontWeight: 600, textAlign: 'right' }}>
              Total Tax: {formatCurrency(gstData.reduce((s, d) => s + d.cgst + d.sgst, 0))}
            </div>
          </div>
        )
      }

      case 'hsn-summary': {
        const hsnMap: Record<string, { name: string; qty: number; taxable: number; rate: number }> = {}
        sales.forEach(inv => inv.items.forEach(li => {
          const hsn = li.sku || 'OTHER'
          if (!hsnMap[hsn]) hsnMap[hsn] = { name: li.itemName, qty: 0, taxable: 0, rate: li.gstRate }
          hsnMap[hsn].qty += li.quantity
          hsnMap[hsn].taxable += li.amount
        }))
        return (
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ backgroundColor: Colors.primaryLight }}>
                <th style={th}>HSN/SAC</th><th style={th}>Description</th><th style={th}>Qty</th><th style={th}>Taxable</th><th style={th}>GST%</th>
              </tr></thead>
              <tbody>{Object.entries(hsnMap).map(([code, d]) => (
                <tr key={code} style={{ borderBottom: `1px solid ${Colors.divider}` }}>
                  <td style={td}>{code}</td><td style={td}>{d.name}</td><td style={td}>{d.qty}</td>
                  <td style={td}>{formatCurrency(d.taxable)}</td><td style={td}>{d.rate}%</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )
      }

      case 'customer-statement': return (
        <div style={{ textAlign: 'center', padding: 20, color: Colors.textSecondary, fontSize: 13 }}>
          Select a customer from the parties list to view their full statement with opening/closing balance.
          <button onClick={() => onNavigate('customers')} style={{ display: 'block', margin: '12px auto', ...s.primaryBtn, width: 'auto', padding: '8px 20px', fontSize: 12 }}>Go to Customers</button>
        </div>
      )

      case 'party-outstanding': {
        const partyBal: Record<string, { name: string; sale: number; purchase: number; paid: number; net: number }> = {}
        allInvoices.forEach(i => {
          if (!partyBal[i.partyId]) partyBal[i.partyId] = { name: i.partyName, sale: 0, purchase: 0, paid: 0, net: 0 }
          if (i.type === 'SALE') { partyBal[i.partyId].sale += i.grandTotal; partyBal[i.partyId].paid += i.paidAmount }
          else { partyBal[i.partyId].purchase += i.grandTotal; partyBal[i.partyId].paid -= i.paidAmount }
        })
        Object.values(partyBal).forEach(p => { p.net = p.sale - p.purchase - p.paid })
        return (
          <div>{Object.entries(partyBal).sort((a, b) => Math.abs(b[1].net) - Math.abs(a[1].net)).slice(0, 30).map(([id, p]) => (
            <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${Colors.divider}`, fontSize: 12 }}>
              <span style={{ fontWeight: 500 }}>{p.name}</span>
              <span style={{ color: p.net >= 0 ? Colors.error : Colors.success, fontWeight: 600 }}>{formatCurrency(Math.abs(p.net))} {p.net >= 0 ? 'Dr' : 'Cr'}</span>
            </div>
          ))}</div>
        )
      }

      case 'trial-balance': {
        const debit = allLedger.filter(e => e.type === 'SALE' || e.type === 'PURCHASE').reduce((s, e) => s + e.amount, 0)
        const credit = allLedger.filter(e => e.type === 'RECEIPT' || e.type === 'PAYMENT').reduce((s, e) => s + e.amount, 0)
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `2px solid ${Colors.textPrimary}`, fontSize: 13, fontWeight: 700 }}>
              <span>Account</span><span>Debit</span><span>Credit</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${Colors.divider}`, fontSize: 12 }}>
              <span>Sales & Purchases</span><span style={{ color: Colors.error }}>{formatCurrency(debit)}</span><span>–</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${Colors.divider}`, fontSize: 12 }}>
              <span>Receipts & Payments</span><span>–</span><span style={{ color: Colors.success }}>{formatCurrency(credit)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: `2px solid ${Colors.textPrimary}`, fontSize: 13, fontWeight: 700 }}>
              <span>Total</span><span>{formatCurrency(debit)}</span><span>{formatCurrency(credit)}</span>
            </div>
            <div style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 8 }}>Difference: {formatCurrency(Math.abs(debit - credit))}</div>
          </div>
        )
      }

      case 'cash-flow': {
        const byMonth: Record<string, { inflow: number; outflow: number }> = {}
        allInvoices.forEach(i => {
          const m = i.date.slice(0, 7)
          if (!byMonth[m]) byMonth[m] = { inflow: 0, outflow: 0 }
          if (i.type === 'SALE') byMonth[m].inflow += i.paidAmount
          else byMonth[m].outflow += i.grandTotal
        })
        allExpenses.forEach(e => {
          const m = e.date.slice(0, 7)
          if (!byMonth[m]) byMonth[m] = { inflow: 0, outflow: 0 }
          byMonth[m].outflow += e.amount
        })
        const months = Object.keys(byMonth).sort().reverse()
        return (
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ backgroundColor: Colors.primaryLight }}>
                <th style={th}>Month</th><th style={th}>Inflow</th><th style={th}>Outflow</th><th style={th}>Net</th>
              </tr></thead>
              <tbody>{months.map(m => {
                const net = byMonth[m].inflow - byMonth[m].outflow
                return (
                  <tr key={m} style={{ borderBottom: `1px solid ${Colors.divider}` }}>
                    <td style={td}>{m}</td>
                    <td style={{ ...td, color: Colors.success }}>{formatCurrency(byMonth[m].inflow)}</td>
                    <td style={{ ...td, color: Colors.error }}>{formatCurrency(byMonth[m].outflow)}</td>
                    <td style={{ ...td, fontWeight: 600, color: net >= 0 ? Colors.success : Colors.error }}>{formatCurrency(net)}</td>
                  </tr>
                )
              })}</tbody>
            </table>
          </div>
        )
      }

      case 'purchase-analytics': {
        const byParty: Record<string, { name: string; count: number; total: number }> = {}
        purchases.forEach(i => {
          if (!byParty[i.partyId]) byParty[i.partyId] = { name: i.partyName, count: 0, total: 0 }
          byParty[i.partyId].count++
          byParty[i.partyId].total += i.grandTotal
        })
        return (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: Spacing.md }}>
              <KpiCard label="Total Purchases" value={formatCurrency(totalPurchases)} color={Colors.accent} icon={<Icons.Inventory size={16} />} />
              <KpiCard label="This Month" value={formatCurrency(thisMonthPurchases.reduce((s, i) => s + i.grandTotal, 0))} color={Colors.warning} icon={<Icons.Money size={16} />} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Top Suppliers</div>
            {Object.entries(byParty).sort((a, b) => b[1].total - a[1].total).slice(0, 10).map(([id, p]) => (
              <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${Colors.divider}`, fontSize: 12 }}>
                <span>{p.name || id}</span><span>{p.count} inv · {formatCurrency(p.total)}</span>
              </div>
            ))}
          </div>
        )
      }

      case 'employee-reports': {
        const employees = DB.employees?.list() || []
        return (
          <div>
            <KpiCard label="Total Employees" value={String(employees.length)} color={Colors.primary} icon={<Icons.Employee size={16} />} />
            <div style={{ marginTop: Spacing.md, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Employee List</div>
            {employees.map(e => (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${Colors.divider}`, fontSize: 12 }}>
                <span>{e.name} · {e.role}</span><span>₹{e.salary.toLocaleString()}/mo</span>
              </div>
            ))}
          </div>
        )
      }

      case 'assets': {
        const bankAccounts = DB.bankAccounts?.list() || []
        const totalCash = bankAccounts.reduce((s, a) => s + a.balance, 0)
        return (
          <div>
            <KpiCard label="Total Bank/Cash Balance" value={formatCurrency(totalCash)} color={Colors.success} icon={<Icons.Bank size={16} />} />
            <div style={{ marginTop: Spacing.md }}>{bankAccounts.map(a => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${Colors.divider}`, fontSize: 12 }}>
                <span>{a.name} ({a.type})</span><span style={{ fontWeight: 600 }}>{formatCurrency(a.balance)}</span>
              </div>
            ))}</div>
          </div>
        )
      }

      default: return <div style={{ color: Colors.textSecondary, textAlign: 'center', padding: 20 }}>Report not available</div>
    }
  }

  const sections: { title: string; icon: React.ReactNode; reports: ReportItem[] }[] = [
    {
      title: 'Dashboard', icon: <Icons.Dashboard size={18} />, reports: [
        { label: 'Business Overview', icon: <Icons.Chart size={14} />, desc: 'Sales, purchases, profit KPIs', onClick: () => setModal('overview'), color: Colors.primary },
        { label: 'Sales Analytics', icon: <Icons.Trending size={14} />, desc: 'Monthly sales trends & collection', onClick: () => setModal('sales-report'), color: Colors.success },
        { label: 'Revenue Trends', icon: <Icons.Money size={14} />, desc: 'Cash flow analysis', onClick: () => setModal('cash-flow'), color: Colors.info },
        { label: 'KPI Dashboard', icon: <Icons.Star size={14} />, desc: 'Key performance indicators', onClick: () => setModal('overview'), color: Colors.accent },
      ]
    },
    {
      title: 'Sales', icon: <Icons.Money size={18} />, reports: [
        { label: 'Sales Report', icon: <Icons.Reports size={14} />, desc: 'Monthly sales summary', onClick: () => setModal('sales-report'), color: Colors.success },
        { label: 'Sales Return', icon: <Icons.Refresh size={14} />, desc: `Returns (${returns.filter(r => r.docType === 'SALE_RETURN').length})`, onClick: () => onNavigate('returns'), color: Colors.warning },
        { label: 'Invoice Report', icon: <Icons.Invoice size={14} />, desc: 'All invoices summary', onClick: () => onNavigate('invoices'), color: Colors.primary },
        { label: 'Payment Collection', icon: <Icons.Payment size={14} />, desc: 'Payment received vs pending', onClick: () => setModal('sales-report'), color: Colors.success },
        { label: 'Outstanding', icon: <Icons.Payment size={14} />, desc: formatCurrency(outstanding) + ' due', onClick: () => setModal('outstanding'), color: Colors.error, badge: formatCurrency(outstanding) },
        { label: 'Customer Aging', icon: <Icons.People size={14} />, desc: 'Overdue analysis by days', onClick: () => setModal('customer-aging'), color: Colors.warning },
        { label: 'Bill Wise Profit', icon: <Icons.Trending size={14} />, desc: 'Profit per invoice', onClick: () => setModal('bill-wise-profit'), color: Colors.success },
      ]
    },
    {
      title: 'Purchases', icon: <Icons.Inventory size={18} />, reports: [
        { label: 'Purchase Report', icon: <Icons.Reports size={14} />, desc: 'Purchase summary', onClick: () => setModal('purchase-analytics'), color: Colors.accent },
        { label: 'Purchase Return', icon: <Icons.Refresh size={14} />, desc: `Returns (${returns.filter(r => r.docType === 'PURCHASE_RETURN').length})`, onClick: () => onNavigate('returns'), color: Colors.warning },
        { label: 'Supplier Outstanding', icon: <Icons.Payment size={14} />, desc: 'Amount payable to suppliers', onClick: () => setModal('party-outstanding'), color: Colors.error },
        { label: 'Purchase Analytics', icon: <Icons.Chart size={14} />, desc: 'Supplier-wise analysis', onClick: () => setModal('purchase-analytics'), color: Colors.accent },
      ]
    },
    {
      title: 'Inventory', icon: <Icons.Inventory size={18} />, reports: [
        { label: 'Stock Summary', icon: <Icons.Reports size={14} />, desc: 'Stock value & low stock alerts', onClick: () => setModal('stock-summary'), color: Colors.primary },
        { label: 'Stock Ledger', icon: <Icons.Book size={14} />, desc: 'Item-wise stock changes', onClick: () => onNavigate('stock-adjustment'), color: Colors.info },
        { label: 'Stock Movement', icon: <Icons.Transfer size={14} />, desc: 'Additions & removals log', onClick: () => setModal('stock-movement'), color: Colors.accent },
        { label: 'Low Stock', icon: <Icons.Inventory size={14} />, desc: `Items below min level`, onClick: () => setModal('stock-summary'), color: Colors.error, badge: String(allItems.filter(i => i.currentStock <= i.minStockLevel).length) },
        { label: 'Dead Stock', icon: <Icons.Inventory size={14} />, desc: 'Items with no sales', onClick: () => setModal('fast-slow-moving'), color: Colors.warning },
        { label: 'Fast Moving Items', icon: <Icons.Trending size={14} />, desc: 'Top selling products', onClick: () => setModal('fast-slow-moving'), color: Colors.success },
        { label: 'Slow Moving Items', icon: <Icons.Trending size={14} />, desc: 'Low turnover items', onClick: () => setModal('fast-slow-moving'), color: Colors.warning },
        { label: 'Batch Report', icon: <Icons.Inventory size={14} />, desc: 'Batch-wise stock tracking', onClick: () => setModal('stock-summary'), color: Colors.primary },
      ]
    },
    {
      title: 'Parties', icon: <Icons.People size={18} />, reports: [
        { label: 'Customer Statement', icon: <Icons.People size={14} />, desc: 'Full ledger with balance', onClick: () => setModal('customer-statement'), color: Colors.primary },
        { label: 'Supplier Statement', icon: <Icons.People size={14} />, desc: 'Supplier ledger details', onClick: () => setModal('customer-statement'), color: Colors.accent },
        { label: 'Customer Profitability', icon: <Icons.Trending size={14} />, desc: 'Profit per customer', onClick: () => setModal('bill-wise-profit'), color: Colors.success },
        { label: 'Party Outstanding', icon: <Icons.Payment size={14} />, desc: 'All parties balance', onClick: () => setModal('party-outstanding'), color: Colors.error },
      ]
    },
    {
      title: 'Accounting', icon: <Icons.Book size={18} />, reports: [
        { label: 'Day Book', icon: <Icons.Document size={14} />, desc: 'Today\'s transactions', onClick: () => setModal('day-book'), color: Colors.primary },
        { label: 'Cash Book', icon: <Icons.Money size={14} />, desc: 'Cash transactions', onClick: () => onNavigate('ledger'), color: Colors.success },
        { label: 'Bank Book', icon: <Icons.Bank size={14} />, desc: 'Bank transactions', onClick: () => onNavigate('bank-accounts'), color: Colors.info },
        { label: 'Ledger', icon: <Icons.Book size={14} />, desc: 'General ledger', onClick: () => onNavigate('ledger'), color: Colors.primary },
        { label: 'Trial Balance', icon: <Icons.Reports size={14} />, desc: 'Debit/credit summary', onClick: () => setModal('trial-balance'), color: Colors.accent },
        { label: 'P&L', icon: <Icons.Trending size={14} />, desc: 'Profit & loss statement', onClick: () => onNavigate('profitloss'), color: Colors.success },
        { label: 'Balance Sheet', icon: <Icons.Reports size={14} />, desc: 'Assets & liabilities', onClick: () => onNavigate('balance-sheet'), color: Colors.primary },
        { label: 'Cash Flow', icon: <Icons.Transfer size={14} />, desc: 'Inflow vs outflow', onClick: () => setModal('cash-flow'), color: Colors.success },
      ]
    },
    {
      title: 'GST', icon: <Icons.Star size={18} />, reports: [
        { label: 'GSTR-1', icon: <Icons.Document size={14} />, desc: 'Outward supply summary', onClick: () => onNavigate('gst-reports'), color: Colors.primary },
        { label: 'GSTR-3B', icon: <Icons.Document size={14} />, desc: 'Monthly return summary', onClick: () => onNavigate('gst-reports'), color: Colors.success },
        { label: 'HSN Summary', icon: <Icons.Reports size={14} />, desc: 'HSN-wise sales', onClick: () => setModal('hsn-summary'), color: Colors.accent },
        { label: 'Tax Summary', icon: <Icons.Money size={14} />, desc: 'CGST/SGST breakup', onClick: () => setModal('tax-summary'), color: Colors.primary },
        { label: 'GST Audit', icon: <Icons.Reports size={14} />, desc: 'GST compliance check', onClick: () => onNavigate('gst-reports'), color: Colors.warning },
      ]
    },
    {
      title: 'Expenses', icon: <Icons.Expense size={18} />, reports: [
        { label: 'Expense Report', icon: <Icons.Reports size={14} />, desc: `Total: ${formatCurrency(totalExpenses)}`, onClick: () => onNavigate('expenses'), color: Colors.error, badge: formatCurrency(totalExpenses) },
      ]
    },
    {
      title: 'Other Income', icon: <Icons.Money size={18} />, reports: [
        { label: 'Other Income', icon: <Icons.Money size={14} />, desc: 'Non-sales income', onClick: () => onNavigate('ledger'), color: Colors.success },
      ]
    },
    {
      title: 'Orders', icon: <Icons.Cart size={18} />, reports: [
        { label: 'Orders', icon: <Icons.Cart size={14} />, desc: 'Open & converted orders', onClick: () => onNavigate('orders'), color: Colors.warning },
        { label: 'Estimates', icon: <Icons.Document size={14} />, desc: 'Quotations & estimates', onClick: () => onNavigate('estimates'), color: Colors.primary },
      ]
    },
    {
      title: 'Employee Reports', icon: <Icons.Employee size={18} />, reports: [
        { label: 'Employee Report', icon: <Icons.Employee size={14} />, desc: 'Staff list & salaries', onClick: () => setModal('employee-reports'), color: Colors.info },
      ]
    },
    {
      title: 'Assets', icon: <Icons.Bank size={18} />, reports: [
        { label: 'Assets', icon: <Icons.Bank size={14} />, desc: 'Bank & cash balances', onClick: () => setModal('assets'), color: Colors.success },
      ]
    },
    {
      title: 'Custom Reports', icon: <Icons.Reports size={18} />, reports: [
        { label: 'Export Data', icon: <Icons.Download size={14} />, desc: 'Download as Excel', onClick: () => onNavigate('data-export'), color: Colors.primary },
        { label: 'GST Reports', icon: <Icons.Reports size={14} />, desc: 'GST filing exports', onClick: () => onNavigate('gst-reports'), color: Colors.accent },
      ]
    },
  ]

  const downloadFullReport = () => {
    const sheets = [
      {
        name: 'Overview', headers: ['Metric', 'Value'], colWidths: [30, 20],
        rows: [
          ['Total Sales', totalSales], ['Total Purchases', totalPurchases],
          ['Total Expenses', totalExpenses], ['Outstanding', outstanding],
          ['Net Profit', totalSales - totalPurchases - totalExpenses],
          ['Total Items', allItems.length], ['Total Parties', allParties.length],
        ]
      },
      {
        name: 'Stock', headers: ['Item', 'SKU', 'Stock', 'Min Level', 'Unit', 'Sell Price'], colWidths: [25, 15, 10, 10, 8, 15],
        rows: allItems.map(i => [i.name, i.sku, i.currentStock, i.minStockLevel, i.unit, i.sellingPrice])
      },
      {
        name: 'Sales', headers: ['Invoice', 'Party', 'Date', 'Amount', 'Status'], colWidths: [15, 20, 14, 15, 10],
        rows: sales.slice(0, 500).map(i => [i.invoiceNo, i.partyName, i.date, i.grandTotal, i.paymentStatus])
      },
    ]
    downloadXLSX('vyapar-setu-full-report.xlsx', sheets)
  }

  const reportXlsData = {
    name: 'Overview', headers: ['Metric', 'Value'], colWidths: [30, 20] as number[],
    rows: [
      ['Total Sales', totalSales], ['Total Purchases', totalPurchases],
      ['Total Expenses', totalExpenses], ['Outstanding', outstanding],
      ['Net Profit', totalSales - totalPurchases - totalExpenses],
      ['Total Items', allItems.length], ['Total Parties', allParties.length],
    ] as (string | number)[][],
  }

  const reportPdfData = {
    headers: ['Metric', 'Value'],
    rows: [
      ['Total Sales', totalSales], ['Total Purchases', totalPurchases],
      ['Total Expenses', totalExpenses], ['Outstanding', outstanding],
      ['Net Profit', totalSales - totalPurchases - totalExpenses],
      ['Total Items', allItems.length], ['Total Parties', allParties.length],
    ] as (string | number)[][],
    subTitle: `${allInvoices.length} invoices · ${allItems.length} items`,
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: Colors.textPrimary }}>Reports</div>
          <div style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 }}>{allInvoices.length} invoices · {allItems.length} items</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm }}>
          <ExportBar title="Reports" pdfData={reportPdfData} xlsData={reportXlsData} />
          <button onClick={downloadFullReport} style={{ ...s.primaryBtn, width: 'auto', padding: '8px 14px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Icons.Download size={14} /> All
          </button>
        </div>
      </div>

      {sections.map(section => (
        <Section key={section.title} title={section.title} icon={section.icon} defaultOpen={section.title === 'Dashboard' || section.title === 'Sales'}>
          {section.reports.map(report => (
            <ReportRow key={report.label} item={report} />
          ))}
        </Section>
      ))}

      {modal && (
        <Modal title={sections.flatMap(s => s.reports).find(r => r.label === modal)?.label || modal} onClose={() => setModal(null)}>
          {modalContent(modal)}
        </Modal>
      )}
    </div>
  )
}

const th: React.CSSProperties = { padding: '8px 8px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: Colors.textPrimary }
const td: React.CSSProperties = { padding: '6px 8px', fontSize: 12 }
