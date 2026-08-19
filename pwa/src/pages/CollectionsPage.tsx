import React, { useState, useMemo } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, formatDate, generateId, todayISO } from '../utils/formatting'
import { SelectSheet } from '../utils/smooth'
import { Icons } from '../utils/Icons'
import { createLedgerEntry } from '../utils/invoiceOps'
import type { Invoice, Party } from '../types'

export function CollectionsPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [partySearch, setPartySearch] = useState('')
  const [selectedPartyId, setSelectedPartyId] = useState('')
  const [showPartySheet, setShowPartySheet] = useState(false)
  const [tab, setTab] = useState<'UNPAID' | 'PAID' | 'ALL'>('UNPAID')

  // Payment Collection Modal State
  const [collectingInvoice, setCollectingInvoice] = useState<Invoice | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'CASH' | 'CHEQUE' | 'BANK_TRANSFER'>('UPI')
  const [referenceNo, setReferenceNo] = useState('')
  const [salesmanName, setSalesmanName] = useState('')

  const allParties = useMemo(() => DB.parties.list().filter(p => p.type !== 'SUPPLIER'), [])
  const allInvoices = DB.invoices.list().filter(i => (!i.docType || i.docType === 'SALE') && i.type === 'SALE')
  const profile = DB.businessProfile.get()

  // Filter parties by search
  const filteredParties = useMemo(() => {
    if (!partySearch) return allParties
    const q = partySearch.toLowerCase()
    return allParties.filter(p => p.name.toLowerCase().includes(q) || (p.phone && p.phone.includes(q)))
  }, [allParties, partySearch])

  // Parties with unpaid dues sorted by highest due
  const topDueParties = useMemo(() => {
    return allParties.map(p => {
      const partyInvoices = allInvoices.filter(i => i.partyId === p.id && i.paymentStatus !== 'PAID')
      const totalDue = partyInvoices.reduce((s, i) => s + i.dueAmount, 0)
      return { party: p, totalDue, count: partyInvoices.length }
    }).filter(x => x.totalDue > 0).sort((a, b) => b.totalDue - a.totalDue)
  }, [allParties, allInvoices])

  const selectedParty = useMemo(() => {
    return selectedPartyId ? DB.parties.byId(selectedPartyId) : null
  }, [selectedPartyId])

  // Selected Customer Invoices
  const customerInvoices = useMemo(() => {
    if (!selectedPartyId) return []
    const list = allInvoices.filter(i => i.partyId === selectedPartyId)
    if (tab === 'UNPAID') return list.filter(i => i.paymentStatus !== 'PAID')
    if (tab === 'PAID') return list.filter(i => i.paymentStatus === 'PAID')
    return list
  }, [allInvoices, selectedPartyId, tab])

  const customerTotalDue = useMemo(() => {
    if (!selectedPartyId) return 0
    return allInvoices.filter(i => i.partyId === selectedPartyId && i.paymentStatus !== 'PAID').reduce((s, i) => s + i.dueAmount, 0)
  }, [allInvoices, selectedPartyId])

  // Mark 100% Paid instantly
  const handleMarkFullyPaid = (inv: Invoice) => {
    if (!confirm(`Mark Invoice #${inv.invoiceNo} (${formatCurrency(inv.dueAmount)}) as 100% Paid?`)) return
    executeCollection(inv, inv.dueAmount, 'UPI', '100% Mark Paid', 'Admin')
  }

  // Open Custom Payment Dialog
  const openCustomCollectModal = (inv: Invoice) => {
    setCollectingInvoice(inv)
    setCustomAmount(String(inv.dueAmount))
    setPaymentMode('UPI')
    setReferenceNo('')
    setSalesmanName('')
  }

  const executeCollection = (inv: Invoice, amount: number, mode: string, ref: string, salesman: string) => {
    if (amount <= 0) return
    const newPaid = inv.paidAmount + amount
    const newDue = Math.max(0, inv.grandTotal - newPaid)
    const newStatus = newDue === 0 ? 'PAID' : 'PARTIAL'

    const updatedInv: Invoice = {
      ...inv,
      paidAmount: newPaid,
      dueAmount: newDue,
      paymentStatus: newStatus,
    }

    DB.invoices.save(updatedInv)

    // Log Ledger Receipt
    createLedgerEntry(
      inv.partyId,
      inv.partyName,
      'RECEIPT',
      amount,
      `${mode}${ref ? ` (${ref})` : ''}`,
      inv.invoiceNo,
      `Payment Received for Invoice #${inv.invoiceNo}${salesman ? ` by ${salesman}` : ''}`,
      todayISO()
    )

    DB.auditLogs.save({
      id: generateId(),
      entity: 'COLLECTION',
      entityId: inv.id,
      action: 'UPDATE',
      user: salesman || 'Admin',
      timestamp: new Date().toISOString(),
      description: `Collected ₹${amount} for Invoice #${inv.invoiceNo} (${newStatus})`,
    })

    // Offer instant WhatsApp receipt to customer
    const party = DB.parties.byId(inv.partyId)
    if (party?.phone) {
      const cleanPhone = party.phone.replace(/[^0-9]/g, '')
      const msg = `🧾 *Payment Receipt - ${profile.businessName}*\n\n` +
        `Received *${formatCurrency(amount)}* via *${mode}* for Invoice *#${inv.invoiceNo}*\n` +
        (salesman ? `Collected by: *${salesman}*\n` : '') +
        `Remaining Due: *${formatCurrency(newDue)}*\n\nThank you for your payment!`

      const waUrl = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(msg)}`
      window.open(waUrl, '_blank')
    }

    setCollectingInvoice(null)
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      {/* Top Customer Search & Selection Bar */}
      <Field label="Search Customer for Payment Collection">
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: 12, display: 'flex', color: Colors.textDisabled }}>
            <Icons.Search size={16} />
          </span>
          <input
            value={partySearch}
            onChange={e => setPartySearch(e.target.value)}
            placeholder="Type customer name (e.g. Tata Kirana, Gupta Medical)..."
            style={{ ...s.searchBox, paddingLeft: 36, fontSize: 14 }}
          />
        </div>
      </Field>

      {/* Customer Quick Suggestions / Top Due Customers */}
      {!selectedPartyId && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: Colors.textSecondary, marginBottom: Spacing.sm }}>
            ⚠️ Customers with Outstanding Dues ({topDueParties.length})
          </div>
          {topDueParties.length === 0 ? (
            <div style={{ textAlign: 'center', padding: Spacing.huge, color: Colors.textDisabled }}>
              <Icons.Check size={48} color={Colors.success} style={{ marginBottom: Spacing.sm }} />
              <div>All customer invoices are fully paid!</div>
            </div>
          ) : (
            topDueParties.map(item => (
              <div
                key={item.party.id}
                onClick={() => { setSelectedPartyId(item.party.id); setPartySearch('') }}
                style={{
                  ...s.card,
                  marginBottom: Spacing.xs,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderLeft: `4px solid ${Colors.error}`,
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: Colors.textPrimary }}>{item.party.name}</div>
                  <div style={{ fontSize: 12, color: Colors.textSecondary }}>{item.party.phone || 'No phone'} · {item.count} pending invoice{item.count > 1 ? 's' : ''}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: Colors.textDisabled, textTransform: 'uppercase' }}>Due Balance</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: Colors.error }}>{formatCurrency(item.totalDue)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Selected Customer View */}
      {selectedParty && (
        <div>
          {/* Customer Header Card */}
          <div style={{ backgroundColor: Colors.surface, border: `1.5px solid ${Colors.primary}`, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md, boxShadow: '0 4px 12px rgba(30,64,175,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div>
                <span style={{ fontSize: 18, fontWeight: 800, color: Colors.textPrimary }}>{selectedParty.name}</span>
                <div style={{ fontSize: 12, color: Colors.textSecondary }}>📞 {selectedParty.phone || 'N/A'} {selectedParty.address ? `· 📍 ${selectedParty.address}` : ''}</div>
              </div>
              <button onClick={() => setSelectedPartyId('')} style={{ background: 'none', border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.sm, padding: '4px 10px', fontSize: 11, cursor: 'pointer', color: Colors.textSecondary }}>
                Switch Customer
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${Colors.border}`, paddingTop: Spacing.sm, marginTop: Spacing.sm }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: Colors.textDisabled, textTransform: 'uppercase' }}>Total Outstanding Due</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: customerTotalDue > 0 ? Colors.error : Colors.success }}>{formatCurrency(customerTotalDue)}</div>
              </div>

              <button
                onClick={() => onNavigate('party-ledger?id=' + selectedParty.id)}
                style={{ padding: '8px 14px', backgroundColor: Colors.primaryLight, color: Colors.primary, border: 'none', borderRadius: BorderRadius.sm, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                View Full Ledger
              </button>
            </div>
          </div>

          {/* Filter Tabs for Invoices */}
          <div style={s.toggleGroup}>
            <button onClick={() => setTab('UNPAID')} style={s.toggle(tab === 'UNPAID', Colors.error)}>Unpaid Invoices</button>
            <button onClick={() => setTab('PAID')} style={s.toggle(tab === 'PAID', Colors.success)}>Paid Invoices</button>
            <button onClick={() => setTab('ALL')} style={s.toggle(tab === 'ALL', Colors.primary)}>All Invoices</button>
          </div>

          {/* Invoice List */}
          {customerInvoices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: Spacing.huge, color: Colors.textDisabled }}>
              <Icons.Invoice size={48} style={{ marginBottom: Spacing.sm }} />
              <div>No {tab.toLowerCase()} invoices found for {selectedParty.name}</div>
            </div>
          ) : (
            customerInvoices.map(inv => (
              <div key={inv.id} style={{ ...s.card, marginBottom: Spacing.sm }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: 15, color: Colors.textPrimary }}>#{inv.invoiceNo}</span>
                    <span style={{ fontSize: 11, color: Colors.textDisabled, marginLeft: 8 }}>{formatDate(inv.date)}</span>
                  </div>
                  <span style={s.badge(inv.paymentStatus === 'PAID' ? Colors.success : inv.paymentStatus === 'PARTIAL' ? Colors.warning : Colors.error)}>
                    {inv.paymentStatus}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm, backgroundColor: Colors.surfaceVariant, padding: '8px 10px', borderRadius: BorderRadius.sm }}>
                  <div>
                    <div style={{ fontSize: 11, color: Colors.textSecondary }}>Grand Total: {formatCurrency(inv.grandTotal)}</div>
                    <div style={{ fontSize: 11, color: Colors.success }}>Paid: {formatCurrency(inv.paidAmount)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: Colors.textDisabled, textTransform: 'uppercase' }}>Remaining Due</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: inv.dueAmount > 0 ? Colors.error : Colors.success }}>{formatCurrency(inv.dueAmount)}</div>
                  </div>
                </div>

                {/* Collection Action Buttons */}
                {inv.dueAmount > 0 ? (
                  <div style={{ display: 'flex', gap: Spacing.xs }}>
                    <button
                      onClick={() => handleMarkFullyPaid(inv)}
                      style={{ flex: 1, padding: '8px 10px', backgroundColor: Colors.success, color: '#fff', border: 'none', borderRadius: BorderRadius.sm, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      ✓ Mark 100% Paid ({formatCurrency(inv.dueAmount)})
                    </button>

                    <button
                      onClick={() => openCustomCollectModal(inv)}
                      style={{ flex: 1, padding: '8px 10px', backgroundColor: Colors.primaryLight, color: Colors.primary, border: `1px solid ${Colors.primary}30`, borderRadius: BorderRadius.sm, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      💳 Partial Collect ₹
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: Colors.success, fontWeight: 700, textAlign: 'center', padding: '4px' }}>
                    ✅ Invoice Fully Settled
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Partial Collection Custom Dialog */}
      {collectingInvoice && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: Spacing.md }}>
          <div style={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.lg, width: '100%', maxWidth: 420 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: Colors.textPrimary, marginBottom: 4 }}>💳 Collect Payment for #{collectingInvoice.invoiceNo}</div>
            <div style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.md }}>Customer: <strong>{collectingInvoice.partyName}</strong></div>

            <Field label="Collection Amount (₹)">
              <input
                inputMode="decimal"
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value)}
                style={{ ...s.input, fontSize: 18, fontWeight: 800, color: Colors.primary }}
              />
            </Field>

            <Field label="Payment Mode">
              <select value={paymentMode} onChange={e => setPaymentMode(e.target.value as any)} style={s.select}>
                <option value="UPI">UPI (GPay / PhonePe / Paytm / QR)</option>
                <option value="CASH">Cash Payment</option>
                <option value="CHEQUE">Cheque / Demand Draft</option>
                <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS)</option>
              </select>
            </Field>

            <Field label="UTR / Ref Number (Optional)">
              <input value={referenceNo} onChange={e => setReferenceNo(e.target.value)} placeholder="e.g. UTR-98765432" style={s.input} />
            </Field>

            <Field label="Sales Representative Name">
              <input value={salesmanName} onChange={e => setSalesmanName(e.target.value)} placeholder="e.g. Rahul Sharma" style={s.input} />
            </Field>

            <div style={{ display: 'flex', gap: Spacing.sm, marginTop: Spacing.lg }}>
              <button onClick={() => setCollectingInvoice(null)} style={{ flex: 1, padding: '10px', background: 'none', border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.md, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => executeCollection(collectingInvoice, parseFloat(customAmount) || 0, paymentMode, referenceNo, salesmanName)} style={{ flex: 1, padding: '10px', backgroundColor: Colors.success, color: '#fff', border: 'none', borderRadius: BorderRadius.md, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Confirm Receipt ➔</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
