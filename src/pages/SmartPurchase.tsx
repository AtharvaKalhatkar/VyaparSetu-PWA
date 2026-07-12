import React, { useState, useRef, useEffect } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { generateId, todayISO, nextInvoiceNo } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import type { Item, Invoice } from '../types'

const TESSERACT_CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'

function preprocessImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight
      const scale = Math.min(1600 / w, 1600 / h, 1)
      const cw = Math.round(w * scale), ch = Math.round(h * scale)
      const canvas = document.createElement('canvas')
      canvas.width = cw; canvas.height = ch
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, cw, ch)
      const imageData = ctx.getImageData(0, 0, cw, ch)
      const d = imageData.data
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2]
        const gray = 0.299 * r + 0.587 * g + 0.114 * b
        const contrast = gray > 128 ? Math.min(255, gray * 1.3) : Math.max(0, gray * 0.7)
        d[i] = d[i + 1] = d[i + 2] = contrast
      }
      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.src = dataUrl
  })
}

function loadTesseract(): Promise<void> {
  if ((window as any).Tesseract) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = TESSERACT_CDN
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load OCR engine'))
    document.head.appendChild(script)
  })
}

function extractNumbers(text: string): number[] {
  const tokens: number[] = []
  const cleaned = text.replace(/[₹,]/g, '')
  const matches = cleaned.match(/\d+\.?\d*/g)
  if (matches) {
    for (const m of matches) {
      const n = parseFloat(m)
      if (isFinite(n) && n >= 0) tokens.push(n)
    }
  }
  return tokens
}

function autoDetectSupplier(ocrText: string, suppliers: { id: string; name: string; gstin?: string }[]): string {
  const lines = ocrText.split('\n').map(l => l.trim()).filter(Boolean)
  const headerLines = lines.slice(0, Math.min(8, lines.length)).join(' ').toLowerCase()

  const gstMatch = headerLines.match(/\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}/)
  if (gstMatch) {
    const matchByGst = suppliers.find(s => s.gstin && s.gstin.replace(/\s/g, '') === gstMatch[0])
    if (matchByGst) return matchByGst.id
  }

  const nameMatches = suppliers
    .map(s => {
      const nameParts = s.name.toLowerCase().split(/\s+/).filter(t => t.length > 2)
      const matchCount = nameParts.filter(p => headerLines.includes(p)).length
      const score = nameParts.length > 0 ? matchCount / nameParts.length : 0
      return { id: s.id, score }
    })
    .filter(x => x.score > 0.5)
    .sort((a, b) => b.score - a.score)

  return nameMatches[0]?.id || ''
}

