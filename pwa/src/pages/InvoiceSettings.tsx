import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { InvoiceThemeGallery } from './InvoiceThemeGallery'
import { Icons } from '../utils/Icons'

const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
  { code: 'MYR', symbol: 'RM', label: 'Malaysian Ringgit' },
  { code: 'SAR', symbol: '﷼', label: 'Saudi Riyal' },
]

export function InvoiceSettings() {
  const settings = DB.settings.get()
  const [prefix, setPrefix] = useState(settings.prefix)
  const [template, setTemplate] = useState(settings.template)
  const [defaultTerms, setDefaultTerms] = useState(settings.defaultTerms)
  const [enableGst, setEnableGst] = useState(settings.enableGst)
  const [themeColor, setThemeColor] = useState(settings.themeColor || '#1B5E20')
  const [showBank, setShowBank] = useState(settings.showBank ?? true)
  const [showSignature, setShowSignature] = useState(settings.showSignature ?? true)
  const [currencyCode, setCurrencyCode] = useState(settings.currency || 'INR')
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || '₹')
  const [roundOff, setRoundOff] = useState(settings.roundOff ?? false)
  const [lateFeePercent, setLateFeePercent] = useState(String(settings.lateFeePercent || 0))
  const [saved, setSaved] = useState(false)

  const handleCurrencyChange = (code: string) => {
    const c = CURRENCIES.find(c => c.code === code)
    if (c) { setCurrencyCode(c.code); setCurrencySymbol(c.symbol) }
  }

  const handleSave = () => {
    DB.settings.save({
      prefix: prefix.trim() || 'INV', template, defaultTerms: defaultTerms.trim(),
      enableGst, themeColor, showBank, showSignature, showLogo: true, paperSize: 'A4',
      currency: currencyCode, currencySymbol,
      roundOff, lateFeePercent: parseFloat(lateFeePercent) || 0,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <Field label="Invoice Prefix">
        <input value={prefix} onChange={e => setPrefix(e.target.value)} placeholder="INV" style={s.input} />
        <div style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 4 }}>Next: {prefix || 'INV'}-{DB.invoices.list().length + 1}</div>
      </Field>

      <Field label="Invoice Template">
        <InvoiceThemeGallery onSelect={(t) => setTemplate(t)} />
      </Field>

      <Field label="Theme Color">
        <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm }}>
          <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)} style={{ width: 40, height: 40, border: 'none', padding: 0, cursor: 'pointer' }} />
          <input value={themeColor} onChange={e => setThemeColor(e.target.value)} placeholder="#1B5E20" style={{ ...s.input, flex: 1 }} />
        </div>
      </Field>

      <Field label="Currency">
        <select value={currencyCode} onChange={e => handleCurrencyChange(e.target.value)} style={s.select}>
          {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.label}</option>)}
        </select>
      </Field>

      <Field label="Default Terms & Conditions">
        <textarea value={defaultTerms} onChange={e => setDefaultTerms(e.target.value)} rows={3} style={{ ...s.input, resize: 'vertical', fontFamily: 'inherit' }} />
      </Field>

      <Field label="Options">
        <label style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm, cursor: 'pointer', marginBottom: Spacing.sm }}>
          <input type="checkbox" checked={enableGst} onChange={e => setEnableGst(e.target.checked)} style={{ width: 18, height: 18 }} />
          <span style={{ fontSize: 14, color: Colors.textPrimary }}>Enable GST on invoices</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm, cursor: 'pointer', marginBottom: Spacing.sm }}>
          <input type="checkbox" checked={showBank} onChange={e => setShowBank(e.target.checked)} style={{ width: 18, height: 18 }} />
          <span style={{ fontSize: 14, color: Colors.textPrimary }}>Show bank details</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm, cursor: 'pointer', marginBottom: Spacing.sm }}>
          <input type="checkbox" checked={showSignature} onChange={e => setShowSignature(e.target.checked)} style={{ width: 18, height: 18 }} />
          <span style={{ fontSize: 14, color: Colors.textPrimary }}>Show signature line</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm, cursor: 'pointer', marginBottom: Spacing.sm }}>
          <input type="checkbox" checked={roundOff} onChange={e => setRoundOff(e.target.checked)} style={{ width: 18, height: 18 }} />
          <span style={{ fontSize: 14, color: Colors.textPrimary }}>Round off invoice totals</span>
        </label>
        <Field label="Late Fee (% per month)">
          <input type="number" value={lateFeePercent} onChange={e => setLateFeePercent(e.target.value)} style={s.input} min="0" max="100" step="0.5" />
        </Field>
      </Field>

      <button onClick={handleSave} style={saved ? { ...s.primaryBtn, backgroundColor: Colors.success } : s.primaryBtn}>
        {saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  )
}
