import React, { useState, useMemo, useCallback, useRef, useReducer } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, statusColor } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, formatDate, generateId, nextInvoiceNo } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { useDelayedRender, ListSkeleton } from '../utils/smooth'
import { deleteInvoiceWithReversal } from '../utils/invoiceOps'
import { useFuzzySearch } from '../utils/useFuzzySearch'
import { useBatchSelect, BatchActionBar } from '../utils/useBatchSelect'
import { ContextMenu, useDefaultShareOption } from '../utils/ContextMenu'
import { ExportBar } from '../utils/ExportBar'
import type { Invoice } from '../types'
import html2canvas from 'html2canvas'
import { detectAnomalies } from '../utils/ai'
import type { Anomaly } from '../utils/ai'

function localDate(d?: Date): string {
  const dt = d || new Date()
  return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0')
}

function groupLabel(dateStr: string): string {
  const today = localDate()
  const yesterday = localDate(new Date(Date.now() - 86400000))
  if (dateStr === today) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  const d = new Date(dateStr + 'T00:00:00')
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const weekAgo = new Date(now.getTime() - 7 * 86400000)
  if (d >= weekAgo) return 'This Week'
  const monthAgo = new Date(now.getTime() - 30 * 86400000)
  if (d >= monthAgo) return 'This Month'
  return 'Older'
}

