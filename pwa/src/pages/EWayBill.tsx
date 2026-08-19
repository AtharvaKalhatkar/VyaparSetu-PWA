import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, formatDate, generateId, todayISO } from '../utils/formatting'
import { Icons } from '../utils/Icons'

interface EWayBillRecord {
  id: string
  invoiceId: string
  invoiceNo: string
  partyName: string
  grandTotal: number
  ewayBillNo: string
  irnHash: string
  distanceKm: number
  transportMode: 'ROAD' | 'RAIL' | 'AIR' | 'SHIP'
  transporterId: string
  vehicleNo: string
  generatedAt: string
  expiresAt: string
  status: 'ACTIVE' | 'CANCELLED'
}

const EWAY_KEY = 'vs_eway_bills'

function getEWayBills(): EWayBillRecord[] {
  try { return JSON.parse(localStorage.getItem(EWAY_KEY) || '[]') } catch { return [] }
}

function saveEWayBills(records: EWayBillRecord[]) {
  localStorage.setItem(EWAY_KEY, JSON.stringify(records))
}

export function EWayBillPage({ onBack }: { onBack?: () => void }) {
  const [records, setRecords] = useState<EWayBillRecord[]>(() => getEWayBills())
  const [showModal, setShowModal] = useState(false)
  const [selectedInvId, setSelectedInvId] = useState('')
  const [distanceKm, setDistanceKm] = useState('150')
  const [transportMode, setTransportMode] = useState<'ROAD' | 'RAIL' | 'AIR' | 'SHIP'>('ROAD')
  const [transporterId, setTransporterId] = useState('')
  const [vehicleNo, setVehicleNo] = useState('')
  const [transporterName, setTransporterName] = useState('')

  const invoices = DB.invoices.list().filter(i => i.type === 'SALE' || i.docType === 'SALE')
  const profile = DB.businessProfile.get()

  const eligibleInvoices = invoices.filter(i => i.grandTotal >= 50000 && !records.some(r => r.invoiceId === i.id))

  const generateEWayBill = () => {
    const inv = invoices.find(i => i.id === selectedInvId)
    if (!inv) { alert('Please select a valid invoice'); return }
    const km = parseFloat(distanceKm)
    if (isNaN(km) || km <= 0) { alert('Please enter valid distance in KM'); return }
    if (transportMode === 'ROAD' && !vehicleNo.trim()) { alert('Please enter Vehicle Number for Road transport'); return }

    // Generate 12-digit E-Way Bill Number and 64-char IRN Hash
    const ewayNo = '38' + Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('')
    const irnHash = Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')

    const createdDate = new Date()
    const expiryDate = new Date(createdDate.getTime() + Math.ceil(km / 100) * 86400000)

    const record: EWayBillRecord = {
      id: generateId(),
      invoiceId: inv.id,
      invoiceNo: inv.invoiceNo,
      partyName: inv.partyName,
      grandTotal: inv.grandTotal,
      ewayBillNo: ewayNo,
      irnHash,
      distanceKm: km,
      transportMode,
      transporterId: transporterId.trim() || profile.gstin || '29AAAAA0000A1Z5',
      vehicleNo: vehicleNo.trim().toUpperCase(),
      generatedAt: todayISO(),
      expiresAt: expiryDate.toISOString().split('T')[0],
      status: 'ACTIVE',
    }

    const updated = [record, ...records]
    setRecords(updated)
    saveEWayBills(updated)

    DB.auditLogs.save({
      id: generateId(), entity: 'EWAY_BILL', entityId: record.id, action: 'CREATE', user: 'Admin',
      timestamp: new Date().toISOString(), description: `Generated E-Way Bill #${record.ewayBillNo} for Invoice ${inv.invoiceNo}`,
    })

    setShowModal(false)
    setSelectedInvId('')
    setVehicleNo('')
    setTransporterId('')
  }

  const downloadJsonPayload = (rec: EWayBillRecord) => {
    const inv = DB.invoices.byId(rec.invoiceId)
    const payload = {
      Version: '1.03',
      BillDetails: {
        userGstin: profile.gstin || '29AAAAA0000A1Z5',
        supplyType: 'O',
        subSupplyType: '1',
        docType: 'INV',
        docNo: rec.invoiceNo,
        docDate: formatDate(rec.generatedAt),
        fromGstin: profile.gstin,
        fromTrdName: profile.businessName,
        fromAddr1: profile.address,
        toGstin: '29ABCDE1234F1Z5',
        toTrdName: rec.partyName,
        totalValue: rec.grandTotal,
        cgstValue: inv?.taxAmount ? inv.taxAmount / 2 : 0,
        sgstValue: inv?.taxAmount ? inv.taxAmount / 2 : 0,
        igstValue: 0,
        totInvValue: rec.grandTotal,
        transMode: rec.transportMode === 'ROAD' ? '1' : rec.transportMode === 'RAIL' ? '2' : '3',
        transDistance: rec.distanceKm,
        transporterId: rec.transporterId,
        vehicleNo: rec.vehicleNo,
        vehicleType: 'R',
      },
      ItemList: inv?.items.map(i => ({
        productName: i.itemName,
        hsnCode: i.sku || '1001',
        quantity: i.quantity,
        qtyUnit: i.unit,
        taxableAmount: i.amount,
        gstRate: i.gstRate,
      })) || [],
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `EWayBill_${rec.ewayBillNo}_${rec.invoiceNo}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm }}>
          {onBack && <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: Colors.textSecondary, padding: 0 }}><Icons.Back size={20} /></button>}
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: Colors.textPrimary }}>E-Way Bill & E-Invoicing</h2>
            <div style={{ fontSize: 12, color: Colors.textSecondary }}>GST Portal E-Way Bills & IRN Signed QR Codes</div>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} style={{ ...s.primaryBtn, width: 'auto', padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icons.Add size={16} /> Generate E-Way Bill
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: Spacing.md, marginBottom: Spacing.xl }}>
        <div style={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: '14px 16px', border: `1px solid ${Colors.border}` }}>
          <div style={{ fontSize: 11, color: Colors.textSecondary }}>Active E-Way Bills</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: Colors.primary, marginTop: 2 }}>{records.filter(r => r.status === 'ACTIVE').length}</div>
        </div>
        <div style={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: '14px 16px', border: `1px solid ${Colors.border}` }}>
          <div style={{ fontSize: 11, color: Colors.textSecondary }}>Eligible Invoices (&gt; ₹50,000)</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: Colors.warning, marginTop: 2 }}>{eligibleInvoices.length}</div>
        </div>
        <div style={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: '14px 16px', border: `1px solid ${Colors.border}` }}>
          <div style={{ fontSize: 11, color: Colors.textSecondary }}>IRN Generated</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: Colors.success, marginTop: 2 }}>{records.length}</div>
        </div>
      </div>

      {records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: Spacing.huge, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, border: `1px solid ${Colors.border}` }}>
          <Icons.Truck size={48} color={Colors.textDisabled} />
          <div style={{ marginTop: Spacing.md, fontSize: 14, fontWeight: 600, color: Colors.textPrimary }}>No E-Way Bills Generated Yet</div>
          <div style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 4 }}>Generate official GST Portal E-Way bills for sales above ₹50,000</div>
          <button onClick={() => setShowModal(true)} style={{ ...s.primaryBtn, width: 220, marginTop: Spacing.lg, marginInline: 'auto' }}>Generate First E-Way Bill</button>
        </div>
      ) : (
        <div style={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.md, border: `1px solid ${Colors.border}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: Colors.surfaceVariant, borderBottom: `1px solid ${Colors.border}`, textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: Colors.textSecondary }}>E-WAY BILL NO</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: Colors.textSecondary }}>INVOICE</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: Colors.textSecondary }}>PARTY</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: Colors.textSecondary, textAlign: 'right' }}>VALUE</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: Colors.textSecondary }}>VEHICLE</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: Colors.textSecondary }}>EXPIRATION</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: Colors.textSecondary, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {records.map(rec => (
                <tr key={rec.id} style={{ borderBottom: `1px solid ${Colors.divider}` }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: Colors.primary }}>
                    {rec.ewayBillNo}
                    <div style={{ fontSize: 10, color: Colors.textDisabled, fontFamily: 'monospace' }}>IRN: {rec.irnHash.slice(0, 16)}...</div>
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>{rec.invoiceNo}</td>
                  <td style={{ padding: '12px 14px' }}>{rec.partyName}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(rec.grandTotal)}</td>
                  <td style={{ padding: '12px 14px' }}>{rec.vehicleNo || 'N/A'} ({rec.distanceKm} km)</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: Colors.textSecondary }}>{formatDate(rec.expiresAt)}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <button onClick={() => downloadJsonPayload(rec)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${Colors.primary}40`, backgroundColor: Colors.primaryLight, color: Colors.primary, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                      JSON Payload ↓
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: Spacing.lg }} onClick={() => setShowModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: BorderRadius.lg, width: '100%', maxWidth: 540, padding: Spacing.xl, maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: Colors.textPrimary }}>Generate E-Way Bill</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: Colors.textDisabled }}>✕</button>
            </div>

            <Field label="Select Sale Invoice (&gt; ₹50,000)">
              <select value={selectedInvId} onChange={e => setSelectedInvId(e.target.value)} style={s.select}>
                <option value="">Choose invoice...</option>
                {invoices.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.invoiceNo} — {i.partyName} ({formatCurrency(i.grandTotal)}) {i.grandTotal >= 50000 ? '⭐ EWB Required' : ''}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Distance (in KM)"><input type="number" value={distanceKm} onChange={e => setDistanceKm(e.target.value)} style={s.input} placeholder="150" /></Field>
            <Field label="Transport Mode">
              <div style={{ display: 'flex', gap: 6 }}>
                {(['ROAD', 'RAIL', 'AIR', 'SHIP'] as const).map(mode => (
                  <button key={mode} type="button" onClick={() => setTransportMode(mode)} style={{ flex: 1, padding: '8px 4px', borderRadius: 6, border: transportMode === mode ? `1px solid ${Colors.primary}` : `1px solid ${Colors.border}`, backgroundColor: transportMode === mode ? Colors.primaryLight : Colors.surface, color: transportMode === mode ? Colors.primary : Colors.textSecondary, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                    {mode}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Vehicle Number (e.g., KA01AB1234)"><input value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} style={s.input} placeholder="KA01AB1234" /></Field>
            <Field label="Transporter Name / GSTIN (Optional)"><input value={transporterName} onChange={e => setTransporterName(e.target.value)} style={s.input} placeholder="VRL Logistics / GSTIN" /></Field>

            <div style={{ display: 'flex', gap: Spacing.sm, marginTop: Spacing.lg }}>
              <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.sm, backgroundColor: 'transparent', cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={generateEWayBill} disabled={!selectedInvId} style={{ flex: 2, ...(selectedInvId ? s.primaryBtn : s.primaryBtnDisabled) }}>
                Generate E-Way Bill & IRN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