function autoDetectDate(ocrText: string): string {
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
    /(\d{1,2})\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i,
  ]
  for (const line of ocrText.split('\n')) {
    for (const p of datePatterns) {
      const m = line.match(p)
      if (m) {
        if (m[0].includes('-') || m[0].includes('/')) {
          const parts = m[0].split(/[\/\-]/)
          if (parts[0].length === 4) {
            const d = new Date(`${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`)
            if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
          } else {
            const d = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`)
            if (!isNaN(d.getTime()) && d <= new Date()) return d.toISOString().split('T')[0]
          }
        }
      }
    }
  }
  return todayISO()
}

function parseBillLines(lines: string[], items: Item[]): { name: string; qty: number; rate: number; amount: number }[] {
  const result: { name: string; qty: number; rate: number; amount: number }[] = []

  const skipWords = new Set([
    'total', 'subtotal', 'tax', 'gst', 'cgst', 'sgst', 'igst', 'discount',
    'invoice', 'bill', 'date', 'gstin', 'address', 'phone', 'mobile',
    'particulars', 'description', 'hsn', 'sac', 'qty', 'quantity',
    'rate', 'amount', 'price', 'net', 'grand', 'round', 'off',
    'thank', 'you', 'business', 'seller', 'buyer', 'reverse charge',
  ])

  for (let raw of lines) {
    raw = raw.trim()
    if (!raw || raw.length < 4) continue

    const lower = raw.toLowerCase()

    const isLikelyTitle = skipWords.has(lower.trim()) && result.length === 0
    if (isLikelyTitle) continue

    const hasSkipWord = Array.from(skipWords).some(w => lower.includes(w))
    const nums = extractNumbers(raw)

    const onlyNumbersAndSymbols = raw.replace(/[₹\s,\d.\-xX@*=()\/]/g, '').length < 3
    if (onlyNumbersAndSymbols && nums.length <= 1) continue

    if (hasSkipWord && /^[A-Za-z\s]{2,}$/.test(raw.trim())) continue

    let qty = 1, rate = 0, amount = 0

    const atMatch = raw.match(/@\s*(\d+\.?\d*)/i)
    const xMatch = raw.match(/(\d+\.?\d*)\s*[xX]\s*(\d+\.?\d*)/)
    const eqMatch = raw.match(/[=:]\s*(\d+\.?\d*)/)

    if (nums.length >= 3) {
      amount = nums[nums.length - 1]
      if (nums.length >= 4) {
        rate = nums[nums.length - 2]
        qty = nums[nums.length - 3]
      } else {
        if (atMatch) {
          rate = parseFloat(atMatch[1])
          qty = nums.find(n => n !== rate && n !== amount) || 1
        } else if (xMatch) {
          qty = parseFloat(xMatch[1])
          rate = parseFloat(xMatch[2])
        } else {
          qty = nums[0]
          rate = nums[1]
        }
      }
    } else if (nums.length === 2) {
      if (xMatch) {
        qty = parseFloat(xMatch[1])
        rate = parseFloat(xMatch[2])
        amount = qty * rate
      } else {
        rate = nums[0]
        amount = nums[1]
        qty = Math.round(amount / rate) || 1
      }
    } else if (nums.length === 1) {
      amount = nums[0]
    }

    if (amount === 0 && rate > 0 && qty > 0) amount = qty * rate
    if (rate === 0 && amount > 0 && qty > 0) rate = amount / qty

    if (amount === 0) continue

    qty = Math.min(qty, 99999)
    rate = Math.min(rate, 9999999)
    amount = Math.min(amount, 9999999)
    if (qty <= 0) qty = 1

    let name = raw
      .replace(/₹\s*\d+\.?\d*/g, '')
      .replace(/@\s*\d+\.?\d*/g, '')
      .replace(/\d+\s*[xX]\s*\d+\.?\d*/g, '')
      .replace(/[=:]\s*\d+\.?\d*/g, '')
      .replace(/[\d,.\-*()\/₹#@]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    const nameTokens = name.split(/\s+/).filter(t => t.length > 1 && !skipWords.has(t.toLowerCase()))

    let matched: Item | undefined
    const searchText = nameTokens.join(' ').toLowerCase()
    if (searchText.length > 1) {
      matched = items.find(i => {
        const iname = i.name.toLowerCase()
        const tokens = iname.split(/\s+/)
        return tokens.some(t => t.length > 2 && searchText.includes(t))
      })
      if (!matched) {
        matched = items.find(i => {
          const iname = i.name.toLowerCase()
          return nameTokens.some(t => t.length > 2 && iname.includes(t))
        })
      }
    }

    if (nameTokens.length === 0) {
      name = nums.length > 0 ? `Item ${result.length + 1}` : raw
    } else {
      name = nameTokens.join(' ')
    }

    result.push({
      name: matched?.name || name,
      qty: Math.round(qty),
      rate: Math.round(rate),
      amount: Math.round(amount),
    })
  }

  return result.slice(0, 50)
}

export function SmartPurchase() {
  const [image, setImage] = useState<string | null>(null)
  const [ocrText, setOcrText] = useState('')
  const [parsedItems, setParsedItems] = useState<{ name: string; qty: number; rate: number; amount: number }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [partyId, setPartyId] = useState('')
  const [date, setDate] = useState(todayISO())
  const [saved, setSaved] = useState(false)
  const [supplierAutoDetected, setSupplierAutoDetected] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => { mountedRef.current = false }
  }, [])

  const suppliers = DB.parties.list().filter(p => p.type === 'SUPPLIER' || p.type === 'BOTH')
  const inventoryItems = DB.items.list().filter(i => i.isActive)

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setOcrText('')
    setParsedItems([])
    setPartyId('')
    setSupplierAutoDetected(false)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string
      if (!mountedRef.current) return
      setImage(dataUrl)
      await runOcr(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const runOcr = async (dataUrl: string) => {
    setLoading(true)
    setError('')
    try {
      await loadTesseract()
      if (!mountedRef.current) return
      const processed = await preprocessImage(dataUrl)
      if (!mountedRef.current) return
      const result = await (window as any).Tesseract.recognize(
        processed,
        'eng+hin',
        {
          logger: () => {},
          tessedit_pageseg_mode: '3',
          tessedit_char_whitelist: '',
        }
      )
      if (!mountedRef.current) return
      const text = result.data.text
      setOcrText(text)

      if (text.trim().length < 5) {
        setError('Could not read any text from this image. Try a clearer photo.')
        if (mountedRef.current) setLoading(false)
        return
      }

      const detectedPartyId = autoDetectSupplier(text, suppliers)
      if (detectedPartyId) {
        setPartyId(detectedPartyId)
        setSupplierAutoDetected(true)
      }

      const detectedDate = autoDetectDate(text)
      setDate(detectedDate)

      const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean)
      const detected = parseBillLines(lines, inventoryItems)
      if (detected.length > 0) {
        setParsedItems(detected)
      } else {
        setError('Could not detect items from the bill text. Please enter items manually below.')
      }
    } catch (err) {
      if (!mountedRef.current) return
      setError('OCR processing failed. Please enter items manually.')
    }
    if (mountedRef.current) setLoading(false)
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
      partyId: partyId || 'cash',
      partyName: suppliers.find(s => s.id === partyId)?.name || 'Cash Purchase',
      type: 'PURCHASE', docType: 'PURCHASE',
      items: parsedItems.map(p => ({
        itemId: inventoryItems.find(i => i.name === p.name)?.id || generateId(),
        itemName: p.name, sku: '', quantity: p.qty, rate: p.rate, unit: 'Pcs',
        discountPercent: 0, discountAmount: 0, gstRate: 0, amount: p.amount,
      })),
      subtotal: total, discountAmount: 0, taxAmount: 0, grandTotal: total,
      paymentStatus: 'PENDING', paidAmount: 0, dueAmount: total, date,
    }
    DB.invoices.save(inv)
    parsedItems.forEach(p => {
      const item = DB.items.byId(inventoryItems.find(i => i.name === p.name)?.id || '')
      if (item) { item.currentStock += p.qty; DB.items.save(item) }
    })
    setSaved(true)
  }

  const resetAll = () => {
    setImage(null); setOcrText(''); setParsedItems([]); setError(''); setPartyId(''); setDate(todayISO()); setSaved(false); setSupplierAutoDetected(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const changePhoto = () => {
    fileRef.current?.click()
  }

  if (saved) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', padding: Spacing.xxl }}>
        <div style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.successLight, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl }}>
          <Icons.Check size={40} color={Colors.success} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: Colors.textPrimary, marginBottom: Spacing.sm }}>Purchase Recorded!</div>
        <div style={{ fontSize: 14, color: Colors.textSecondary, textAlign: 'center' }}>{parsedItems.length} items added to stock</div>
        <button onClick={resetAll} style={{ ...s.outlineBtn, marginTop: Spacing.xl, width: 200 }}>
          <Icons.Add size={16} /> Add Another Bill
        </button>
      </div>
    )
  }

  const totalAmount = parsedItems.reduce((s, p) => s + p.amount, 0)

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ backgroundColor: Colors.primaryLight + '40', borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.lg, border: `1px solid ${Colors.primary}20` }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: Colors.primary, marginBottom: Spacing.sm }}>
          <Icons.Barcode size={16} /> Smart Purchase
        </div>
        <div style={{ fontSize: 12, color: Colors.textSecondary }}>
          Upload a purchase bill photo and we'll auto-detect items, quantities, and prices. Verify and save!
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleImage} style={{ display: 'none' }} />

      <div style={{ position: 'relative', marginBottom: Spacing.md }}>
        <div onClick={changePhoto} style={{ border: `2px dashed ${Colors.border}`, borderRadius: BorderRadius.md, padding: image ? Spacing.sm : Spacing.xxxl, textAlign: 'center', cursor: 'pointer', backgroundColor: Colors.surface }}>
          {image ? (
            <div style={{ position: 'relative' }}>
              <img src={image} alt="Bill" style={{ maxHeight: 180, maxWidth: '100%', borderRadius: BorderRadius.sm }} />
              <div style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: BorderRadius.sm, padding: '4px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icons.Edit size={12} /> Change Photo
              </div>
            </div>
          ) : (
            <div>
              <Icons.Barcode size={40} color={Colors.textDisabled} />
              <div style={{ fontSize: 14, color: Colors.textSecondary, marginTop: Spacing.sm }}>Tap to take or upload bill photo</div>
              <div style={{ fontSize: 11, color: Colors.textDisabled, marginTop: 4 }}>Supports JPG, PNG</div>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: Spacing.xl }}>
          <div style={{ width: 32, height: 32, border: `3px solid ${Colors.border}`, borderTopColor: Colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 13, color: Colors.textSecondary }}>Processing image... Reading text...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {error && !loading && (
        <div style={{ backgroundColor: Colors.errorLight, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.lg, border: `1px solid ${Colors.error}30`, fontSize: 13, color: Colors.error }}>
          {error}
        </div>
      )}

      {parsedItems.length > 0 && (
        <div style={{ marginBottom: Spacing.lg, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, border: `1px solid ${Colors.border}`, padding: Spacing.md }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: Colors.textPrimary }}>
              Detected Items ({parsedItems.length})
            </div>
            <div style={{ fontSize: 13, color: Colors.textSecondary }}>
              Total: <span style={{ fontWeight: 700, color: Colors.textPrimary }}>\u20B9{totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {parsedItems.map((p, i) => {
            const isMatched = inventoryItems.some(item => item.name === p.name)
            return (
              <div key={i} style={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.md, border: `1px solid ${Colors.border}`, padding: Spacing.md, marginBottom: Spacing.sm }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs }}>
                  <div style={{ flex: 1 }}>
                    <Field label="Item Name">
                      <input value={p.name} onChange={e => updateParsed(i, 'name', e.target.value)} style={s.input} placeholder="Item name" />
                    </Field>
                  </div>
                  {isMatched && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: Colors.success, backgroundColor: Colors.successLight, padding: '2px 8px', borderRadius: BorderRadius.xs, whiteSpace: 'nowrap', marginTop: 18 }}>
                      In Stock
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: Spacing.sm }}>
                  <Field label="Qty">
                    <input inputMode="decimal" value={p.qty} onChange={e => { const v = e.target.value; if (v === '') { updateParsed(i, 'qty', 0); return }; const n = parseFloat(v); if (!isNaN(n)) updateParsed(i, 'qty', Math.max(0.001, n)) }} onBlur={e => { if (p.qty <= 0) updateParsed(i, 'qty', 1) }} style={{ ...s.input, width: '100%' }} />
                  </Field>
                  <Field label="Rate (\u20B9)">
                    <input inputMode="decimal" value={p.rate} onChange={e => { const v = e.target.value; if (v === '') { updateParsed(i, 'rate', 0); return }; const n = parseFloat(v); if (!isNaN(n)) updateParsed(i, 'rate', n) }} style={{ ...s.input, width: '100%' }} />
                  </Field>
                  <Field label="Amount (\u20B9)">
                    <input inputMode="decimal" value={p.amount} onChange={e => { const v = e.target.value; if (v === '') { updateParsed(i, 'amount', 0); return }; const n = parseFloat(v); if (!isNaN(n)) updateParsed(i, 'amount', n) }} style={{ ...s.input, width: '100%' }} />
                  </Field>
                  <button onClick={() => removeParsed(i)} style={{ background: 'none', border: 'none', color: Colors.error, cursor: 'pointer', alignSelf: 'flex-end', padding: '12px 4px' }} title="Remove item">
                    <Icons.Delete size={18} />
                  </button>
                </div>
              </div>
            )
          })}

          <button onClick={addManualItem} style={{ width: '100%', padding: '12px', backgroundColor: Colors.surface, border: `1.5px dashed ${Colors.border}`, borderRadius: BorderRadius.sm, cursor: 'pointer', fontSize: 13, color: Colors.textSecondary, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Icons.Add size={16} /> Add Item Manually
          </button>
        </div>
      )}

      {image && !loading && parsedItems.length === 0 && (
        <div style={{ marginBottom: Spacing.lg }}>
          <button onClick={addManualItem} style={{ width: '100%', padding: '12px', backgroundColor: Colors.surface, border: `1.5px dashed ${Colors.border}`, borderRadius: BorderRadius.sm, cursor: 'pointer', fontSize: 13, color: Colors.textSecondary, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: Spacing.md }}>
            <Icons.Add size={16} /> Add Item Manually
          </button>
          <button onClick={() => runOcr(image!)} style={{ width: '100%', padding: '12px', backgroundColor: Colors.surface, border: `1.5px solid ${Colors.primary}40`, borderRadius: BorderRadius.sm, cursor: 'pointer', fontSize: 13, color: Colors.primary, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Icons.Refresh size={16} /> Retry OCR
          </button>
        </div>
      )}

      {(parsedItems.length > 0 || ocrText) && (
        <div style={{ marginBottom: Spacing.xl }}>
          <Field label={supplierAutoDetected ? 'Supplier (auto-detected)' : 'Supplier'}>
            <select value={partyId} onChange={e => setPartyId(e.target.value)} style={s.select}>
              <option value="">Cash Purchase (No Supplier)</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}{s.gstin ? ` (${s.gstin})` : ''}</option>)}
            </select>
            {supplierAutoDetected && (
              <div style={{ fontSize: 11, color: Colors.success, marginTop: 2 }}>Detected from bill &mdash; change if wrong</div>
            )}
          </Field>
          <Field label="Purchase Date">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={s.input} />
          </Field>
        </div>
      )}

      {ocrText && !loading && (
        <details style={{ marginBottom: Spacing.lg, cursor: 'pointer' }}>
          <summary style={{ fontSize: 12, color: Colors.textSecondary, fontWeight: 500 }}>
            Raw OCR Text ({ocrText.split('\n').length} lines) &mdash; tap to expand
          </summary>
          <pre style={{ fontSize: 11, color: Colors.textDisabled, whiteSpace: 'pre-wrap', backgroundColor: Colors.surfaceVariant, padding: Spacing.md, borderRadius: BorderRadius.sm, maxHeight: 200, overflow: 'auto', marginTop: Spacing.sm }}>
            {ocrText}
          </pre>
        </details>
      )}

      {parsedItems.length > 0 && (
        <div style={{ position: 'sticky', bottom: 0, paddingTop: Spacing.md, backgroundColor: Colors.background }}>
          <button onClick={handleSave} style={s.primaryBtn}>
            <Icons.Check size={16} /> Save Purchase ({parsedItems.length} items, \u20B9{totalAmount.toLocaleString('en-IN')})
          </button>
        </div>
      )}
    </div>
  )
}