export function InvoicesPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'PARTIAL'>('ALL')
  const [dateFilter, setDateFilter] = useState('')
  const [batchMode, setBatchMode] = useState(false)
  const [rev, bumpRev] = useReducer(x => x + 1, 0)
  const ready = useDelayedRender(200)
  const { defaultOption, saveDefault } = useDefaultShareOption()
  const listRef = useRef<HTMLDivElement>(null)

  const allInvoices = useMemo(() =>
    [...DB.invoices.list()].sort((a, b) => b.date.localeCompare(a.date)),
  [rev])

  const statusFiltered = useMemo(() => {
    let list = allInvoices
    if (filter !== 'ALL') list = list.filter(i => i.paymentStatus === filter)
    if (dateFilter) list = list.filter(i => i.date === dateFilter)
    return list
  }, [allInvoices, filter, dateFilter])

  const invoices = useFuzzySearch(statusFiltered, search, ['invoiceNo', 'partyName'], 5, 500)

  const grouped = useMemo(() => {
    const groups: Record<string, Invoice[]> = {}
    invoices.forEach(inv => {
      const g = groupLabel(inv.date)
      if (!groups[g]) groups[g] = []
      groups[g].push(inv)
    })
    return groups
  }, [invoices])

  const order = ['Today', 'Yesterday', 'This Week', 'This Month', 'Older']

  const batch = useBatchSelect(invoices)

  const handleDelete = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this invoice?')) return
    deleteInvoiceWithReversal(id); bumpRev()
  }, [])

  const handleDuplicate = useCallback((inv: Invoice) => {
    const newId = generateId()
    const docType = inv.docType
    const prefix = docType === 'PURCHASE' ? 'PUR' : 'INV'
    DB.invoices.save({
      ...inv, id: newId, invoiceNo: nextInvoiceNo(DB.invoices.list().filter(i => i.docType === docType).map(i => i.invoiceNo), prefix),
      date: localDate(), paymentStatus: 'PENDING', paidAmount: 0, dueAmount: inv.grandTotal, orderStatus: undefined, convertedTo: undefined,
    })
    bumpRev()
    onNavigate('invoice-view?id=' + newId)
  }, [onNavigate])

  const handlePay = useCallback((invId: string) => {
    onNavigate('add-payment?id=' + invId)
  }, [onNavigate])

  const handleReturn = useCallback((invId: string) => {
    onNavigate('returns?sourceId=' + invId)
  }, [onNavigate])

  const handleChallan = useCallback((inv: Invoice) => {
    const items = inv.items.map(i => ({
      itemId: i.itemId, itemName: i.itemName, quantity: i.quantity, rate: i.rate, unit: i.unit, amount: i.amount,
      discountPercent: 0, discountAmount: 0, gstRate: i.gstRate, sku: i.sku,
    }))
    DB.invoices.save({
      id: generateId(), docType: 'CHALLAN', invoiceNo: nextInvoiceNo(DB.invoices.list().filter(i => i.docType === 'CHALLAN').map(i => i.invoiceNo), 'CHL'),
      partyId: inv.partyId, partyName: inv.partyName, type: inv.type,
      items, subtotal: inv.subtotal, discountAmount: 0, taxAmount: 0, grandTotal: inv.subtotal,
      paymentStatus: 'DRAFT', paidAmount: 0, dueAmount: inv.subtotal, date: localDate(),
      transportDetails: inv.transportDetails || '',
    })
    bumpRev()
    onNavigate('challans')
  }, [onNavigate])

  const handleShareImage = useCallback((inv: Invoice) => {
    onNavigate('invoice-view?id=' + inv.id)
    setTimeout(async () => {
      const el = document.getElementById('invoice-preview')
      if (!el) return
      try {
        const canvas = await html2canvas(el, { scale: 2, useCORS: true })
        canvas.toBlob(blob => {
          if (!blob) return
          if (navigator.share) {
            navigator.share({ files: [new File([blob], `Invoice_${inv.invoiceNo}.png`, { type: 'image/png' })] })
          } else {
            const url = URL.createObjectURL(blob)
            window.open(url, '_blank')
            setTimeout(() => URL.revokeObjectURL(url), 30000)
          }
        })
      } catch (e) { console.error('html2canvas failed', e) }
    }, 800)
  }, [onNavigate])

  const defaultShare = useCallback((inv: Invoice, e: React.MouseEvent) => {
    e.stopPropagation()
    if (defaultOption === 'image') handleShareImage(inv)
    else onNavigate('invoice-view?id=' + inv.id + '&print=1')
  }, [defaultOption, handleShareImage, onNavigate])

  const handleEInvoice = useCallback((inv: Invoice) => {
    alert('e-Invoice generation requires a backend connected to the GST portal (IRP). This feature will be available in the cloud version.')
  }, [])

  const handleBatchDelete = useCallback(() => {
    const realInvoices = batch.selectedItems.filter(i => i.docType === 'SALE' || i.docType === 'PURCHASE')
    if (realInvoices.length === 0) { alert('Only actual invoices (not orders/estimates/returns) can be batch-deleted.'); return }
    if (!confirm(`Delete ${realInvoices.length} invoice(s)? This will reverse stock & ledger entries.`)) return
    realInvoices.forEach(inv => deleteInvoiceWithReversal(inv.id))
    batch.selectedItems.filter(i => i.docType !== 'SALE' && i.docType !== 'PURCHASE').forEach(inv => DB.invoices.delete(inv.id))
    bumpRev()
    batch.clearSelection()
    setBatchMode(false)
  }, [batch])

  const handleBatchMarkPaid = useCallback(() => {
    const realInvoices = batch.selectedItems.filter(i => (i.docType === 'SALE' || i.docType === 'PURCHASE') && i.paymentStatus !== 'PAID')
    if (realInvoices.length === 0) { alert('No unpaid invoices selected.'); return }
    if (!confirm(`Mark ${realInvoices.length} invoice(s) as paid?`)) return
    realInvoices.forEach(inv => {
      DB.invoices.save({ ...inv, paymentStatus: 'PAID', paidAmount: inv.grandTotal, dueAmount: 0 })
    })
    bumpRev()
    batch.clearSelection()
    setBatchMode(false)
  }, [batch])

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }} ref={listRef}>
      <div style={{ display: 'flex', gap: Spacing.sm, marginBottom: Spacing.md }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 12, top: 10, display: 'flex', alignItems: 'center', color: Colors.textDisabled }}><Icons.Search size={16} /></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices..." style={{ ...s.searchBox, paddingLeft: 36 }} />
        </div>
        <ExportBar title="invoices"
          xlsData={{ name: 'Invoices', headers: ['Invoice No', 'Date', 'Party', 'Type', 'Total', 'Paid', 'Due', 'Status'], rows: allInvoices.map(i => [i.invoiceNo, i.date, i.partyName, i.type, String(i.grandTotal), String(i.paidAmount), String(i.dueAmount), i.paymentStatus]) }}
        />
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: Spacing.md, flexWrap: 'wrap', alignItems: 'center' }}>
        {(['ALL', 'PAID', 'PENDING', 'PARTIAL'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={s.chip(filter === f, f === 'ALL' ? Colors.primary : statusColor(f))}>
            {f === 'ALL' ? 'All' : f}
          </button>
        ))}
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value === dateFilter ? '' : e.target.value)} style={{ ...s.input, width: 140, padding: '6px 10px', fontSize: 12, marginLeft: 'auto' }} title="Filter by date" />
        {dateFilter && <button onClick={() => setDateFilter('')} style={{ background: 'none', border: 'none', color: Colors.error, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Clear</button>}
        <button onClick={() => { setBatchMode(!batchMode); batch.clearSelection() }} style={{
          padding: '6px 12px', border: `1px solid ${batchMode ? Colors.error : Colors.primary}30`, borderRadius: 6,
          backgroundColor: batchMode ? Colors.error + '10' : 'transparent',
          color: batchMode ? Colors.error : Colors.primary, cursor: 'pointer', fontSize: 11, fontWeight: 600,
        }}>
          {batchMode ? 'Cancel' : 'Select'}
        </button>
      </div>

      {(() => {
        const anomalies = detectAnomalies()
        if (anomalies.length === 0) return null
        return (
          <details style={{ marginBottom: Spacing.md, backgroundColor: Colors.errorLight, borderRadius: BorderRadius.md, padding: Spacing.md, border: `1px solid ${Colors.error}30`, cursor: 'pointer' }}>
            <summary style={{ fontSize: 12, fontWeight: 700, color: Colors.error, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icons.Star size={14} /> {anomalies.length} Anomal{anomalies.length === 1 ? 'y' : 'ies'} Detected
            </summary>
            <div style={{ marginTop: Spacing.sm, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {anomalies.map((a, i) => (
                <div key={i} style={{ fontSize: 11, color: Colors.textSecondary, padding: '4px 0', borderBottom: `1px solid ${Colors.error}15`, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: a.severity === 'HIGH' ? Colors.error : Colors.warning, flexShrink: 0 }} />
                  {a.message}
                </div>
              ))}
            </div>
          </details>
        )
      })()}

      {!ready ? (
        <ListSkeleton count={6} />
      ) : invoices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: Spacing.huge, color: Colors.textDisabled }}>
          <div style={{ marginBottom: Spacing.md }}><Icons.Invoice size={48} /></div>
          <div>No invoices yet</div>
          <button data-haptic="10" onClick={() => onNavigate('billing')} style={{ marginTop: Spacing.md, ...s.primaryBtn }}>Create First Invoice</button>
        </div>
      ) : (
        order.map(group => {
          const items = grouped[group]
          if (!items) return null
          return (
            <div key={group} style={{ marginBottom: Spacing.md }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: Colors.textSecondary, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 1 }}>{group} ({items.length})</div>
              {items.map(inv => (
                <div key={inv.id} onClick={() => !batchMode && onNavigate('invoice-view?id=' + inv.id)} style={{
                  ...s.listItem,
                  backgroundColor: batch.isSelected(inv.id) ? Colors.primary + '08' : Colors.surface,
                }}
                  onMouseEnter={e => !batchMode && (e.currentTarget.style.backgroundColor = Colors.surfaceVariant)}
                  onMouseLeave={e => !batchMode && (e.currentTarget.style.backgroundColor = Colors.surface)}>
                  {batchMode && (
                    <div onClick={e => { e.stopPropagation(); batch.toggle(inv.id) }} style={{
                      width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer',
                    }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: 4, border: `2px solid ${batch.isSelected(inv.id) ? Colors.primary : Colors.border}`,
                        backgroundColor: batch.isSelected(inv.id) ? Colors.primary : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                      }}>
                        {batch.isSelected(inv.id) && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>}
                      </div>
                    </div>
                  )}
                  <div style={s.listStrip(statusColor(inv.paymentStatus))} />
                  <div style={{ ...s.listBody, gap: 2 }}>
                    <div style={{ ...s.spaceBetween }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: Colors.textPrimary }}>#{inv.invoiceNo}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: Colors.textPrimary }}>{formatCurrency(inv.grandTotal)}</span>
                        <ContextMenu trigger={<span style={{ padding: '4px', display: 'flex', color: Colors.textDisabled, cursor: 'pointer' }}><Icons.More size={18} /></span>}
                          items={[
                            { label: 'Duplicate', icon: <Icons.Document size={14} />, onClick: () => handleDuplicate(inv) },
                            ...(inv.docType === 'SALE' ? [{ label: 'Receive Payment', icon: <Icons.Payment size={14} />, onClick: () => onNavigate('add-payment?id=' + inv.id), color: Colors.success }] : []),
                            ...(inv.docType === 'PURCHASE' ? [{ label: 'Make Payment', icon: <Icons.Payment size={14} />, onClick: () => onNavigate('add-payment-out?id=' + inv.id), color: Colors.error }] : []),
                            { label: 'Return', icon: <Icons.Refresh size={14} />, onClick: () => onNavigate('returns?sourceId=' + inv.id), color: Colors.warning },
                            { label: 'Delivery Challan', icon: <Icons.Truck size={14} />, onClick: () => handleChallan(inv), color: '#1565C0' },
                            { label: 'Share as PDF', icon: <Icons.Download size={14} />, onClick: () => onNavigate('invoice-view?id=' + inv.id) },
                            { label: 'Generate e-Invoice', icon: <Icons.Star size={14} />, onClick: () => handleEInvoice(inv), color: Colors.primary },
                          ]}
                        />
                      </div>
                    </div>
                    <div style={{ ...s.spaceBetween }}>
                      <span style={{ fontSize: 12, color: Colors.textSecondary }}>{inv.partyName} · {formatDate(inv.date)}</span>
                      <span style={s.badge(statusColor(inv.paymentStatus))}>{inv.paymentStatus}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 12 }}>
                      {inv.dueAmount > 0 ? (
                        <span style={{ color: Colors.error }}>Due: {formatCurrency(inv.dueAmount)}</span>
                      ) : (
                        <span style={{ color: Colors.success }}>Paid</span>
                      )}
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ContextMenu trigger={<span style={{ padding: 4, display: 'flex', color: Colors.textSecondary, cursor: 'pointer' }} title="Share"><Icons.Upload size={16} /></span>}
                          items={[
                            { label: 'Share as Image', icon: <Icons.Camera size={14} />, onClick: () => handleShareImage(inv) },
                            { label: 'Share as PDF', icon: <Icons.Download size={14} />, onClick: () => onNavigate('invoice-view?id=' + inv.id) },
                            { divider: true },
                            { label: defaultOption === 'image' ? '✓ Default: Image' : 'Set Image as Default', icon: defaultOption === 'image' ? undefined : <Icons.Star size={14} />, onClick: () => saveDefault('image') },
                            { label: defaultOption === 'pdf' ? '✓ Default: PDF' : 'Set PDF as Default', icon: defaultOption === 'pdf' ? undefined : <Icons.Star size={14} />, onClick: () => saveDefault('pdf') },
                          ]}
                        />
                        <span onClick={(e) => defaultShare(inv, e)} style={{ padding: 4, display: 'flex', color: Colors.textSecondary, cursor: 'pointer' }} title={`Share as ${defaultOption === 'image' ? 'Image' : 'PDF'}`}>
                          {defaultOption === 'image' ? <Icons.Camera size={16} /> : <Icons.Download size={16} />}
                        </span>
                        <span data-haptic="5" onClick={(e) => { e.stopPropagation(); onNavigate('invoice-view?id=' + inv.id + '&print=1') }} style={{ padding: 4, display: 'flex', color: Colors.textSecondary, cursor: 'pointer' }} title="Print">
                          <Icons.Print size={16} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        })
      )}

      <BatchActionBar
        selectedCount={batch.selectedCount}
        onClear={() => { batch.clearSelection(); setBatchMode(false) }}
        actions={[
          { label: 'Mark Paid', icon: <Icons.Payment size={14} />, onClick: handleBatchMarkPaid, color: Colors.success },
          { label: 'Delete', icon: <Icons.Delete size={14} />, onClick: handleBatchDelete, danger: true },
        ]}
      />

      <button data-haptic="8" onClick={() => onNavigate('billing')} style={{
        position: 'fixed', right: Spacing.lg, bottom: 80, width: 56, height: 56, borderRadius: 28,
        backgroundColor: Colors.primary, color: Colors.textLight, border: 'none', fontSize: 28,
        cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Icons.Add size={28} /></button>
    </div>
  )
}
