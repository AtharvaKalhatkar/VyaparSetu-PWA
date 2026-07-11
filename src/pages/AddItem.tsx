import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, Field, StepIndicator, SectionCard, SummaryRow } from '../utils/styles'
import { DB } from '../utils/storage'
import { generateId } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import { useVertical } from '../context/VerticalContext'

const allSteps = (gst: boolean) => gst ? ['Basic Info', 'Pricing', 'Stock', 'Tax', 'Review'] : ['Basic Info', 'Pricing', 'Stock', 'Review']

export function AddItem({ editId, onBack, onNavigate, onAddUnit }: { editId?: string; onBack: () => void; onNavigate?: (p: string) => void; onAddUnit?: () => void }) {
  const config = useVertical()
  const STEPS = allSteps(config.enableGst)
  const existing = editId ? DB.items.byId(editId) : null
  const [step, setStep] = useState(0)
  const [saved, setSaved] = useState(false)

  // Step 1 - Basic Info
  const [itemType, setItemType] = useState<'PRODUCT' | 'SERVICE'>('PRODUCT')
  const [name, setName] = useState(existing?.name || '')
  const [sku, setSku] = useState(existing?.sku || '')
  const [category, setCategory] = useState(existing?.category || '')
  const [brand, setBrand] = useState(existing?.brand || '')
  const [description, setDescription] = useState(existing?.description || '')
  const [itemImage, setItemImage] = useState(existing?.imageUrl || '')

  // Step 2 - Pricing & Unit
  const [unit, setUnit] = useState(existing?.unit || 'Pcs')
  const [purchasePrice, setPurchasePrice] = useState(String(existing?.purchasePrice || ''))
  const [sellingPrice, setSellingPrice] = useState(String(existing?.sellingPrice || ''))
  const [mrp, setMrp] = useState(String(existing?.mrp || ''))
  const [discountPercent, setDiscountPercent] = useState(String(existing?.discountPercent || ''))
  const [taxIncluded, setTaxIncluded] = useState(false)
  const [multiUnits, setMultiUnits] = useState<{ unitName: string; conversionRate: number; sellingPrice: number; purchasePrice: number }[]>(existing?.units?.map(u => ({ unitName: u.unitName, conversionRate: u.conversionRate, sellingPrice: u.sellingPrice, purchasePrice: u.purchasePrice })) || [])
  const priceLists = DB.priceLists.list()
  const [priceListPrices, setPriceListPrices] = useState<Record<string, string>>(() => {
    const p: Record<string, string> = {}
    existing?.priceLists?.forEach(pl => { p[pl.name] = String(pl.price) })
    return p
  })

  // Step 3 - Stock Details
  const [currentStock, setCurrentStock] = useState(String(existing?.currentStock || '0'))
  const [minStock, setMinStock] = useState(String(existing?.minStockLevel || '10'))
  const [warehouse, setWarehouse] = useState(existing?.warehouse || '')
  const [rackLocation, setRackLocation] = useState(existing?.rackLocation || '')
  const [barcode, setBarcode] = useState(existing?.barcode || '')

  // Step 4 - Tax & Additional
  const [gstRate, setGstRate] = useState(String(existing?.gstRate || '18'))
  const [hsnCode, setHsnCode] = useState(existing?.hsnCode || '')
  const [supplier, setSupplier] = useState(existing?.supplier || '')
  const [batchNo, setBatchNo] = useState(existing?.batchNo || '')
  const [mfgDate, setMfgDate] = useState(existing?.mfgDate || '')
  const [expDate, setExpDate] = useState(existing?.expDate || '')
  const [notes, setNotes] = useState(existing?.notes || '')

  const units = DB.units.list().filter(u => u.isActive)
  const categories = config.defaultCategories
  const suppliers = DB.parties.list().filter(p => p.type === 'SUPPLIER' || p.type === 'BOTH')

  const canNext = () => {
    if (step === 0) return name.trim().length > 0
    if (step === 1) return unit.length > 0
    if (step === 2) return true
    if (step === 3) return true
    return true
  }

  const handleSave = () => {
    DB.items.save({
      id: existing?.id || generateId(), name: name.trim(), sku: sku.trim() || 'SKU-' + Date.now().toString(36).toUpperCase(),
      barcode: barcode || undefined, hsnCode: hsnCode || undefined, category: category || undefined,
      unit, sellingPrice: parseFloat(sellingPrice) || 0, purchasePrice: parseFloat(purchasePrice) || 0,
      gstRate: parseFloat(gstRate) || 0, currentStock: parseFloat(currentStock) || 0,
      minStockLevel: parseFloat(minStock) || 0, isActive: true, brand: brand || undefined,
      description: description || undefined, mrp: parseFloat(mrp) || undefined,
      discountPercent: parseFloat(discountPercent) || undefined,
      warehouse: warehouse || undefined, rackLocation: rackLocation || undefined,
      supplier: supplier || undefined, batchNo: batchNo || undefined,
      mfgDate: mfgDate || undefined, expDate: expDate || undefined,
      notes: notes || undefined,
      units: multiUnits.length > 0 ? multiUnits.map((u, i) => ({ unitId: `mu_${existing?.id || generateId()}_${i}`, unitName: u.unitName, conversionRate: u.conversionRate, sellingPrice: u.sellingPrice, purchasePrice: u.purchasePrice })) : undefined,
      priceLists: priceLists.filter(pl => !pl.isDefault && priceListPrices[pl.name]).map(pl => ({ name: pl.name, price: parseFloat(priceListPrices[pl.name]) || 0 })),
      imageUrl: itemImage || undefined,
    })
    setSaved(true)
    setTimeout(onBack, 1500)
  }

  if (saved) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', padding: Spacing.xxl }}>
        <div style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.successLight, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl }}>
          <Icons.Check size={40} color={Colors.success} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: Colors.textPrimary, marginBottom: Spacing.sm }}>Item Added Successfully</div>
        <div style={{ fontSize: 14, color: Colors.textSecondary, textAlign: 'center' }}>{name} has been added to your inventory</div>
      </div>
    )
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <StepIndicator current={step} steps={STEPS} />

      {step === 0 && (
        <div>
          <div style={{ display: 'flex', gap: Spacing.sm, marginBottom: Spacing.xl, backgroundColor: Colors.surfaceVariant, borderRadius: BorderRadius.sm, padding: 4 }}>
            {(['PRODUCT', 'SERVICE'] as const).map(t => (
              <button key={t} onClick={() => setItemType(t)} style={{
                flex: 1, padding: '10px', border: 'none', borderRadius: BorderRadius.xs, fontWeight: 600, cursor: 'pointer', fontSize: 13,
                backgroundColor: itemType === t ? Colors.surface : 'transparent', color: itemType === t ? Colors.primary : Colors.textSecondary, boxShadow: itemType === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}>{t === 'PRODUCT' ? 'Product' : 'Service'}</button>
            ))}
          </div>
          <Field label="Item Name" required><input value={name} onChange={e => setName(e.target.value)} placeholder="Enter item name" style={s.input} /></Field>
          <Field label="Item Code / SKU">
            <div style={{ display: 'flex', gap: Spacing.xs }}>
              <input value={sku} onChange={e => setSku(e.target.value)} placeholder="Auto-generated if empty" style={{ ...s.input, flex: 1 }} />
              <button onClick={() => setSku(String(Date.now()))} style={{ padding: '10px 12px', backgroundColor: Colors.primaryLight, border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.sm, color: Colors.primary, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Auto</button>
            </div>
          </Field>
          <Field label="Category">
            <select value={category} onChange={e => setCategory(e.target.value)} style={s.select}>
              <option value="">Select category...</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          {config.itemFields.brand !== 'hidden' && <Field label="Brand"><input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Brand name (optional)" style={s.input} /></Field>}
          <Field label="Item Image">
            <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm }}>
              {itemImage && <img src={itemImage} alt="preview" style={{ width: 60, height: 60, borderRadius: BorderRadius.sm, objectFit: 'cover', border: `1px solid ${Colors.border}` }} />}
              <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setItemImage(r.result as string); r.readAsDataURL(f) } }} style={{ fontSize: 13 }} />
            </div>
          </Field>
          <Field label="Description"><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description" rows={2} style={s.textarea} /></Field>
        </div>
      )}

      {step === 1 && (
        <div>
          <Field label="Unit">
            <select value={unit} onChange={e => setUnit(e.target.value)} style={s.select}>
              <option value="">Select unit...</option>
              {units.map(u => <option key={u.id} value={u.shortName}>{u.name} ({u.shortName})</option>)}
              <option value="Hour">Hour</option>
              <option value="Day">Day</option>
              <option value="Trip">Trip</option>
            </select>
          </Field>
          <Field label="Purchase Price (₹)"><input type="number" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} placeholder="0" style={s.input} /></Field>
          <Field label="Selling Price (₹)"><input type="number" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} placeholder="0" style={s.input} /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: Spacing.md }}>
            {config.itemFields.mrp !== 'hidden' && <Field label="MRP (₹)"><input type="number" value={mrp} onChange={e => setMrp(e.target.value)} placeholder="0" style={s.input} /></Field>}
            <Field label="Discount %"><input type="number" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} placeholder="0" style={s.input} /></Field>
          </div>
          {config.enableGst && <Field label="Tax Included">
            <label style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm, cursor: 'pointer' }}>
              <input type="checkbox" checked={taxIncluded} onChange={e => setTaxIncluded(e.target.checked)} style={{ width: 18, height: 18, accentColor: Colors.primary }} />
              <span style={{ fontSize: 14, color: Colors.textSecondary }}>Price includes tax</span>
            </label>
          </Field>}
          <div style={{ borderTop: `1px solid ${Colors.divider}`, margin: '12px 0', paddingTop: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: Colors.textPrimary, marginBottom: Spacing.sm }}>Alternative Units</div>
            <div style={{ fontSize: 11, color: Colors.textSecondary, marginBottom: Spacing.sm }}>Define larger selling units (e.g., Box = 12 Pcs, Outer = 72 Pcs)</div>
            {multiUnits.map((mu, idx) => (
              <div key={idx} style={{ ...s.row, gap: Spacing.xs, marginBottom: Spacing.xs, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 600 }}>1 </span>
                <input value={mu.unitName} onChange={e => { const u = [...multiUnits]; u[idx].unitName = e.target.value; setMultiUnits(u) }} placeholder="e.g., Outer" style={{ ...s.input, width: 70, padding: '6px 8px', fontSize: 11 }} />
                <span style={{ fontSize: 11, color: Colors.textSecondary }}>=</span>
                <input type="number" value={mu.conversionRate} onChange={e => { const u = [...multiUnits]; u[idx].conversionRate = Number(e.target.value); setMultiUnits(u) }} placeholder="72" style={{ ...s.input, width: 55, padding: '6px 8px', fontSize: 11 }} />
                <span style={{ fontSize: 11, color: Colors.textSecondary }}>{unit}</span>
                <input type="number" value={mu.sellingPrice || ''} onChange={e => { const u = [...multiUnits]; u[idx].sellingPrice = Number(e.target.value); setMultiUnits(u) }} placeholder="SP" style={{ ...s.input, width: 65, padding: '6px 8px', fontSize: 11 }} />
                <input type="number" value={mu.purchasePrice || ''} onChange={e => { const u = [...multiUnits]; u[idx].purchasePrice = Number(e.target.value); setMultiUnits(u) }} placeholder="PP" style={{ ...s.input, width: 65, padding: '6px 8px', fontSize: 11 }} />
                <button onClick={() => setMultiUnits(mu => mu.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: Colors.error, cursor: 'pointer', padding: 4 }}><Icons.Delete size={16} /></button>
              </div>
            ))}
            <button onClick={() => setMultiUnits(mu => [...mu, { unitName: '', conversionRate: 1, sellingPrice: 0, purchasePrice: 0 }])} style={{ padding: '8px 12px', backgroundColor: Colors.primaryLight, border: `1px dashed ${Colors.primary}`, borderRadius: BorderRadius.sm, cursor: 'pointer', fontSize: 12, color: Colors.primary, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icons.Add size={14} /> Add Unit
            </button>
          </div>
          {priceLists.length > 1 && (
            <div style={{ borderTop: `1px solid ${Colors.divider}`, margin: '12px 0', paddingTop: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: Colors.textPrimary, marginBottom: Spacing.sm }}>Price List Pricing</div>
              {priceLists.filter(pl => !pl.isDefault).map(pl => (
                <Field key={pl.id} label={pl.name}>
                  <input type="number" value={priceListPrices[pl.name] || ''} onChange={e => setPriceListPrices(p => ({ ...p, [pl.name]: e.target.value }))} style={s.input} placeholder="Enter price..." />
                </Field>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div>
          <Field label="Current Stock"><input type="number" value={currentStock} onChange={e => setCurrentStock(e.target.value)} placeholder="0" style={s.input} /></Field>
          <Field label="Minimum Stock Alert"><input type="number" value={minStock} onChange={e => setMinStock(e.target.value)} placeholder="10" style={s.input} /></Field>
          {config.itemFields.warehouseRack !== 'hidden' && <>
          <Field label="Warehouse">
            <select value={warehouse} onChange={e => setWarehouse(e.target.value)} style={s.select}>
              <option value="">Select warehouse...</option>
              <option value="Main">Main Warehouse</option>
              <option value="Secondary">Secondary Warehouse</option>
              <option value="Retail">Retail Store</option>
            </select>
          </Field>
          <Field label="Rack Location"><input value={rackLocation} onChange={e => setRackLocation(e.target.value)} placeholder="e.g., A1-B2" style={s.input} /></Field>
        </>}
          <Field label="Barcode">
            <div style={{ display: 'flex', gap: Spacing.sm }}>
              <input value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="Scan or type barcode" style={{ ...s.input, flex: 1 }} />
              <button style={{ padding: '12px 14px', backgroundColor: Colors.surfaceVariant, border: `1.5px solid ${Colors.border}`, borderRadius: BorderRadius.sm, cursor: 'pointer', color: Colors.primary }}><Icons.Barcode size={20} /></button>
            </div>
          </Field>
        </div>
      )}

      {step === 3 && config.enableGst && (
        <div>
          <Field label="GST Rate">
            <select value={gstRate} onChange={e => setGstRate(e.target.value)} style={s.select}>
              <option value="0">0% (Exempted)</option>
              <option value="5">5%</option>
              <option value="12">12%</option>
              <option value="18">18%</option>
              <option value="28">28%</option>
            </select>
          </Field>
          <Field label="HSN / SAC Code"><input value={hsnCode} onChange={e => setHsnCode(e.target.value)} placeholder="e.g., 84713000" style={s.input} /></Field>
          <Field label="Supplier">
            <select value={supplier} onChange={e => setSupplier(e.target.value)} style={s.select}>
              <option value="">Select supplier...</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          {config.itemFields.batchExpiry !== 'hidden' && <>
            <Field label="Batch Number (optional)"><input value={batchNo} onChange={e => setBatchNo(e.target.value)} placeholder="e.g., BATCH-001" style={s.input} /></Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: Spacing.md }}>
              <Field label="Manufacturing Date"><input type="date" value={mfgDate} onChange={e => setMfgDate(e.target.value)} style={s.input} /></Field>
              <Field label="Expiry Date"><input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} style={s.input} /></Field>
            </div>
          </>}
          <Field label="Notes"><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes" rows={2} style={s.textarea} /></Field>
        </div>
      )}
      {step === 3 && !config.enableGst && (
        <div>
          <Field label="Supplier">
            <select value={supplier} onChange={e => setSupplier(e.target.value)} style={s.select}>
              <option value="">Select supplier...</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          {config.itemFields.batchExpiry !== 'hidden' && <>
            <Field label="Batch Number (optional)"><input value={batchNo} onChange={e => setBatchNo(e.target.value)} placeholder="e.g., BATCH-001" style={s.input} /></Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: Spacing.md }}>
              <Field label="Manufacturing Date"><input type="date" value={mfgDate} onChange={e => setMfgDate(e.target.value)} style={s.input} /></Field>
              <Field label="Expiry Date"><input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} style={s.input} /></Field>
            </div>
          </>}
          <Field label="Notes"><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes" rows={2} style={s.textarea} /></Field>
        </div>
      )}

      {(config.enableGst ? step === 4 : step === 3) && (
        <div>
          <SectionCard title="Basic Information" onEdit={() => setStep(0)}>
            <SummaryRow label="Item Name" value={name} />
            <SummaryRow label="SKU" value={sku || 'Auto-generated'} />
            <SummaryRow label="Category" value={category || '–'} />
            {config.itemFields.brand !== 'hidden' && <SummaryRow label="Brand" value={brand || '–'} />}
            <SummaryRow label="Type" value={itemType} />
          </SectionCard>
          <SectionCard title="Pricing" onEdit={() => setStep(1)}>
            <SummaryRow label="Unit" value={unit} />
            <SummaryRow label="Purchase Price" value={purchasePrice ? `₹${parseFloat(purchasePrice).toLocaleString()}` : '–'} />
            <SummaryRow label="Selling Price" value={sellingPrice ? `₹${parseFloat(sellingPrice).toLocaleString()}` : '–'} />
            {config.itemFields.mrp !== 'hidden' && <SummaryRow label="MRP" value={mrp ? `₹${parseFloat(mrp).toLocaleString()}` : '–'} />}
            <SummaryRow label="Discount" value={discountPercent ? `${discountPercent}%` : '–'} />
            <SummaryRow label="Tax Included" value={taxIncluded ? 'Yes' : 'No'} />
          </SectionCard>
          <SectionCard title="Stock" onEdit={() => setStep(2)}>
            <SummaryRow label="Current Stock" value={currentStock} />
            <SummaryRow label="Min Stock Alert" value={minStock} />
            {config.itemFields.warehouseRack !== 'hidden' && <><SummaryRow label="Warehouse" value={warehouse || '–'} />
            <SummaryRow label="Rack Location" value={rackLocation || '–'} /></>}
            <SummaryRow label="Barcode" value={barcode || '–'} />
          </SectionCard>
          {config.enableGst && <SectionCard title="Tax & Additional" onEdit={() => setStep(3)}>
            <SummaryRow label="GST Rate" value={`${gstRate}%`} />
            <SummaryRow label="HSN Code" value={hsnCode || '–'} />
            <SummaryRow label="Supplier" value={suppliers.find(s => s.id === supplier)?.name || '–'} />
            {config.itemFields.batchExpiry !== 'hidden' && <><SummaryRow label="Batch No" value={batchNo || '–'} />
            <SummaryRow label="Mfg Date" value={mfgDate || '–'} />
            <SummaryRow label="Expiry Date" value={expDate || '–'} /></>}
          </SectionCard>}
          {!config.enableGst && <SectionCard title="Additional" onEdit={() => setStep(3)}>
            <SummaryRow label="Supplier" value={suppliers.find(s => s.id === supplier)?.name || '–'} />
            {config.itemFields.batchExpiry !== 'hidden' && <><SummaryRow label="Batch No" value={batchNo || '–'} />
            <SummaryRow label="Mfg Date" value={mfgDate || '–'} />
            <SummaryRow label="Expiry Date" value={expDate || '–'} /></>}
          </SectionCard>}
          <div style={{ display: 'flex', gap: Spacing.sm, marginTop: Spacing.lg }}>
            {editId && <button onClick={() => { DB.items.delete(editId); onBack() }} style={{ flex: 1, ...s.outlineBtn, color: Colors.error, borderColor: Colors.error }}>Delete</button>}
            <button onClick={handleSave} style={{ flex: 2, ...s.primaryBtn }}>
              <Icons.Check size={16} /> Save Item
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: Spacing.sm, marginTop: Spacing.xxl }}>
        {step > 0 && <button onClick={() => setStep(step - 1)} style={{ flex: 1, ...s.outlineBtn }}>{step < STEPS.length - 1 ? 'Back' : 'Edit'}</button>}
        {step < STEPS.length - 1 && <button onClick={() => canNext() && setStep(step + 1)} disabled={!canNext()} style={{ flex: 2, ...(canNext() ? s.primaryBtn : s.primaryBtnDisabled) }}>
          Continue
        </button>}
      </div>
    </div>
  )
}
