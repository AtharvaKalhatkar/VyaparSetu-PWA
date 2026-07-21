import React, { useState, useRef, useEffect } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, generateId, todayISO } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { useToast } from '../utils/smooth'
import type { Item } from '../types'

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
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
        d[i] = d[i + 1] = d[i + 2] = gray > 128 ? Math.min(255, gray * 1.3) : Math.max(0, gray * 0.7)
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
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load OCR engine'))
    document.head.appendChild(s)
  })
}

function extractNumbers(text: string): number[] {
  const tokens: number[] = []
  for (const m of text.replace(/[₹,]/g, '').match(/\d+\.?\d*/g) || []) {
    const n = parseFloat(m)
    if (isFinite(n) && n >= 0) tokens.push(n)
  }
  return tokens
}

function parseReceiptLines(lines: string[], items: Item[]) {
  const result: { name: string; qty: number; rate: number; amount: number }[] = []
  const skipWords = new Set(['total', 'subtotal', 'tax', 'gst', 'cgst', 'sgst', 'igst', 'discount', 'invoice', 'bill', 'date', 'gstin', 'address', 'phone', 'particulars', 'description', 'hsn', 'qty', 'quantity', 'rate', 'amount', 'price', 'net', 'grand', 'round', 'off', 'thank', 'you'])

  for (let raw of lines) {
    raw = raw.trim()
    if (!raw || raw.length < 4) continue
    const lower = raw.toLowerCase()
    if (Array.from(skipWords).some(w => lower.includes(w)) && /^[A-Za-z\s]{2,}$/.test(raw.trim())) continue
    const nums = extractNumbers(raw)
    if (nums.length < 2) continue
    const amount = nums[nums.length - 1]
    const rate = nums.length >= 3 ? nums[nums.length - 2] : amount
    const qty = nums.length >= 3 ? nums[nums.length - 3] : 1
    let name = raw.replace(/[₹\d,.\-*()\/@#xX=:]/g, ' ').replace(/\s+/g, ' ').trim()
    const tokens = name.split(/\s+/).filter(t => t.length > 1 && !skipWords.has(t.toLowerCase()))
    if (tokens.length === 0) name = `Item ${result.length + 1}`
    else name = tokens.join(' ')
    const matched = items.find(i => i.name.toLowerCase().split(/\s+/).some(t => t.length > 2 && name.toLowerCase().includes(t)))
    result.push({ name: matched?.name || name, qty: Math.round(qty) || 1, rate: Math.round(rate) || 0, amount: Math.round(amount) || 0 })
  }
  return result.slice(0, 50)
}

export function ReceiptScanPage({ onBack }: { onBack: () => void }) {
  const { toast } = useToast()
  const camRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [photo, setPhoto] = useState<string | null>(null)
  const [mode, setMode] = useState<'scan' | 'enter'>('scan')
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrError, setOcrError] = useState('')

  const [date, setDate] = useState(todayISO())
  const [vendor, setVendor] = useState('')
  const [lines, setLines] = useState<{ name: string; qty: string; rate: string }[]>([])

  useEffect(() => {
    return () => { stream?.getTracks().forEach(t => t.stop()) }
  }, [])

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      setStream(s)
      if (camRef.current) camRef.current.srcObject = s
    } catch { toast('Camera access denied', 'error') }
  }

  const capturePhoto = () => {
    if (!camRef.current || !canvasRef.current) return
    canvasRef.current.width = camRef.current.videoWidth
    canvasRef.current.height = camRef.current.videoHeight
    const ctx = canvasRef.current.getContext('2d')
    ctx?.drawImage(camRef.current, 0, 0)
    setPhoto(canvasRef.current.toDataURL('image/jpeg'))
    stream?.getTracks().forEach(t => t.stop())
    setStream(null)
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => setPhoto(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  function autoDetectVendor(ocrText: string): string {
    const lines = ocrText.split('\n').map(l => l.trim()).filter(Boolean)
    const headerText = lines.slice(0, Math.min(6, lines.length)).join(' ')

    const gstMatch = headerText.match(/\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}/)
    if (gstMatch) {
      const byGst = DB.parties.list().find(p => p.gstin && p.gstin.replace(/\s/g, '') === gstMatch[0])
      if (byGst) return byGst.name
    }

    const parties = DB.parties.list().filter(p => p.type === 'SUPPLIER' || p.type === 'BOTH')
    const headerLower = headerText.toLowerCase()
    const scored = parties.map(p => {
      const parts = p.name.toLowerCase().split(/\s+/).filter(t => t.length > 2)
      const matchCount = parts.filter(part => headerLower.includes(part)).length
      return { name: p.name, score: parts.length > 0 ? matchCount / parts.length : 0 }
    }).filter(x => x.score > 0.5).sort((a, b) => b.score - a.score)
    if (scored.length > 0) return scored[0].name

    const nonItemLines = lines.filter(l => {
      const nums = l.match(/\d+\.?\d*/g)
      return !nums || nums.length < 2
    })
    const candidate = nonItemLines.find(l => l.length > 5 && l.length < 60 && /^[A-Za-z\s\.\&]+$/.test(l.trim()))
    return candidate?.trim() || ''
  }

  const [vendorDetected, setVendorDetected] = useState(false)

  const runOcrOnPhoto = async () => {
    if (!photo) return
    setOcrLoading(true)
    setOcrError('')
    setVendorDetected(false)
    try {
      await loadTesseract()
      const processed = await preprocessImage(photo)
      const result = await (window as any).Tesseract.recognize(processed, 'eng+hin', { logger: () => {} })
      const text = result.data.text
      if (text.trim().length < 5) {
        setOcrError('Could not read text. Try a clearer photo.')
        return
      }
      const detectedVendor = autoDetectVendor(text)
      if (detectedVendor && !vendor) {
        setVendor(detectedVendor)
        setVendorDetected(true)
      }
      const detected = parseReceiptLines(text.split('\n').map((l: string) => l.trim()).filter(Boolean), DB.items.list().filter(i => i.isActive))
      if (detected.length > 0) {
        setLines(detected.map(d => ({ name: d.name, qty: String(d.qty), rate: String(d.rate) })))
        toast(`Detected ${detected.length} items!`, 'success')
      } else {
        setOcrError('Could not detect items. Please enter manually.')
      }
    } catch {
      setOcrError('OCR failed. Enter items manually.')
    }
    setOcrLoading(false)
  }

  const addLine = () => setLines(prev => [...prev, { name: '', qty: '1', rate: '0' }])
  const updateLine = (idx: number, field: string, v: string) => setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: v } : l))
  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx))

  const subtotal = lines.reduce((s, l) => s + (parseFloat(l.qty) || 0) * (parseFloat(l.rate) || 0), 0)

  const saveAsExpense = () => {
    if (lines.length === 0) return
    DB.expenses.save({
      id: generateId(), category: 'Office', amount: subtotal,
      description: `Receipt scan${vendor ? ' - ' + vendor : ''}`,
      date, paymentMode: 'CASH',
    })
    toast('Receipt saved as expense!', 'success')
    setPhoto(null); setLines([]); setVendor(''); setDate(todayISO())
  }

  const saveAsPurchase = () => {
    if (lines.length === 0 || !vendor.trim()) return
    const party = DB.parties.list().find(p => p.name.toLowerCase() === vendor.toLowerCase())
    const partyId = party?.id || generateId()
    if (!party) {
      DB.parties.save({
        id: partyId, name: vendor.trim(), phone: '', type: 'SUPPLIER',
        openingBalance: 0, balanceType: 'DEBIT', creditLimit: 0, creditDays: 0,
        isActive: true, createdAt: todayISO(),
      })
    }
    const invItems = lines.map(l => ({
      itemId: '', itemName: l.name, sku: '', quantity: parseFloat(l.qty) || 0,
      rate: parseFloat(l.rate) || 0, unit: 'Pcs',
      discountPercent: 0, discountAmount: 0, gstRate: 0, amount: (parseFloat(l.qty) || 0) * (parseFloat(l.rate) || 0),
    }))
    const inv = {
      id: generateId(), invoiceNo: String(DB.invoices.list().filter(x => x.docType === 'PURCHASE').length + 1),
      partyId, partyName: vendor.trim(), type: 'PURCHASE' as const, docType: 'PURCHASE' as const,
      items: invItems, subtotal, discountAmount: 0, taxAmount: 0, grandTotal: subtotal,
      paymentStatus: 'PENDING' as const, paidAmount: 0, dueAmount: subtotal,
      date, notes: 'From receipt scan',
    }
    DB.invoices.save(inv)
    toast('Purchase invoice created!', 'success')
    setPhoto(null); setLines([]); setVendor(''); setDate(todayISO())
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ display: 'flex', gap: Spacing.sm, marginBottom: Spacing.lg }}>
        <button onClick={() => setMode('scan')} style={s.toggle(mode === 'scan', Colors.primary)}>Scan</button>
        <button onClick={() => setMode('enter')} style={s.toggle(mode === 'enter', Colors.primary)}>Manual</button>
      </div>

      {mode === 'scan' && !photo && (
        <div>
          <div style={{ display: 'flex', gap: Spacing.sm, marginBottom: Spacing.md }}>
            <button onClick={startCamera} style={{ flex: 1, padding: '12px', backgroundColor: Colors.primary, color: '#fff', border: 'none', borderRadius: BorderRadius.sm, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Icons.Camera size={18} /> Open Camera
            </button>
            <button onClick={() => fileRef.current?.click()} style={{ flex: 1, padding: '12px', backgroundColor: Colors.accent, color: '#fff', border: 'none', borderRadius: BorderRadius.sm, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Icons.Upload size={18} /> Upload Photo
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          {stream && (
            <div style={{ position: 'relative', marginBottom: Spacing.md }}>
              <video ref={camRef} autoPlay playsInline style={{ width: '100%', borderRadius: BorderRadius.md, backgroundColor: '#000' }} />
              <button onClick={capturePhoto} style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff', border: '4px solid #333', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#333' }} />
              </button>
            </div>
          )}
          {!stream && (
            <div style={{ textAlign: 'center', padding: Spacing.huge, color: Colors.textDisabled }}>
              <Icons.Camera size={48} style={{ marginBottom: Spacing.md, opacity: 0.3 }} />
              <div style={{ fontSize: 14 }}>Tap "Open Camera" to scan a receipt</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>or upload a photo from your gallery</div>
            </div>
          )}
        </div>
      )}

      {photo && (
        <div style={{ marginBottom: Spacing.md }}>
          <img src={photo} alt="Receipt" style={{ width: '100%', borderRadius: BorderRadius.md, maxHeight: 300, objectFit: 'contain', backgroundColor: '#f5f5f5' }} />
          <div style={{ display: 'flex', gap: Spacing.sm, marginTop: Spacing.xs, alignItems: 'center' }}>
            <button onClick={() => { setPhoto(null); stream?.getTracks().forEach(t => t.stop()); setStream(null); setOcrError(''); setOcrLoading(false) }} style={{ background: 'none', border: 'none', color: Colors.error, cursor: 'pointer', fontSize: 12 }}>Retake</button>
            <button onClick={runOcrOnPhoto} disabled={ocrLoading} style={{ padding: '6px 14px', backgroundColor: Colors.primary, color: '#fff', border: 'none', borderRadius: BorderRadius.sm, fontSize: 12, fontWeight: 600, cursor: ocrLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: ocrLoading ? 0.6 : 1 }}>
              {ocrLoading ? <><Icons.Refresh size={14} /> Scanning...</> : <><Icons.Barcode size={14} /> Auto-Detect Items</>}
            </button>
          </div>
          {ocrLoading && <div style={{ fontSize: 12, color: Colors.textSecondary, marginTop: Spacing.sm }}>Processing receipt image...</div>}
          {ocrError && <div style={{ fontSize: 12, color: Colors.error, marginTop: Spacing.sm }}>{ocrError}</div>}
        </div>
      )}

      {(mode === 'enter' || photo) && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: Spacing.sm }}>
            <Field label="Date"><input type="date" value={date} onChange={e => setDate(e.target.value)} style={s.input} /></Field>
            <Field label={vendorDetected ? 'Vendor Name (detected)' : 'Vendor Name'}>
              <input value={vendor} onChange={e => { setVendor(e.target.value); setVendorDetected(false) }} placeholder="Supplier name" style={s.input} />
              {vendorDetected && <div style={{ fontSize: 11, color: Colors.success, marginTop: 2 }}>Detected from receipt &mdash; change if wrong</div>}
            </Field>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: Colors.textPrimary }}>Items ({lines.length})</span>
            <button onClick={addLine} style={{ padding: '6px 12px', backgroundColor: Colors.primary, color: '#fff', border: 'none', borderRadius: BorderRadius.sm, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icons.Add size={14} /> Add Row
            </button>
          </div>

          {lines.length === 0 && (
            <div style={{ textAlign: 'center', padding: Spacing.xl, color: Colors.textDisabled, border: `1px dashed ${Colors.border}`, borderRadius: BorderRadius.md, marginBottom: Spacing.md }}>
              <div style={{ fontSize: 13 }}>Tap "Add Row" to enter items from the receipt</div>
            </div>
          )}

          {lines.map((l, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <input value={l.name} onChange={e => updateLine(idx, 'name', e.target.value)} placeholder="Item name" style={{ ...s.input, flex: 1, padding: '6px 8px', fontSize: 12 }} />
              <input inputMode="decimal" value={l.qty} onChange={e => updateLine(idx, 'qty', e.target.value)} onBlur={e => { const v = parseFloat(e.target.value); if (isNaN(v) || v <= 0) updateLine(idx, 'qty', '1') }} style={{ ...s.input, width: 50, padding: '6px 6px', fontSize: 12, textAlign: 'center' }} />
              <input inputMode="decimal" value={l.rate} onChange={e => updateLine(idx, 'rate', e.target.value)} style={{ ...s.input, width: 70, padding: '6px 6px', fontSize: 12, textAlign: 'right' }} />
              <span style={{ fontSize: 12, fontWeight: 600, minWidth: 60, textAlign: 'right' }}>{formatCurrency((parseFloat(l.qty) || 0) * (parseFloat(l.rate) || 0))}</span>
              <button onClick={() => removeLine(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: Colors.textDisabled, padding: 2 }}><Icons.Delete size={14} /></button>
            </div>
          ))}

          {lines.length > 0 && (
            <div style={{ textAlign: 'right', fontSize: 16, fontWeight: 700, color: Colors.textPrimary, marginTop: Spacing.sm, marginBottom: Spacing.lg }}>
              Total: {formatCurrency(subtotal)}
            </div>
          )}

          {lines.length > 0 && (
            <div style={{ display: 'flex', gap: Spacing.sm }}>
              <button onClick={saveAsExpense} style={{ flex: 1, ...s.primaryBtn, backgroundColor: Colors.warning }}>
                <Icons.Expense size={16} /> Save as Expense
              </button>
              <button onClick={saveAsPurchase} disabled={!vendor.trim()} style={{ flex: 1, ...(!vendor.trim() ? s.primaryBtnDisabled : s.primaryBtn) }}>
                <Icons.Invoice size={16} /> Save as Purchase
              </button>
            </div>
          )}
        </>
      )}

      <style>{`input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}input[type=number]{-moz-appearance:textfield}`}</style>
    </div>
  )
}
