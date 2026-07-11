import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius, Shadows } from '../theme'
import { s, statusColor, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, formatDate, generateId, todayISO } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { useToast } from '../utils/smooth'
import type { Delivery } from '../types'

const STATUSES: Delivery['status'][] = ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']
const PINCES = ['', '110001', '110002', '110003', '110004', '110005', '400001', '400002', '560001', '560002', '600001']

export function DeliveriesPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  const { toast } = useToast()
  const [tab, setTab] = useState<'list' | 'assign'>('list')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [search, setSearch] = useState('')

  const [invoiceId, setInvoiceId] = useState('')
  const [address, setAddress] = useState('')
  const [pincode, setPincode] = useState('')
  const [deliveryDate, setDeliveryDate] = useState(todayISO())

  const allDeliveries = DB.deliveries.list().sort((a, b) => a.date.localeCompare(b.date))

  const filtered = allDeliveries.filter(d => {
    if (filterStatus !== 'ALL' && d.status !== filterStatus) return false
    if (search && !d.partyName.toLowerCase().includes(search.toLowerCase()) && !d.invoiceNo.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const pendingInvoices = DB.invoices.list().filter(i => i.type === 'SALE' && !allDeliveries.find(d => d.invoiceId === i.id))

  const assignDelivery = () => {
    if (!invoiceId || !address.trim()) return
    const inv = DB.invoices.byId(invoiceId)
    if (!inv) return
    const del: Delivery = {
      id: generateId(), invoiceId, invoiceNo: inv.invoiceNo,
      partyId: inv.partyId, partyName: inv.partyName,
      address: address.trim(), pincode: pincode || undefined,
      area: pincode ? `Area ${pincode.slice(0, 3)}` : undefined,
      status: 'PENDING', date: todayISO(), deliveryDate: deliveryDate || undefined,
    }
    DB.deliveries.save(del)
    toast('Delivery assigned!', 'success')
    setInvoiceId(''); setAddress(''); setPincode('')
  }

  const updateStatus = (id: string, status: Delivery['status']) => {
    const d = DB.deliveries.byId(id)
    if (d) { d.status = status; DB.deliveries.save(d); toast(`Delivery ${status}`, 'info') }
  }

  const groupedByArea: Record<string, Delivery[]> = {}
  filtered.forEach(d => {
    const area = d.area || 'Unassigned'
    if (!groupedByArea[area]) groupedByArea[area] = []
    groupedByArea[area].push(d)
  })

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ display: 'flex', gap: Spacing.sm, marginBottom: Spacing.lg }}>
        <button onClick={() => setTab('list')} style={s.toggle(tab === 'list', Colors.primary)}>Deliveries</button>
        <button onClick={() => setTab('assign')} style={s.toggle(tab === 'assign', Colors.primary)}>Assign</button>
      </div>

      {tab === 'assign' ? (
        <>
          <div style={{ marginBottom: Spacing.md }}>
            <label style={s.label}>Invoice to Deliver</label>
            <select value={invoiceId} onChange={e => setInvoiceId(e.target.value)} style={s.select}>
              <option value="">Select invoice...</option>
              {pendingInvoices.map(inv => (
                <option key={inv.id} value={inv.id}>#{inv.invoiceNo} — {inv.partyName} — {formatCurrency(inv.grandTotal)}</option>
              ))}
            </select>
            {pendingInvoices.length === 0 && <div style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 4 }}>No pending invoices to deliver</div>}
          </div>
          <Field label="Delivery Address"><textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Full delivery address" rows={2} style={{ ...s.input, resize: 'vertical', fontFamily: 'inherit' }} /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: Spacing.sm }}>
            <Field label="Pincode">
              <select value={pincode} onChange={e => setPincode(e.target.value)} style={s.select}>
                <option value="">Select pincode</option>
                {PINCES.filter(p => p).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Delivery Date"><input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} style={s.input} /></Field>
          </div>
          <button onClick={assignDelivery} disabled={!invoiceId || !address.trim()} style={{ ...(!invoiceId || !address.trim() ? s.primaryBtnDisabled : s.primaryBtn) }}>
            <Icons.Truck size={16} /> Assign Delivery
          </button>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: Spacing.md }}>
            <button onClick={() => setFilterStatus('ALL')} style={s.chip(filterStatus === 'ALL', Colors.primary)}>All</button>
            {STATUSES.map(st => (
              <button key={st} onClick={() => setFilterStatus(st)} style={s.chip(filterStatus === st, statusColor(st))}>{st.replace('_', ' ')}</button>
            ))}
          </div>
          <div style={{ position: 'relative', marginBottom: Spacing.md }}>
            <span style={{ position: 'absolute', left: 12, top: 10, display: 'flex', alignItems: 'center', color: Colors.textDisabled }}><Icons.Search size={16} /></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by party or invoice..." style={{ ...s.searchBox, paddingLeft: 36 }} />
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: Spacing.huge, color: Colors.textDisabled }}>
              <Icons.Truck size={48} style={{ marginBottom: Spacing.md, opacity: 0.4 }} />
              <div>No deliveries found</div>
            </div>
          ) : (
            Object.entries(groupedByArea).map(([area, dels]) => (
              <div key={area} style={{ marginBottom: Spacing.md }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: Colors.textSecondary, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {area} ({dels.length})
                </div>
                {dels.map(d => (
                  <div key={d.id} style={{ ...s.card, marginBottom: Spacing.sm }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: Spacing.xs }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: Colors.textPrimary }}>{d.partyName}</span>
                      <span style={s.badge(statusColor(d.status))}>{d.status.replace('_', ' ')}</span>
                    </div>
                    <div style={{ fontSize: 12, color: Colors.textSecondary }}>Invoice #{d.invoiceNo} · {formatDate(d.date)}</div>
                    <div style={{ fontSize: 11, color: Colors.textDisabled, marginTop: 2, whiteSpace: 'pre-line' }}>{d.address}</div>
                    {d.deliveryDate && <div style={{ fontSize: 11, color: d.deliveryDate <= todayISO() ? Colors.error : Colors.success, marginTop: 2 }}>Deliver by: {formatDate(d.deliveryDate)}</div>}
                    <div style={{ display: 'flex', gap: 4, marginTop: Spacing.sm }}>
                      {d.status === 'PENDING' && <button onClick={() => updateStatus(d.id, 'IN_TRANSIT')} style={{ flex: 1, padding: '6px', backgroundColor: Colors.warning, color: '#fff', border: 'none', borderRadius: BorderRadius.sm, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Start Delivery</button>}
                      {d.status === 'IN_TRANSIT' && <button onClick={() => updateStatus(d.id, 'DELIVERED')} style={{ flex: 1, padding: '6px', backgroundColor: Colors.success, color: '#fff', border: 'none', borderRadius: BorderRadius.sm, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Mark Delivered</button>}
                      {d.status !== 'DELIVERED' && d.status !== 'CANCELLED' && <button onClick={() => updateStatus(d.id, 'CANCELLED')} style={{ padding: '6px 12px', backgroundColor: Colors.errorLight, color: Colors.error, border: 'none', borderRadius: BorderRadius.sm, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </>
      )}
    </div>
  )
}
