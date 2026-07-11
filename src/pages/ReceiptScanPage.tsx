import React, { useState, useRef } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, generateId, todayISO } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { useToast } from '../utils/smooth'

export function ReceiptScanPage({ onBack }: { onBack: () => void }) {
  const { toast } = useToast()
  const camRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [photo, setPhoto] = useState<string | null>(null)
  const [mode, setMode] = useState<'scan' | 'enter'>('scan')

  const [date, setDate] = useState(todayISO())
  const [vendor, setVendor] = useState('')
  const [lines, setLines] = useState<{ name: string; qty: string; rate: string }[]>([])

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
          <button onClick={() => { setPhoto(null); stream?.getTracks().forEach(t => t.stop()); setStream(null) }} style={{ marginTop: Spacing.xs, background: 'none', border: 'none', color: Colors.error, cursor: 'pointer', fontSize: 12 }}>Retake</button>
        </div>
      )}

      {(mode === 'enter' || photo) && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: Spacing.sm }}>
            <Field label="Date"><input type="date" value={date} onChange={e => setDate(e.target.value)} style={s.input} /></Field>
            <Field label="Vendor Name"><input value={vendor} onChange={e => setVendor(e.target.value)} placeholder="Supplier name" style={s.input} /></Field>
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
