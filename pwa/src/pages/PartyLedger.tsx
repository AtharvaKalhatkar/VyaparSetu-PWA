import React, { useState, useMemo } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, statusColor } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, formatDate, todayISO } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { calculateCreditRisk } from '../utils/ai'

const PRINT_STYLE = `
  body { font-family: Arial, sans-serif; padding: 20px; color: #1A1A2E; margin: 0; }
  .no-print { display: none !important; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #E5E7EB; font-size: 12px; }
  th { background: #2B5DC2; color: #fff; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
  .sum { font-weight: 700; border-top: 2px solid #2B5DC2; font-size: 13px; }
  .debit { color: #D93025; }
  .credit { color: #1B8C3A; }
  .header { text-align: center; margin-bottom: 16px; }
  .header h2 { margin: 0; font-size: 18px; }
  .header p { margin: 4px 0; font-size: 12px; color: #666; }
  @page { margin: 10mm; }
  @media print { body { -webkit-print-color-adjust: exact; } }
`

export function PartyLedger({ partyId }: { partyId: string }) {
  const party = DB.parties.byId(partyId)
  const allEntries = useMemo(() => DB.ledger.forParty(partyId).reverse(), [partyId])
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const filtered = useMemo(() => {
    if (!fromDate && !toDate) return allEntries
    return allEntries.filter(e => {
      if (fromDate && e.date < fromDate) return false
      if (toDate && e.date > toDate) return false
      return true
    })
  }, [allEntries, fromDate, toDate])

  const openingBalance = useMemo(() => {
    if (!fromDate) return 0
    return allEntries.filter(e => e.date < fromDate).reduce((bal, e) => {
      if (e.type === 'SALE') return bal + e.amount
      if (e.type === 'PURCHASE') return bal - e.amount
      if (e.type === 'RECEIPT') return bal - e.amount
      if (e.type === 'PAYMENT') return bal + e.amount
      return bal
    }, 0)
  }, [allEntries, fromDate])

  const closingBalance = useMemo(() => {
    return filtered.reduce((bal, e) => {
      if (e.type === 'SALE') return bal + e.amount
      if (e.type === 'PURCHASE') return bal - e.amount
      if (e.type === 'RECEIPT') return bal - e.amount
      if (e.type === 'PAYMENT') return bal + e.amount
      return bal
    }, openingBalance)
  }, [filtered, openingBalance])

  const totals = useMemo(() => {
    let debit = 0, credit = 0
    filtered.forEach(e => {
      if (e.type === 'SALE' || e.type === 'PURCHASE') debit += e.amount
      else credit += e.amount
    })
    return { debit, credit }
  }, [filtered])

  const printStatement = () => {
    const w = window.open('', '_blank')
    if (!w) { window.print(); return }
    const rows = filtered.map(e => `
      <tr>
        <td>${formatDate(e.date)}</td>
        <td>${e.description}</td>
        <td>${e.reference}</td>
        <td>${e.mode}</td>
        <td class="debit">${e.type === 'SALE' || e.type === 'PURCHASE' ? formatCurrency(e.amount) : '-'}</td>
        <td class="credit">${e.type === 'RECEIPT' || e.type === 'PAYMENT' ? formatCurrency(e.amount) : '-'}</td>
      </tr>
    `).join('')
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Statement - ${party?.name}</title><style>${PRINT_STYLE}</style></head><body>
      <div class="header">
        <h2>${party?.name || 'Party'}</h2>
        <p>Account Statement${party?.phone ? ' · ' + party.phone : ''}</p>
        <p>${fromDate ? 'From ' + formatDate(fromDate) : 'All time'}${toDate ? ' to ' + formatDate(toDate) : ''}</p>
      </div>
      <p>Opening Balance: <strong>${formatCurrency(openingBalance)}</strong></p>
      <table>
        <tr><th>Date</th><th>Description</th><th>Reference</th><th>Mode</th><th>Debit</th><th>Credit</th></tr>
        ${rows}
        <tr class="sum">
          <td colspan="4" style="text-align:right">Total</td>
          <td class="debit">${formatCurrency(totals.debit)}</td>
          <td class="credit">${formatCurrency(totals.credit)}</td>
        </tr>
        <tr class="sum">
          <td colspan="5" style="text-align:right">Closing Balance</td>
          <td class="${closingBalance >= 0 ? 'debit' : 'credit'}">${formatCurrency(Math.abs(closingBalance))} ${closingBalance >= 0 ? 'Dr' : 'Cr'}</td>
        </tr>
      </table>
      <p style="text-align:center;color:#888;font-size:11px;margin-top:20px">Generated on ${new Date().toLocaleDateString()} · Vyapar Setu</p>
    </body></html>`)
    w.document.close()
    setTimeout(() => { w.focus(); w.print() }, 500)
  }

  if (!party) return <div style={{ padding: Spacing.lg }}>Party not found</div>

  const isDept = closingBalance >= 0

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xl }}>
        <div style={s.avatar(party.name.charAt(0), Colors.primary)}>{party.name.charAt(0)}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: Colors.textPrimary }}>{party.name}</div>
          <div style={{ fontSize: 12, color: Colors.textSecondary }}>{party.phone}{party.email ? ' · ' + party.email : ''}</div>
        </div>
        <button onClick={printStatement} className="no-print" style={{ background: Colors.primary, color: '#fff', border: 'none', borderRadius: 20, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icons.Print size={14} /> Print</button>
        <button onClick={() => { const msg = `👋 *Payment Reminder*\n\nDear ${party.name},\n\nYour outstanding balance is ₹${Math.abs(closingBalance).toLocaleString()}. Please clear the dues at the earliest.\n\nThank you`; window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank') }} className="no-print" style={{ background: '#25D366', color: '#fff', border: 'none', borderRadius: 20, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icons.WhatsApp size={14} /> Remind</button>
      </div>

      <div className="no-print" style={{ display: 'flex', gap: Spacing.sm, marginBottom: Spacing.md }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 11, color: Colors.textSecondary }}>From</span>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ ...s.input, padding: '8px 10px', fontSize: 13 }} />
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 11, color: Colors.textSecondary }}>To</span>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ ...s.input, padding: '8px 10px', fontSize: 13 }} />
        </div>
        {(fromDate || toDate) && <button onClick={() => { setFromDate(''); setToDate('') }} style={{ alignSelf: 'flex-end', padding: '8px 12px', background: 'none', border: 'none', color: Colors.error, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Clear</button>}
      </div>

      <div style={{ display: 'flex', gap: Spacing.md, marginBottom: Spacing.md }}>
        <div style={{ flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: '10px 12px', border: `1px solid ${Colors.border}` }}>
          <div style={{ fontSize: 10, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>Opening</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: Colors.textPrimary }}>{formatCurrency(Math.abs(openingBalance))} {openingBalance >= 0 ? 'Dr' : 'Cr'}</div>
        </div>
        <div style={{ flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: '10px 12px', border: `1px solid ${Colors.border}` }}>
          <div style={{ fontSize: 10, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>Closing</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: isDept ? Colors.error : Colors.success }}>{formatCurrency(Math.abs(closingBalance))} {isDept ? 'Dr' : 'Cr'}</div>
        </div>
      </div>

      {party && (() => {
        const risk = calculateCreditRisk(party.id)
        if (risk.totalOutstanding === 0 && risk.missedPayments === 0) return null
        const riskColors = { LOW: Colors.success, MEDIUM: Colors.warning, HIGH: Colors.error, CRITICAL: Colors.error }
        const riskBg = { LOW: Colors.successLight, MEDIUM: Colors.warningLight, HIGH: Colors.errorLight, CRITICAL: Colors.errorLight }
        return (
          <div style={{ backgroundColor: riskBg[risk.level], borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.lg, border: `1px solid ${riskColors[risk.level]}30` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: riskColors[risk.level], display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icons.Star size={14} /> Credit Risk: {risk.level}
              </div>
              <span style={{ fontSize: 20, fontWeight: 700, color: riskColors[risk.level] }}>{risk.score}/100</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: Spacing.xs, fontSize: 11, color: Colors.textSecondary }}>
              <span>On-time payment rate: <strong>{Math.round(risk.onTimeRate * 100)}%</strong></span>
              <span>Avg delay: <strong>{risk.averageDelayDays} days</strong></span>
              <span>Overdue invoices: <strong>{risk.missedPayments}</strong></span>
              <span>Outstanding: <strong>{formatCurrency(risk.totalOutstanding)}</strong></span>
            </div>
          </div>
        )
      })()}

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: Spacing.huge, color: Colors.textDisabled }}>
          <Icons.Book size={32} /><br />No entries
        </div>
      ) : (
        filtered.map(entry => (
          <div key={entry.id} style={s.listItem}>
            <div style={s.listStrip(entry.type === 'SALE' || entry.type === 'PURCHASE' ? Colors.primary : Colors.success)} />
            <div style={s.listBody}>
              <div style={{ ...s.spaceBetween }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: Colors.textPrimary }}>{entry.description}</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: entry.type === 'RECEIPT' || entry.type === 'PAYMENT' ? Colors.success : Colors.textPrimary }}>
                  {entry.type === 'RECEIPT' || entry.type === 'PAYMENT' ? '' : ''}{formatCurrency(entry.amount)}
                </span>
              </div>
              <div style={{ ...s.spaceBetween }}>
                <span style={{ fontSize: 11, color: Colors.textSecondary }}>{entry.reference} · {formatDate(entry.date)} · {entry.mode} · {entry.type}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: Colors.textSecondary }}>{formatCurrency(entry.runningBalance)}</span>
              </div>
            </div>
          </div>
        ))
      )}

      {filtered.length > 0 && (
        <div style={{ marginTop: Spacing.lg, borderTop: `2px solid ${Colors.primary}`, paddingTop: Spacing.md }}>
          <div style={{ ...s.spaceBetween, fontSize: 13, color: Colors.textSecondary }}><span>Total Debit (Sales + Purchases)</span><span style={{ fontWeight: 600, color: Colors.textPrimary }}>{formatCurrency(totals.debit)}</span></div>
          <div style={{ ...s.spaceBetween, fontSize: 13, color: Colors.textSecondary, marginTop: 4 }}><span>Total Credit (Receipts + Payments)</span><span style={{ fontWeight: 600, color: Colors.textPrimary }}>{formatCurrency(totals.credit)}</span></div>
          <div style={{ ...s.spaceBetween, marginTop: Spacing.sm, fontSize: 15, fontWeight: 700, color: Colors.textPrimary, borderTop: `1px solid ${Colors.border}`, paddingTop: Spacing.sm }}>
            <span>Closing Balance</span>
            <span style={{ color: isDept ? Colors.error : Colors.success }}>{formatCurrency(Math.abs(closingBalance))} {isDept ? 'Dr' : 'Cr'}</span>
          </div>
        </div>
      )}
    </div>
  )
}
