import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, todayISO } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { ExportBar } from '../utils/ExportBar'
import * as XLSX from 'xlsx'

export function GstReports({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [tab, setTab] = useState('GSTR1')
  const [month, setMonth] = useState(todayISO().slice(0, 7))
  const parties = DB.parties.list()
  const allInvs = DB.invoices.list()
  const [y, m] = month.split('-').map(Number)
  const monthStart = `${y}-${String(m).padStart(2, '0')}-01`
  const monthEnd = new Date(y, m, 0).toISOString().split('T')[0]
  const monthInvs = allInvs.filter(i => i.date >= monthStart && i.date <= monthEnd)
  const saleInvs = monthInvs.filter(i => i.type === 'SALE')
  const purchInvs = monthInvs.filter(i => i.type === 'PURCHASE')

  const Th = ({ children, right }: { children: React.ReactNode; right?: boolean }) => (
    <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 600, color: Colors.textSecondary, backgroundColor: Colors.surfaceVariant, borderBottom: `1px solid ${Colors.border}`, textAlign: right ? 'right' : 'left', whiteSpace: 'nowrap' }}>{children}</th>
  )
  const Td = ({ children, right }: { children: React.ReactNode; right?: boolean }) => (
    <td style={{ padding: '8px', fontSize: 12, color: Colors.textPrimary, borderBottom: `1px solid ${Colors.divider}`, textAlign: right ? 'right' : 'left' }}>{children}</td>
  )

  const renderGstr1 = () => {
    const items: { hsn: string; name: string; qty: number; rate: number; taxable: number; gstRate: number; tax: number; isB2B: boolean }[] = []
    saleInvs.forEach(inv => {
      const party = parties.find(p => p.id === inv.partyId)
      const isB2B = !!party?.gstin
      inv.items.forEach(item => {
        const taxable = (item.quantity * item.rate) - item.discountAmount
        const tax = taxable * item.gstRate / 100
        items.push({ hsn: '', name: item.itemName, qty: item.quantity, rate: item.rate, taxable, gstRate: item.gstRate, tax, isB2B })
      })
    })
    const b2b = items.filter(i => i.isB2B)
    const b2c = items.filter(i => !i.isB2B)
    const totalTaxable = items.reduce((s, i) => s + i.taxable, 0)
    const totalTax = items.reduce((s, i) => s + i.tax, 0)
    return items.length === 0 ? (
      <div style={{ textAlign: 'center', padding: Spacing.huge, color: Colors.textDisabled, fontSize: 14 }}><Icons.Reports size={32} /><br />No sales in this period</div>
    ) : (
      <>
        <div style={{ overflow: 'auto', ...s.card, padding: 0, marginBottom: Spacing.md }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><Th>HSN</Th><Th>Item</Th><Th right>Qty</Th><Th right>Rate</Th><Th right>Taxable</Th><Th right>GST%</Th><Th right>Tax</Th></tr></thead>
            <tbody>{items.map((it, i) => (<tr key={i}><Td>{it.hsn || '–'}</Td><Td>{it.name}</Td><Td right>{it.qty}</Td><Td right>{formatCurrency(it.rate)}</Td><Td right>{formatCurrency(it.taxable)}</Td><Td right>{it.gstRate}%</Td><Td right>{formatCurrency(it.tax)}</Td></tr>))}</tbody>
          </table>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: Spacing.md, marginBottom: Spacing.md }}>
          <div style={{ ...s.card, textAlign: 'center' }}><div style={{ fontSize: 11, color: Colors.textSecondary }}>Total Taxable Value</div><div style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrency(totalTaxable)}</div></div>
          <div style={{ ...s.card, textAlign: 'center' }}><div style={{ fontSize: 11, color: Colors.textSecondary }}>Total Tax</div><div style={{ fontSize: 20, fontWeight: 700, color: Colors.primary }}>{formatCurrency(totalTax)}</div></div>
        </div>
        <div style={{ ...s.card, marginBottom: Spacing.md }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: Spacing.sm }}>B2B / B2C Breakdown</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderBottom: `1px solid ${Colors.divider}` }}><span style={{ color: Colors.textSecondary }}>B2B ({b2b.length} items)</span><span style={{ fontWeight: 600 }}>{formatCurrency(b2b.reduce((s, i) => s + i.taxable, 0))}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}><span style={{ color: Colors.textSecondary }}>B2C ({b2c.length} items)</span><span style={{ fontWeight: 600 }}>{formatCurrency(b2c.reduce((s, i) => s + i.taxable, 0))}</span></div>
        </div>
      </>
    )
  }

  const renderGstr3b = () => {
    const allItems = [...saleInvs, ...purchInvs].flatMap(inv => {
      const taxable = inv.items.reduce((s, it) => s + (it.quantity * it.rate) - it.discountAmount, 0)
      const totalGst = inv.items.reduce((s, it) => s + ((it.quantity * it.rate) - it.discountAmount) * it.gstRate / 100, 0)
      return { type: inv.type === 'SALE' ? 'Sales' : 'Purchases', taxable, igst: totalGst, cgst: totalGst / 2, sgst: totalGst / 2 }
    })
    const summary = {
      sales: { taxable: allItems.filter(i => i.type === 'Sales').reduce((s, i) => s + i.taxable, 0), igst: allItems.filter(i => i.type === 'Sales').reduce((s, i) => s + i.igst, 0), cgst: allItems.filter(i => i.type === 'Sales').reduce((s, i) => s + i.cgst, 0), sgst: allItems.filter(i => i.type === 'Sales').reduce((s, i) => s + i.sgst, 0) },
      purchases: { taxable: allItems.filter(i => i.type === 'Purchases').reduce((s, i) => s + i.taxable, 0), igst: allItems.filter(i => i.type === 'Purchases').reduce((s, i) => s + i.igst, 0), cgst: allItems.filter(i => i.type === 'Purchases').reduce((s, i) => s + i.cgst, 0), sgst: allItems.filter(i => i.type === 'Purchases').reduce((s, i) => s + i.sgst, 0) },
    }
    const totalLiability = summary.sales.igst + summary.sales.cgst + summary.sales.sgst
    const totalCredit = summary.purchases.igst + summary.purchases.cgst + summary.purchases.sgst
    return allItems.length === 0 ? (
      <div style={{ textAlign: 'center', padding: Spacing.huge, color: Colors.textDisabled, fontSize: 14 }}><Icons.Reports size={32} /><br />No transactions in this period</div>
    ) : (
      <>
        <div style={{ overflow: 'auto', ...s.card, padding: 0, marginBottom: Spacing.md }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><Th>Type</Th><Th right>Taxable Value</Th><Th right>IGST</Th><Th right>CGST</Th><Th right>SGST</Th></tr></thead>
            <tbody>
              <tr><Td>Sales</Td><Td right>{formatCurrency(summary.sales.taxable)}</Td><Td right>{formatCurrency(summary.sales.igst)}</Td><Td right>{formatCurrency(summary.sales.cgst)}</Td><Td right>{formatCurrency(summary.sales.sgst)}</Td></tr>
              <tr><Td>Purchases</Td><Td right>{formatCurrency(summary.purchases.taxable)}</Td><Td right>{formatCurrency(summary.purchases.igst)}</Td><Td right>{formatCurrency(summary.purchases.cgst)}</Td><Td right>{formatCurrency(summary.purchases.sgst)}</Td></tr>
            </tbody>
          </table>
        </div>
        <div style={{ ...s.card, backgroundColor: Colors.primaryLight, borderColor: Colors.primary + '30' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}><span style={{ color: Colors.textSecondary }}>Total Tax Liability (Output)</span><span style={{ fontWeight: 700, color: Colors.error }}>{formatCurrency(totalLiability)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}><span style={{ color: Colors.textSecondary }}>Total ITC Available (Input)</span><span style={{ fontWeight: 700, color: Colors.success }}>{formatCurrency(totalCredit)}</span></div>
          <div style={{ borderTop: `1px solid ${Colors.border}`, margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 16 }}><span style={{ fontWeight: 700 }}>Net Tax Payable</span><span style={{ fontWeight: 700, color: Colors.primary }}>{formatCurrency(Math.max(0, totalLiability - totalCredit))}</span></div>
        </div>
      </>
    )
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ ...s.spaceBetween, marginBottom: Spacing.lg }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: Colors.textPrimary }}>GST Reports</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm }}>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ ...s.input, width: 140 }} />
          <ExportBar title={'gst-' + tab}
            xlsData={tab === 'GSTR1' ? {
              name: 'GSTR1', headers: ['Invoice No', 'Party', 'Item', 'HSN', 'Qty', 'Rate', 'Taxable', 'GST%', 'Tax'],
              rows: saleInvs.flatMap(inv => inv.items.map(it => [inv.invoiceNo, inv.partyName, it.itemName, it.sku || '', String(it.quantity), String(it.rate), String((it.quantity * it.rate) - it.discountAmount), String(it.gstRate) + '%', String(((it.quantity * it.rate) - it.discountAmount) * it.gstRate / 100)])),
            } : {
              name: 'GSTR3B', headers: ['Period', 'Sales Taxable', 'Sales Tax', 'Purchase Taxable', 'Purchase Tax'],
              rows: [[month,
                String(saleInvs.reduce((s, i) => s + i.items.reduce((s2, it) => s2 + (it.quantity * it.rate) - it.discountAmount, 0), 0)),
                String(saleInvs.reduce((s, i) => s + i.items.reduce((s2, it) => s2 + ((it.quantity * it.rate) - it.discountAmount) * it.gstRate / 100, 0), 0)),
                String(purchInvs.reduce((s, i) => s + i.items.reduce((s2, it) => s2 + (it.quantity * it.rate) - it.discountAmount, 0), 0)),
                String(purchInvs.reduce((s, i) => s + i.items.reduce((s2, it) => s2 + ((it.quantity * it.rate) - it.discountAmount) * it.gstRate / 100, 0), 0)),
              ]],
            }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: Spacing.sm, marginBottom: Spacing.lg }}>
        <button onClick={() => setTab('GSTR1')} style={s.toggle(tab === 'GSTR1', Colors.primary)}>GSTR-1</button>
        <button onClick={() => setTab('GSTR3B')} style={s.toggle(tab === 'GSTR3B', Colors.primary)}>GSTR-3B</button>
      </div>
      {tab === 'GSTR1' ? renderGstr1() : renderGstr3b()}
    </div>
  )
}
