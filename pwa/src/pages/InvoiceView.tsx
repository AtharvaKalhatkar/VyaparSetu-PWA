import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency as fc, formatDate } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import type { Invoice, InvoiceItem, InvoiceTemplate } from '../types'

function formatCurrency(n: number) { return fc(n) }

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function numberToWords(n: number): string {
  if (n === 0) return 'Zero'
  const num = Math.round(n)
  const convert = (m: number): string => {
    if (m < 20) return ones[m]
    if (m < 100) return tens[Math.floor(m / 10)] + (m % 10 ? ' ' + ones[m % 10] : '')
    if (m < 1000) return ones[Math.floor(m / 100)] + ' Hundred' + (m % 100 ? ' ' + convert(m % 100) : '')
    if (m < 100000) return convert(Math.floor(m / 1000)) + ' Thousand' + (m % 1000 ? ' ' + convert(m % 1000) : '')
    if (m < 10000000) return convert(Math.floor(m / 100000)) + ' Lakh' + (m % 100000 ? ' ' + convert(m % 100000) : '')
    return convert(Math.floor(m / 10000000)) + ' Crore' + (m % 10000000 ? ' ' + convert(m % 10000000) : '')
  }
  return convert(num) + ' Only'
}

import { printThermalInvoice } from '../utils/thermalPrinter'
import { sanitizeHtml } from '../utils/security'

export function InvoiceView({ invoiceId, onNavigate, autoPrint }: { invoiceId: string; onNavigate?: (p: string) => void; autoPrint?: boolean }) {
  const inv = DB.invoices.byId(invoiceId)

  React.useEffect(() => {
    if (autoPrint) {
      const t = setTimeout(() => { printInvoice() }, 500)
      return () => clearTimeout(t)
    }
  }, [autoPrint])

  if (!inv || !inv.items || !inv.invoiceNo) return <div style={{ padding: Spacing.lg, color: Colors.textSecondary }}>Invoice not found</div>

  const settings = DB.settings.get()
  const profile = DB.businessProfile.get()
  const [currentTemplate, setCurrentTemplate] = useState<InvoiceTemplate>(settings.template || 'STANDARD')

  const printInvoice = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) { window.print(); return }
    const allStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map(el => el.outerHTML).join('\n')
    const contentHtml = sanitizeHtml(document.getElementById('invoice-preview')?.innerHTML || '<p>Preview not available</p>')
    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${inv.invoiceNo}</title>${allStyles}<style>body { margin: 0; padding: 15px; font-family: 'Segoe UI', Arial, sans-serif; } .no-print { display: none !important; } @page { margin: 10mm; } @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }</style></head><body>
      ${contentHtml}
    </body></html>`)
    printWindow.document.close()
    setTimeout(() => { try { printWindow.print(); printWindow.close() } catch (e) { console.error('print failed', e) } }, 800)
  }

  const shareAsPdf = () => {
    const w = window.open('', '_blank')
    if (!w) { window.print(); return }
    const allStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map(el => el.outerHTML).join('\n')
    const contentHtml = sanitizeHtml(document.getElementById('invoice-preview')?.innerHTML || '<p>Preview not available</p>')
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${inv.invoiceNo}</title>${allStyles}<style>body { margin: 20px; font-family: 'Segoe UI', Arial, sans-serif; } .no-print { display: none !important; } @page { margin: 10mm; }</style></head><body>
      ${contentHtml}
      <p style="text-align:center;color:#888;font-size:11px">Use Ctrl+P → Save as PDF to download</p>
    </body></html>`)
    w.document.close()
    setTimeout(() => { try { w.focus(); w.print() } catch (e) { console.error('print failed', e) } }, 800)
  }

  const shareWhatsApp = () => {
    const total = formatCurrency(inv.grandTotal)
    const items = inv.items.map(i => `• ${i.itemName} x${i.quantity} ${i.unit} = ${formatCurrency(i.amount)}`).join('\n')
    const msg = `📄 *Invoice: ${settings.prefix}-${inv.invoiceNo.replace(/^[A-Z]+-/, '')}*\n📅 ${formatDate(inv.date)}\n👤 ${inv.partyName}\n\n${items}\n\n💰 *Total: ${total}*\n${settings.defaultTerms ? '\n' + settings.defaultTerms : ''}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div className="no-print" style={{ marginBottom: Spacing.md, display: 'flex', gap: Spacing.sm, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={printInvoice} style={{ ...s.primaryBtn, width: 'auto', padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: Spacing.sm, backgroundColor: '#333' }}><Icons.Print size={16} /> Print / PDF</button>
        <button onClick={() => printThermalInvoice(inv, 58)} style={{ ...s.primaryBtn, width: 'auto', padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: Spacing.sm, backgroundColor: '#059669' }}>🖨️ Thermal (Bluetooth)</button>
        <button onClick={shareAsPdf} style={{ ...s.primaryBtn, width: 'auto', padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: Spacing.sm, backgroundColor: '#1565C0' }}><Icons.Download size={16} /> Share PDF</button>
        <button onClick={shareWhatsApp} style={{ ...s.primaryBtn, width: 'auto', padding: '10px 20px', display: 'inline-flex', alignItems: 'center', gap: Spacing.sm, backgroundColor: '#25D366' }}><Icons.WhatsApp size={16} /> WhatsApp</button>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: Colors.surface, padding: '8px 14px', borderRadius: BorderRadius.md, border: `1px solid ${Colors.border}` }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: Colors.textSecondary }}>Format:</span>
          <select
            value={currentTemplate}
            onChange={e => {
              const t = e.target.value as InvoiceTemplate
              setCurrentTemplate(t)
              DB.settings.save({ ...settings, template: t })
            }}
            style={{ fontSize: 13, fontWeight: 600, border: 'none', background: 'transparent', cursor: 'pointer', outline: 'none', color: Colors.primary }}
          >
            <option value="STANDARD">Standard</option>
            <option value="COMPACT">Compact</option>
            <option value="DETAILED">Detailed Tax</option>
            <option value="CLASSIC">Classic</option>
            <option value="MODERN">Modern</option>
            <option value="PREMIUM">Premium</option>
            <option value="ELEGANT">Elegant</option>
            <option value="BOLD">Bold</option>
            <option value="NATURE">Nature</option>
            <option value="OCEAN">Ocean</option>
            <option value="SUNSET">Sunset</option>
            <option value="CORPORATE">Corporate</option>
            <option value="DOTTED">Dotted / Dot-Matrix</option>
          </select>
        </div>
        {onNavigate && <button onClick={() => onNavigate('returns?sourceId=' + invoiceId)} style={{ ...s.primaryBtn, width: 'auto', padding: '10px 20px', display: 'inline-flex', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.error }}><Icons.Refresh size={16} /> Return</button>}
      </div>

      <div id="invoice-preview" style={{
        backgroundColor: '#fff', borderRadius: BorderRadius.md, padding: Spacing.xxl,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)', maxWidth: 800, margin: '0 auto', color: '#333',
        fontFamily: "'Segoe UI', Arial, sans-serif", position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
        {currentTemplate === 'DOTTED' ? <DottedTemplate inv={inv} settings={{ ...settings, template: currentTemplate }} profile={profile} /> :
         currentTemplate === 'COMPACT' ? <CompactTemplate inv={inv} settings={{ ...settings, template: currentTemplate }} profile={profile} /> :
         currentTemplate === 'DETAILED' ? <DetailedTemplate inv={inv} settings={{ ...settings, template: currentTemplate }} profile={profile} /> :
         currentTemplate === 'CLASSIC' ? <ClassicTemplate inv={inv} settings={{ ...settings, template: currentTemplate }} profile={profile} /> :
         currentTemplate === 'MODERN' ? <ModernTemplate inv={inv} settings={{ ...settings, template: currentTemplate }} profile={profile} /> :
         currentTemplate === 'PREMIUM' ? <PremiumTemplate inv={inv} settings={{ ...settings, template: currentTemplate }} profile={profile} /> :
         currentTemplate === 'ELEGANT' ? <ElegantTemplate inv={inv} settings={{ ...settings, template: currentTemplate }} profile={profile} /> :
         currentTemplate === 'BOLD' ? <BoldTemplate inv={inv} settings={{ ...settings, template: currentTemplate }} profile={profile} /> :
         currentTemplate === 'NATURE' ? <NatureTemplate inv={inv} settings={{ ...settings, template: currentTemplate }} profile={profile} /> :
         currentTemplate === 'OCEAN' ? <OceanTemplate inv={inv} settings={{ ...settings, template: currentTemplate }} profile={profile} /> :
         currentTemplate === 'SUNSET' ? <SunsetTemplate inv={inv} settings={{ ...settings, template: currentTemplate }} profile={profile} /> :
         currentTemplate === 'CORPORATE' ? <CorporateTemplate inv={inv} settings={{ ...settings, template: currentTemplate }} profile={profile} /> :
           <StandardTemplate inv={inv} settings={{ ...settings, template: currentTemplate }} profile={profile} />}
          
          {/* Watermark: Created by VyaparSetu */}
          <div style={{
            marginTop: 20,
            paddingTop: 8,
            borderTop: '1px dashed #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontSize: 10,
            fontWeight: 600,
            color: '#94A3B8',
            letterSpacing: '0.5px',
          }}>
            <span>⚡ Created by</span>
            <span style={{ color: '#2B5DC2', fontWeight: 800 }}>VyaparSetu</span>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          #invoice-preview { box-shadow: none; border-radius: 0; padding: 15px; max-width: 100%; }
          @page { margin: 10mm; }
        }
      `}</style>
    </div>
  )
}

