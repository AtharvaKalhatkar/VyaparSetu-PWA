import React, { useState, useMemo } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, formatDate, generateId, todayISO, nextInvoiceNo } from '../utils/formatting'
import { SelectSheet } from '../utils/smooth'
import { Icons } from '../utils/Icons'
import { deleteInvoiceWithReversal, applyStockChanges, createLedgerEntry } from '../utils/invoiceOps'
import type { Invoice, InvoiceItem } from '../types'

const COMMON_UNITS = ['Pcs', 'Pack', 'Box', 'Outer', 'Carton', 'Bundle', 'Kg', 'Gm', 'Ltr', 'Ml', 'Meter', 'Feet', 'Set', 'Pair', 'Bag', 'Dozen', 'Bottle', 'Can']

export function OrdersPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [tab, setTab] = useState<'SALE' | 'PURCHASE'>('SALE')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'CONFIRMED' | 'PARTIAL' | 'CONVERTED' | 'OVERDUE'>('ALL')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<'SALE' | 'PURCHASE'>('SALE')
  const [partyId, setPartyId] = useState('')
  const [showPartySheet, setShowPartySheet] = useState(false)
  const [showItemSheet, setShowItemSheet] = useState(false)
  const [date, setDate] = useState(todayISO())
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('')
  const [advancePaid, setAdvancePaid] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<{ itemId: string; name: string; qty: string; rate: string; unit: string; gstRate: number }[]>([])

  // Modal for Partial Conversion
  const [convertingOrder, setConvertingOrder] = useState<Invoice | null>(null)
  const [convertQtys, setConvertQtys] = useState<Record<string, number>>({})

  // Modal for Salesman Field Payment Collection
  const [collectingOrder, setCollectingOrder] = useState<Invoice | null>(null)
  const [collectAmount, setCollectAmount] = useState('')
  const [collectMode, setCollectMode] = useState<'CASH' | 'UPI' | 'CHEQUE' | 'BANK_TRANSFER'>('UPI')
  const [collectReference, setCollectReference] = useState('')
  const [salesmanName, setSalesmanName] = useState('')

  const allOrders = DB.invoices.list().filter(i => i.docType === (tab === 'SALE' ? 'SALE_ORDER' : 'PURCHASE_ORDER'))
  const profile = DB.businessProfile.get()

  // Calculate Today's Total Collections on Orders
  const todayCollections = useMemo(() => {
    const today = todayISO()
    return allOrders.reduce((sum, o) => sum + (o.date === today ? (o.advancePaid || 0) : 0), 0)
  }, [allOrders])

  const filtered = useMemo(() => {
    const today = todayISO()
    return allOrders.filter(o => {
      const matchSearch = o.invoiceNo.toLowerCase().includes(search.toLowerCase()) || o.partyName.toLowerCase().includes(search.toLowerCase())
      if (!matchSearch) return false

      if (statusFilter === 'ALL') return true
      if (statusFilter === 'OVERDUE') {
        return o.orderStatus !== 'CONVERTED' && o.orderStatus !== 'CANCELLED' && o.expectedDeliveryDate && o.expectedDeliveryDate < today
      }
      return o.orderStatus === statusFilter
    })
  }, [allOrders, search, statusFilter])

  const parties = DB.parties.list().filter(p => formType === 'SALE' ? p.type !== 'SUPPLIER' : p.type !== 'CUSTOMER')
  const allItems = DB.items.list().filter(i => i.isActive)

  const calcSubtotal = () => lines.reduce((s, l) => s + (parseFloat(l.qty) || 0) * (parseFloat(l.rate) || 0), 0)
  const calcTax = () => lines.reduce((s, l) => s + ((parseFloat(l.qty) || 0) * (parseFloat(l.rate) || 0) * (l.gstRate || 0)) / 100, 0)
  const calcGrandTotal = () => calcSubtotal() + calcTax()

  const addLine = (itemId: string) => {
    const item = allItems.find(i => i.id === itemId)
    if (!item || lines.find(l => l.itemId === itemId)) return
    setLines(prev => [...prev, {
      itemId: item.id,
      name: item.name,
      qty: '1',
      rate: String(formType === 'SALE' ? item.sellingPrice : (item.purchasePrice || item.sellingPrice)),
      unit: item.unit || 'Pcs',
      gstRate: item.gstRate || 0,
    }])
  }

  const updateLineUnit = (idx: number, newUnit: string) => {
    const l = lines[idx]
    const item = allItems.find(i => i.id === l.itemId)
    let newRate = l.rate
    if (item && item.units) {
      const iu = item.units.find(u => u.unitName === newUnit)
      if (iu && iu.sellingPrice) {
        newRate = String(formType === 'SALE' ? iu.sellingPrice : (iu.purchasePrice || iu.sellingPrice))
      }
    }
    setLines(prev => prev.map((line, i) => i === idx ? { ...line, unit: newUnit, rate: newRate } : line))
  }

  const updateLine = (idx: number, field: string, value: number | string) => {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }

  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx))

  const resetForm = () => {
    setShowForm(false)
    setLines([])
    setPartyId('')
    setDate(todayISO())
    setExpectedDeliveryDate('')
    setAdvancePaid('')
    setNotes('')
  }

  const handleSave = () => {
    if (!partyId || lines.length === 0) return
    const party = parties.find(p => p.id === partyId)
    const docType = formType === 'SALE' ? 'SALE_ORDER' : 'PURCHASE_ORDER'
    const subtotal = calcSubtotal()
    const taxAmount = calcTax()
    const grandTotal = subtotal + taxAmount
    const advance = parseFloat(advancePaid) || 0

    const orderRecord: Invoice = {
      id: generateId(),
      docType,
      invoiceNo: nextInvoiceNo(DB.invoices.list().filter(i => i.docType === docType).map(i => i.invoiceNo), formType === 'SALE' ? 'SO' : 'PO'),
      partyId,
      partyName: party?.name || '',
      type: formType,
      items: lines.map(l => {
        const qty = parseFloat(l.qty) || 0
        const rate = parseFloat(l.rate) || 0
        return {
          itemId: l.itemId,
          itemName: l.name,
          sku: '',
          quantity: qty,
          rate,
          unit: l.unit,
          discountPercent: 0,
          discountAmount: 0,
          gstRate: l.gstRate,
          amount: qty * rate,
        }
      }),
      subtotal,
      discountAmount: 0,
      taxAmount,
      grandTotal,
      paymentStatus: advance >= grandTotal ? 'PAID' : advance > 0 ? 'PARTIAL' : 'DRAFT',
      paidAmount: advance,
      dueAmount: Math.max(0, grandTotal - advance),
      date,
      expectedDeliveryDate: expectedDeliveryDate || undefined,
      advancePaid: advance,
      orderStatus: 'CONFIRMED',
      notes,
    }

    DB.invoices.save(orderRecord)

    // Log Advance Token Payment in Ledger if non-zero
    if (advance > 0 && party) {
      const ledgType = formType === 'SALE' ? 'RECEIPT' : 'PAYMENT'
      createLedgerEntry(
        party.id,
        party.name,
        ledgType,
        advance,
        'UPI / Cash',
        orderRecord.invoiceNo,
        `Token Advance for ${formType === 'SALE' ? 'Sale' : 'Purchase'} Order #${orderRecord.invoiceNo}`,
        date
      )
    }

    DB.auditLogs.save({
      id: generateId(),
      entity: 'ORDER',
      entityId: orderRecord.id,
      action: 'CREATE',
      user: 'Admin',
      timestamp: new Date().toISOString(),
      description: `Created ${formType} Order #${orderRecord.invoiceNo} (Advance: ₹${advance})`,
    })

    resetForm()
  }

  // Open Salesman Field Payment Collection Modal
  const openCollectModal = (order: Invoice) => {
    setCollectingOrder(order)
    setCollectAmount(String(order.dueAmount > 0 ? order.dueAmount : ''))
    setCollectMode('UPI')
    setCollectReference('')
    setSalesmanName('')
  }

  // Execute Payment Collection from Order
  const executePaymentCollection = () => {
    if (!collectingOrder) return
    const amt = parseFloat(collectAmount)
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid collection amount')
      return
    }

    const order = collectingOrder
    const newAdvance = (order.advancePaid || 0) + amt
    const newDue = Math.max(0, order.grandTotal - newAdvance)
    const newPaymentStatus = newDue === 0 ? 'PAID' : 'PARTIAL'

    const updatedOrder: Invoice = {
      ...order,
      advancePaid: newAdvance,
      paidAmount: newAdvance,
      dueAmount: newDue,
      paymentStatus: newPaymentStatus,
    }

    DB.invoices.save(updatedOrder)

    // Log Ledger Receipt / Payment Entry
    const party = DB.parties.byId(order.partyId)
    const isSale = order.type === 'SALE' || order.docType === 'SALE_ORDER'
    const ledgType = isSale ? 'RECEIPT' : 'PAYMENT'

    createLedgerEntry(
      order.partyId,
      order.partyName,
      ledgType,
      amt,
      `${collectMode}${collectReference ? ` (${collectReference})` : ''}`,
      order.invoiceNo,
      `Field Sales Payment Collection for Order #${order.invoiceNo}${salesmanName ? ` by ${salesmanName}` : ''}`,
      todayISO()
    )

    DB.auditLogs.save({
      id: generateId(),
      entity: 'ORDER_COLLECTION',
      entityId: order.id,
      action: 'UPDATE',
      user: salesmanName || 'Salesman',
      timestamp: new Date().toISOString(),
      description: `Collected ₹${amt} via ${collectMode} for Order #${order.invoiceNo}`,
    })

    // Offer instant WhatsApp receipt to customer
    if (party?.phone) {
      const cleanPhone = party.phone.replace(/[^0-9]/g, '')
      const msg = `🧾 *Payment Receipt - ${profile.businessName}*\n\n` +
        `Received *${formatCurrency(amt)}* via *${collectMode}* for Order *#${order.invoiceNo}*\n` +
        (salesmanName ? `Collected by Sales Executive: *${salesmanName}*\n` : '') +
        `Remaining Order Due: *${formatCurrency(newDue)}*\n\nThank you!`

      const waUrl = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(msg)}`
      window.open(waUrl, '_blank')
    }

    alert(`✅ Payment of ${formatCurrency(amt)} recorded successfully!`)
    setCollectingOrder(null)
  }

  // Open Partial/Full Conversion Modal
  const openConvertModal = (order: Invoice) => {
    const initQtys: Record<string, number> = {}
    order.items.forEach(i => {
      initQtys[i.itemId] = i.quantity
    })
    setConvertingOrder(order)
    setConvertQtys(initQtys)
  }

  // Execute Invoice Conversion (Pulls system live rate)
  const executeConversion = () => {
    if (!convertingOrder) return
    const order = convertingOrder
    const isSale = order.type === 'SALE' || order.docType === 'SALE_ORDER'
    const dt = isSale ? ('SALE' as const) : ('PURCHASE' as const)
    const prefix = isSale ? 'INV' : 'PUR'

    const convertedItems: InvoiceItem[] = []
    const remainingItems: InvoiceItem[] = []

    order.items.forEach(item => {
      const dbItem = DB.items.byId(item.itemId)
      const qtyToBill = convertQtys[item.itemId] || 0

      // Pull system live rate from DB if available, fallback to order rate
      const systemRate = isSale
        ? (dbItem?.sellingPrice ?? item.rate)
        : (dbItem?.purchasePrice ?? dbItem?.sellingPrice ?? item.rate)

      if (qtyToBill > 0) {
        convertedItems.push({
          ...item,
          quantity: qtyToBill,
          rate: systemRate,
          amount: qtyToBill * systemRate,
        })
      }
      const remainingQty = item.quantity - qtyToBill
      if (remainingQty > 0) {
        remainingItems.push({
          ...item,
          quantity: remainingQty,
          amount: remainingQty * item.rate,
        })
      }
    })

    if (convertedItems.length === 0) {
      alert('Please specify at least 1 item quantity to convert into invoice.')
      return
    }

    const subtotal = convertedItems.reduce((s, i) => s + i.amount, 0)
    const taxAmount = convertedItems.reduce((s, i) => s + (i.amount * i.gstRate) / 100, 0)
    const grandTotal = subtotal + taxAmount

    // Apply Advance Payment deduction if available
    const advanceDeducted = Math.min(order.advancePaid || 0, grandTotal)
    const dueAmount = Math.max(0, grandTotal - advanceDeducted)

    const newInv: Invoice = {
      id: generateId(),
      docType: dt,
      invoiceNo: nextInvoiceNo(DB.invoices.list().filter(i => i.docType === dt).map(i => i.invoiceNo), prefix),
      partyId: order.partyId,
      partyName: order.partyName,
      type: dt,
      items: convertedItems,
      subtotal,
      discountAmount: 0,
      taxAmount,
      grandTotal,
      paymentStatus: dueAmount === 0 ? 'PAID' : advanceDeducted > 0 ? 'PARTIAL' : 'PENDING',
      paidAmount: advanceDeducted,
      dueAmount,
      date: todayISO(),
      notes: `Converted from Order #${order.invoiceNo}`,
    }

    DB.invoices.save(newInv)

    // Update Stock
    applyStockChanges(
      convertedItems.map(i => ({ itemId: i.itemId, quantity: i.quantity, unit: i.unit })),
      dt,
      false
    )

    // Ledger Entry
    const ledgType = isSale ? 'SALE' : 'PURCHASE'
    createLedgerEntry(
      newInv.partyId,
      newInv.partyName,
      ledgType,
      grandTotal,
      'CREDIT',
      newInv.invoiceNo,
      `Billed from Order #${order.invoiceNo}${advanceDeducted > 0 ? ` (Advance ₹${advanceDeducted} applied)` : ''}`,
      todayISO()
    )

    // Update Order Status
    const isFullyConverted = remainingItems.length === 0
    const updatedOrderStatus = isFullyConverted ? 'CONVERTED' : 'PARTIAL'

    DB.invoices.save({
      ...order,
      orderStatus: updatedOrderStatus,
      advancePaid: Math.max(0, (order.advancePaid || 0) - advanceDeducted),
      convertedTo: newInv.id,
      items: isFullyConverted ? order.items : remainingItems,
    })

    DB.auditLogs.save({
      id: generateId(),
      entity: 'ORDER',
      entityId: order.id,
      action: 'UPDATE',
      user: 'Admin',
      timestamp: new Date().toISOString(),
      description: `Converted Order #${order.invoiceNo} ➔ ${dt} Invoice #${newInv.invoiceNo} (${updatedOrderStatus})`,
    })

    setConvertingOrder(null)
    onNavigate(`invoice-view?id=${newInv.id}`)
  }

  // Convert to Delivery Challan
  const handleConvertToChallan = (order: Invoice) => {
    const challanNo = nextInvoiceNo(DB.invoices.list().filter(i => i.docType === 'CHALLAN').map(i => i.invoiceNo), 'DC')
    const challanRecord: Invoice = {
      ...order,
      id: generateId(),
      docType: 'CHALLAN',
      invoiceNo: challanNo,
      date: todayISO(),
      notes: `Delivery Challan generated from Order #${order.invoiceNo}`,
      orderStatus: 'OPEN',
    }
    DB.invoices.save(challanRecord)
    alert(`✅ Delivery Challan #${challanNo} created!`)
    onNavigate(`invoice-view?id=${challanRecord.id}`)
  }

  // WhatsApp 1-Click Order Share
  const handleWhatsAppShare = (order: Invoice) => {
    const party = DB.parties.byId(order.partyId)
    const phone = party?.phone || profile.phone || ''
    const cleanPhone = phone.replace(/[^0-9]/g, '')

    const itemSummary = order.items.map(i => `• ${i.itemName}: ${i.quantity} ${i.unit} × ₹${i.rate} = ₹${i.amount}`).join('\n')
    const msg = `🧾 *Order Confirmation - ${profile.businessName}*\n\n` +
      `Order No: *${order.invoiceNo}*\n` +
      `Date: ${formatDate(order.date)}\n` +
      `Party: *${order.partyName}*\n` +
      (order.expectedDeliveryDate ? `Expected Delivery: *${formatDate(order.expectedDeliveryDate)}*\n` : '') +
      `------------------------\n` +
      `${itemSummary}\n` +
      `------------------------\n` +
      `Total Order Value: *${formatCurrency(order.grandTotal)}*\n` +
      (order.advancePaid && order.advancePaid > 0 ? `Advance Paid: *${formatCurrency(order.advancePaid)}*\nRemaining Due: *${formatCurrency(order.dueAmount)}*\n` : '') +
      `\nThank you for doing business with us!`

    const url = cleanPhone
      ? `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`

    window.open(url, '_blank')
  }

  const handleDelete = (id: string) => {
    if (confirm('Delete this order?')) deleteInvoiceWithReversal(id)
  }

  const orderStatusBadge = (st?: string) => {
    const map: Record<string, { color: string; label: string }> = {
      OPEN: { color: Colors.info, label: 'Open' },
      CONFIRMED: { color: Colors.primary, label: 'Confirmed' },
      PARTIAL: { color: Colors.warning, label: 'Partially Billed' },
      CONVERTED: { color: Colors.textDisabled, label: 'Fully Billed' },
      CANCELLED: { color: Colors.error, label: 'Cancelled' },
    }
    const item = map[st || 'OPEN'] || { color: Colors.textSecondary, label: st || 'Open' }
    return <span style={s.badge(item.color)}>{item.label}</span>
  }

  if (showForm) {
    return (
      <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: Colors.textPrimary }}>New {formType === 'SALE' ? 'Sale' : 'Purchase'} Order</div>
          <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: Colors.textDisabled }}>✕</button>
        </div>

        <div style={s.toggleGroup}>
          <button onClick={() => setFormType('SALE')} style={s.toggle(formType === 'SALE', Colors.primary)}>Sale Order (Customer)</button>
          <button onClick={() => setFormType('PURCHASE')} style={s.toggle(formType === 'PURCHASE', Colors.warning)}>Purchase Order (Supplier)</button>
        </div>

        {/* Party Selector */}
        <Field label={formType === 'SALE' ? 'Customer' : 'Supplier'}>
          <div onClick={() => setShowPartySheet(true)} style={{ ...s.select, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: partyId ? Colors.textPrimary : Colors.textDisabled }}>
              {partyId ? parties.find(p => p.id === partyId)?.name : `Select ${formType === 'SALE' ? 'Customer' : 'Supplier'}...`}
            </span>
            <span style={{ color: Colors.textDisabled, fontSize: 10 }}>▼</span>
          </div>
        </Field>
        <SelectSheet open={showPartySheet} onClose={() => setShowPartySheet(false)} title={`Select ${formType === 'SALE' ? 'Customer' : 'Supplier'}`}
          options={parties.map(p => ({ value: p.id, label: p.name, sublabel: p.phone }))}
          onSelect={(v) => setPartyId(v)} searchable />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: Spacing.sm }}>
          <Field label="Order Date"><input type="date" value={date} onChange={e => setDate(e.target.value)} style={s.input} /></Field>
          <Field label="Expected Delivery Date"><input type="date" value={expectedDeliveryDate} onChange={e => setExpectedDeliveryDate(e.target.value)} style={s.input} /></Field>
        </div>

        {/* Searchable Product Dropdown Button */}
        <Field label="Add Items to Order">
          <button onClick={() => setShowItemSheet(true)} style={{ ...s.select, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.primary }}>
            <span style={{ color: Colors.textSecondary, fontWeight: 500, fontSize: 13 }}>🔍 Search & select product from inventory...</span>
            <span style={{ color: Colors.primary, fontWeight: 700, fontSize: 12, backgroundColor: Colors.primaryLight, padding: '2px 8px', borderRadius: 4 }}>+ Browse Items</span>
          </button>
        </Field>
        <SelectSheet open={showItemSheet} onClose={() => setShowItemSheet(false)} title="Search Product Inventory"
          options={allItems.map(i => ({
            value: i.id,
            label: `${i.name} (Stock: ${i.currentStock || 0} ${i.unit})`,
            sublabel: `Rate: ₹${formType === 'SALE' ? i.sellingPrice : (i.purchasePrice || i.sellingPrice)} · SKU: ${i.sku || 'N/A'}${i.category ? ` · ${i.category}` : ''}`
          }))}
          onSelect={(v) => { addLine(v); setShowItemSheet(false) }} searchable />

        {/* Quick Item Picker Chips */}
        <div style={{ fontSize: 12, fontWeight: 600, color: Colors.textSecondary, marginBottom: 4 }}>Quick Add Items:</div>
        <div style={{ display: 'flex', gap: Spacing.xs, flexWrap: 'wrap', marginBottom: Spacing.md }}>
          {allItems.filter(i => !lines.find(l => l.itemId === i.id)).slice(0, 8).map(i => (
            <button key={i.id} onClick={() => addLine(i.id)} style={{ padding: '6px 10px', backgroundColor: Colors.surface, border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.sm, fontSize: 11, cursor: 'pointer', color: Colors.textSecondary, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icons.Add size={12} /> {i.name} <span style={{ color: Colors.primary, fontWeight: 700 }}>({i.currentStock || 0} {i.unit})</span>
            </button>
          ))}
        </div>

        <div style={{ fontSize: 14, fontWeight: 600, color: Colors.textPrimary, marginBottom: Spacing.sm }}>
          Order Items ({lines.length})
        </div>

        {/* Order Line Items List */}
        {lines.map((l, idx) => {
          const dbItem = allItems.find(i => i.id === l.itemId)
          const availableUnits = Array.from(new Set([
            l.unit,
            dbItem?.unit || 'Pcs',
            ...(dbItem?.units?.map(u => u.unitName) || []),
            ...COMMON_UNITS,
          ])).filter(Boolean)

          return (
            <div key={idx} style={{ backgroundColor: Colors.surface, border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.xs }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: Colors.textPrimary }}>{l.name}</span>
                  {dbItem && (
                    <span style={{ fontSize: 11, color: (dbItem.currentStock || 0) <= (dbItem.minStockLevel || 0) ? Colors.error : Colors.success, marginLeft: 8, fontWeight: 600 }}>
                      📦 System Stock: {dbItem.currentStock || 0} {dbItem.unit}
                    </span>
                  )}
                </div>
                <button onClick={() => removeLine(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: Colors.error, padding: 2 }}><Icons.Delete size={16} /></button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, color: Colors.textSecondary }}>Qty:</span>
                  <input inputMode="decimal" value={l.qty} onChange={e => updateLine(idx, 'qty', e.target.value)} onBlur={e => { const v = parseFloat(e.target.value); if (isNaN(v) || v <= 0) updateLine(idx, 'qty', '1') }} style={{ ...s.input, width: 55, padding: '4px 6px', textAlign: 'center', fontWeight: 700 }} />
                </div>

                {/* Unit Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, color: Colors.textSecondary }}>Unit:</span>
                  <select value={l.unit} onChange={e => updateLineUnit(idx, e.target.value)} style={{ ...s.select, width: 90, padding: '4px 6px', fontSize: 12, fontWeight: 600 }}>
                    {availableUnits.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, color: Colors.textSecondary }}>Rate (₹):</span>
                  <input inputMode="decimal" value={l.rate} onChange={e => updateLine(idx, 'rate', e.target.value)} onBlur={e => { const v = parseFloat(e.target.value); if (isNaN(v) || v < 0) updateLine(idx, 'rate', '0') }} style={{ ...s.input, width: 75, padding: '4px 6px', fontWeight: 700 }} />
                </div>

                <div style={{ flex: 1, textAlign: 'right', fontWeight: 800, fontSize: 14, color: Colors.primary }}>
                  {formatCurrency((parseFloat(l.qty) || 0) * (parseFloat(l.rate) || 0))}
                </div>
              </div>
            </div>
          )
        })}

        {lines.length > 0 && (
          <div style={{ backgroundColor: Colors.primaryLight + '40', borderRadius: BorderRadius.md, padding: Spacing.sm, marginTop: Spacing.sm, marginBottom: Spacing.md, fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span>Subtotal:</span>
              <span>{formatCurrency(calcSubtotal())}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, color: Colors.textSecondary }}>
              <span>GST Tax:</span>
              <span>{formatCurrency(calcTax())}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 14, color: Colors.primary, borderTop: `1px solid ${Colors.primary}30`, paddingTop: 4, marginTop: 4 }}>
              <span>Total Order Value:</span>
              <span>{formatCurrency(calcGrandTotal())}</span>
            </div>
          </div>
        )}

        <Field label="Token Advance Received (₹) (Optional)">
          <input inputMode="decimal" value={advancePaid} onChange={e => setAdvancePaid(e.target.value)} placeholder="e.g., 5000" style={s.input} />
        </Field>

        <Field label="Order Notes & Special Instructions">
          <textarea value={notes} onChange={e => setNotes(e.target.value)} style={s.textarea} rows={2} placeholder="e.g. Delivery after 2 PM, Special packing required" />
        </Field>

        <div style={{ display: 'flex', gap: Spacing.sm, marginTop: Spacing.md }}>
          <button onClick={handleSave} disabled={!partyId || lines.length === 0} style={!partyId || lines.length === 0 ? s.primaryBtnDisabled : s.primaryBtn}>Save {formType === 'SALE' ? 'Sale' : 'Purchase'} Order</button>
        </div>
        <button onClick={resetForm} style={{ marginTop: Spacing.sm, width: '100%', padding: '10px', background: 'none', border: 'none', color: Colors.textSecondary, cursor: 'pointer' }}>Cancel</button>
      </div>
    )
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      {/* Top Salesman Field Collection Summary Banner */}
      {todayCollections > 0 && (
        <div style={{ backgroundColor: Colors.successLight, border: `1px solid ${Colors.success}40`, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: Colors.success, textTransform: 'uppercase', letterSpacing: 0.5 }}>💰 Today's Field Sales Collections</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: Colors.textPrimary, marginTop: 2 }}>{formatCurrency(todayCollections)}</div>
          </div>
          <button onClick={() => onNavigate('reports')} style={{ padding: '6px 12px', backgroundColor: Colors.success, color: '#fff', border: 'none', borderRadius: BorderRadius.sm, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            View Ledger
          </button>
        </div>
      )}

      {/* Top Order Type Toggle */}
      <div style={s.toggleGroup}>
        <button onClick={() => setTab('SALE')} style={s.toggle(tab === 'SALE', Colors.primary)}>Sale Orders</button>
        <button onClick={() => setTab('PURCHASE')} style={s.toggle(tab === 'PURCHASE', Colors.warning)}>Purchase Orders</button>
      </div>

      {/* Status Filter Chips */}
      <div style={{ display: 'flex', gap: Spacing.xs, overflowX: 'auto', paddingBottom: Spacing.xs, marginBottom: Spacing.md }}>
        {(['ALL', 'OPEN', 'CONFIRMED', 'PARTIAL', 'CONVERTED', 'OVERDUE'] as const).map(st => (
          <button key={st} onClick={() => setStatusFilter(st)} style={{
            padding: '5px 12px',
            borderRadius: BorderRadius.round,
            border: `1px solid ${statusFilter === st ? Colors.primary : Colors.border}`,
            backgroundColor: statusFilter === st ? Colors.primaryLight : Colors.surface,
            color: statusFilter === st ? Colors.primary : Colors.textSecondary,
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}>
            {st === 'ALL' ? 'All Orders' : st === 'OVERDUE' ? '⚠️ Overdue' : st}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: Spacing.md }}>
        <span style={{ position: 'absolute', left: 12, top: 10, display: 'flex', alignItems: 'center', color: Colors.textDisabled }}><Icons.Search size={16} /></span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders by number or party name..." style={{ ...s.searchBox, paddingLeft: 36 }} />
      </div>

      {/* Order Cards List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: Spacing.huge, color: Colors.textDisabled }}>
          <div style={{ marginBottom: Spacing.md }}><Icons.Invoice size={48} /></div>
          <div style={{ fontSize: 14 }}>No {statusFilter.toLowerCase()} orders found</div>
        </div>
      ) : (
        filtered.map(o => {
          const isOverdue = o.orderStatus !== 'CONVERTED' && o.orderStatus !== 'CANCELLED' && o.expectedDeliveryDate && o.expectedDeliveryDate < todayISO()
          return (
            <div key={o.id} style={{ ...s.card, marginBottom: Spacing.sm, borderLeft: isOverdue ? `4px solid ${Colors.error}` : undefined }}>
              <div style={{ ...s.spaceBetween, marginBottom: Spacing.xs }}>
                <div>
                  <span style={{ fontWeight: 800, fontSize: 15, color: Colors.textPrimary }}>#{o.invoiceNo}</span>
                  {isOverdue && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: Colors.error, backgroundColor: Colors.errorLight, padding: '2px 6px', borderRadius: 4 }}>⚠️ Overdue</span>}
                </div>
                {orderStatusBadge(o.orderStatus)}
              </div>

              <div style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.xs }}>
                👤 <strong>{o.partyName}</strong> · {formatDate(o.date)}
              </div>

              {o.expectedDeliveryDate && (
                <div style={{ fontSize: 11, color: isOverdue ? Colors.error : Colors.info, marginBottom: Spacing.xs, fontWeight: 600 }}>
                  📅 Expected Delivery: {formatDate(o.expectedDeliveryDate)}
                </div>
              )}

              <div style={{ ...s.spaceBetween, marginBottom: Spacing.sm }}>
                <span style={{ fontSize: 12, color: Colors.textDisabled }}>{o.items.length} items</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: Colors.textPrimary }}>{formatCurrency(o.grandTotal)}</div>
                  {o.advancePaid && o.advancePaid > 0 ? (
                    <div style={{ fontSize: 10, color: Colors.success }}>Advance Paid: {formatCurrency(o.advancePaid)} (Due: {formatCurrency(o.dueAmount)})</div>
                  ) : null}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: Spacing.xs, flexWrap: 'wrap' }}>
                <button onClick={(e) => { e.stopPropagation(); onNavigate('invoice-view?id=' + o.id) }} style={{ flex: 1, padding: '7px 10px', backgroundColor: Colors.surfaceVariant, border: 'none', borderRadius: BorderRadius.sm, fontSize: 11, fontWeight: 600, color: Colors.textPrimary, cursor: 'pointer' }}>View PDF</button>

                {o.orderStatus !== 'CONVERTED' && o.orderStatus !== 'CANCELLED' && o.dueAmount > 0 && (
                  <button onClick={(e) => { e.stopPropagation(); openCollectModal(o) }} style={{ flex: 1, padding: '7px 10px', backgroundColor: Colors.successLight, border: `1px solid ${Colors.success}30`, borderRadius: BorderRadius.sm, fontSize: 11, fontWeight: 700, color: Colors.success, cursor: 'pointer' }}>
                    💳 Collect ₹
                  </button>
                )}

                {o.orderStatus !== 'CONVERTED' && o.orderStatus !== 'CANCELLED' && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); openConvertModal(o) }} style={{ flex: 1, padding: '7px 10px', backgroundColor: Colors.primary + '15', border: 'none', borderRadius: BorderRadius.sm, fontSize: 11, fontWeight: 700, color: Colors.primary, cursor: 'pointer' }}>
                      Convert ➔ Invoice
                    </button>

                    <button onClick={(e) => { e.stopPropagation(); handleConvertToChallan(o) }} style={{ flex: 1, padding: '7px 10px', backgroundColor: Colors.accent + '15', border: 'none', borderRadius: BorderRadius.sm, fontSize: 11, fontWeight: 600, color: Colors.accent, cursor: 'pointer' }}>
                      Challan
                    </button>
                  </>
                )}

                <button onClick={(e) => { e.stopPropagation(); handleWhatsAppShare(o) }} style={{ padding: '7px 10px', backgroundColor: '#25D366' + '20', border: 'none', borderRadius: BorderRadius.sm, fontSize: 11, fontWeight: 700, color: '#128C7E', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  WhatsApp
                </button>

                <button onClick={(e) => { e.stopPropagation(); handleDelete(o.id) }} style={{ padding: '7px 10px', backgroundColor: Colors.errorLight, border: 'none', borderRadius: BorderRadius.sm, color: Colors.error, cursor: 'pointer' }}><Icons.Delete size={14} /></button>
              </div>
            </div>
          )
        })
      )}

      {/* Field Sales Payment Collection Modal */}
      {collectingOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: Spacing.md }}>
          <div style={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.lg, width: '100%', maxWidth: 420 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: Colors.textPrimary, marginBottom: 4 }}>💳 Field Sales Payment Collection</div>
            <div style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.md }}>
              Collecting payment for Order <strong>#{collectingOrder.invoiceNo}</strong> ({collectingOrder.partyName})
            </div>

            <Field label="Collection Amount (₹)">
              <input inputMode="decimal" value={collectAmount} onChange={e => setCollectAmount(e.target.value)} style={{ ...s.input, fontSize: 16, fontWeight: 800, color: Colors.primary }} />
            </Field>

            <Field label="Payment Mode">
              <select value={collectMode} onChange={e => setCollectMode(e.target.value as any)} style={s.select}>
                <option value="UPI">UPI (GPay / PhonePe / Paytm / QR)</option>
                <option value="CASH">Cash Payment</option>
                <option value="CHEQUE">Cheque / Demand Draft</option>
                <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS)</option>
              </select>
            </Field>

            <Field label="Reference / UTR / Cheque No. (Optional)">
              <input value={collectReference} onChange={e => setCollectReference(e.target.value)} placeholder="e.g. UTR-98765432" style={s.input} />
            </Field>

            <Field label="Sales Executive / Representative Name">
              <input value={salesmanName} onChange={e => setSalesmanName(e.target.value)} placeholder="e.g. Rahul Sharma" style={s.input} />
            </Field>

            <div style={{ display: 'flex', gap: Spacing.sm, marginTop: Spacing.lg }}>
              <button onClick={() => setCollectingOrder(null)} style={{ flex: 1, padding: '10px', background: 'none', border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.md, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={executePaymentCollection} style={{ flex: 1, padding: '10px', backgroundColor: Colors.success, color: '#fff', border: 'none', borderRadius: BorderRadius.md, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Record Receipt ➔</button>
            </div>
          </div>
        </div>
      )}

      {/* Partial / Full Order Conversion Modal */}
      {convertingOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: Spacing.md }}>
          <div style={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.lg, width: '100%', maxWidth: 450, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: Colors.textPrimary, marginBottom: 4 }}>Convert Order #{convertingOrder.invoiceNo}</div>
            <div style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.md }}>Select quantity to bill for this invoice (System live rates will apply):</div>

            {convertingOrder.items.map(item => {
              const dbItem = DB.items.byId(item.itemId)
              const liveRate = dbItem ? (convertingOrder.type === 'SALE' ? dbItem.sellingPrice : (dbItem.purchasePrice || dbItem.sellingPrice)) : item.rate

              return (
                <div key={item.itemId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm, padding: '8px 10px', backgroundColor: Colors.surfaceVariant, borderRadius: BorderRadius.sm }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{item.itemName}</div>
                    <div style={{ fontSize: 11, color: Colors.textSecondary }}>Order Total: {item.quantity} {item.unit}</div>
                    <div style={{ fontSize: 10, color: Colors.primary, fontWeight: 700 }}>System Live Rate: ₹{liveRate}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: Colors.textSecondary }}>Bill Qty:</span>
                    <input
                      type="number"
                      min="0"
                      max={item.quantity}
                      value={convertQtys[item.itemId] ?? item.quantity}
                      onChange={e => setConvertQtys({ ...convertQtys, [item.itemId]: Math.max(0, Math.min(item.quantity, parseFloat(e.target.value) || 0)) })}
                      style={{ width: 60, padding: '4px 6px', textAlign: 'center', fontWeight: 700, borderRadius: 6, border: `1px solid ${Colors.border}` }}
                    />
                    <span style={{ fontSize: 11 }}>{item.unit}</span>
                  </div>
                </div>
              )
            })}

            <div style={{ display: 'flex', gap: Spacing.sm, marginTop: Spacing.lg }}>
              <button onClick={() => setConvertingOrder(null)} style={{ flex: 1, padding: '10px', background: 'none', border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.md, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={executeConversion} style={{ flex: 1, padding: '10px', backgroundColor: Colors.primary, color: '#fff', border: 'none', borderRadius: BorderRadius.md, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Create Invoice ➔</button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button onClick={() => { setShowForm(true); setFormType(tab) }} style={{
        position: 'fixed', right: Spacing.lg, bottom: 80, width: 56, height: 56, borderRadius: 28,
        backgroundColor: Colors.primary, color: Colors.textLight, border: 'none', fontSize: 28,
        cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Icons.Add size={28} /></button>
    </div>
  )
}
