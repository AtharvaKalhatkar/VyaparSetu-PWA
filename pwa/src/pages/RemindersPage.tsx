import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius, Shadows } from '../theme'
import { s, statusColor } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, formatDate, generateId, todayISO } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { useToast } from '../utils/smooth'
import type { Invoice } from '../types'
import { getOptimalReminderTime } from '../utils/ai'

export function RemindersPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  const { toast } = useToast()
  const [filter, setFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'PARTIAL'>('PENDING')

  const allInvoices = DB.invoices.list().filter(i => i.type === 'SALE').sort((a, b) => a.date.localeCompare(b.date))
  const dueInvoices = allInvoices.filter(i => filter === 'ALL' || i.paymentStatus === filter)

  const reminders = DB.reminders.list()

  const getLastReminder = (invId: string) => {
    const r = reminders.filter(r => r.invoiceId === invId).sort((a, b) => b.sentDate.localeCompare(a.sentDate))
    return r.length > 0 ? r[0] : null
  }

  const sendWhatsApp = (inv: Invoice) => {
    const items = inv.items.map(i => `• ${i.itemName} x${i.quantity} ${i.unit} = ${formatCurrency(i.amount)}`).join('\n')
    const msg = `🧾 *Payment Reminder*\n\nInvoice: ${inv.invoiceNo}\nDate: ${formatDate(inv.date)}\nParty: ${inv.partyName}\nTotal: ₹${inv.grandTotal.toLocaleString()}\nDue: ₹${inv.dueAmount.toLocaleString()}\n\nPlease make the payment at the earliest.\n\nThank you`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')

    DB.reminders.save({ id: generateId(), invoiceId: inv.id, partyName: inv.partyName, invoiceNo: inv.invoiceNo, amount: inv.grandTotal, dueAmount: inv.dueAmount, sentDate: todayISO(), type: 'WHATSAPP' })
    toast('Reminder sent via WhatsApp!', 'success')
  }

  const sendBulkWhatsApp = () => {
    const unpaid = dueInvoices.filter(i => i.paymentStatus !== 'PAID')
    if (unpaid.length === 0) { toast('No unpaid invoices to remind', 'info'); return }
    const msgs = unpaid.map(inv => `🧾 *Payment Reminder*\n\nInvoice: ${inv.invoiceNo}\nDate: ${formatDate(inv.date)}\nParty: ${inv.partyName}\nTotal: ₹${inv.grandTotal.toLocaleString()}\nDue: ₹${inv.dueAmount.toLocaleString()}\n\nPlease make the payment at the earliest.`).join('\n\n---\n\n')
    window.open(`https://wa.me/?text=${encodeURIComponent(msgs)}`, '_blank')
    unpaid.forEach(inv => {
      DB.reminders.save({ id: generateId(), invoiceId: inv.id, partyName: inv.partyName, invoiceNo: inv.invoiceNo, amount: inv.grandTotal, dueAmount: inv.dueAmount, sentDate: todayISO(), type: 'WHATSAPP' })
    })
    toast(`${unpaid.length} reminder(s) sent!`, 'success')
  }

  const totalDue = dueInvoices.reduce((s, i) => s + i.dueAmount, 0)

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ ...s.card, marginBottom: Spacing.lg, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.warningLight, borderColor: Colors.warning + '30' }}>
        <div>
          <div style={{ fontSize: 11, color: Colors.textSecondary }}>Total Due</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: Colors.warning }}>{formatCurrency(totalDue)}</div>
          <div style={{ fontSize: 11, color: Colors.textSecondary }}>{dueInvoices.length} invoice(s) pending</div>
        </div>
        <button onClick={sendBulkWhatsApp} disabled={dueInvoices.length === 0} style={{ padding: '10px 18px', backgroundColor: '#25D366', color: '#fff', border: 'none', borderRadius: BorderRadius.sm, fontSize: 13, fontWeight: 600, cursor: dueInvoices.length > 0 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6, opacity: dueInvoices.length > 0 ? 1 : 0.5 }}>
          <Icons.WhatsApp size={18} /> Send All
        </button>
      </div>

      {dueInvoices.length > 0 && (() => {
        const parties = [...new Set(dueInvoices.map(i => i.partyId))]
        const insights = parties.slice(0, 5).map(id => ({ partyId: id, partyName: dueInvoices.find(i => i.partyId === id)?.partyName || '', insight: getOptimalReminderTime(id) }))
        const bestDay = insights.reduce((best, cur) => cur.insight.payProbability > best.insight.payProbability ? cur : best, insights[0])
        return (
          <div style={{ backgroundColor: Colors.primaryLight + '60', borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md, border: `1px solid ${Colors.primary}30`, fontSize: 12 }}>
            <div style={{ fontWeight: 600, color: Colors.primary, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icons.Star size={14} /> Smart Reminder Tip
            </div>
            <div style={{ color: Colors.textSecondary }}>
              Best time to send: <strong>{bestDay.insight.dayLabel} morning</strong> — {bestDay.insight.payProbability}% of parties pay when reminded then
            </div>
          </div>
        )
      })()}

      <div style={{ display: 'flex', gap: 6, marginBottom: Spacing.md }}>
        {(['ALL', 'PENDING', 'PARTIAL', 'PAID'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={s.chip(filter === f, f === 'ALL' ? Colors.primary : statusColor(f))}>
            {f === 'ALL' ? 'All' : f}
          </button>
        ))}
      </div>

      {dueInvoices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: Spacing.huge, color: Colors.textDisabled }}>
          <Icons.Bell size={48} style={{ marginBottom: Spacing.md, opacity: 0.4 }} />
          <div>No invoices to remind</div>
        </div>
      ) : dueInvoices.map(inv => {
        const last = getLastReminder(inv.id)
        return (
          <div key={inv.id} style={{ ...s.card, marginBottom: Spacing.sm }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: Spacing.xs }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: Colors.textPrimary }}>{inv.partyName}</span>
              <span style={s.badge(statusColor(inv.paymentStatus))}>{inv.paymentStatus}</span>
            </div>
            <div style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.xs }}>
              #{inv.invoiceNo} · {formatDate(inv.date)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 16, color: Colors.textPrimary }}>{formatCurrency(inv.grandTotal)}</span>
                <span style={{ fontSize: 12, color: Colors.error, marginLeft: Spacing.sm }}>Due: {formatCurrency(inv.dueAmount)}</span>
              </div>
              <button onClick={() => sendWhatsApp(inv)} style={{ padding: '7px 14px', backgroundColor: '#25D366', color: '#fff', border: 'none', borderRadius: BorderRadius.sm, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icons.WhatsApp size={14} /> Remind
              </button>
            </div>
            {last && <div style={{ fontSize: 10, color: Colors.textDisabled, marginTop: Spacing.xs }}>Last reminder: {formatDate(last.sentDate)}</div>}
          </div>
        )
      })}
    </div>
  )
}