const TC = (c: string) => c || '#1B5E20'

function InvoiceTable({ items, showGst }: { items: InvoiceItem[]; showGst: boolean }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ backgroundColor: '#1B5E20', color: '#fff' }}>
          <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>#</th>
          <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>HSN/SAC</th>
          <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>Description</th>
          <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 600, fontSize: 11 }}>Qty</th>
          <th style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 600, fontSize: 11 }}>Rate</th>
          {showGst && <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 600, fontSize: 11 }}>GST%</th>}
          {showGst && <th style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 600, fontSize: 11 }}>CGST</th>}
          {showGst && <th style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 600, fontSize: 11 }}>SGST</th>}
          <th style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 600, fontSize: 11 }}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => {
          const cgst = showGst ? item.amount * item.gstRate / 200 : 0
          const sgst = showGst ? item.amount * item.gstRate / 200 : 0
          return (
            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '7px 6px', color: '#666', fontSize: 11 }}>{i + 1}</td>
              <td style={{ padding: '7px 6px', fontSize: 10, color: '#888' }}>{item.sku || '–'}</td>
              <td style={{ padding: '7px 6px', fontWeight: 500 }}>{item.itemName}</td>
              <td style={{ padding: '7px 6px', textAlign: 'center', fontSize: 12 }}>{item.quantity} {item.unit}</td>
              <td style={{ padding: '7px 6px', textAlign: 'right' }}>{formatCurrency(item.rate)}</td>
              {showGst && <td style={{ padding: '7px 6px', textAlign: 'center', fontSize: 11 }}>{item.gstRate}%</td>}
              {showGst && <td style={{ padding: '7px 6px', textAlign: 'right', fontSize: 10 }}>{formatCurrency(cgst)}</td>}
              {showGst && <td style={{ padding: '7px 6px', textAlign: 'right', fontSize: 10 }}>{formatCurrency(sgst)}</td>}
              <td style={{ padding: '7px 6px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.amount)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function TotalsBlock({ inv, settings, c }: { inv: Invoice; settings: any; c: string }) {
  const gstRates = [...new Set(inv.items.map(i => i.gstRate).filter(r => r > 0))].sort()
  const discountRatio = inv.subtotal > 0 ? Math.max(0, (inv.subtotal - inv.discountAmount) / inv.subtotal) : 1
  return (
    <div style={{
      backgroundColor: '#F8FAFC',
      border: `1.5px solid ${c}30`,
      borderRadius: 8,
      padding: '12px 16px',
      minWidth: 260,
      fontSize: 13,
      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: '#64748B', fontSize: 12 }}>Subtotal (Taxable):</span>
        <span style={{ fontWeight: 600, color: '#334155' }}>{formatCurrency(inv.subtotal)}</span>
      </div>
      {inv.discountAmount > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ color: '#64748B', fontSize: 12 }}>Total Discount:</span>
          <span style={{ fontWeight: 600, color: '#EF4444' }}>-{formatCurrency(inv.discountAmount)}</span>
        </div>
      )}
      {settings.enableGst && gstRates.map(r => (
        <React.Fragment key={r}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ color: '#64748B', fontSize: 11 }}>CGST ({r / 2}%):</span>
            <span style={{ fontWeight: 600, color: '#334155', fontSize: 12 }}>
              {formatCurrency(inv.items.reduce((s, i) => i.gstRate === r ? s + i.amount * i.gstRate / 200 * discountRatio : s, 0))}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ color: '#64748B', fontSize: 11 }}>SGST ({r / 2}%):</span>
            <span style={{ fontWeight: 600, color: '#334155', fontSize: 12 }}>
              {formatCurrency(inv.items.reduce((s, i) => i.gstRate === r ? s + i.amount * i.gstRate / 200 * discountRatio : s, 0))}
            </span>
          </div>
        </React.Fragment>
      ))}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 8,
        borderTop: `2px solid ${c}`,
        paddingTop: 8,
        alignItems: 'center',
      }}>
        <span style={{ fontWeight: 800, fontSize: 15, color: c }}>Grand Total:</span>
        <span style={{ fontWeight: 800, fontSize: 19, color: c }}>{formatCurrency(inv.grandTotal)}</span>
      </div>
      {inv.paidAmount > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 12, color: '#16A34A', fontWeight: 600 }}>
          <span>Amount Paid:</span>
          <span>{formatCurrency(inv.paidAmount)}</span>
        </div>
      )}
      {inv.dueAmount > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, fontSize: 12, color: '#DC2626', fontWeight: 700 }}>
          <span>Balance Due:</span>
          <span>{formatCurrency(inv.dueAmount)}</span>
        </div>
      )}
    </div>
  )
}

