import React, { useState, useRef } from 'react'
import { Colors, Spacing, BorderRadius, Shadows } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { generateId, todayISO, nextInvoiceNo } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import type { Item, Invoice } from '../types'

declare const Tesseract: any

export function SmartPurchase() {
  const [image, setImage] = useState<string | null>(null)
  const [ocrText, setOcrText] = useState('')
  const [parsedItems, setParsedItems] = useState<{ name: string; qty: number; rate: number; amount: number }[]>([])
  const [loading, setLoading] = useState(false)
  const [partyId, setPartyId] = useState('')
  const [date, setDate] = useState(todayISO())
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const suppliers = DB.parties.list().filter(p => p.type === 'SUPPLIER' || p.type === 'BOTH')
  const items = DB.items.list().filter(i => i.isActive)

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string
      setImage(dataUrl)
      await runOcr(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const runOcr = async (dataUrl: string) => {
    setLoading(true)
    setOcrText('')
    setParsedItems([])
    try {
      if (!(window as any).Tesseract) {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'
        document.head.appendChild(script)
        await new Promise(r => { script.onload = r; setTimeout(r, 10000) })
      }
      const result = await (window as any).Tesseract.recognize(dataUrl, 'eng', { logger: () => {} })
      const text = result.data.text
      setOcrText(text)
      parseBillText(text)
    } catch (err) {
      setOcrText('OCR failed. Please enter items manually below.')
    }
    setLoading(false)
  }

  const parseBillText = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    const detected: { name: string; qty: number; rate: number; amount: number }[] = []

    for (const line of lines) {
      const nums = line.match(/[\d,]+\.?\d*/g)?.map(n => parseFloat(n.replace(/,/g, ''))) || []
      const rates = nums.filter(n => n > 0 && n < 999999)
      if (rates.length >= 2) {
        const amount = rates[rates.length - 1]
        const rate = rates.length >= 3 ? rates[rates.length - 2] : amount
        const qty = rates.length >= 3 ? rates[0] : 1
        const name = line.replace(/[\d,\.\s]+/g, '').trim()
        if (name && name.length > 1 && amount > 0) {
          const match = items.find(i => name.toLowerCase().includes(i.name.toLowerCase().slice(0, 4)))
          detected.push({ name: match?.name || name, qty: Math.round(qty), rate: Math.round(rate), amount: Math.round(amount) })
        }
      }
    }

    if (detected.length > 0) setParsedItems(detected)
    else {
      const words = text.match(/[A-Z][a-z]+(?:\s[A-Z][a-z]+)*/g) || []
      words.slice(0, 5).forEach((w, i) => detected.push({ name: w, qty: 1, rate: 0, amount: 0 }))
      if (detected.length > 0) setParsedItems(detected)
    }
  }

  const updateParsed = (idx: number, field: string, val: any) => {
    setParsedItems(prev => prev.map((p, i) => i === idx ? { ...p, [field]: val } : p))
  }

  const removeParsed = (idx: number) => setParsedItems(prev => prev.filter((_, i) => i !== idx))

  const addManualItem = () => {
    setParsedItems(prev => [...prev, { name: '', qty: 1, rate: 0, amount: 0 }])
  }

  const handleSave = () => {
    if (parsedItems.length === 0) return
    const total = parsedItems.reduce((s, p) => s + p.amount, 0)
    const inv: Invoice = {
      id: generateId(),
      invoiceNo: nextInvoiceNo(DB.invoices.list().filter(i => i.docType === 'PURCHASE').map(i => i.invoiceNo), 'PUR'),
      partyId: partyId || 'cash', partyName: suppliers.find(s => s.id === partyId)?.name || 'Cash Purchase',
      type: 'PURCHASE', docType: 'PURCHASE',
      items: parsedItems.map(p => ({
        itemId: items.find(i => i.name === p.name)?.id || generateId(),
        itemName: p.name, sku: '', quantity: p.qty, rate: p.rate, unit: 'Pcs',
        discountPercent: 0, discountAmount: 0, gstRate: 0, amount: p.amount,
      })),
      subtotal: total, discountAmount: 0, taxAmount: 0, grandTotal: total,
      paymentStatus: 'PENDING', paidAmount: 0, dueAmount: total, date,
    }
    DB.invoices.save(inv)
    parsedItems.forEach(p => {
      const item = DB.items.byId(items.find(i => i.name === p.name)?.id || '')
      if (item) { item.currentStock += p.qty; DB.items.save(item) }
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (saved) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', padding: Spacing.xxl }}>
        <div style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.successLight, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl }}><Icons.Check size={40} color={Colors.success} /></div>
        <div style={{ fontSize: 22, fontWeight: 700, color: Colors.textPrimary, marginBottom: Spacing.sm }}>Purchase Recorded!</div>
        <div style={{ fontSize: 14, color: Colors.textSecondary, textAlign: 'center' }}>{parsedItems.length} items added to stock</div>
      </div>
    )
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ backgroundColor: Colors.primaryLight + '40', borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.lg, border: `1px solid ${Colors.primary}20` }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: Colors.primary, marginBottom: Spacing.sm }}><Icons.Barcode size={16} /> Smart Purchase</div>
        <div style={{ fontSize: 12, color: Colors.textSecondary }}>Upload a purchase bill photo and we'll auto-detect items, quantities, and prices. Just verify once!</div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleImage} style={{ display: 'none' }} />
      <div onClick={() => fileRef.current?.click()} style={{ border: `2px dashed ${Colors.border}`, borderRadius: BorderRadius.md, padding: Spacing.xxxl, textAlign: 'center', cursor: 'pointer', marginBottom: Spacing.lg, backgroundColor: Colors.surface }}>
        {image ? (
          <img src={image} alt="Bill" style={{ maxHeight: 200, maxWidth: '100%', borderRadius: BorderRadius.sm }} />
        ) : (
          <div>
            <Icons.Barcode size={40} color={Colors.textDisabled} />
            <div style={{ fontSize: 14, color: Colors.textSecondary, marginTop: Spacing.sm }}>Tap to take/upload bill photo</div>
            <div style={{ fontSize: 11, color: Colors.textDisabled, marginTop: 4 }}>Supports JPG, PNG</div>
          </div>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: Spacing.xl }}>
          <div style={{ width: 32, height: 32, border: `3px solid ${Colors.border}`, borderTopColor: Colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 13, color: Colors.textSecondary }}>Scanning bill... Reading text...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {parsedItems.length > 0 && (
        <div style={{ marginBottom: Spacing.lg }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: Colors.textPrimary, marginBottom: Spacing.md }}>Detected Items — Please Verify</div>
          {parsedItems.map((p, i) => (
            <div key={i} style={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.md, border: `1px solid ${Colors.border}`, padding: Spacing.md, marginBottom: Spacing.sm }}>
              <Field label="Item Name"><input value={p.name} onChange={e => updateParsed(i, 'name', e.target.value)} style={s.input} /></Field>
              <div style={{ display: 'flex', gap: Spacing.sm }}>
                <Field label="Qty"><input inputMode="decimal" value={p.qty} onChange={e => { const v = e.target.value; if (v === '') { updateParsed(i, 'qty', 0); return }; const n = parseFloat(v); if (!isNaN(n)) updateParsed(i, 'qty', Math.max(0.001, n)) }} onBlur={e => { if (p.qty <= 0) updateParsed(i, 'qty', 1) }} style={{ ...s.input, width: '100%' }} /></Field>
                <Field label="Rate (₹)"><input inputMode="decimal" value={p.rate} onChange={e => { const v = e.target.value; if (v === '') { updateParsed(i, 'rate', 0); return }; const n = parseFloat(v); if (!isNaN(n)) updateParsed(i, 'rate', n) }} style={{ ...s.input, width: '100%' }} /></Field>
                <Field label="Amount (₹)"><input inputMode="decimal" value={p.amount} onChange={e => { const v = e.target.value; if (v === '') { updateParsed(i, 'amount', 0); return }; const n = parseFloat(v); if (!isNaN(n)) updateParsed(i, 'amount', n) }} style={{ ...s.input, width: '100%' }} /></Field>
                <button onClick={() => removeParsed(i)} style={{ background: 'none', border: 'none', color: Colors.error, cursor: 'pointer', alignSelf: 'flex-end', padding: '12px 4px' }}><Icons.Delete size={18} /></button>
              </div>
            </div>
          ))}
          <button onClick={addManualItem} style={{ width: '100%', padding: '12px', backgroundColor: Colors.surface, border: `1.5px dashed ${Colors.border}`, borderRadius: BorderRadius.sm, cursor: 'pointer', fontSize: 13, color: Colors.textSecondary, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Icons.Add size={16} /> Add Item Manually</button>
        </div>
      )}

      {(parsedItems.length > 0 || ocrText) && (
        <div style={{ marginBottom: Spacing.xl }}>
          <Field label="Supplier">
            <select value={partyId} onChange={e => setPartyId(e.target.value)} style={s.select}>
              <option value="">Cash Purchase (No Supplier)</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Purchase Date"><input type="date" value={date} onChange={e => setDate(e.target.value)} style={s.input} /></Field>
        </div>
      )}

      {ocrText && parsedItems.length === 0 && !loading && (
        <div style={{ marginBottom: Spacing.lg }}>
          <div style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.sm }}>Raw OCR Text (for reference):</div>
          <pre style={{ fontSize: 11, color: Colors.textDisabled, whiteSpace: 'pre-wrap', backgroundColor: Colors.surfaceVariant, padding: Spacing.md, borderRadius: BorderRadius.sm, maxHeight: 200, overflow: 'auto' }}>{ocrText}</pre>
        </div>
      )}

      {parsedItems.length > 0 && (
        <button onClick={handleSave} style={s.primaryBtn}>
          <Icons.Check size={16} /> Save Purchase ({parsedItems.length} items, ₹{parsedItems.reduce((s, p) => s + p.amount, 0).toLocaleString()})
        </button>
      )}
    </div>
  )
}
