import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { Icons } from '../utils/Icons'
import { generateId, formatCurrency, formatDate } from '../utils/formatting'

interface TdsTcsEntry {
  id: string
  type: 'TDS' | 'TCS'
  section: string
  rate: number
  partyId: string
  invoiceNo: string
  invoiceAmount: number
  taxAmount: number
  paidDate: string
  challanNo?: string
  quarter: string
  financialYear: string
  status: 'PENDING' | 'PAID' | 'FILED'
}

const SECTIONS = {
  TDS: ['194A', '194C', '194D', '194H', '194I', '194J', '194O', '194Q'],
  TCS: ['206C(1)', '206C(1H)', '206C(1G)'],
}

const QUARTERS = ['Q1 (Apr-Jun)', 'Q2 (Jul-Sep)', 'Q3 (Oct-Dec)', 'Q4 (Jan-Mar)']

function getQuarter(dateStr: string): string {
  const m = new Date(dateStr).getMonth()
  if (m < 3) return 'Q4 (Jan-Mar)'
  if (m < 6) return 'Q1 (Apr-Jun)'
  if (m < 9) return 'Q2 (Jul-Sep)'
  return 'Q3 (Oct-Dec)'
}

export function TdsTcs() {
  const [activeTab, setActiveTab] = useState<'TDS' | 'TCS'>('TDS')
  const [entries, setEntries] = useState<TdsTcsEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem('vs_tdsTcsEntries') || '[]') } catch { return [] }
  })
  const [showForm, setShowForm] = useState(false)
  const [section, setSection] = useState(SECTIONS.TDS[0])
  const [rate, setRate] = useState('10')
  const [partyId, setPartyId] = useState('')
  const [invoiceNo, setInvoiceNo] = useState('')
  const [invoiceAmount, setInvoiceAmount] = useState('')
  const [taxAmount, setTaxAmount] = useState('')
  const [paidDate, setPaidDate] = useState('')
  const [challanNo, setChallanNo] = useState('')
  const [financialYear, setFinancialYear] = useState('2025-26')

  const parties = DB.parties.list()
  const fyOptions = ['2024-25', '2025-26', '2026-27']

  const filtered = entries.filter(e => e.type === activeTab)

  const autoCalcTax = (amount: string, r: string) => {
    setInvoiceAmount(amount)
    const amt = parseFloat(amount) || 0
    const rt = parseFloat(r) || 0
    setTaxAmount(String(Math.round(amt * rt / 100 * 100) / 100))
  }

  const addEntry = () => {
    const amt = parseFloat(invoiceAmount) || 0
    const tx = parseFloat(taxAmount) || 0
    const entry: TdsTcsEntry = {
      id: generateId(), type: activeTab, section, rate: parseFloat(rate) || 0,
      partyId, invoiceNo, invoiceAmount: amt, taxAmount: tx,
      paidDate: paidDate || new Date().toISOString().slice(0, 10),
      challanNo: challanNo || undefined,
      quarter: getQuarter(paidDate || new Date().toISOString().slice(0, 10)),
      financialYear, status: 'PENDING',
    }
    const updated = [...entries, entry]
    setEntries(updated)
    localStorage.setItem('vs_tdsTcsEntries', JSON.stringify(updated))
    DB.auditLogs.save({ id: generateId(), entity: 'TDS_TCS', entityId: entry.id, action: 'CREATE', user: 'Admin', description: `${activeTab} entry created for ${invoiceNo} — ₹${tx}`, timestamp: new Date().toISOString() })
    setShowForm(false)
    setInvoiceNo(''); setInvoiceAmount(''); setTaxAmount(''); setPaidDate(''); setChallanNo(''); setPartyId('')
  }

  const updateStatus = (id: string, status: 'PAID' | 'FILED') => {
    const updated = entries.map(e => e.id === id ? { ...e, status } : e)
    setEntries(updated)
    localStorage.setItem('vs_tdsTcsEntries', JSON.stringify(updated))
  }

  const deleteEntry = (id: string) => {
    const updated = entries.filter(e => e.id !== id)
    setEntries(updated)
    localStorage.setItem('vs_tdsTcsEntries', JSON.stringify(updated))
  }

  const summary = {
    total: filtered.reduce((s, e) => s + e.taxAmount, 0),
    pending: filtered.filter(e => e.status === 'PENDING').reduce((s, e) => s + e.taxAmount, 0),
    paid: filtered.filter(e => e.status === 'PAID').reduce((s, e) => s + e.taxAmount, 0),
    filed: filtered.filter(e => e.status === 'FILED').reduce((s, e) => s + e.taxAmount, 0),
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ display: 'flex', gap: Spacing.sm, marginBottom: Spacing.xl }}>
        {(['TDS', 'TCS'] as const).map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); setSection(SECTIONS[tab][0]) }} style={{
            flex: 1, padding: '12px', border: 'none', borderRadius: BorderRadius.sm, fontWeight: 600, fontSize: 14, cursor: 'pointer',
            backgroundColor: activeTab === tab ? Colors.primary : Colors.surfaceVariant, color: activeTab === tab ? '#fff' : Colors.textPrimary,
          }}>{tab} — {tab === 'TDS' ? 'Deducted at Source' : 'Collected at Source'}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: Spacing.sm, marginBottom: Spacing.xl }}>
        {[{label:'Total',value:summary.total,clr:Colors.primary},{label:'Pending',value:summary.pending,clr:'#E65100'},{label:'Paid',value:summary.paid,clr:Colors.warning},{label:'Filed',value:summary.filed,clr:Colors.success}].map(s => (
          <div key={s.label} style={{ background: Colors.surfaceVariant, padding: Spacing.md, borderRadius: BorderRadius.md, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: Colors.textSecondary }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.clr }}>{formatCurrency(s.value)}</div>
          </div>
        ))}
      </div>

      <button onClick={() => setShowForm(!showForm)} style={{ ...s.primaryBtn, marginBottom: Spacing.lg }}>
        <Icons.Add size={16} /> Add {activeTab} Entry
      </button>

      {showForm && (
        <div style={{ background: Colors.surfaceVariant, padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.lg }}>
          <Field label="Section">
            <select value={section} onChange={e => setSection(e.target.value)} style={s.select}>
              {SECTIONS[activeTab].map(sec => <option key={sec} value={sec}>{sec}</option>)}
            </select>
          </Field>
          <Field label="Rate (%)"><input type="number" value={rate} onChange={e => { setRate(e.target.value); autoCalcTax(invoiceAmount, e.target.value) }} style={s.input} /></Field>
          <Field label="Party">
            <select value={partyId} onChange={e => setPartyId(e.target.value)} style={s.select}>
              <option value="">Select party...</option>
              {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Invoice No"><input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} style={s.input} placeholder="INV-001" /></Field>
          <Field label="Invoice Amount"><input type="number" value={invoiceAmount} onChange={e => autoCalcTax(e.target.value, rate)} style={s.input} /></Field>
          <Field label={`${activeTab} Amount`}><input type="number" value={taxAmount} onChange={e => setTaxAmount(e.target.value)} style={s.input} /></Field>
          <Field label="Paid Date"><input type="date" value={paidDate} onChange={e => { setPaidDate(e.target.value); setChallanNo('') }} style={s.input} /></Field>
          <Field label="Challan No"><input value={challanNo} onChange={e => setChallanNo(e.target.value)} style={s.input} placeholder="Optional" /></Field>
          <Field label="Financial Year">
            <select value={financialYear} onChange={e => setFinancialYear(e.target.value)} style={s.select}>
              {fyOptions.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </Field>
          <button onClick={addEntry} style={s.primaryBtn}>Save Entry</button>
        </div>
      )}

      {filtered.length === 0 && <div style={{ textAlign: 'center', padding: Spacing.xxl, color: Colors.textSecondary, fontSize: 14 }}>No {activeTab} entries yet</div>}

      {filtered.map(e => (
        <div key={e.id} style={{ background: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, border: `1px solid ${Colors.divider}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 600, color: Colors.textPrimary }}>{e.section}</span>
              <span style={{ fontSize: 12, color: Colors.textSecondary, marginLeft: Spacing.sm }}>@{e.rate}%</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: BorderRadius.round, backgroundColor: e.status === 'PENDING' ? '#FFF3E0' : e.status === 'PAID' ? '#E3F2FD' : '#E8F5E9', color: e.status === 'PENDING' ? '#E65100' : e.status === 'PAID' ? '#1565C0' : '#2E7D32' }}>{e.status}</span>
          </div>
          <div style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.xs }}>{parties.find(p => p.id === e.partyId)?.name || 'Unknown'} · {e.invoiceNo}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: Colors.textSecondary }}>{activeTab} Amount: <strong style={{ color: Colors.textPrimary }}>{formatCurrency(e.taxAmount)}</strong></span>
            <span style={{ color: Colors.textSecondary }}>{e.quarter} · {formatDate(e.paidDate)}</span>
          </div>
          <div style={{ display: 'flex', gap: Spacing.xs, marginTop: Spacing.sm }}>
            {e.status === 'PENDING' && <><button onClick={() => updateStatus(e.id, 'PAID')} style={{ padding: '6px 12px', backgroundColor: '#E3F2FD', border: 'none', borderRadius: BorderRadius.sm, color: '#1565C0', fontSize: 11, cursor: 'pointer' }}>Mark Paid</button><button onClick={() => updateStatus(e.id, 'FILED')} style={{ padding: '6px 12px', backgroundColor: '#E8F5E9', border: 'none', borderRadius: BorderRadius.sm, color: '#2E7D32', fontSize: 11, cursor: 'pointer' }}>Mark Filed</button></>}
            {e.status === 'PAID' && <button onClick={() => updateStatus(e.id, 'FILED')} style={{ padding: '6px 12px', backgroundColor: '#E8F5E9', border: 'none', borderRadius: BorderRadius.sm, color: '#2E7D32', fontSize: 11, cursor: 'pointer' }}>Mark Filed</button>}
            <button onClick={() => deleteEntry(e.id)} style={{ padding: '6px 12px', backgroundColor: '#FFEBEE', border: 'none', borderRadius: BorderRadius.sm, color: Colors.error, fontSize: 11, cursor: 'pointer' }}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  )
}