function BankFooter({ settings, profile, dueAmount, invoiceNo }: { settings: any; profile: any; dueAmount?: number; invoiceNo?: string }) {
  const upiId = profile.upiId
  const amt = dueAmount != null ? dueAmount : 0
  const upiUri = upiId ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(profile.businessName || 'Business')}&am=${amt}&tn=${encodeURIComponent('Inv ' + (invoiceNo || ''))}` : ''
  const qrUrl = upiUri ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(upiUri)}` : ''

  return (
    <div style={{ marginTop: 16, borderTop: '1px solid #E2E8F0', paddingTop: 12, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
      <div style={{ flex: 1, fontSize: 11, color: '#475569', lineHeight: 1.6 }}>
        {settings.showBank && profile.bankName && (
          <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, padding: '8px 12px', marginBottom: 8 }}>
            <strong style={{ color: '#1E293B', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🏦 Bank Details for Direct Transfer:</strong><br />
            <span>Bank: <strong>{profile.bankName}</strong></span>
            {profile.bankAccount ? <span> · A/C No: <strong>{profile.bankAccount}</strong></span> : ''}
            {profile.bankIfsc ? <span> · IFSC: <strong>{profile.bankIfsc}</strong></span> : ''}
          </div>
        )}
        {upiId && (
          <div style={{ color: '#0F766E', fontWeight: 600 }}>
            📱 <strong>UPI ID:</strong> {upiId}
          </div>
        )}
        {settings.defaultTerms && (
          <div style={{ marginTop: 8, fontSize: 10, color: '#64748B' }}>
            <strong>Terms & Conditions:</strong><br />
            {settings.defaultTerms}
          </div>
        )}
      </div>

      {upiId && amt > 0 && (
        <div style={{ textAlign: 'center', backgroundColor: '#F0FDFA', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #0D948840', flexShrink: 0 }}>
          <img src={qrUrl} alt="UPI QR Code" style={{ width: 90, height: 90, display: 'block', margin: '0 auto', borderRadius: 4 }} />
          <div style={{ fontSize: 10, fontWeight: 800, color: '#0D9488', marginTop: 4 }}>Scan & Pay ₹{amt.toLocaleString()}</div>
          <div style={{ fontSize: 8, color: '#64748B' }}>GPay / PhonePe / Paytm / BHIM</div>
        </div>
      )}

      {/* Authorized Signatory Box */}
      <div style={{ textAlign: 'center', minWidth: 160, alignSelf: 'flex-end', marginLeft: 16 }}>
        <div style={{ height: 40, borderBottom: '1px solid #CBD5E1', marginBottom: 4 }} />
        <div style={{ fontSize: 10, fontWeight: 700, color: '#334155' }}>For {profile.businessName || 'Business'}</div>
        <div style={{ fontSize: 9, color: '#94A3B8' }}>(Authorized Signatory)</div>
      </div>
    </div>
  )
}

function StandardTemplate({ inv, settings, profile }: { inv: Invoice; settings: any; profile: any }) {
  const c = TC(settings.themeColor)
  const party = DB.parties.byId(inv.partyId)
  const partyAddress = inv.shippingAddress || party?.address
  const gstRates = [...new Set(inv.items.map(i => i.gstRate).filter(r => r > 0))].sort()

  return (
    <div>
      {/* Header Container */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `3px solid ${c}`, paddingBottom: 14, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, color: c, fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>{profile.businessName || 'Your Business Name'}</h2>
          <div style={{ fontSize: 11, color: '#475569', marginTop: 4, whiteSpace: 'pre-line', lineHeight: 1.5 }}>{profile.address}</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 6, fontSize: 11, color: '#64748B' }}>
            {profile.phone && <span>📞 <strong>{profile.phone}</strong></span>}
            {profile.email && <span>✉ <strong>{profile.email}</strong></span>}
            {profile.ownerName && <span>Proprietor: <strong>{profile.ownerName}</strong></span>}
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 11, color: '#64748B', marginTop: 2 }}>
            {profile.gstin && <span style={{ backgroundColor: c + '15', color: c, padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>GSTIN: {profile.gstin}</span>}
            {profile.pan && <span>PAN: <strong>{profile.pan}</strong></span>}
          </div>
        </div>

        <div style={{ textAlign: 'right', minWidth: 210 }}>
          <div style={{
            fontSize: 12, color: '#fff', backgroundColor: c, textTransform: 'uppercase',
            letterSpacing: 1.5, fontWeight: 800, display: 'inline-block',
            padding: '6px 16px', borderRadius: 4, marginBottom: 8,
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          }}>
            {settings.enableGst ? 'Tax Invoice' : 'Invoice'}
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: c, letterSpacing: 0.5 }}>#{inv.invoiceNo}</div>
          <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>Date: <strong>{formatDate(inv.date)}</strong></div>
          {inv.dueDate && <div style={{ fontSize: 11, color: '#475569' }}>Due Date: <strong>{formatDate(inv.dueDate)}</strong></div>}
          <div style={{ marginTop: 6 }}>
            <span style={{
              fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 12,
              backgroundColor: inv.paymentStatus === 'PAID' ? '#DCFCE7' : inv.paymentStatus === 'PARTIAL' ? '#FEF3C7' : '#FEE2E2',
              color: inv.paymentStatus === 'PAID' ? '#166534' : inv.paymentStatus === 'PARTIAL' ? '#92400E' : '#991B1B',
            }}>
              {inv.paymentStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Bill To & Details Container */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, padding: '12px 14px', backgroundColor: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0' }}>
        <div style={{ fontSize: 13, flex: 1 }}>
          <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 2 }}>Bill To (Customer)</div>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#1E293B' }}>{inv.partyName}</span>
          {partyAddress && <div style={{ fontSize: 11, color: '#475569', marginTop: 3, whiteSpace: 'pre-line' }}>📍 {partyAddress}</div>}
          {party?.phone && <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>📞 {party.phone}</div>}
          {party?.gstin && <div style={{ fontSize: 10, fontWeight: 700, color: c, marginTop: 4 }}>GSTIN: {party.gstin}</div>}
        </div>
        {inv.notes && (
          <div style={{ fontSize: 11, textAlign: 'right', color: '#64748B', maxWidth: 220 }}>
            <strong>Notes:</strong><br />{inv.notes}
          </div>
        )}
      </div>

      {/* Line Items Table */}
      <InvoiceTable items={inv.items} showGst={settings.enableGst} />

      {/* Totals & Tax Summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, gap: 16 }}>
        <div style={{ fontSize: 11, color: '#475569', flex: 1 }}>
          <div style={{ backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
            <strong style={{ color: '#1E293B', fontSize: 11 }}>Amount Chargeable (in words):</strong><br />
            <span style={{ fontWeight: 700, color: c, fontSize: 12 }}>{numberToWords(inv.grandTotal)}</span>
          </div>

          {gstRates.length > 0 && (
            <div style={{ marginTop: 10, fontSize: 10, color: '#64748B', lineHeight: 1.6 }}>
              <strong style={{ color: '#334155' }}>GST Rate Breakdown:</strong><br />
              {gstRates.map(r => {
                const taxable = inv.items.filter(i => i.gstRate === r).reduce((s, i) => s + i.amount, 0)
                const cgst = taxable * r / 200
                const sgst = taxable * r / 200
                return (
                  <div key={r}>• Taxable ₹{formatCurrency(taxable)} @ {r}% | CGST: ₹{formatCurrency(cgst)} | SGST: ₹{formatCurrency(sgst)}</div>
                )
              })}
            </div>
          )}
        </div>

        <TotalsBlock inv={inv} settings={settings} c={c} />
      </div>

      <BankFooter settings={settings} profile={profile} dueAmount={inv.dueAmount} invoiceNo={inv.invoiceNo} />
    </div>
  )
}

function CompactTemplate({ inv, settings, profile }: { inv: Invoice; settings: any; profile: any }) {
  const c = TC(settings.themeColor)
  return (
    <div style={{ fontSize: 11 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px dashed ${c}`, paddingBottom: 6, marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: c }}>{profile.businessName || 'Business'}</div>
          <div style={{ fontSize: 9, color: '#888', whiteSpace: 'pre-line', lineHeight: 1.3 }}>{profile.address}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: c }}>{settings.prefix}-{inv.invoiceNo.replace(/^[A-Z]+-/, '')}</div>
          <div style={{ fontSize: 9, color: '#888' }}>{formatDate(inv.date)}</div>
        </div>
      </div>
      <div style={{ fontSize: 10, marginBottom: 6 }}><strong>{inv.partyName}</strong></div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
        <thead>
          <tr style={{ borderBottom: `1px dashed ${Colors.divider}` }}>
            <th style={{ padding: '3px 4px', textAlign: 'left', fontWeight: 600, fontSize: 9 }}>#</th>
            <th style={{ padding: '3px 4px', textAlign: 'left', fontWeight: 600, fontSize: 9 }}>Item</th>
            <th style={{ padding: '3px 4px', textAlign: 'center', fontWeight: 600, fontSize: 9 }}>Qty</th>
            <th style={{ padding: '3px 4px', textAlign: 'right', fontWeight: 600, fontSize: 9 }}>Rate</th>
            <th style={{ padding: '3px 4px', textAlign: 'right', fontWeight: 600, fontSize: 9 }}>Amt</th>
          </tr>
        </thead>
        <tbody>
          {inv.items.map((item, i) => (
            <tr key={i} style={{ borderBottom: `1px dotted ${Colors.divider}` }}>
              <td style={{ padding: '2px 4px', color: '#888' }}>{i + 1}</td>
              <td style={{ padding: '2px 4px' }}>{item.itemName}</td>
              <td style={{ padding: '2px 4px', textAlign: 'center' }}>{item.quantity} {item.unit}</td>
              <td style={{ padding: '2px 4px', textAlign: 'right' }}>{formatCurrency(item.rate)}</td>
              <td style={{ padding: '2px 4px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ borderTop: `1px dashed ${c}`, marginTop: 6, paddingTop: 4, textAlign: 'right', fontSize: 11 }}>
        {settings.enableGst && <div><span style={{ color: '#888' }}>GST: </span>{formatCurrency(inv.taxAmount)}</div>}
        <div style={{ fontWeight: 700, fontSize: 13, color: c }}>Total: {formatCurrency(inv.grandTotal)}</div>
      </div>
      {settings.defaultTerms && <div style={{ fontSize: 8, color: '#aaa', marginTop: 4, borderTop: '1px dashed #ddd', paddingTop: 4 }}>{settings.defaultTerms}</div>}
    </div>
  )
}

function DetailedTemplate({ inv, settings, profile }: { inv: Invoice; settings: any; profile: any }) {
  const c = TC(settings.themeColor)
  return (
    <div>
      <div style={{ textAlign: 'center', borderBottom: `3px double ${c}`, paddingBottom: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: c }}>{profile.businessName || 'Business Name'}</div>
        <div style={{ fontSize: 10, color: '#888', whiteSpace: 'pre-line' }}>{profile.address}</div>
        {settings.enableGst && profile.gstin && <div style={{ fontSize: 10, color: '#888' }}>GSTIN: {profile.gstin} | PAN: {profile.pan}</div>}
        <div style={{ fontSize: 16, fontWeight: 700, color: c, marginTop: 4, letterSpacing: 2 }}>— TAX INVOICE —</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#666', marginTop: 4 }}>
          <span>{settings.prefix}-{inv.invoiceNo.replace(/^[A-Z]+-/, '')}</span>
          <span>Date: {formatDate(inv.date)}</span>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 12, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
        <div><strong>Buyer:</strong> {inv.partyName}</div>
        {inv.type === 'PURCHASE' && <div><strong>Type:</strong> Purchase</div>}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr style={{ backgroundColor: c, color: '#fff' }}>
            <th style={{ padding: '6px 4px', textAlign: 'left' }}>#</th>
            <th style={{ padding: '6px 4px', textAlign: 'left' }}>Item</th>
            <th style={{ padding: '6px 4px', textAlign: 'left' }}>HSN</th>
            <th style={{ padding: '6px 4px', textAlign: 'center' }}>Qty</th>
            <th style={{ padding: '6px 4px', textAlign: 'right' }}>Rate</th>
            <th style={{ padding: '6px 4px', textAlign: 'right' }}>Taxable</th>
            {settings.enableGst && <><th style={{ padding: '6px 4px', textAlign: 'right' }}>CGST</th><th style={{ padding: '6px 4px', textAlign: 'right' }}>SGST</th></>}
            <th style={{ padding: '6px 4px', textAlign: 'right' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {inv.items.map((item, i) => {
            const cgst = settings.enableGst ? item.amount * item.gstRate / 200 : 0
            const sgst = settings.enableGst ? item.amount * item.gstRate / 200 : 0
            return (
              <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '6px 4px', color: '#666' }}>{i + 1}</td>
                <td style={{ padding: '6px 4px' }}>{item.itemName}</td>
                <td style={{ padding: '6px 4px', color: '#888', fontSize: 10 }}>{item.sku || '–'}</td>
                <td style={{ padding: '6px 4px', textAlign: 'center' }}>{item.quantity} {item.unit}</td>
                <td style={{ padding: '6px 4px', textAlign: 'right' }}>{formatCurrency(item.rate)}</td>
                <td style={{ padding: '6px 4px', textAlign: 'right' }}>{formatCurrency(item.amount)}</td>
                {settings.enableGst && <><td style={{ padding: '6px 4px', textAlign: 'right', fontSize: 10 }}>{formatCurrency(cgst)}</td><td style={{ padding: '6px 4px', textAlign: 'right', fontSize: 10 }}>{formatCurrency(sgst)}</td></>}
                <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.amount + cgst + sgst)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <TotalsBlock inv={inv} settings={settings} c={c} />
      <BankFooter settings={settings} profile={profile} dueAmount={inv.dueAmount} invoiceNo={inv.invoiceNo} />
      {settings.defaultTerms && <div style={{ fontSize: 10, color: '#888', marginTop: 8, borderTop: '1px solid #ddd', paddingTop: 8, whiteSpace: 'pre-line' }}><strong>Terms:</strong> {settings.defaultTerms}</div>}
      {settings.showSignature && <div style={{ marginTop: 20, textAlign: 'right', fontSize: 11, color: '#666' }}>Authorised Signatory</div>}
    </div>
  )
}

function ClassicTemplate({ inv, settings, profile }: { inv: Invoice; settings: any; profile: any }) {
  const c = '#1a237e'
  return (
    <div style={{ border: '2px solid #1a237e', padding: 20, fontFamily: 'Georgia, serif' }}>
      <div style={{ textAlign: 'center', borderBottom: '2px double #1a237e', paddingBottom: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: c, letterSpacing: 1 }}>{profile.businessName || 'YOUR BUSINESS'}</div>
        <div style={{ fontSize: 11, color: '#555', marginTop: 2, whiteSpace: 'pre-line' }}>{profile.address}</div>
        {profile.gstin && <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>GST: {profile.gstin} | PAN: {profile.pan}</div>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 13 }}>
          <span style={{ fontWeight: 700, color: c }}>INVOICE</span><br />
          <span style={{ fontSize: 11, color: '#555' }}>No: {settings.prefix}-{inv.invoiceNo.replace(/^[A-Z]+-/, '')}</span><br />
          <span style={{ fontSize: 11, color: '#555' }}>Date: {formatDate(inv.date)}</span>
        </div>
        <div style={{ fontSize: 13, textAlign: 'right' }}>
          <span style={{ fontWeight: 700, color: c }}>Bill To:</span><br />
          <span style={{ fontSize: 12 }}>{inv.partyName}</span>
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, border: '1px solid #ddd' }}>
        <thead>
          <tr style={{ backgroundColor: c, color: '#fff' }}>
            {['#', 'Particulars', 'Qty', 'Rate', 'Amount'].map(h => <th key={h} style={{ padding: '7px 8px', textAlign: h === 'Qty' ? 'center' : h === 'Amount' ? 'right' : 'left', fontWeight: 600 }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {inv.items.map((item, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '6px 8px', color: '#666' }}>{i + 1}</td>
              <td style={{ padding: '6px 8px' }}>{item.itemName}</td>
              <td style={{ padding: '6px 8px', textAlign: 'center' }}>{item.quantity} {item.unit}</td>
              <td style={{ padding: '6px 8px', textAlign: 'right' }}>{formatCurrency(item.rate)}</td>
              <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 10, textAlign: 'right', fontSize: 13 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 40, marginBottom: 4 }}><span>Subtotal:</span><span style={{ fontWeight: 600, minWidth: 80, textAlign: 'right' }}>{formatCurrency(inv.subtotal)}</span></div>
        {inv.discountAmount > 0 && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 40, marginBottom: 4 }}><span>Discount:</span><span style={{ fontWeight: 600, color: '#e53935' }}>-{formatCurrency(inv.discountAmount)}</span></div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 40, borderTop: '2px solid #1a237e', paddingTop: 6, marginTop: 4, fontSize: 16, fontWeight: 700, color: c }}>
          <span>Total:</span><span>{formatCurrency(inv.grandTotal)}</span>
        </div>
      </div>
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#555' }}>
        <div style={{ whiteSpace: 'pre-line' }}>Terms & Conditions:\n{settings.defaultTerms}</div>
        {settings.showSignature && <div style={{ textAlign: 'center' }}><div style={{ marginTop: 20, borderTop: '1px solid #333', paddingTop: 4 }}>Authorised Signatory</div></div>}
      </div>
    </div>
  )
}

function ModernTemplate({ inv, settings, profile }: { inv: Invoice; settings: any; profile: any }) {
  return (
    <div style={{ padding: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #ddd', paddingBottom: 16, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 2 }}>{profile.businessName || 'Business'}</div>
          <div style={{ fontSize: 10, color: '#aaa', marginTop: 2, whiteSpace: 'pre-line' }}>{profile.address}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, color: '#999', textTransform: 'uppercase', letterSpacing: 1 }}>Invoice</div>
          <div style={{ fontSize: 24, fontWeight: 200, color: '#333', letterSpacing: 1 }}>{settings.prefix}-{inv.invoiceNo.replace(/^[A-Z]+-/, '')}</div>
          <div style={{ fontSize: 10, color: '#aaa' }}>{formatDate(inv.date)}</div>
        </div>
      </div>
      <div style={{ fontSize: 13, marginBottom: 20, padding: '12px 16px', backgroundColor: '#fafafa', borderRadius: 4, borderLeft: '3px solid #999' }}>
        <strong>Client:</strong> {inv.partyName}
      </div>
      <InvoiceTable items={inv.items} showGst={settings.enableGst} />
      <div style={{ borderTop: '2px solid #333', marginTop: 12, paddingTop: 8, textAlign: 'right', fontSize: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 40, marginBottom: 4 }}><span style={{ color: '#999' }}>Subtotal</span><span style={{ fontWeight: 600, minWidth: 80, textAlign: 'right' }}>{formatCurrency(inv.subtotal)}</span></div>
        {settings.enableGst && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 40, marginBottom: 4 }}><span style={{ color: '#999' }}>GST</span><span style={{ fontWeight: 600 }}>{formatCurrency(inv.taxAmount)}</span></div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 40, marginTop: 4, fontSize: 18, fontWeight: 700 }}>
          <span>Total</span><span>{formatCurrency(inv.grandTotal)}</span>
        </div>
      </div>
      {settings.showBank && profile.bankName && <div style={{ marginTop: 12, fontSize: 9, color: '#bbb', borderTop: '1px solid #eee', paddingTop: 6 }}>{profile.bankName} | {profile.bankAccount}</div>}
      {settings.defaultTerms && <div style={{ fontSize: 9, color: '#bbb', marginTop: 4 }}>{settings.defaultTerms}</div>}
    </div>
  )
}

function PremiumTemplate({ inv, settings, profile }: { inv: Invoice; settings: any; profile: any }) {
  const gold = '#b8860b'; const dark = '#1a1a2e'
  return (
    <div>
      <div style={{ backgroundColor: dark, color: '#fff', padding: '20px 24px', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 300, letterSpacing: 1, color: gold }}>{profile.businessName || 'BUSINESS'}</div>
          <div style={{ fontSize: 10, color: '#aaa', marginTop: 2, whiteSpace: 'pre-line' }}>{profile.address}</div>
          {profile.gstin && <div style={{ fontSize: 9, color: '#888', marginTop: 2 }}>GSTIN: {profile.gstin}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: gold, letterSpacing: 3, textTransform: 'uppercase' }}>Invoice</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginTop: 2 }}>{settings.prefix}-{inv.invoiceNo.replace(/^[A-Z]+-/, '')}</div>
          <div style={{ fontSize: 9, color: '#aaa' }}>{formatDate(inv.date)}</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, padding: '10px 14px', backgroundColor: '#faf6f0', borderRadius: 6, border: `1px solid ${gold}20` }}>
        <div style={{ fontSize: 13 }}><span style={{ fontWeight: 600, color: dark }}>Bill To:</span><br /><span>{inv.partyName}</span></div>
        {profile.phone && <div style={{ fontSize: 11, color: '#888', textAlign: 'right' }}>Phone: {profile.phone}</div>}
      </div>
      <InvoiceTable items={inv.items} showGst={settings.enableGst} />
      <div style={{ borderTop: `2px solid ${gold}`, marginTop: 12, paddingTop: 8, textAlign: 'right', fontSize: 13 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 32, marginBottom: 4 }}><span>Subtotal:</span><span style={{ fontWeight: 600 }}>{formatCurrency(inv.subtotal)}</span></div>
        {inv.discountAmount > 0 && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 32, marginBottom: 4 }}><span>Discount:</span><span style={{ color: '#e53935' }}>-{formatCurrency(inv.discountAmount)}</span></div>}
        {settings.enableGst && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 32, marginBottom: 4 }}><span>GST:</span><span>{formatCurrency(inv.taxAmount)}</span></div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 32, borderTop: `2px solid ${dark}`, paddingTop: 8, marginTop: 4, fontSize: 18, fontWeight: 700, color: dark }}>
          <span>Total:</span><span>{formatCurrency(inv.grandTotal)}</span>
        </div>
      </div>
      <BankFooter settings={settings} profile={profile} dueAmount={inv.dueAmount} invoiceNo={inv.invoiceNo} />
      {settings.defaultTerms && <div style={{ fontSize: 10, color: '#888', marginTop: 8, borderTop: `1px solid ${gold}30`, paddingTop: 8, whiteSpace: 'pre-line' }}><strong>Terms:</strong> {settings.defaultTerms}</div>}
      {settings.showSignature && <div style={{ marginTop: 24, textAlign: 'right' }}><div style={{ borderTop: `1px solid ${dark}`, paddingTop: 4, minWidth: 140, display: 'inline-block', fontSize: 11, color: dark }}>Authorised Signatory</div></div>}
    </div>
  )
}

function ElegantTemplate({ inv, settings, profile }: { inv: Invoice; settings: any; profile: any }) {
  const primary = '#d4a574'; const dark = '#5d4037'
  return (
    <div style={{ fontFamily: "'Georgia', serif" }}>
      <div style={{ background: `linear-gradient(135deg, ${primary}, ${dark})`, padding: '16px 20px', borderRadius: '12px', marginBottom: 16, color: '#fff' }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 0.5 }}>{profile.businessName || 'Business Name'}</div>
        <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2, whiteSpace: 'pre-line' }}>{profile.address}</div>
        {settings.enableGst && profile.gstin && <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>GSTIN: {profile.gstin}</div>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '0 4px' }}>
        <div>
          <div style={{ fontSize: 10, color: primary, textTransform: 'uppercase', letterSpacing: 1 }}>Invoice</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: dark }}>{settings.prefix}-{inv.invoiceNo.replace(/^[A-Z]+-/, '')}</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 11, color: '#888' }}>
          <div>Date: {formatDate(inv.date)}</div>
          {inv.dueDate && <div>Due: {formatDate(inv.dueDate)}</div>}
        </div>
      </div>
      <div style={{ backgroundColor: '#fdf6f0', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Bill To</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: dark }}>{inv.partyName}</div>
        {inv.shippingAddress && <div style={{ fontSize: 11, color: '#888', marginTop: 2, whiteSpace: 'pre-line' }}>{inv.shippingAddress}</div>}
      </div>
      <InvoiceTable items={inv.items} showGst={settings.enableGst} />
      <TotalsBlock inv={inv} settings={settings} c={primary} />
      <BankFooter settings={settings} profile={profile} dueAmount={inv.dueAmount} invoiceNo={inv.invoiceNo} />
      {settings.defaultTerms && <div style={{ fontSize: 10, color: '#999', marginTop: 8, borderTop: '1px solid #f0e0d0', paddingTop: 8, whiteSpace: 'pre-line' }}><strong>Terms:</strong> {settings.defaultTerms}</div>}
    </div>
  )
}

function BoldTemplate({ inv, settings, profile }: { inv: Invoice; settings: any; profile: any }) {
  const accent = '#e65100'; const bg = '#fff3e0'; const text = '#212121'
  return (
    <div style={{ border: `3px solid ${accent}`, padding: 16 }}>
      <div style={{ backgroundColor: accent, color: '#fff', padding: '12px 16px', margin: -16, marginBottom: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 1 }}>{profile.businessName || 'BUSINESS'}</div>
        <div style={{ fontSize: 11, opacity: 0.8, whiteSpace: 'pre-line' }}>{profile.address}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: accent, textTransform: 'uppercase' }}>Invoice</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: text }}>#{settings.prefix}-{inv.invoiceNo.replace(/^[A-Z]+-/, '')}</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 12, color: '#666' }}>
          <div>{formatDate(inv.date)}</div>
          <div style={{ fontWeight: 700, color: text }}>{inv.partyName}</div>
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ backgroundColor: accent, color: '#fff' }}>
            <th style={{ padding: '8px', textAlign: 'left', fontWeight: 700 }}>#</th>
            <th style={{ padding: '8px', textAlign: 'left', fontWeight: 700 }}>Item</th>
            <th style={{ padding: '8px', textAlign: 'center', fontWeight: 700 }}>Qty</th>
            <th style={{ padding: '8px', textAlign: 'right', fontWeight: 700 }}>Rate</th>
            <th style={{ padding: '8px', textAlign: 'right', fontWeight: 700 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {inv.items.map((item, i) => (
            <tr key={i} style={{ borderBottom: `2px solid ${bg}` }}>
              <td style={{ padding: '7px 8px', color: '#666' }}>{i + 1}</td>
              <td style={{ padding: '7px 8px', fontWeight: 600 }}>{item.itemName}</td>
              <td style={{ padding: '7px 8px', textAlign: 'center' }}>{item.quantity} {item.unit}</td>
              <td style={{ padding: '7px 8px', textAlign: 'right' }}>{formatCurrency(item.rate)}</td>
              <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700, color: accent }}>{formatCurrency(item.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ borderTop: `3px solid ${accent}`, marginTop: 8, paddingTop: 8, textAlign: 'right', fontSize: 13 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, marginBottom: 4 }}><span style={{ color: '#666' }}>Subtotal</span><span style={{ fontWeight: 700 }}>{formatCurrency(inv.subtotal)}</span></div>
        {inv.discountAmount > 0 && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, marginBottom: 4 }}><span style={{ color: '#666' }}>Discount</span><span style={{ fontWeight: 700, color: accent }}>-{formatCurrency(inv.discountAmount)}</span></div>}
        {settings.enableGst && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, marginBottom: 4 }}><span style={{ color: '#666' }}>GST</span><span style={{ fontWeight: 700 }}>{formatCurrency(inv.taxAmount)}</span></div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, borderTop: `2px solid ${text}`, paddingTop: 6, marginTop: 4, fontSize: 18, fontWeight: 900, color: accent }}>
          <span>Total</span><span>{formatCurrency(inv.grandTotal)}</span>
        </div>
      </div>
      {settings.defaultTerms && <div style={{ fontSize: 9, color: '#999', marginTop: 6 }}>{settings.defaultTerms}</div>}
    </div>
  )
}

function NatureTemplate({ inv, settings, profile }: { inv: Invoice; settings: any; profile: any }) {
  const green = '#2e7d32'; const light = '#f1f8e9'; const dark = '#33691e'
  return (
    <div style={{ border: '1px solid #c8e6c9', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ backgroundColor: green, color: '#fff', padding: '14px 18px', position: 'relative' }}>
        <div style={{ position: 'absolute', right: 10, top: 10, fontSize: 40, opacity: 0.1 }}>🌿</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{profile.businessName || 'Business'}</div>
        <div style={{ fontSize: 10, opacity: 0.8, whiteSpace: 'pre-line' }}>{profile.address}</div>
      </div>
      <div style={{ padding: '12px 16px', backgroundColor: light }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, color: green, textTransform: 'uppercase', letterSpacing: 1 }}>Invoice</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: dark }}>{settings.prefix}-{inv.invoiceNo.replace(/^[A-Z]+-/, '')}</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 11, color: '#666' }}>
            <div>{formatDate(inv.date)}</div>
            <div style={{ fontWeight: 600, color: dark, marginTop: 2 }}>{inv.partyName}</div>
          </div>
        </div>
      </div>
      <div style={{ padding: '0 16px' }}>
        <InvoiceTable items={inv.items} showGst={settings.enableGst} />
        <TotalsBlock inv={inv} settings={settings} c={green} />
      </div>
      <div style={{ padding: '10px 16px', backgroundColor: light, borderTop: '1px solid #c8e6c9', fontSize: 10, color: '#888' }}>
        <BankFooter settings={settings} profile={profile} dueAmount={inv.dueAmount} invoiceNo={inv.invoiceNo} />
        {settings.defaultTerms && <div style={{ marginTop: 4, whiteSpace: 'pre-line' }}><strong>Terms:</strong> {settings.defaultTerms}</div>}
      </div>
    </div>
  )
}

function OceanTemplate({ inv, settings, profile }: { inv: Invoice; settings: any; profile: any }) {
  const blue = '#01579b'; const teal = '#006064'; const light = '#e1f5fe'
  return (
    <div style={{ backgroundColor: '#fff' }}>
      <div style={{ background: `linear-gradient(135deg, ${blue}, ${teal})`, padding: '16px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: -10, left: 0, right: 0, height: 20, backgroundColor: '#fff', borderRadius: '50% 50% 0 0', opacity: 0.15 }} />
        <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{profile.businessName || 'Business'}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', whiteSpace: 'pre-line' }}>{profile.address}</div>
      </div>
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', backgroundColor: light }}>
        <div>
          <div style={{ fontSize: 10, color: teal, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>Tax Invoice</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: blue, marginTop: 2 }}>{settings.prefix}-{inv.invoiceNo.replace(/^[A-Z]+-/, '')}</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 11, color: '#666' }}>
          <div>Date: {formatDate(inv.date)}</div>
          <div style={{ fontWeight: 600, color: blue, marginTop: 2 }}>{inv.partyName}</div>
        </div>
      </div>
      <div style={{ padding: '12px 16px 0' }}>
        <InvoiceTable items={inv.items} showGst={settings.enableGst} />
        <TotalsBlock inv={inv} settings={settings} c={blue} />
      </div>
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${light}`, fontSize: 10, color: '#999' }}>
        <BankFooter settings={settings} profile={profile} dueAmount={inv.dueAmount} invoiceNo={inv.invoiceNo} />
        {settings.defaultTerms && <div style={{ marginTop: 4, whiteSpace: 'pre-line' }}><strong>Terms:</strong> {settings.defaultTerms}</div>}
      </div>
    </div>
  )
}

function SunsetTemplate({ inv, settings, profile }: { inv: Invoice; settings: any; profile: any }) {
  const purple = '#7b1fa2'; const orange = '#e65100'
  return (
    <div style={{ backgroundColor: '#fff' }}>
      <div style={{ background: `linear-gradient(135deg, ${purple}, #e040fb, ${orange})`, padding: '16px 20px', color: '#fff' }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{profile.businessName || 'Business'}</div>
        <div style={{ fontSize: 11, opacity: 0.8, whiteSpace: 'pre-line' }}>{profile.address}</div>
        {profile.gstin && <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>GSTIN: {profile.gstin}</div>}
      </div>
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', background: 'linear-gradient(135deg, #fce4ec, #fff3e0)' }}>
        <div>
          <div style={{ fontSize: 10, color: purple, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>Invoice</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: orange }}>{settings.prefix}-{inv.invoiceNo.replace(/^[A-Z]+-/, '')}</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 11, color: '#666' }}>
          {formatDate(inv.date)}
          <div style={{ fontWeight: 600, color: purple, marginTop: 2 }}>{inv.partyName}</div>
        </div>
      </div>
      <div style={{ padding: '0 16px' }}>
        <InvoiceTable items={inv.items} showGst={settings.enableGst} />
        <div style={{ borderTop: `2px solid ${purple}`, marginTop: 12, paddingTop: 8, textAlign: 'right', fontSize: 13 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, marginBottom: 4 }}><span style={{ color: '#666' }}>Subtotal</span><span style={{ fontWeight: 700 }}>{formatCurrency(inv.subtotal)}</span></div>
          {settings.enableGst && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, marginBottom: 4 }}><span style={{ color: '#666' }}>GST</span><span>{formatCurrency(inv.taxAmount)}</span></div>}
          {inv.discountAmount > 0 && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, marginBottom: 4 }}><span style={{ color: '#666' }}>Discount</span><span style={{ color: orange }}>-{formatCurrency(inv.discountAmount)}</span></div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, borderTop: `2px solid ${orange}`, paddingTop: 6, marginTop: 4, fontSize: 18, fontWeight: 700, color: purple }}>
            <span>Total</span><span>{formatCurrency(inv.grandTotal)}</span>
          </div>
        </div>
      </div>
      <BankFooter settings={settings} profile={profile} dueAmount={inv.dueAmount} invoiceNo={inv.invoiceNo} />
      {settings.defaultTerms && <div style={{ fontSize: 10, color: '#999', padding: '8px 16px', borderTop: '1px solid #fce4ec' }}>{settings.defaultTerms}</div>}
    </div>
  )
}

function CorporateTemplate({ inv, settings, profile }: { inv: Invoice; settings: any; profile: any }) {
  const gray = '#37474f'; const blue = '#1565c0'; const light = '#eceff1'
  return (
    <div>
      <div style={{ backgroundColor: gray, color: '#fff', padding: '14px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{profile.businessName || 'Business'}</div>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 2, opacity: 0.7 }}>Tax Invoice</div>
        </div>
        <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4, whiteSpace: 'pre-line' }}>{profile.address}</div>
      </div>
      <div style={{ padding: '10px 14px', backgroundColor: blue, color: '#fff', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ fontWeight: 700 }}>{settings.prefix}-{inv.invoiceNo.replace(/^[A-Z]+-/, '')}</span>
        <span>{formatDate(inv.date)}</span>
      </div>
      <div style={{ padding: '10px 14px', backgroundColor: light, marginBottom: 12, fontSize: 13 }}>
        <span style={{ color: '#888', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Client</span><br />
        <span style={{ fontWeight: 700, color: gray }}>{inv.partyName}</span>
        {inv.shippingAddress && <div style={{ fontSize: 11, color: '#888', marginTop: 2, whiteSpace: 'pre-line' }}>{inv.shippingAddress}</div>}
      </div>
      <div style={{ padding: '0 14px' }}>
        <InvoiceTable items={inv.items} showGst={settings.enableGst} />
        <div style={{ borderTop: `2px solid ${gray}`, marginTop: 12, paddingTop: 8, textAlign: 'right', fontSize: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 20, marginBottom: 3 }}><span style={{ color: '#888' }}>Subtotal</span><span style={{ fontWeight: 600 }}>{formatCurrency(inv.subtotal)}</span></div>
          {settings.enableGst && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 20, marginBottom: 3 }}><span style={{ color: '#888' }}>GST</span><span>{formatCurrency(inv.taxAmount)}</span></div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 20, borderTop: `1px solid ${light}`, paddingTop: 6, marginTop: 4, fontSize: 16, fontWeight: 700, color: blue }}>
            <span>Total</span><span>{formatCurrency(inv.grandTotal)}</span>
          </div>
        </div>
      </div>
      <BankFooter settings={settings} profile={profile} dueAmount={inv.dueAmount} invoiceNo={inv.invoiceNo} />
      {settings.defaultTerms && <div style={{ fontSize: 9, color: '#aaa', padding: '6px 14px', borderTop: `1px solid ${light}`, marginTop: 6 }}>{settings.defaultTerms}</div>}
    </div>
  )
}

function DottedTemplate({ inv, settings, profile }: { inv: Invoice; settings: any; profile: any }) {
  const dotBorder = '1.5px dashed #333'
  const lightDotBorder = '1px dotted #888'

  return (
    <div style={{ padding: '16px', border: '2px dashed #222', borderRadius: '4px', backgroundColor: '#fff', color: '#111', fontFamily: "'Courier New', Courier, monospace, sans-serif" }}>
      {/* Header Banner */}
      <div style={{ textAlign: 'center', paddingBottom: '12px', borderBottom: dotBorder }}>
        <div style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>
          {profile.businessName || 'TAX INVOICE'}
        </div>
        {profile.ownerName && <div style={{ fontSize: '11px', marginTop: '2px' }}>Prop: {profile.ownerName}</div>}
        {profile.address && <div style={{ fontSize: '11px', color: '#444', marginTop: '2px', whiteSpace: 'pre-line' }}>{profile.address}</div>}
        <div style={{ fontSize: '11px', marginTop: '4px', display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {profile.phone && <span><strong>Phone:</strong> {profile.phone}</span>}
          {profile.gstin && <span><strong>GSTIN:</strong> {profile.gstin}</span>}
        </div>
      </div>

      {/* Invoice Meta & Customer Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: dotBorder, fontSize: '12px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#666', letterSpacing: '0.5px' }}>Billed To:</div>
          <div style={{ fontSize: '14px', fontWeight: '800' }}>{inv.partyName || 'Cash Customer'}</div>
          {inv.shippingAddress && <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>{inv.shippingAddress}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div><strong>INVOICE NO:</strong> {settings.prefix}-{inv.invoiceNo.replace(/^[A-Z]+-/, '')}</div>
          <div><strong>DATE:</strong> {formatDate(inv.date)}</div>
          {inv.dueDate && <div><strong>DUE DATE:</strong> {formatDate(inv.dueDate)}</div>}
        </div>
      </div>

      {/* Dotted Items Table */}
      <div style={{ margin: '12px 0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: dotBorder, textAlign: 'left' }}>
              <th style={{ padding: '6px 4px', width: '30px' }}>#</th>
              <th style={{ padding: '6px 4px' }}>Item Description</th>
              <th style={{ padding: '6px 4px', textAlign: 'center' }}>Qty</th>
              <th style={{ padding: '6px 4px', textAlign: 'right' }}>Rate</th>
              {settings.enableGst && <th style={{ padding: '6px 4px', textAlign: 'center' }}>GST</th>}
              <th style={{ padding: '6px 4px', textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {inv.items.map((item: any, i: number) => (
              <tr key={i} style={{ borderBottom: lightDotBorder }}>
                <td style={{ padding: '6px 4px' }}>{i + 1}</td>
                <td style={{ padding: '6px 4px' }}>
                  <strong>{item.itemName}</strong>
                  {item.sku && <span style={{ fontSize: '10px', color: '#666' }}> ({item.sku})</span>}
                </td>
                <td style={{ padding: '6px 4px', textAlign: 'center' }}>{item.quantity} {item.unit}</td>
                <td style={{ padding: '6px 4px', textAlign: 'right' }}>{formatCurrency(item.rate)}</td>
                {settings.enableGst && <td style={{ padding: '6px 4px', textAlign: 'center' }}>{item.gstRate || 0}%</td>}
                <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: '700' }}>{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dotted Totals Box */}
      <div style={{ borderTop: dotBorder, paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ flex: 1, minWidth: '220px', fontSize: '11px' }}>
          <div><strong>Amount in Words:</strong></div>
          <div style={{ fontStyle: 'italic', marginTop: '2px', color: '#333' }}>{numberToWords(inv.grandTotal)}</div>
          {inv.notes && (
            <div style={{ marginTop: '8px', padding: '6px', border: lightDotBorder, borderRadius: '4px' }}>
              <strong>Notes:</strong> {inv.notes}
            </div>
          )}
        </div>

        <div style={{ minWidth: '240px', border: dotBorder, padding: '10px', borderRadius: '4px', backgroundColor: '#fafafa', fontSize: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Subtotal:</span>
            <span>{formatCurrency(inv.subtotal)}</span>
          </div>
          {inv.discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#C53030' }}>
              <span>Discount:</span>
              <span>- {formatCurrency(inv.discountAmount)}</span>
            </div>
          )}
          {settings.enableGst && inv.taxAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Tax (GST):</span>
              <span>{formatCurrency(inv.taxAmount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: dotBorder, paddingTop: '6px', marginTop: '4px', fontSize: '15px', fontWeight: '900' }}>
            <span>GRAND TOTAL:</span>
            <span>{formatCurrency(inv.grandTotal)}</span>
          </div>
          {inv.paidAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: '#2E7D32' }}>
              <span>Paid Amount:</span>
              <span>{formatCurrency(inv.paidAmount)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Dotted Tear Cut Line */}
      <div style={{ margin: '16px 0', borderBottom: '1.5px dashed #999', textAlign: 'center', position: 'relative' }}>
        <span style={{ position: 'relative', top: '10px', backgroundColor: '#fff', padding: '0 8px', fontSize: '11px', color: '#777' }}>
          ✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ✂
        </span>
      </div>

      {/* Footer, Bank & UPI QR Code */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px', fontSize: '11px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          {profile.bankAccount && (
            <div style={{ border: lightDotBorder, padding: '8px', borderRadius: '4px', maxWidth: '280px' }}>
              <div style={{ fontWeight: '800', marginBottom: '2px' }}>BANK DETAILS:</div>
              <div>Bank: {profile.bankName || 'N/A'}</div>
              <div>A/C: {profile.bankAccount}</div>
              <div>IFSC: {profile.bankIfsc || 'N/A'}</div>
              {profile.upiId && <div>UPI: {profile.upiId}</div>}
            </div>
          )}
          {settings.defaultTerms && (
            <div style={{ fontSize: '10px', color: '#555', marginTop: '6px', maxWidth: '320px', whiteSpace: 'pre-line' }}>
              <strong>Terms & Conditions:</strong> {settings.defaultTerms}
            </div>
          )}
        </div>

        {/* 📱 Dotted UPI Payment QR Code Block */}
        {profile.upiId && (
          <div style={{ border: dotBorder, padding: '8px 12px', borderRadius: '4px', textAlign: 'center', backgroundColor: '#fafafa', flexShrink: 0 }}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`upi://pay?pa=${encodeURIComponent(profile.upiId)}&pn=${encodeURIComponent(profile.businessName || 'Business')}&am=${inv.grandTotal}&tn=${encodeURIComponent('Inv ' + inv.invoiceNo)}`)}`}
              alt="UPI QR Code"
              style={{ width: 85, height: 85, display: 'block', margin: '0 auto' }}
            />
            <div style={{ fontSize: '10px', fontWeight: '800', marginTop: '4px', color: '#111' }}>SCAN TO PAY</div>
            <div style={{ fontSize: '11px', fontWeight: '900', color: Colors.primary }}>{formatCurrency(inv.grandTotal)}</div>
            <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>UPI: {profile.upiId}</div>
          </div>
        )}

        <div style={{ textAlign: 'center', minWidth: '160px' }}>
          <div style={{ height: '40px' }}></div>
          <div style={{ borderTop: dotBorder, paddingTop: '4px', fontWeight: '700', fontSize: '11px' }}>
            Authorised Signatory
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>{profile.businessName || ''}</div>
        </div>
      </div>
    </div>
  )
}
