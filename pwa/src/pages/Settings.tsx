import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius, Shadows } from '../theme'
import { s, Field } from '../utils/styles'
import { useAuth } from '../store/auth'
import { Icons } from '../utils/Icons'
import { DB } from '../utils/storage'
import { useToast } from '../utils/smooth'

type SettingsSubPage =
  | null
  | 'general'
  | 'transactions'
  | 'print'
  | 'gst'
  | 'users'
  | 'sms'
  | 'reminders'
  | 'party'
  | 'items'
  | 'multicurrency'

export function Settings({
  onNavigate,
  onLogout,
  isDarkMode,
  onToggleDarkMode,
}: {
  onNavigate: (p: string) => void
  onLogout: () => void
  isDarkMode?: boolean
  onToggleDarkMode?: (v: boolean) => void
}) {
  const { userName, businessName } = useAuth()
  const profile = DB.businessProfile.get()
  const businessId = profile.businessId || localStorage.getItem('vs_business_id') || 'VS-682914'
  const { toast } = useToast()

  const [subPage, setSubPage] = useState<SettingsSubPage>(null)

  // Settings State loaded from DB / LocalStorage
  const existingSettings = DB.settings.get() || {}

  // 1. General
  const [language, setLanguage] = useState(localStorage.getItem('vs_lang') || 'en')
  const [dateFormat, setDateFormat] = useState(localStorage.getItem('vs_date_fmt') || 'DD/MM/YYYY')
  const [currencySymbol, setCurrencySymbol] = useState(localStorage.getItem('vs_currency') || '₹')
  const [decimalPrecision, setDecimalPrecision] = useState(localStorage.getItem('vs_decimals') || '2')

  // 2. Transactions
  const [invoicePrefix, setInvoicePrefix] = useState(existingSettings.invoicePrefix || 'INV')
  const [allowNegativeStock, setAllowNegativeStock] = useState(existingSettings.allowNegativeStock ?? false)
  const [roundOffTotal, setRoundOffTotal] = useState(existingSettings.roundOffTotal ?? true)
  const [defaultCreditDays, setDefaultCreditDays] = useState(String(existingSettings.defaultCreditDays || 15))

  // 3. Invoice Print
  const [printTheme, setPrintTheme] = useState(existingSettings.defaultTemplate || 'MODERN')
  const [showLogoOnPrint, setShowLogoOnPrint] = useState(existingSettings.showLogo ?? true)
  const [showBankOnPrint, setShowBankOnPrint] = useState(existingSettings.showBankDetails ?? true)
  const [showSignOnPrint, setShowSignOnPrint] = useState(existingSettings.showSignature ?? true)
  const [termsText, setTermsText] = useState(existingSettings.termsAndConditions || 'Goods once sold will not be taken back. Subject to local jurisdiction.')

  // 4. Taxes & GST
  const [enableGst, setEnableGst] = useState(existingSettings.enableGst ?? true)
  const [defaultGstRate, setDefaultGstRate] = useState(String(existingSettings.defaultGstRate || 18))
  const [gstScheme, setGstScheme] = useState(existingSettings.gstScheme || 'REGULAR')
  const [enableTds, setEnableTds] = useState(existingSettings.enableTds ?? false)

  // 5. User Management & Security
  const [pinLock, setPinLock] = useState(localStorage.getItem('vs_pin_enabled') === 'true')
  const [userPin, setUserPin] = useState(localStorage.getItem('vs_pin_code') || '')
  const [userRole, setUserRole] = useState('ADMIN')

  // 6. SMS & WhatsApp
  const [autoWhatsapp, setAutoWhatsapp] = useState(localStorage.getItem('vs_auto_whatsapp') !== 'false')
  const [enableSms, setEnableSms] = useState(localStorage.getItem('vs_enable_sms') === 'true')
  const [smsTemplate, setSmsTemplate] = useState(localStorage.getItem('vs_sms_tmpl') || 'Thank you for your purchase of {AMOUNT} at {STORE}. Invoice #{INV}')

  // 7. Payment Reminders
  const [autoReminders, setAutoReminders] = useState(localStorage.getItem('vs_auto_reminders') !== 'false')
  const [reminderDays, setReminderDays] = useState(localStorage.getItem('vs_reminder_days') || '3')

  // 8. Party & Customer
  const [enforceCreditLimit, setEnforceCreditLimit] = useState(existingSettings.enforceCreditLimit ?? true)
  const [partyPhoneMandatory, setPartyPhoneMandatory] = useState(localStorage.getItem('vs_phone_mandatory') === 'true')

  // 9. Items & Inventory
  const [enableBarcodes, setEnableBarcodes] = useState(existingSettings.enableBarcodes ?? true)
  const [enableBatchExpiry, setEnableBatchExpiry] = useState(existingSettings.enableBatchExpiry ?? false)
  const [lowStockLevel, setLowStockLevel] = useState(String(existingSettings.lowStockAlertLevel || 5))

  // 10. Multi-Currency
  const [enableMultiCurrency, setEnableMultiCurrency] = useState(localStorage.getItem('vs_multi_curr') === 'true')
  const [usdRate, setUsdRate] = useState(localStorage.getItem('vs_rate_usd') || '83.50')

  const handleSaveSettings = (categoryName: string) => {
    DB.settings.save({
      ...existingSettings,
      invoicePrefix,
      allowNegativeStock,
      roundOffTotal,
      defaultCreditDays: parseInt(defaultCreditDays) || 15,
      defaultTemplate: printTheme,
      showLogo: showLogoOnPrint,
      showBankDetails: showBankOnPrint,
      showSignature: showSignOnPrint,
      termsAndConditions: termsText,
      enableGst,
      defaultGstRate: parseFloat(defaultGstRate) || 18,
      gstScheme,
      enableTds,
      enforceCreditLimit,
      enableBarcodes,
      enableBatchExpiry,
      lowStockAlertLevel: parseInt(lowStockLevel) || 5,
    })

    localStorage.setItem('vs_lang', language)
    localStorage.setItem('vs_date_fmt', dateFormat)
    localStorage.setItem('vs_currency', currencySymbol)
    localStorage.setItem('vs_decimals', decimalPrecision)
    localStorage.setItem('vs_pin_enabled', String(pinLock))
    localStorage.setItem('vs_pin_code', userPin)
    localStorage.setItem('vs_auto_whatsapp', String(autoWhatsapp))
    localStorage.setItem('vs_enable_sms', String(enableSms))
    localStorage.setItem('vs_sms_tmpl', smsTemplate)
    localStorage.setItem('vs_auto_reminders', String(autoReminders))
    localStorage.setItem('vs_reminder_days', reminderDays)
    localStorage.setItem('vs_phone_mandatory', String(partyPhoneMandatory))
    localStorage.setItem('vs_multi_curr', String(enableMultiCurrency))
    localStorage.setItem('vs_rate_usd', usdRate)

    toast(`${categoryName} settings saved`, 'success')
    setSubPage(null)
  }

  // Master Settings Option List with Vector Icons and Short Clean Titles
  const settingCards = [
    { key: 'general' as const, title: 'General', desc: 'Language, Currency, Date Format & Theme', Icon: Icons.Settings, color: Colors.primary },
    { key: 'transactions' as const, title: 'Transactions', desc: 'Invoice Prefix, Credit Days & Stock Rules', Icon: Icons.Invoice, color: Colors.accent },
    { key: 'print' as const, title: 'Invoice Print', desc: 'Templates, Logo, Bank Details & Signature', Icon: Icons.Invoice, color: '#059669' },
    { key: 'gst' as const, title: 'Taxes & GST', desc: 'GST Rates, Tax Scheme & Compliance', Icon: Icons.Document, color: '#7C3AED' },
    { key: 'users' as const, title: 'Users & Security', desc: 'Staff Roles & App PIN Lock', Icon: Icons.People, color: '#2563EB' },
    { key: 'sms' as const, title: 'SMS & WhatsApp', desc: 'Auto Messaging & Receipt Templates', Icon: Icons.WhatsApp, color: '#DC2626' },
    { key: 'reminders' as const, title: 'Reminders', desc: 'Due Payment Alerts & Notifications', Icon: Icons.Bell, color: '#D97706' },
    { key: 'party' as const, title: 'Parties', desc: 'Credit Limits & Customer Rules', Icon: Icons.People, color: '#EC4899' },
    { key: 'items' as const, title: 'Items & Stock', desc: 'Barcodes, Expiry Tracking & Low Stock', Icon: Icons.Inventory, color: '#059669' },
    { key: 'multicurrency' as const, title: 'Multi-Currency', desc: 'Foreign Exchange & Billing Rates', Icon: Icons.Payment, color: '#2563EB' },
  ]

  // SUB-PAGES RENDERING
  if (subPage !== null) {
    const activeCard = settingCards.find(c => c.key === subPage)
    const ActiveIcon = activeCard?.Icon || Icons.Settings
    return (
      <div style={{ padding: Spacing.lg, paddingBottom: 100, maxWidth: 600, margin: '0 auto' }}>
        
        {/* Sub-screen Navigation Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => setSubPage(null)} style={{
            width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceVariant,
            border: `1px solid ${Colors.border}`, color: Colors.textPrimary, display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, fontWeight: 700,
          }}>
            ←
          </button>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: Colors.textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ActiveIcon size={20} color={activeCard?.color || Colors.primary} />
              {activeCard?.title}
            </div>
            <div style={{ fontSize: 11, color: Colors.textSecondary }}>{activeCard?.desc}</div>
          </div>
        </div>

        {/* Sub-Screen Body Card */}
        <div style={{
          backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
          border: `1px solid ${Colors.border}`, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
          marginBottom: 20,
        }}>

          {/* 1. GENERAL SETTINGS */}
          {subPage === 'general' && (
            <div>
              <Field label="App Language">
                <select value={language} onChange={e => setLanguage(e.target.value)} style={s.select}>
                  <option value="en">English (Default)</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="mr">मराठी (Marathi)</option>
                  <option value="gu">ગુજરાતી (Gujarati)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                  <option value="te">తెలుగు (Telugu)</option>
                  <option value="kn">ಕನ್ನಡ (Kannada)</option>
                  <option value="bn">বাংলা (Bengali)</option>
                </select>
              </Field>

              <Field label="Date Format">
                <select value={dateFormat} onChange={e => setDateFormat(e.target.value)} style={s.select}>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 22/08/2026)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 08/22/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Format)</option>
                </select>
              </Field>

              <Field label="Currency Symbol">
                <select value={currencySymbol} onChange={e => setCurrencySymbol(e.target.value)} style={s.select}>
                  <option value="₹">₹ (Indian Rupee - INR)</option>
                  <option value="$">$ (US Dollar - USD)</option>
                  <option value="€">€ (Euro - EUR)</option>
                  <option value="£">£ (British Pound - GBP)</option>
                  <option value="AED">AED (UAE Dirham)</option>
                  <option value="SAR">SAR (Saudi Riyal)</option>
                </select>
              </Field>

              <Field label="Decimal Precision">
                <select value={decimalPrecision} onChange={e => setDecimalPrecision(e.target.value)} style={s.select}>
                  <option value="2">2 Decimals (e.g. ₹1,250.50)</option>
                  <option value="3">3 Decimals (e.g. ₹1,250.500)</option>
                  <option value="0">Rounded Whole Numbers (e.g. ₹1,251)</option>
                </select>
              </Field>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderTop: `1px solid ${Colors.divider}`, marginTop: 14 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: Colors.textPrimary }}>Dark Theme</div>
                  <div style={{ fontSize: 11, color: Colors.textSecondary }}>Toggle light or dark interface</div>
                </div>
                <button onClick={() => onToggleDarkMode?.(!isDarkMode)} style={{
                  padding: '6px 14px', borderRadius: BorderRadius.sm, border: `1px solid ${Colors.border}`,
                  backgroundColor: isDarkMode ? Colors.primary : Colors.surfaceVariant,
                  color: isDarkMode ? '#fff' : Colors.textPrimary, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>
                  {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                </button>
              </div>
            </div>
          )}

          {/* 2. TRANSACTIONS */}
          {subPage === 'transactions' && (
            <div>
              <Field label="Invoice Prefix">
                <input value={invoicePrefix} onChange={e => setInvoicePrefix(e.target.value)} placeholder="e.g. INV or BILL" style={s.input} />
              </Field>

              <Field label="Default Payment Terms">
                <select value={defaultCreditDays} onChange={e => setDefaultCreditDays(e.target.value)} style={s.select}>
                  <option value="0">0 Days (Immediate Payment)</option>
                  <option value="7">7 Days Credit</option>
                  <option value="15">15 Days Credit</option>
                  <option value="30">30 Days Credit</option>
                  <option value="45">45 Days Credit</option>
                </select>
              </Field>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: Colors.textPrimary }}>
                  <input type="checkbox" checked={allowNegativeStock} onChange={e => setAllowNegativeStock(e.target.checked)} style={{ width: 16, height: 16, accentColor: Colors.primary }} />
                  Allow Negative Stock Billing (Bill items even if stock is 0)
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: Colors.textPrimary }}>
                  <input type="checkbox" checked={roundOffTotal} onChange={e => setRoundOffTotal(e.target.checked)} style={{ width: 16, height: 16, accentColor: Colors.primary }} />
                  Auto-Round Off Invoice Grand Total to nearest ₹1
                </label>
              </div>
            </div>
          )}

          {/* 3. INVOICE PRINT */}
          {subPage === 'print' && (
            <div>
              <Field label="Print Template Theme">
                <select value={printTheme} onChange={e => setPrintTheme(e.target.value)} style={s.select}>
                  <option value="MODERN">Modern Executive GST Template</option>
                  <option value="CLASSIC">Classic Standard Invoice</option>
                  <option value="COMPACT">Thermal Receipt (58mm / 80mm POS)</option>
                  <option value="DOTTED">Dotted / Dot-Matrix Receipt Style</option>
                </select>
              </Field>

              <Field label="Terms & Conditions (Footer)">
                <textarea value={termsText} onChange={e => setTermsText(e.target.value)} rows={3} style={{ ...s.input, resize: 'vertical' }} />
              </Field>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: Colors.textPrimary }}>
                  <input type="checkbox" checked={showLogoOnPrint} onChange={e => setShowLogoOnPrint(e.target.checked)} style={{ width: 16, height: 16, accentColor: Colors.primary }} />
                  Show Store Logo on Printed Invoices
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: Colors.textPrimary }}>
                  <input type="checkbox" checked={showBankOnPrint} onChange={e => setShowBankOnPrint(e.target.checked)} style={{ width: 16, height: 16, accentColor: Colors.primary }} />
                  Show Bank Account Details & UPI QR Code on Invoice
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: Colors.textPrimary }}>
                  <input type="checkbox" checked={showSignOnPrint} onChange={e => setShowSignOnPrint(e.target.checked)} style={{ width: 16, height: 16, accentColor: Colors.primary }} />
                  Embed Digital Signature on Invoice
                </label>
              </div>
            </div>
          )}

          {/* 4. TAXES & GST */}
          {subPage === 'gst' && (
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: Colors.primary, marginBottom: 14 }}>
                <input type="checkbox" checked={enableGst} onChange={e => setEnableGst(e.target.checked)} style={{ width: 16, height: 16, accentColor: Colors.primary }} />
                Enable GST Tax Calculation Module
              </label>

              {enableGst && (
                <>
                  <Field label="Default GST Rate (%)">
                    <select value={defaultGstRate} onChange={e => setDefaultGstRate(e.target.value)} style={s.select}>
                      <option value="0">0% (Exempt)</option>
                      <option value="5">5% GST</option>
                      <option value="12">12% GST</option>
                      <option value="18">18% GST (Standard)</option>
                      <option value="28">28% GST</option>
                    </select>
                  </Field>

                  <Field label="GST Registration Type">
                    <select value={gstScheme} onChange={e => setGstScheme(e.target.value)} style={s.select}>
                      <option value="REGULAR">Regular Taxpayer (Tax Invoice)</option>
                      <option value="COMPOSITION">Composition Scheme (Bill of Supply)</option>
                      <option value="UNREGISTERED">Unregistered Business</option>
                    </select>
                  </Field>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: Colors.textPrimary, marginTop: 12 }}>
                    <input type="checkbox" checked={enableTds} onChange={e => setEnableTds(e.target.checked)} style={{ width: 16, height: 16, accentColor: Colors.primary }} />
                    Enable TDS / TCS Tax Deductions
                  </label>
                </>
              )}
            </div>
          )}

          {/* 5. USERS & SECURITY */}
          {subPage === 'users' && (
            <div>
              <Field label="Active User Role">
                <select value={userRole} onChange={e => setUserRole(e.target.value)} style={s.select}>
                  <option value="ADMIN">Owner / Super Admin (Full Access)</option>
                  <option value="BILLER">Billing Counter Executive (Sales & Invoices)</option>
                  <option value="ACCOUNTANT">Accountant (Reports & Ledger)</option>
                  <option value="VIEWER">View-Only (Read Only)</option>
                </select>
              </Field>

              <div style={{ borderTop: `1px solid ${Colors.divider}`, paddingTop: 14, marginTop: 14 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: Colors.textPrimary, marginBottom: 12 }}>
                  <input type="checkbox" checked={pinLock} onChange={e => setPinLock(e.target.checked)} style={{ width: 16, height: 16, accentColor: Colors.primary }} />
                  Enable 4-Digit Passcode Lock on App Launch
                </label>

                {pinLock && (
                  <Field label="4-Digit App Security PIN">
                    <input type="password" maxLength={4} value={userPin} onChange={e => setUserPin(e.target.value)} placeholder="e.g. 1234" style={{ ...s.input, width: 140 }} />
                  </Field>
                )}
              </div>
            </div>
          )}

          {/* 6. SMS & WHATSAPP */}
          {subPage === 'sms' && (
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: Colors.textPrimary, marginBottom: 12 }}>
                <input type="checkbox" checked={autoWhatsapp} onChange={e => setAutoWhatsapp(e.target.checked)} style={{ width: 16, height: 16, accentColor: Colors.primary }} />
                Auto-Prompt WhatsApp Share after Invoice Save
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: Colors.textPrimary, marginBottom: 14 }}>
                <input type="checkbox" checked={enableSms} onChange={e => setEnableSms(e.target.checked)} style={{ width: 16, height: 16, accentColor: Colors.primary }} />
                Enable SMS Receipts & Payment Confirmations
              </label>

              <Field label="SMS / WhatsApp Message Template">
                <textarea value={smsTemplate} onChange={e => setSmsTemplate(e.target.value)} rows={3} style={{ ...s.input, resize: 'vertical' }} />
              </Field>
            </div>
          )}

          {/* 7. REMINDERS */}
          {subPage === 'reminders' && (
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: Colors.textPrimary, marginBottom: 14 }}>
                <input type="checkbox" checked={autoReminders} onChange={e => setAutoReminders(e.target.checked)} style={{ width: 16, height: 16, accentColor: Colors.primary }} />
                Enable Auto Payment Reminders for Overdue Bills
              </label>

              <Field label="Reminder Notice Timing">
                <select value={reminderDays} onChange={e => setReminderDays(e.target.value)} style={s.select}>
                  <option value="3">3 Days Before Due Date</option>
                  <option value="0">On Due Date</option>
                  <option value="-3">3 Days After Due Date (Overdue)</option>
                </select>
              </Field>
            </div>
          )}

          {/* 8. PARTIES */}
          {subPage === 'party' && (
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: Colors.textPrimary, marginBottom: 12 }}>
                <input type="checkbox" checked={enforceCreditLimit} onChange={e => setEnforceCreditLimit(e.target.checked)} style={{ width: 16, height: 16, accentColor: Colors.primary }} />
                Enforce Customer Credit Limit Warning on Billing
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: Colors.textPrimary }}>
                <input type="checkbox" checked={partyPhoneMandatory} onChange={e => setPartyPhoneMandatory(e.target.checked)} style={{ width: 16, height: 16, accentColor: Colors.primary }} />
                Make Phone Number Mandatory for New Customers
              </label>
            </div>
          )}

          {/* 9. ITEMS & STOCK */}
          {subPage === 'items' && (
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: Colors.textPrimary, marginBottom: 12 }}>
                <input type="checkbox" checked={enableBarcodes} onChange={e => setEnableBarcodes(e.target.checked)} style={{ width: 16, height: 16, accentColor: Colors.primary }} />
                Enable Barcode Scanner & Label Printing
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: Colors.textPrimary, marginBottom: 14 }}>
                <input type="checkbox" checked={enableBatchExpiry} onChange={e => setEnableBatchExpiry(e.target.checked)} style={{ width: 16, height: 16, accentColor: Colors.primary }} />
                Enable Batch Number & Expiry Date Tracking
              </label>

              <Field label="Default Low Stock Alert Threshold">
                <input type="number" value={lowStockLevel} onChange={e => setLowStockLevel(e.target.value)} style={{ ...s.input, width: 140 }} />
              </Field>
            </div>
          )}

          {/* 10. MULTI-CURRENCY */}
          {subPage === 'multicurrency' && (
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: Colors.textPrimary, marginBottom: 14 }}>
                <input type="checkbox" checked={enableMultiCurrency} onChange={e => setEnableMultiCurrency(e.target.checked)} style={{ width: 16, height: 16, accentColor: Colors.primary }} />
                Enable Foreign Multi-Currency Invoicing
              </label>

              {enableMultiCurrency && (
                <Field label="USD ($) to INR (₹) Conversion Rate">
                  <input type="number" step="0.01" value={usdRate} onChange={e => setUsdRate(e.target.value)} style={{ ...s.input, width: 160 }} />
                </Field>
              )}
            </div>
          )}

          {/* Sub-Screen Save Action Button */}
          <div style={{ borderTop: `1px solid ${Colors.divider}`, paddingTop: 16, marginTop: 20, textAlign: 'right' }}>
            <button onClick={() => handleSaveSettings(activeCard?.title || 'Settings')} style={{
              ...s.primaryBtn, width: 'auto', padding: '10px 24px', fontSize: 13, fontWeight: 800,
            }}>
              Save {activeCard?.title}
            </button>
          </div>

        </div>

      </div>
    )
  }

  // MAIN SETTINGS LANDING PAGE
  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 100, maxWidth: 600, margin: '0 auto' }}>
      
      {/* Account Info Card */}
      <div style={{
        backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
        border: `1px solid ${Colors.border}`, padding: 16, marginBottom: 16,
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 22,
            backgroundColor: Colors.primarySurface, color: Colors.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800, border: `2px solid ${Colors.primaryLight}`,
          }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: Colors.textPrimary }}>{userName}</div>
            <div style={{ fontSize: 12, color: Colors.textSecondary, fontWeight: 600 }}>{businessName || 'My Store'}</div>
            <div style={{ fontSize: 10, fontWeight: 800, color: Colors.primary, fontFamily: 'monospace', marginTop: 2 }}>
              ID: {businessId}
            </div>
          </div>
        </div>

        <button onClick={() => onNavigate('business-profile')} style={{
          padding: '7px 12px', backgroundColor: Colors.primarySurface, color: Colors.primary,
          border: `1px solid ${Colors.primaryLight}`, borderRadius: BorderRadius.sm,
          fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>
          Edit Profile ➔
        </button>
      </div>

      <div style={{ fontSize: 12, fontWeight: 800, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
        App Settings
      </div>

      {/* Interactive Settings Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
        {settingCards.map(card => {
          const CardIcon = card.Icon
          return (
            <div
              key={card.key}
              onClick={() => setSubPage(card.key)}
              style={{
                backgroundColor: Colors.surface, border: `1px solid ${Colors.border}`,
                borderRadius: BorderRadius.md, padding: '12px 14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                boxShadow: '0 1px 2px rgba(15,23,42,0.03)', transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = Colors.primary}
              onMouseLeave={e => e.currentTarget.style.borderColor = Colors.border}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, paddingRight: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  backgroundColor: card.color + '12', color: card.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <CardIcon size={20} color={card.color} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: Colors.textPrimary }}>{card.title}</div>
                  <div style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 1 }}>{card.desc}</div>
                </div>
              </div>
              <div style={{ fontSize: 16, color: Colors.textDisabled, fontWeight: 700 }}>
                ›
              </div>
            </div>
          )
        })}

        {/* Companies Link */}
        <div
          onClick={() => onNavigate('companies')}
          style={{
            backgroundColor: Colors.surface, border: `1px solid ${Colors.border}`,
            borderRadius: BorderRadius.md, padding: '12px 14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.primaryLight + '30', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.Building size={20} color={Colors.primary} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: Colors.textPrimary }}>Companies</div>
              <div style={{ fontSize: 11, color: Colors.textSecondary }}>Switch or add multi-firm business accounts</div>
            </div>
          </div>
          <span style={{ fontSize: 16, color: Colors.textDisabled, fontWeight: 700 }}>›</span>
        </div>

        {/* Data Export Link */}
        <div
          onClick={() => onNavigate('data-export')}
          style={{
            backgroundColor: Colors.surface, border: `1px solid ${Colors.border}`,
            borderRadius: BorderRadius.md, padding: '12px 14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.dangerBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.Download size={20} color={Colors.danger} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: Colors.textPrimary }}>Import & Export</div>
              <div style={{ fontSize: 11, color: Colors.textSecondary }}>Database backup & Excel data import</div>
            </div>
          </div>
          <span style={{ fontSize: 16, color: Colors.textDisabled, fontWeight: 700 }}>›</span>
        </div>
      </div>

      {/* Logout Action Card */}
      <button onClick={onLogout} style={{
        width: '100%', padding: '12px',
        backgroundColor: Colors.errorLight, color: Colors.error, border: `1px solid ${Colors.error}30`,
        borderRadius: BorderRadius.md, fontSize: 13, fontWeight: 700, cursor: 'pointer',
      }}>
        Logout
      </button>

    </div>
  )
}
