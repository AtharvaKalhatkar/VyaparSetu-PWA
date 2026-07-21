import React from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { Icons } from './Icons'
import { ContextMenu, type MenuItem } from './ContextMenu'
import { DB } from './storage'
import { formatCurrency } from './formatting'
import { todayISO } from './formatting'
import * as XLSX from 'xlsx'

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

function generateMonthlySummary(): string {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  const allInvoices = DB.invoices.list()
  const allItems = DB.items.list()
  const allParties = DB.parties.list()
  const allExpenses = DB.expenses.list()

  const monthInvs = allInvoices.filter(i => i.date >= monthStart && i.date <= monthEnd)
  const monthSales = monthInvs.filter(i => i.type === 'SALE')
  const monthPurchases = monthInvs.filter(i => i.type === 'PURCHASE')
  const monthExpenses = allExpenses.filter(e => e.date >= monthStart && e.date <= monthEnd)

  const totalSales = monthSales.reduce((s, i) => s + i.grandTotal, 0)
  const totalPurchases = monthPurchases.reduce((s, i) => s + i.grandTotal, 0)
  const totalExpenses = monthExpenses.reduce((s, e) => s + e.amount, 0)
  const outstanding = allInvoices.filter(i => i.paymentStatus !== 'PAID').reduce((s, i) => s + i.dueAmount, 0)

  const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' })
  return `Vyapar Setu - Monthly Report (${monthName})

Summary:
• Total Sales: ${formatCurrency(totalSales)}
• Total Purchases: ${formatCurrency(totalPurchases)}
• Total Expenses: ${formatCurrency(totalExpenses)}
• Outstanding: ${formatCurrency(outstanding)}
• Net: ${formatCurrency(totalSales - totalPurchases - totalExpenses)}
• Items: ${allItems.length}
• Parties: ${allParties.length}
• Invoices: ${monthSales.length}

Generated on ${new Date().toLocaleDateString('en-IN')}`
}

function shareOnWhatsApp(text: string) {
  const url = 'https://wa.me/?text=' + encodeURIComponent(text)
  window.open(url, '_blank')
}

function openPrintableReport(title: string, headers: string[], rows: (string | number)[][], subTitle?: string) {
  const settings = DB.settings.get()
  const profile = DB.businessProfile.get()
  const bizName = profile?.businessName || 'Vyapar Setu'
  const colCount = headers.length
  const totalRow = rows.find(r => r[0] === 'Total' || r[0] === 'Grand Total')

  const formatRow = (row: (string | number)[]) => {
    return row.map((c, i) => {
      if (typeof c === 'number') return c.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      return String(c)
    }).join('</td><td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px">')
  }

  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title} — ${bizName}</title>
<style>
  @page { margin: 15mm 10mm; size: A4 portrait; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; color: #1a1a2e; padding: 20px; }
  .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #2B5DC2; padding-bottom: 16px; }
  .header h1 { font-size: 20px; color: #2B5DC2; margin-bottom: 4px; }
  .header .biz { font-size: 14px; color: #6b7280; }
  .header .sub { font-size: 12px; color: #9ca3af; margin-top: 4px; }
  .summary { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
  .summary-item { flex:1; min-width:140px; padding:10px 14px; background:#f8f9fc; border-radius:8px; border:1px solid #e5e7eb; }
  .summary-item .label { font-size: 11px; color:#6b7280; margin-bottom:4px; }
  .summary-item .value { font-size:16px; font-weight:700; }
  table { width:100%; border-collapse:collapse; margin-bottom:12px; }
  th { background:#2B5DC2; color:#fff; padding:8px 10px; font-size:12px; font-weight:600; text-align:left; }
  td { padding:6px 10px; font-size:12px; border-bottom:1px solid #e5e7eb; }
  tr:nth-child(even) td { background:#f8f9fc; }
  .total-row td { font-weight:700; border-top:2px solid #2B5DC2; background:#e8eefb !important; }
  .footer { text-align:center; font-size:10px; color:#9ca3af; margin-top:24px; padding-top:12px; border-top:1px solid #e5e7eb; }
  @media print { body { padding:0; } .no-print { display:none !important; } }
</style></head><body>
  <div class="header">
    <h1>${title}</h1>
    <div class="biz">${bizName}</div>
    ${subTitle ? `<div class="sub">${subTitle}</div>` : ''}
  </div>
  <table>
    <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((row, i) => `<tr${totalRow && row[0] === totalRow[0] ? ' class="total-row"' : ''}><td>${formatRow(row)}</td></tr>`).join('\n')}</tbody>
  </table>
  <div class="footer">Generated on ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
  <div class="no-print" style="text-align:center;margin-top:16px;"><button onclick="window.print()" style="padding:10px 24px;background:#2B5DC2;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-weight:600">Print / Save PDF</button></div>
</body></html>
  `)
  win.document.close()
}

interface ExportBarProps {
  title?: string
  onPDF?: () => void
  onXLS?: () => void
  menuItems?: MenuItem[]
  xlsData?: { name: string; headers: string[]; rows: (string | number)[][]; colWidths?: number[] }
  pdfData?: { headers: string[]; rows: (string | number)[][]; subTitle?: string }
}

export function ExportBar({ title, onPDF, onXLS, menuItems, xlsData, pdfData }: ExportBarProps) {
  const handlePDF = onPDF || (pdfData ? () => {
    openPrintableReport(title || 'Report', pdfData.headers, pdfData.rows, pdfData.subTitle)
  } : () => window.print())

  const handleXLS = onXLS || (xlsData ? () => {
    downloadXLSX((title || 'export') + '.xlsx', [{ ...xlsData }])
  } : undefined)

  const defaultMenuItems: MenuItem[] = [
    { label: 'Share with CA on WhatsApp', icon: <Icons.WhatsApp size={14} />, onClick: () => shareOnWhatsApp(generateMonthlySummary()), color: '#25D366' },
  ]

  const items = menuItems ? [...menuItems, ...defaultMenuItems] : defaultMenuItems

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      <button onClick={handlePDF} title="Export PDF" style={{
        padding: '6px 10px', border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.sm,
        backgroundColor: Colors.surface, cursor: 'pointer', color: Colors.error, fontSize: 11,
        fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3,
      }}>
        <Icons.Download size={13} /> PDF
      </button>
      {handleXLS && (
        <button onClick={handleXLS} title="Export XLS" style={{
          padding: '6px 10px', border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.sm,
          backgroundColor: Colors.surface, cursor: 'pointer', color: Colors.success, fontSize: 11,
          fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3,
        }}>
          <Icons.Download size={13} /> XLS
        </button>
      )}
      <ContextMenu trigger={<button title="More options" style={{
        padding: '6px 8px', border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.sm,
        backgroundColor: Colors.surface, cursor: 'pointer', color: Colors.textSecondary, fontSize: 11,
        fontWeight: 600, display: 'inline-flex', alignItems: 'center',
      }}>
        <Icons.More size={16} />
      </button>}
        items={items}
      />
    </div>
  )
}

export { downloadXLSX, openPrintableReport }
